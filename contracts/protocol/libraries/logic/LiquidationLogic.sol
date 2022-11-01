// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

import {IERC20} from "../../../dependencies/openzeppelin/contracts//IERC20.sol";
import {GPv2SafeERC20} from "../../../dependencies/gnosis/contracts/GPv2SafeERC20.sol";
import {PercentageMath} from "../../libraries/math/PercentageMath.sol";
import {WadRayMath} from "../../libraries/math/WadRayMath.sol";
import {Helpers} from "../../libraries/helpers/Helpers.sol";
import {DataTypes} from "../../libraries/types/DataTypes.sol";
import {ReserveLogic} from "./ReserveLogic.sol";
import {SupplyLogic} from "./SupplyLogic.sol";
import {ValidationLogic} from "./ValidationLogic.sol";
import {GenericLogic} from "./GenericLogic.sol";
import {UserConfiguration} from "../../libraries/configuration/UserConfiguration.sol";
import {ReserveConfiguration} from "../../libraries/configuration/ReserveConfiguration.sol";
import {IPToken} from "../../../interfaces/IPToken.sol";
import {ICollaterizableERC721} from "../../../interfaces/ICollaterizableERC721.sol";
import {IAuctionableERC721} from "../../../interfaces/IAuctionableERC721.sol";
import {INToken} from "../../../interfaces/INToken.sol";
import {PRBMath} from "../../../dependencies/math/PRBMath.sol";
import {PRBMathUD60x18} from "../../../dependencies/math/PRBMathUD60x18.sol";
import {IReserveAuctionStrategy} from "../../../interfaces/IReserveAuctionStrategy.sol";
import {IVariableDebtToken} from "../../../interfaces/IVariableDebtToken.sol";
import {IPriceOracleGetter} from "../../../interfaces/IPriceOracleGetter.sol";
import {IPoolAddressesProvider} from "../../../interfaces/IPoolAddressesProvider.sol";

/**
 * @title LiquidationLogic library
 *
 * @notice Implements actions involving management of collateral in the protocol, the main one being the liquidations
 **/
