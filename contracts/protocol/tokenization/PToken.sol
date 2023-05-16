// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

import {IERC20} from "../../dependencies/openzeppelin/contracts/IERC20.sol";
import {GPv2SafeERC20} from "../../dependencies/gnosis/contracts/GPv2SafeERC20.sol";
import {SafeCast} from "../../dependencies/openzeppelin/contracts/SafeCast.sol";
import {VersionedInitializable} from "../libraries/paraspace-upgradeability/VersionedInitializable.sol";
import {Errors} from "../libraries/helpers/Errors.sol";
import {WadRayMath} from "../libraries/math/WadRayMath.sol";
import {IPool} from "../../interfaces/IPool.sol";
import {IPToken} from "../../interfaces/IPToken.sol";
import {IRewardController} from "../../interfaces/IRewardController.sol";
import {IInitializablePToken} from "../../interfaces/IInitializablePToken.sol";
import {ScaledBalanceTokenBaseERC20} from "./base/ScaledBalanceTokenBaseERC20.sol";
import {IncentivizedERC20} from "./base/IncentivizedERC20.sol";
import {EIP712Base} from "./base/EIP712Base.sol";
import {XTokenType} from "../../interfaces/IXTokenType.sol";
import {ITimeLock} from "../../interfaces/ITimeLock.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {Address} from "../../dependencies/openzeppelin/contracts/Address.sol";
import {ISwapAdapter} from "../../interfaces/ISwapAdapter.sol";
import {Helpers} from "../../protocol/libraries/helpers/Helpers.sol";
import {Math} from "../../dependencies/openzeppelin/contracts/Math.sol";

/**
 * @title ParaSpace ERC20 PToken
 *
 * @notice Implementation of the interest bearing token for the ParaSpace protocol
 */
