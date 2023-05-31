// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

import {INToken} from "../../../interfaces/INToken.sol";
import {IPoolAddressesProvider} from "../../../interfaces/IPoolAddressesProvider.sol";
import {DataTypes} from "../types/DataTypes.sol";
import {IPToken} from "../../../interfaces/IPToken.sol";
import {IERC20} from "../../../dependencies/openzeppelin/contracts/IERC20.sol";
import {Errors} from "../helpers/Errors.sol";
import {ValidationLogic} from "./ValidationLogic.sol";
import {SupplyLogic} from "./SupplyLogic.sol";
import {BorrowLogic} from "./BorrowLogic.sol";
import {ReserveLogic} from "./ReserveLogic.sol";
import {ReserveConfiguration} from "../configuration/ReserveConfiguration.sol";
import {Address} from "../../../dependencies/openzeppelin/contracts/Address.sol";
import {ILendPoolLoan} from "../../../dependencies/benddao/contracts/interfaces/ILendPoolLoan.sol";
import {ILendPool} from "../../../dependencies/benddao/contracts/interfaces/ILendPool.sol";
import {BDaoDataTypes} from "../../../dependencies/benddao/contracts/libraries/types/BDaoDataTypes.sol";

/**
 * @title PositionMoverLogic library
 *
 * @notice Implements the base logic for moving positions
 */