library LiquidationLogic {
    using PercentageMath for uint256;
    using ReserveLogic for DataTypes.ReserveCache;
    using ReserveLogic for DataTypes.ReserveData;
    using UserConfiguration for DataTypes.UserConfigurationMap;
    using ReserveConfiguration for DataTypes.ReserveConfigurationMap;
    using PRBMathUD60x18 for uint256;
    using GPv2SafeERC20 for IERC20;

    /**
     * @dev Default percentage of borrower's debt to be repaid in a liquidation.
     * @dev Percentage applied when the users health factor is above `CLOSE_FACTOR_HF_THRESHOLD`
     * Expressed in bps, a value of 0.5e4 results in 50.00%
     */
    uint256 internal constant DEFAULT_LIQUIDATION_CLOSE_FACTOR = 0.5e4;

    /**
     * @dev Maximum percentage of borrower's debt to be repaid in a liquidation
     * @dev Percentage applied when the users health factor is below `CLOSE_FACTOR_HF_THRESHOLD`
     * Expressed in bps, a value of 1e4 results in 100.00%
     */
    uint256 public constant MAX_LIQUIDATION_CLOSE_FACTOR = 1e4;

    /**
     * @dev Minimum percentage of borrower's debt to be repaid in a liquidation
     * @dev Percentage applied never but works as a placeholder for ERC20 liquidation
     * Expressed in bps, a value of 0e4 results in 0%
     */
    uint256 public constant MIN_LIQUIDATION_CLOSE_FACTOR = 0;

    /**
     * @dev This constant represents below which health factor value it is possible to liquidate
     * an amount of debt corresponding to `MAX_LIQUIDATION_CLOSE_FACTOR`.
     * A value of 0.85e18 results in 85%
     */
    uint256 public constant CLOSE_FACTOR_HF_THRESHOLD = 0.85e18;

    // See `IPool` for descriptions
    event ReserveUsedAsCollateralEnabled(
        address indexed reserve,
        address indexed user
    );
    event ReserveUsedAsCollateralDisabled(
        address indexed reserve,
        address indexed user
    );
    event LiquidationCall(
        address indexed collateralAsset,
        address indexed liquidationAsset,
        address indexed user,
        uint256 liquidationAmount,
        uint256 liquidatedCollateralAmount,
        address liquidator,
        bool receivePToken
    );
    event ERC721LiquidationCall(
        address indexed collateralAsset,
        address indexed liquidationAsset,
        address indexed user,
        uint256 liquidationAmount,
        uint256 liquidatedCollateralTokenId,
        address liquidator,
        bool receiveNToken
    );
    event AuctionEnded(
        address indexed user,
        address indexed collateralAsset,
        uint256 indexed collateralTokenId
    );

    struct LiquidationCallLocalVars {
        //userCollateral from collateralReserve
        uint256 userCollateral;
        //userGlobalCollateral from all reserves
        uint256 userGlobalCollateral;
        //userDebt from liquadationReserve
        uint256 userDebt;
        //userGlobalDebt from all reserves
        uint256 userGlobalDebt;
        //actualDebt allowed to liquidate
        uint256 actualDebtToLiquidate;
        //actualLiquidationAmount to repay based on collateral
        uint256 actualLiquidationAmount;
        //actualCollateral allowed to liquidate
        uint256 actualCollateralToLiquidate;
        //liquidationBonusRate from reserve config
        uint256 liquidationBonus;
        //user health factor
        uint256 healthFactor;
        //minimum close factor
        uint256 minimumCloseFactor;
        //liquidation protocol fee to be sent to treasury
        uint256 liquidationProtocolFeeAmount;
        //collateral P|N Token
        address collateralXToken;
        //whether auction is enabled
        bool auctionEnabled;
        //whether user has debt in liquidation asset
        bool isLiquidationAssetBorrowed;
        //liquidation asset reserve id
        uint16 liquidationAssetReserveId;
        //liquidation reserve cache
        DataTypes.ReserveCache liquidationAssetReserveCache;
    }

    struct LiquidationParametersLocalVars {
        uint256 userCollateral;
        uint256 collateralPrice;
        uint256 liquidationAssetPrice;
        uint256 liquidationAmountInBaseCurrency;
        uint256 liquidationAssetDecimals;
        uint256 collateralDecimals;
        uint256 collateralAssetUnit;
        uint256 liquidationAssetUnit;
        uint256 actualCollateralToLiquidate;
        uint256 actualLiquidationAmount;
        uint256 actualLiquidationBonus;
        uint256 liquidationProtocolFeePercentage;
        uint256 liquidationProtocolFee;
        uint256 auctionMultiplier;
        uint256 auctionStartTime;
    }

    /**
     * @notice Function to liquidate a position if its Health Factor drops below 1. The caller (liquidator)
     * covers `liquidationAmount` amount of debt of the user getting liquidated, and receives
     * a proportional amount of the `collateralAsset` plus a bonus to cover market risk
     * @dev Emits the `LiquidationCall()` event
     * @param reservesData The state of all the reserves
     * @param reservesList The addresses of all the active reserves
     * @param usersConfig The users configuration mapping that track the supplied/borrowed assets
     * @param params The additional parameters needed to execute the liquidation function
     **/
    function executeLiquidationCall(
        mapping(address => DataTypes.ReserveData) storage reservesData,
        mapping(uint256 => address) storage reservesList,
        mapping(address => DataTypes.UserConfigurationMap) storage usersConfig,
        DataTypes.ExecuteLiquidationCallParams memory params
    ) external {
        LiquidationCallLocalVars memory vars;

        DataTypes.ReserveData storage collateralReserve = reservesData[
            params.collateralAsset
        ];
        DataTypes.ReserveData storage liquidationAssetReserve = reservesData[
            params.liquidationAsset
        ];
        DataTypes.UserConfigurationMap storage userConfig = usersConfig[
            params.user
        ];

        vars.minimumCloseFactor = MIN_LIQUIDATION_CLOSE_FACTOR;
        vars.liquidationAssetReserveCache = liquidationAssetReserve.cache();
        vars.isLiquidationAssetBorrowed = true;
        liquidationAssetReserve.updateState(vars.liquidationAssetReserveCache);

        (, , , , , , , vars.healthFactor, , ) = GenericLogic
            .calculateUserAccountData(
                reservesData,
                reservesList,
                DataTypes.CalculateUserAccountDataParams({
                    userConfig: userConfig,
                    reservesCount: params.reservesCount,
                    user: params.user,
                    oracle: params.priceOracle
                })
            );

        (vars.userDebt, vars.actualDebtToLiquidate) = _calculateDebt(
            params,
            vars
        );

        ValidationLogic.validateLiquidationCall(
            userConfig,
            collateralReserve,
            DataTypes.ValidateLiquidationCallParams({
                liquidationAssetReserveCache: vars.liquidationAssetReserveCache,
                totalDebt: vars.userDebt,
                healthFactor: vars.healthFactor,
                priceOracleSentinel: params.priceOracleSentinel
            })
        );

        (vars.collateralXToken, vars.liquidationBonus) = _getConfigurationData(
            collateralReserve,
            vars
        );

        (
            vars.userCollateral,
            vars.actualCollateralToLiquidate,
            vars.actualDebtToLiquidate,
            vars.liquidationProtocolFeeAmount
        ) = _calculateERC20LiquidationParameters(
            collateralReserve,
            params,
            vars
        );

        if (vars.userDebt == vars.actualDebtToLiquidate) {
            userConfig.setBorrowing(liquidationAssetReserve.id, false);
        }

        // Transfer fee to treasury if it is non-zero
        if (vars.liquidationProtocolFeeAmount != 0) {
            IPToken(vars.collateralXToken).transferOnLiquidation(
                params.user,
                IPToken(vars.collateralXToken).RESERVE_TREASURY_ADDRESS(),
                vars.liquidationProtocolFeeAmount
            );
        }

        // If the collateral being liquidated is equal to the user balance,
        // we set the currency as not being used as collateral anymore
        if (vars.actualCollateralToLiquidate == vars.userCollateral) {
            userConfig.setUsingAsCollateral(collateralReserve.id, false);
            emit ReserveUsedAsCollateralDisabled(
                params.collateralAsset,
                params.user
            );
        }

        _burnDebtTokens(liquidationAssetReserve, params, vars);

        if (params.receiveXToken) {
            _liquidatePTokens(usersConfig, collateralReserve, params, vars);
        } else {
            _burnCollateralPTokens(collateralReserve, params, vars);
        }

        emit LiquidationCall(
            params.collateralAsset,
            params.liquidationAsset,
            params.user,
            vars.actualDebtToLiquidate,
            vars.actualCollateralToLiquidate,
            params.liquidator,
            params.receiveXToken
        );
    }

    /**
     * @notice Function to liquidate an ERC721 of a position if its Health Factor drops below 1. The caller (liquidator)
     * covers `liquidationAmount` amount of debt of the user getting liquidated, and receives
     * a proportional tokenId of the `collateralAsset` minus a bonus to cover market risk
     * @dev Emits the `ERC721LiquidationCall()` event
     * @param reservesData The state of all the reserves
     * @param reservesList The addresses of all the active reserves
     * @param usersConfig The users configuration mapping that track the supplied/borrowed assets
     * @param params The additional parameters needed to execute the liquidation function
     **/
    function executeERC721LiquidationCall(
        mapping(address => DataTypes.ReserveData) storage reservesData,
        mapping(uint256 => address) storage reservesList,
        mapping(address => DataTypes.UserConfigurationMap) storage usersConfig,
        DataTypes.ExecuteLiquidationCallParams memory params
    ) external {
        LiquidationCallLocalVars memory vars;

        DataTypes.ReserveData storage collateralReserve = reservesData[
            params.collateralAsset
        ];
        DataTypes.ReserveData storage liquidationAssetReserve = reservesData[
            params.liquidationAsset
        ];
        DataTypes.UserConfigurationMap storage userConfig = usersConfig[
            params.user
        ];

        vars.minimumCloseFactor = MAX_LIQUIDATION_CLOSE_FACTOR;
        vars.liquidationAssetReserveId = liquidationAssetReserve.id;
        vars.isLiquidationAssetBorrowed = userConfig.isBorrowing(
            vars.liquidationAssetReserveId
        );
        vars.liquidationAssetReserveCache = liquidationAssetReserve.cache();
        liquidationAssetReserve.updateState(vars.liquidationAssetReserveCache);

        vars.auctionEnabled =
            collateralReserve.auctionStrategyAddress != address(0);

        (
            vars.userGlobalCollateral,
            ,
            vars.userGlobalDebt, //in base currency
            ,
            ,
            ,
            ,
            ,
            vars.healthFactor,

        ) = GenericLogic.calculateUserAccountData(
            reservesData,
            reservesList,
            DataTypes.CalculateUserAccountDataParams({
                userConfig: userConfig,
                reservesCount: params.reservesCount,
                user: params.user,
                oracle: params.priceOracle
            })
        );

        if (vars.isLiquidationAssetBorrowed) {
            (vars.userDebt, vars.actualDebtToLiquidate) = _calculateDebt(
                params,
                vars
            );
        }

        (vars.collateralXToken, vars.liquidationBonus) = _getConfigurationData(
            collateralReserve,
            vars
        );

        (
            vars.userCollateral,
            vars.actualLiquidationAmount,
            vars.liquidationProtocolFeeAmount,
            vars.userGlobalDebt
        ) = _calculateERC721LiquidationParameters(
            collateralReserve,
            params,
            vars
        );

        ValidationLogic.validateERC721LiquidationCall(
            userConfig,
            collateralReserve,
            DataTypes.ValidateERC721LiquidationCallParams({
                liquidationAssetReserveCache: vars.liquidationAssetReserveCache,
                liquidator: params.liquidator,
                borrower: params.user,
                globalDebt: vars.userGlobalDebt,
                actualLiquidationAmount: vars.actualLiquidationAmount + vars.liquidationProtocolFeeAmount,
                maxLiquidationAmount: params.liquidationAmount,
                healthFactor: vars.healthFactor,
                priceOracleSentinel: params.priceOracleSentinel,
                tokenId: params.collateralTokenId,
                xTokenAddress: vars.collateralXToken,
                auctionEnabled: vars.auctionEnabled,
                auctionRecoveryHealthFactor: params.auctionRecoveryHealthFactor
            })
        );

        if (vars.auctionEnabled) {
            IAuctionableERC721(collateralReserve.xTokenAddress).endAuction(
                params.collateralTokenId
            );
            emit AuctionEnded(
                params.user,
                params.collateralAsset,
                params.collateralTokenId
            );
        }

        if (vars.actualLiquidationAmount > vars.actualDebtToLiquidate) {
            // the actualLiquidationAmount will never be greater than the amount the liquidator is passing in
            // require(params.liquidationAmount >= params.actualLiquidationAmount) - line 669 of ValidationLogic.sol
            // there will always be excess if actualLiquidationAmount > amount needed to liquidate
            // vars.actualDebtToLiquidate = The actual debt that is getting liquidated.
            // If liquidation amount passed in by the liquidator is greater then the total user debt,
            // then use the user total debt as the actual debt getting liquidated.
            // If the user total debt is greater than the liquidation amount getting passed in by the liquidator,
            // then use the liquidation amount the user is passing in.
            // userGlobalDebt = debt across all positions (ie. if there are multiple positions)
            // if the global debt > the actual debt that is getting liquidated then the excess amount goes to pay protocol
            SupplyLogic.executeSupply(
                reservesData,
                userConfig,
                DataTypes.ExecuteSupplyParams({
                    asset: params.liquidationAsset,
                    amount: vars.actualLiquidationAmount -
                        vars.actualDebtToLiquidate,
                    onBehalfOf: params.user,
                    referralCode: 0
                })
            );
            if (
                !userConfig.isUsingAsCollateral(vars.liquidationAssetReserveId)
            ) {
                userConfig.setUsingAsCollateral(
                    vars.liquidationAssetReserveId,
                    true
                );
                emit ReserveUsedAsCollateralEnabled(
                    params.liquidationAsset,
                    params.user
                );
            }
        } else {
            // if the actual debt that is getting liquidated > discounted price then there is no excess amount
            // update the actual debt that is getting liquidated to the discounted price of the nft
            vars.actualDebtToLiquidate = vars.actualLiquidationAmount;
        }

        if (
            vars.isLiquidationAssetBorrowed &&
            vars.userDebt == vars.actualDebtToLiquidate
        ) {
            userConfig.setBorrowing(vars.liquidationAssetReserveId, false);
        }

        // Transfer fee to treasury if it is non-zero
        if (vars.liquidationProtocolFeeAmount != 0) {
            IERC20(params.liquidationAsset).safeTransferFrom(
                params.liquidator,
                IPToken(vars.liquidationAssetReserveCache.xTokenAddress)
                    .RESERVE_TREASURY_ADDRESS(),
                vars.liquidationProtocolFeeAmount
            );
        }

        // If the collateral being liquidated is equal to the user balance,
        // we set the currency as not being used as collateral anymore
        if (vars.userCollateral == 1) {
            userConfig.setUsingAsCollateral(collateralReserve.id, false);
            emit ReserveUsedAsCollateralDisabled(
                params.collateralAsset,
                params.user
            );
        }

        if (vars.actualDebtToLiquidate != 0) {
            _burnDebtTokens(liquidationAssetReserve, params, vars);
        }

        if (params.receiveXToken) {
            INToken(vars.collateralXToken).transferOnLiquidation(
                params.user,
                params.liquidator,
                params.collateralTokenId
            );
        } else {
            _burnCollateralNTokens(params, vars);
        }

        emit ERC721LiquidationCall(
            params.collateralAsset,
            params.liquidationAsset,
            params.user,
            vars.actualDebtToLiquidate,
            params.collateralTokenId,
            params.liquidator,
            params.receiveXToken
        );
    }

    /**
     * @notice Burns the collateral xTokens and transfers the underlying to the liquidator.
     * @dev   The function also updates the state and the interest rate of the collateral reserve.
     * @param collateralReserve The data of the collateral reserve
     * @param params The additional parameters needed to execute the liquidation function
     * @param vars The executeLiquidationCall() function local vars
     */
    function _burnCollateralPTokens(
        DataTypes.ReserveData storage collateralReserve,
        DataTypes.ExecuteLiquidationCallParams memory params,
        LiquidationCallLocalVars memory vars
    ) internal {
        DataTypes.ReserveCache memory collateralReserveCache = collateralReserve
            .cache();
        collateralReserve.updateState(collateralReserveCache);
        collateralReserve.updateInterestRates(
            collateralReserveCache,
            params.collateralAsset,
            0,
            vars.actualCollateralToLiquidate
        );

        // Burn the equivalent amount of xToken, sending the underlying to the liquidator
        IPToken(vars.collateralXToken).burn(
            params.user,
            params.liquidator,
            vars.actualCollateralToLiquidate,
            collateralReserveCache.nextLiquidityIndex
        );
    }

    /**
     * @notice Burns the collateral xTokens and transfers the underlying to the liquidator.
     * @dev   The function also updates the state and the interest rate of the collateral reserve.
     * @param params The additional parameters needed to execute the liquidation function
     * @param vars The executeLiquidationCall() function local vars
     */
    function _burnCollateralNTokens(
        DataTypes.ExecuteLiquidationCallParams memory params,
        LiquidationCallLocalVars memory vars
    ) internal {
        // Burn the equivalent amount of xToken, sending the underlying to the liquidator
        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = params.collateralTokenId;
        INToken(vars.collateralXToken).burn(
            params.user,
            params.liquidator,
            tokenIds
        );
    }

    /**
     * @notice Liquidates the user xTokens by transferring them to the liquidator.
     * @dev   The function also checks the state of the liquidator and activates the xToken as collateral
     *        as in standard transfers if the isolation mode constraints are respected.
     * @param usersConfig The users configuration mapping that track the supplied/borrowed assets
     * @param collateralReserve The data of the collateral reserve
     * @param params The additional parameters needed to execute the liquidation function
     * @param vars The executeLiquidationCall() function local vars
     */
    function _liquidatePTokens(
        mapping(address => DataTypes.UserConfigurationMap) storage usersConfig,
        DataTypes.ReserveData storage collateralReserve,
        DataTypes.ExecuteLiquidationCallParams memory params,
        LiquidationCallLocalVars memory vars
    ) internal {
        IPToken pToken = IPToken(vars.collateralXToken);
        uint256 liquidatorPreviousPTokenBalance = pToken.balanceOf(
            params.liquidator
        );
        pToken.transferOnLiquidation(
            params.user,
            params.liquidator,
            vars.actualCollateralToLiquidate
        );

        if (liquidatorPreviousPTokenBalance == 0) {
            DataTypes.UserConfigurationMap
                storage liquidatorConfig = usersConfig[params.liquidator];

            liquidatorConfig.setUsingAsCollateral(collateralReserve.id, true);
            emit ReserveUsedAsCollateralEnabled(
                params.collateralAsset,
                params.liquidator
            );
        }
    }

    /**
     * @notice Burns the debt tokens of the user up to the amount being repaid by the liquidator.
     * @dev The function alters the `liquidationAssetReserveCache` state in `vars` to update the debt related data.
     * @param liquidationAssetReserve The data of the liquidation reserve
     * @param params The additional parameters needed to execute the liquidation function
     * @param vars the executeLiquidationCall() function local vars
     */
    function _burnDebtTokens(
        DataTypes.ReserveData storage liquidationAssetReserve,
        DataTypes.ExecuteLiquidationCallParams memory params,
        LiquidationCallLocalVars memory vars
    ) internal {
        // Transfers the debt asset being repaid to the xToken, where the liquidity is kept
        IERC20(params.liquidationAsset).safeTransferFrom(
            params.liquidator,
            vars.liquidationAssetReserveCache.xTokenAddress,
            vars.actualDebtToLiquidate
        );
        // Handle payment
        IPToken(vars.liquidationAssetReserveCache.xTokenAddress)
            .handleRepayment(params.liquidator, vars.actualDebtToLiquidate);
        // Burn borrower's debt token
        vars
            .liquidationAssetReserveCache
            .nextScaledVariableDebt = IVariableDebtToken(
            vars.liquidationAssetReserveCache.variableDebtTokenAddress
        ).burn(
                params.user,
                vars.actualDebtToLiquidate,
                vars.liquidationAssetReserveCache.nextVariableBorrowIndex
            );
        // Update borrow & supply rate
        liquidationAssetReserve.updateInterestRates(
            vars.liquidationAssetReserveCache,
            params.liquidationAsset,
            vars.actualDebtToLiquidate,
            0
        );
    }

    /**
     * @notice Calculates the total debt of the user and the actual amount to liquidate depending on the health factor
     * and corresponding close factor. we are always using max closing factor in this version
     * @param params The additional parameters needed to execute the liquidation function
     * @param vars the executeLiquidationCall() function local vars
     * @return The total debt of the user
     * @return The actual debt that is getting liquidated. If liquidation amount passed in by the liquidator is greater then the total user debt, then use the user total debt as the actual debt getting liquidated. If the user total debt is greater than the liquidation amount getting passed in by the liquidator, then use the liquidation amount the user is passing in.
     */
    function _calculateDebt(
        DataTypes.ExecuteLiquidationCallParams memory params,
        LiquidationCallLocalVars memory vars
    ) internal view returns (uint256, uint256) {
        // userDebt = debt of the borrowed position needed for liquidation
        uint256 userDebt = Helpers.getUserCurrentDebt(
            params.user,
            vars.liquidationAssetReserveCache.variableDebtTokenAddress
        );

        uint256 closeFactor = vars.healthFactor > CLOSE_FACTOR_HF_THRESHOLD
            ? DEFAULT_LIQUIDATION_CLOSE_FACTOR
            : MAX_LIQUIDATION_CLOSE_FACTOR;

        uint256 maxLiquidatableDebt = userDebt.percentMul(
            closeFactor > vars.minimumCloseFactor
                ? closeFactor
                : vars.minimumCloseFactor
        );

        uint256 actualDebtToLiquidate = params.liquidationAmount >
            maxLiquidatableDebt
            ? maxLiquidatableDebt
            : params.liquidationAmount;

        return (userDebt, actualDebtToLiquidate);
    }

    /**
     * @notice Returns the configuration data for the debt and the collateral reserves.
     * @param collateralReserve The data of the collateral reserve
     * @return The collateral xToken
     * @return The liquidation bonus to apply to the collateral
     */
    function _getConfigurationData(
        DataTypes.ReserveData storage collateralReserve,
        LiquidationCallLocalVars memory vars
    ) internal view returns (address, uint256) {
        address collateralXToken = collateralReserve.xTokenAddress;
        uint256 liquidationBonus = collateralReserve
            .configuration
            .getLiquidationBonus();

        if (!vars.isLiquidationAssetBorrowed || vars.auctionEnabled) {
            liquidationBonus = PercentageMath.PERCENTAGE_FACTOR;
        }

        return (collateralXToken, liquidationBonus);
    }

    /**
     * @notice Calculates how much of a specific collateral can be liquidated, given
     * a certain amount of debt asset.
     * @dev This function needs to be called after all the checks to validate the liquidation have been performed,
     *   otherwise it might fail.
     * @param collateralReserve The data of the collateral reserve
     * @param params The additional parameters needed to execute the liquidation function
     * @param superVars the executeLiquidationCall() function local vars
     * @return The user collateral balance
     * @return The maximum amount that is possible to liquidate given all the liquidation constraints (user balance, close factor)
     * @return The amount to repay with the liquidation
     * @return The fee taken from the liquidation bonus amount to be paid to the protocol
     **/
    function _calculateERC20LiquidationParameters(
        DataTypes.ReserveData storage collateralReserve,
        DataTypes.ExecuteLiquidationCallParams memory params,
        LiquidationCallLocalVars memory superVars
    )
        internal
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        LiquidationParametersLocalVars memory vars;

        vars.userCollateral = IPToken(superVars.collateralXToken).balanceOf(
            params.user
        );
        vars.collateralPrice = IPriceOracleGetter(params.priceOracle)
            .getAssetPrice(params.collateralAsset);
        vars.liquidationAssetPrice = IPriceOracleGetter(params.priceOracle)
            .getAssetPrice(params.liquidationAsset);

        vars.collateralDecimals = collateralReserve.configuration.getDecimals();
        vars.liquidationAssetDecimals = superVars
            .liquidationAssetReserveCache
            .reserveConfiguration
            .getDecimals();

        unchecked {
            vars.collateralAssetUnit = 10**vars.collateralDecimals;
            vars.liquidationAssetUnit = 10**vars.liquidationAssetDecimals;
        }

        vars.liquidationProtocolFeePercentage = collateralReserve
            .configuration
            .getLiquidationProtocolFee();

        uint256 maxCollateralToLiquidate = ((vars.liquidationAssetPrice *
            params.liquidationAmount *
            vars.collateralAssetUnit) /
            (vars.collateralPrice * vars.liquidationAssetUnit)).percentMul(
                superVars.liquidationBonus
            );

        if (maxCollateralToLiquidate > superVars.userCollateral) {
            vars.actualCollateralToLiquidate = superVars.userCollateral;
            vars.actualLiquidationAmount = (
                ((vars.collateralPrice *
                    vars.actualCollateralToLiquidate *
                    vars.liquidationAssetUnit) /
                    (vars.liquidationAssetPrice * vars.collateralAssetUnit))
            ).percentDiv(superVars.liquidationBonus);
        } else {
            vars.actualCollateralToLiquidate = maxCollateralToLiquidate;
            vars.actualLiquidationAmount = params.liquidationAmount;
        }

        if (vars.liquidationProtocolFeePercentage != 0) {
            uint256 bonusCollateral = vars.actualCollateralToLiquidate -
                vars.actualCollateralToLiquidate.percentDiv(
                    superVars.liquidationBonus
                );

            vars.liquidationProtocolFee = bonusCollateral.percentMul(
                vars.liquidationProtocolFeePercentage
            );

            return (
                vars.userCollateral,
                vars.actualCollateralToLiquidate - vars.liquidationProtocolFee,
                vars.actualLiquidationAmount,
                vars.liquidationProtocolFee
            );
        } else {
            return (
                vars.userCollateral,
                vars.actualCollateralToLiquidate,
                vars.actualLiquidationAmount,
                0
            );
        }
    }

    /**
     * @notice Calculates how much of a specific collateral can be liquidated, given
     * a certain amount of debt asset.
     * @dev This function needs to be called after all the checks to validate the liquidation have been performed,
     *   otherwise it might fail.
     * @param collateralReserve The data of the collateral reserve
     * @param params The additional parameters needed to execute the liquidation function
     * @param superVars the executeLiquidationCall() function local vars
     * @return The user collateral balance
     * @return The discounted nft price + the liquidationProtocolFee
     * @return The liquidationProtocolFee
     * @return The debt price you are paying in (for example, USD or ETH)
     **/
    function _calculateERC721LiquidationParameters(
        DataTypes.ReserveData storage collateralReserve,
        DataTypes.ExecuteLiquidationCallParams memory params,
        LiquidationCallLocalVars memory superVars
    )
        internal
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        LiquidationParametersLocalVars memory vars;

        vars.userCollateral = ICollaterizableERC721(superVars.collateralXToken)
            .collaterizedBalanceOf(params.user);

        // price of the asset that is used as collateral
        if (INToken(collateralReserve.xTokenAddress).getAtomicPricingConfig()) {
            vars.collateralPrice = IPriceOracleGetter(params.priceOracle)
                .getTokenPrice(
                    params.collateralAsset,
                    params.collateralTokenId
                );
        } else {
            vars.collateralPrice = IPriceOracleGetter(params.priceOracle)
                .getAssetPrice(params.collateralAsset);
        }

        if (
            superVars.auctionEnabled &&
            IAuctionableERC721(collateralReserve.xTokenAddress).isAuctioned(
                params.collateralTokenId
            )
        ) {
            vars.auctionStartTime = IAuctionableERC721(
                collateralReserve.xTokenAddress
            ).getAuctionData(params.collateralTokenId).startTime;
            vars.auctionMultiplier = IReserveAuctionStrategy(
                collateralReserve.auctionStrategyAddress
            ).calculateAuctionPriceMultiplier(
                    vars.auctionStartTime,
                    block.timestamp
                );
            vars.collateralPrice = vars.collateralPrice.mul(
                vars.auctionMultiplier
            );
        }

        // price of the asset the liquidator is liquidating with
        vars.liquidationAssetPrice = IPriceOracleGetter(params.priceOracle)
            .getAssetPrice(params.liquidationAsset);
        vars.liquidationAssetDecimals = superVars
            .liquidationAssetReserveCache
            .reserveConfiguration
            .getDecimals();

        unchecked {
            vars.liquidationAssetUnit = 10**vars.liquidationAssetDecimals;
        }

        vars.liquidationProtocolFeePercentage = collateralReserve
            .configuration
            .getLiquidationProtocolFee();

        uint256 collateralToLiquate = (vars.collateralPrice *
            vars.liquidationAssetUnit) / vars.liquidationAssetPrice;

        // base currency to convert to liquidation asset unit.
        uint256 globalDebtAmount = (superVars.userGlobalDebt *
            vars.liquidationAssetUnit) / vars.liquidationAssetPrice;

        // (liquidation amount (passed in by liquidator, this has decimals) * liquidationAssetPrice) / number of decimals
        // ie. liquidation amount (10k DAI * 10^18) * price of DAI ($1) / 10^18 = 10k
        // vars.liquidationAmountInBaseCurrency needs to be >= vars.actualLiquidationAmount otherwise the liquidator cannot buy the NFT
        // in a scenario where there are multiple people trying to liquidate and the highest amount would pay back the more of the total global debt that user has to protocol
        vars.liquidationAmountInBaseCurrency =
            (params.liquidationAmount * vars.liquidationAssetPrice) /
            vars.liquidationAssetUnit;

        vars.actualLiquidationAmount = collateralToLiquate.percentDiv(
            superVars.liquidationBonus
        );

        if (vars.liquidationProtocolFeePercentage != 0) {
            uint256 bonusCollateral = collateralToLiquate -
                vars.actualLiquidationAmount;

            vars.liquidationProtocolFee = bonusCollateral.percentMul(
                vars.liquidationProtocolFeePercentage
            );

            return (
                vars.userCollateral,
                vars.actualLiquidationAmount,
                vars.liquidationProtocolFee,
                globalDebtAmount
            );
        } else {
            return (
                vars.userCollateral,
                vars.actualLiquidationAmount,
                0,
                globalDebtAmount
            );
        }
    }
}