contract PToken is
    VersionedInitializable,
    ScaledBalanceTokenBaseERC20,
    EIP712Base,
    IPToken
{
    using WadRayMath for uint256;
    using SafeCast for uint256;
    using GPv2SafeERC20 for IERC20;

    bytes32 public constant PERMIT_TYPEHASH =
        keccak256(
            "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
        );

    uint256 public constant PTOKEN_REVISION = 149;

    address internal _treasury;
    address internal _underlyingAsset;
    uint256[50] private __gap;

    /// @inheritdoc VersionedInitializable
    function getRevision() internal pure virtual override returns (uint256) {
        return PTOKEN_REVISION;
    }

    /**
     * @dev Constructor.
     * @param pool The address of the Pool contract
     */
    constructor(IPool pool)
        ScaledBalanceTokenBaseERC20(pool, "PTOKEN_IMPL", "PTOKEN_IMPL", 0)
        EIP712Base()
    {
        // Intentionally left blank
    }

    /// @inheritdoc IInitializablePToken
    function initialize(
        IPool initializingPool,
        address treasury,
        address underlyingAsset,
        IRewardController incentivesController,
        uint8 pTokenDecimals,
        string calldata pTokenName,
        string calldata pTokenSymbol,
        bytes calldata params
    ) external override initializer {
        require(initializingPool == POOL, Errors.POOL_ADDRESSES_DO_NOT_MATCH);
        _setName(pTokenName);
        _setSymbol(pTokenSymbol);
        _setDecimals(pTokenDecimals);

        require(underlyingAsset != address(0), Errors.ZERO_ADDRESS_NOT_VALID);
        _treasury = treasury;
        _underlyingAsset = underlyingAsset;
        _rewardController = incentivesController;

        _domainSeparator = _calculateDomainSeparator();

        emit Initialized(
            underlyingAsset,
            address(POOL),
            treasury,
            address(incentivesController),
            pTokenDecimals,
            pTokenName,
            pTokenSymbol,
            params
        );
    }

    /// @inheritdoc IPToken
    function mint(
        address caller,
        address onBehalfOf,
        uint256 amount,
        uint256 index
    ) external virtual override onlyPool returns (bool) {
        return _mintScaled(caller, onBehalfOf, amount, index);
    }

    /// @inheritdoc IPToken
    function burn(
        address from,
        address receiverOfUnderlying,
        uint256 amount,
        uint256 index,
        DataTypes.TimeLockParams calldata timeLockParams
    ) external virtual override onlyPool {
        _burnScaled(from, receiverOfUnderlying, amount, index);
        if (receiverOfUnderlying != address(this)) {
            _sendToUserOrTimeLock(
                timeLockParams,
                POOL.TIME_LOCK(),
                _underlyingAsset,
                amount,
                receiverOfUnderlying
            );
        }
    }

    /// @inheritdoc IPToken
    function mintToTreasury(uint256 amount, uint256 index)
        external
        virtual
        override
        onlyPool
    {
        if (amount == 0) {
            return;
        }
        _mintScaled(address(POOL), _treasury, amount, index);
    }

    /// @inheritdoc IPToken
    function transferOnLiquidation(
        address from,
        address to,
        uint256 value
    ) external virtual override onlyPool {
        _transfer(from, to, value, false);
    }

    /// @inheritdoc IERC20
    function balanceOf(address user)
        public
        view
        virtual
        override(IncentivizedERC20, IERC20)
        returns (uint256)
    {
        return
            super.balanceOf(user).rayMul(
                POOL.getReserveNormalizedIncome(_underlyingAsset)
            );
    }

    /// @inheritdoc IERC20
    function totalSupply()
        public
        view
        virtual
        override(IncentivizedERC20, IERC20)
        returns (uint256)
    {
        uint256 currentSupplyScaled = super.totalSupply();

        if (currentSupplyScaled == 0) {
            return 0;
        }

        return
            currentSupplyScaled.rayMul(
                POOL.getReserveNormalizedIncome(_underlyingAsset)
            );
    }

    /// @inheritdoc IPToken
    function RESERVE_TREASURY_ADDRESS()
        external
        view
        override
        returns (address)
    {
        return _treasury;
    }

    /// @inheritdoc IPToken
    function UNDERLYING_ASSET_ADDRESS()
        external
        view
        override
        returns (address)
    {
        return _underlyingAsset;
    }

    /// @inheritdoc IPToken
    function transferUnderlyingTo(
        address target,
        uint256 amount,
        DataTypes.TimeLockParams calldata timeLockParams
    ) public virtual override onlyPool {
        _sendToUserOrTimeLock(
            timeLockParams,
            POOL.TIME_LOCK(),
            _underlyingAsset,
            amount,
            target
        );
    }

    /// @inheritdoc IPToken
    function swapUnderlyingTo(
        address target,
        DataTypes.TimeLockParams calldata timeLockParams,
        DataTypes.SwapAdapter calldata swapAdapter,
        bytes calldata swapPayload,
        DataTypes.SwapInfo calldata swapInfo
    ) external virtual override onlyPool returns (uint256 amount) {
        uint256 beforeBalance;
        if (swapInfo.exactInput) {
            beforeBalance = IERC20(swapInfo.dstToken).balanceOf(address(this));
        }

        Helpers.checkExactAllowance(
            swapInfo.srcToken,
            swapAdapter.router,
            swapInfo.maxAmountIn
        );
        bytes memory returndata = Address.functionDelegateCall(
            swapAdapter.adapter,
            abi.encodeWithSelector(
                ISwapAdapter.swap.selector,
                swapAdapter.router,
                swapPayload,
                swapInfo.exactInput
            )
        );
        amount = abi.decode(returndata, (uint256));

        uint256 amountOut = swapInfo.exactInput
            ? IERC20(swapInfo.dstToken).balanceOf(address(this)) - beforeBalance
            : amount;

        require(amountOut > 0, Errors.CALL_SWAP_FAILED);

        _sendToUserOrTimeLock(
            timeLockParams,
            POOL.TIME_LOCK(),
            swapInfo.dstToken,
            amountOut,
            target
        );
    }

    /// @inheritdoc IPToken
    function handleRepayment(address user, uint256 amount)
        external
        virtual
        override
        onlyPool
    {
        // Intentionally left blank
    }

    /// @inheritdoc IPToken
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {
        require(owner != address(0), Errors.ZERO_ADDRESS_NOT_VALID);
        //solium-disable-next-line
        require(block.timestamp <= deadline, Errors.INVALID_EXPIRATION);
        uint256 currentValidNonce = _nonces[owner];
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR(),
                keccak256(
                    abi.encode(
                        PERMIT_TYPEHASH,
                        owner,
                        spender,
                        value,
                        currentValidNonce,
                        deadline
                    )
                )
            )
        );
        require(owner == ecrecover(digest, v, r, s), Errors.INVALID_SIGNATURE);
        _nonces[owner] = currentValidNonce + 1;
        _approve(owner, spender, value);
    }

    /**
     * @notice Transfers the pTokens between two users. Validates the transfer
     * (ie checks for valid HF after the transfer) if required
     * @param from The source address
     * @param to The destination address
     * @param amount The amount getting transferred
     * @param validate True if the transfer needs to be validated, false otherwise
     **/
    function _transfer(
        address from,
        address to,
        uint256 amount,
        bool validate
    ) internal virtual {
        address underlyingAsset = _underlyingAsset;

        uint256 index = POOL.getReserveNormalizedIncome(underlyingAsset);

        uint256 fromBalanceBefore = super.balanceOf(from).rayMul(index);
        uint256 toBalanceBefore = super.balanceOf(to).rayMul(index);

        super._transferScaled(from, to, amount, index);

        if (validate) {
            POOL.finalizeTransfer(
                underlyingAsset,
                from,
                to,
                false,
                amount,
                fromBalanceBefore,
                toBalanceBefore
            );
        }

        emit Transfer(from, to, amount);
    }

    /**
     * @notice Overrides the parent _transfer to force validated transfer() and transferFrom()
     * @param from The source address
     * @param to The destination address
     * @param amount The amount getting transferred
     **/
    function _transfer(
        address from,
        address to,
        uint128 amount
    ) internal virtual override {
        _transfer(from, to, amount, true);
    }

    /**
     * @dev Overrides the base function to fully implement IPToken
     * @dev see `IncentivizedERC20.DOMAIN_SEPARATOR()` for more detailed documentation
     */
    function DOMAIN_SEPARATOR()
        public
        view
        override(IPToken, EIP712Base)
        returns (bytes32)
    {
        return super.DOMAIN_SEPARATOR();
    }

    /**
     * @dev Overrides the base function to fully implement IPToken
     * @dev see `IncentivizedERC20.nonces()` for more detailed documentation
     */
    function nonces(address owner)
        public
        view
        override(IPToken, EIP712Base)
        returns (uint256)
    {
        return super.nonces(owner);
    }

    /// @inheritdoc EIP712Base
    function _EIP712BaseId() internal view override returns (string memory) {
        return name();
    }

    /// @inheritdoc IPToken
    function rescueTokens(
        address token,
        address to,
        uint256 amount
    ) external override onlyPoolAdmin {
        require(token != _underlyingAsset, Errors.UNDERLYING_CANNOT_BE_RESCUED);
        IERC20(token).safeTransfer(to, amount);
    }

    function getXTokenType()
        external
        pure
        virtual
        override
        returns (XTokenType)
    {
        return XTokenType.PToken;
    }

    function _sendToUserOrTimeLock(
        DataTypes.TimeLockParams calldata timeLockParams,
        ITimeLock timeLock,
        address asset,
        uint256 amount,
        address target
    ) internal {
        if (timeLockParams.releaseTime != 0) {
            uint256[] memory amounts = new uint256[](1);
            amounts[0] = amount;

            timeLock.createAgreement(
                DataTypes.AssetType.ERC20,
                timeLockParams.actionType,
                asset,
                amounts,
                target,
                timeLockParams.releaseTime
            );

            target = address(timeLock);
        }
        IERC20(asset).safeTransfer(target, amount);
    }
}