library PositionMoverLogic {
    using ReserveConfiguration for DataTypes.ReserveConfigurationMap;
    using ReserveLogic for DataTypes.ReserveData;

    struct PositionMoverVars {
        address[] nftAssets;
        uint256[] tokenIds;
        uint256[] borrowAmounts;
        uint256 totalBorrowAmount;
    }

    event PositionMoved(address asset, uint256 tokenId, address user);

    function executeMovePositionFromBendDAO(
        DataTypes.PoolStorage storage ps,
        IPoolAddressesProvider poolAddressProvider,
        ILendPoolLoan lendPoolLoan,
        ILendPool lendPool,
        uint256[] calldata loanIds
    ) external {
        address weth = poolAddressProvider.getWETH();
        DataTypes.ReserveData storage reserve = ps._reserves[weth];
        address xTokenAddress = reserve.xTokenAddress;

        uint256 borrowAmount = _repayBendDAOPositionLoanAndSupply(
            ps,
            lendPoolLoan,
            lendPool,
            weth,
            xTokenAddress,
            loanIds
        );

        borrowWETH(ps, poolAddressProvider, weth, borrowAmount);
    }

    function _repayBendDAOPositionLoanAndSupply(
        DataTypes.PoolStorage storage ps,
        ILendPoolLoan lendPoolLoan,
        ILendPool lendPool,
        address weth,
        address xTokenAddress,
        uint256[] calldata loanIds
    ) internal returns (uint256 borrowAmount) {
        BDaoDataTypes.LoanData memory loanData;
        PositionMoverVars memory tmpVar;

        tmpVar.borrowAmounts = new uint256[](loanIds.length);
        tmpVar.nftAssets = new address[](loanIds.length);
        tmpVar.tokenIds = new uint256[](loanIds.length);

        for (uint256 index = 0; index < loanIds.length; index++) {
            loanData = lendPoolLoan.getLoan(loanIds[index]);

            require(
                loanData.state == BDaoDataTypes.LoanState.Active,
                "Loan not active"
            );
            require(loanData.borrower == msg.sender, Errors.NOT_THE_OWNER);

            (, tmpVar.borrowAmounts[index]) = lendPoolLoan
                .getLoanReserveBorrowAmount(loanIds[index]);

            tmpVar.totalBorrowAmount += tmpVar.borrowAmounts[index];

            tmpVar.nftAssets[index] = loanData.nftAsset;
            tmpVar.tokenIds[index] = loanData.nftTokenId;
            emit PositionMoved(
                loanData.nftAsset,
                loanData.nftTokenId,
                msg.sender
            );
        }

        DataTypes.TimeLockParams memory timeLockParams;
        IPToken(xTokenAddress).transferUnderlyingTo(
            address(this),
            tmpVar.totalBorrowAmount,
            timeLockParams
        );
        IERC20(weth).approve(address(lendPool), tmpVar.totalBorrowAmount);

        lendPool.batchRepay(
            tmpVar.nftAssets,
            tmpVar.tokenIds,
            tmpVar.borrowAmounts
        );

        supplyAssets(ps, tmpVar);

        borrowAmount = tmpVar.totalBorrowAmount;
    }

    function supplyAssets(
        DataTypes.PoolStorage storage ps,
        PositionMoverVars memory tmpVar
    ) internal {
        uint256 tokenIdsLength = tmpVar.tokenIds.length;
        DataTypes.ERC721SupplyParams[]
            memory tokensToSupply = new DataTypes.ERC721SupplyParams[](
                tokenIdsLength
            );

        address currentSupplyAsset = tmpVar.nftAssets[0];
        uint256 supplySize = 1;
        tokensToSupply[0] = DataTypes.ERC721SupplyParams({
            tokenId: tmpVar.tokenIds[0],
            useAsCollateral: true
        });
        uint256 nextIndex;
        /**
            The following logic divides the array of tokenIds into sub-arrays based on the asset in a greedy logic.
            Then uses the sub-arrays as an inout to the supply logic to reduce the number of supplies.
            Example1:
            input: [BAYCToken1, BAYCToken2, MAYCToken1, MAYCToken1, BAKCToken1]
            output: [BAYCToken1, BAYCToken2] [MAYCToken1, MAYCToken1] [BAKCToken1] (3 supply calls)

            Example2:
            input: [BAYCToken1, MAYCToken1, BAYCToken2, MAYCToken1, BAKCToken1]
            output: [BAYCToken1] [MAYCToken1] [BAYCToken2] [MAYCToken1] [BAKCToken1] (5 supply calls)
            Note: To optimi
         */
        for (uint256 index = 0; index < tokenIdsLength; index++) {
            nextIndex = index + 1;
            if (
                nextIndex < tokenIdsLength &&
                tmpVar.nftAssets[index] == tmpVar.nftAssets[nextIndex]
            ) {
                tokensToSupply[supplySize] = DataTypes.ERC721SupplyParams({
                    tokenId: tmpVar.tokenIds[nextIndex],
                    useAsCollateral: true
                });
                supplySize++;
            } else {
                reduceArrayAndSupply(
                    ps,
                    currentSupplyAsset,
                    tokensToSupply,
                    supplySize
                );

                if (nextIndex < tokenIdsLength) {
                    currentSupplyAsset = tmpVar.nftAssets[nextIndex];
                    tokensToSupply = new DataTypes.ERC721SupplyParams[](
                        tokenIdsLength
                    );
                    tokensToSupply[0] = DataTypes.ERC721SupplyParams({
                        tokenId: tmpVar.tokenIds[nextIndex],
                        useAsCollateral: true
                    });
                    supplySize = 1;
                }
            }
        }
    }

    function reduceArrayAndSupply(
        DataTypes.PoolStorage storage ps,
        address asset,
        DataTypes.ERC721SupplyParams[] memory tokensToSupply,
        uint256 subArraySize
    ) internal {
        if (tokensToSupply.length - subArraySize != 0 && subArraySize != 0) {
            assembly {
                mstore(tokensToSupply, subArraySize)
            }
        }

        // supply the current asset and tokens
        SupplyLogic.executeSupplyERC721(
            ps._reserves,
            ps._usersConfig[msg.sender],
            DataTypes.ExecuteSupplyERC721Params({
                asset: asset,
                tokenData: tokensToSupply,
                onBehalfOf: msg.sender,
                payer: msg.sender,
                referralCode: 0x0
            })
        );
    }

    function borrowWETH(
        DataTypes.PoolStorage storage ps,
        IPoolAddressesProvider poolAddressProvider,
        address weth,
        uint256 borrowAmount
    ) internal {
        BorrowLogic.executeBorrow(
            ps._reserves,
            ps._reservesList,
            ps._usersConfig[msg.sender],
            DataTypes.ExecuteBorrowParams({
                asset: weth,
                user: msg.sender,
                onBehalfOf: msg.sender,
                amount: borrowAmount,
                referralCode: 0x0,
                releaseUnderlying: false,
                reservesCount: ps._reservesCount,
                oracle: poolAddressProvider.getPriceOracle(),
                priceOracleSentinel: poolAddressProvider.getPriceOracleSentinel()
            })
        );
    }
}
