// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

import {IPool} from "../../interfaces/IPool.sol";
import "../../interfaces/IParaApeStaking.sol";
import {IERC20, SafeERC20} from "../../dependencies/openzeppelin/contracts/SafeERC20.sol";
import "../../dependencies/yoga-labs/ApeCoinStaking.sol";
import {PercentageMath} from "../../protocol/libraries/math/PercentageMath.sol";
import "../../interfaces/IAutoCompoundApe.sol";
import "../../interfaces/ICApe.sol";
import {SignatureChecker} from "../../dependencies/looksrare/contracts/libraries/SignatureChecker.sol";
import "../../dependencies/openzeppelin/contracts/SafeCast.sol";
import {WadRayMath} from "../../protocol/libraries/math/WadRayMath.sol";
import "hardhat/console.sol";

/**
 * @title ApeStakingVaultLogic library
 *
 * @notice Implements the base logic for ape staking vault
 */
library ApeStakingVaultLogic {
    using PercentageMath for uint256;
    using SafeCast for uint256;
    using SafeERC20 for IERC20;
    using WadRayMath for uint256;

    uint256 constant BAYC_POOL_ID = 1;
    uint256 constant MAYC_POOL_ID = 2;
    uint256 constant BAKC_POOL_ID = 3;

    event PairNFTDeposited(
        bool isBAYC,
        uint256 apeTokenId,
        uint256 bakcTokenId
    );
    event PairNFTStaked(bool isBAYC, uint256 apeTokenId, uint256 bakcTokenId);
    event PairNFTWithdrew(bool isBAYC, uint256 apeTokenId, uint256 bakcTokenId);
    event PairNFTClaimed(bool isBAYC, uint256 apeTokenId, uint256 bakcTokenId);
    event PairNFTCompounded(
        bool isBAYC,
        uint256 apeTokenId,
        uint256 bakcTokenId
    );

    function depositPairNFT(
        IParaApeStaking.PoolState storage poolState,
        IParaApeStaking.ApeStakingVaultCacheVars memory vars,
        bool isBAYC,
        uint32[] calldata apeTokenIds,
        uint32[] calldata bakcTokenIds
    ) external {
        uint256 arrayLength = apeTokenIds.length;
        require(
            arrayLength == bakcTokenIds.length && arrayLength > 0,
            "wrong param"
        );

        vars.apeStakingPoolId = isBAYC ? BAYC_POOL_ID : MAYC_POOL_ID;
        vars.apeToken = isBAYC ? vars.bayc : vars.mayc;
        vars.nApe = isBAYC ? vars.nBayc : vars.nMayc;
        address msgSender = msg.sender;
        for (uint256 index = 0; index < arrayLength; index++) {
            uint32 apeTokenId = apeTokenIds[index];
            uint32 bakcTokenId = bakcTokenIds[index];

            //check ntoken owner
            {
                address nApeOwner = IERC721(vars.nApe).ownerOf(apeTokenId);
                address nBakcOwner = IERC721(vars.nBakc).ownerOf(bakcTokenId);
                require(
                    msgSender == nApeOwner && msgSender == nBakcOwner,
                    "not owner"
                );
            }

            // check both ape and bakc are not staking
            {
                (uint256 stakedAmount, ) = vars.apeCoinStaking.nftPosition(
                    vars.apeStakingPoolId,
                    apeTokenId
                );
                require(stakedAmount == 0, "ape already staked");
                (stakedAmount, ) = vars.apeCoinStaking.nftPosition(
                    BAKC_POOL_ID,
                    bakcTokenId
                );
                require(stakedAmount == 0, "bakc already staked");
                (, bool isPaired) = vars.apeCoinStaking.mainToBakc(
                    vars.apeStakingPoolId,
                    apeTokenId
                );
                require(!isPaired, "ape already pair staked");
            }

            //update pair status
            poolState.pairStatus[apeTokenId] = IApeStakingVault.PairingStatus({
                tokenId: bakcTokenId,
                isPaired: true
            });

            //transfer ape and BAKC
            IERC721(vars.apeToken).safeTransferFrom(
                vars.nApe,
                address(this),
                apeTokenId
            );
            IERC721(vars.bakc).safeTransferFrom(
                vars.nBakc,
                address(this),
                bakcTokenId
            );

            //emit event
            emit PairNFTDeposited(isBAYC, apeTokenId, bakcTokenId);
        }
    }

    function stakingPairNFT(
        IParaApeStaking.PoolState storage poolState,
        IParaApeStaking.ApeStakingVaultCacheVars memory vars,
        bool isBAYC,
        uint32[] calldata apeTokenIds,
        uint32[] calldata bakcTokenIds
    ) external {
        console.log("stakingPairNFT---------------------1");
        uint256 arrayLength = apeTokenIds.length;
        require(
            arrayLength == bakcTokenIds.length && arrayLength > 0,
            "wrong param"
        );

        ApeCoinStaking.SingleNft[]
            memory _nfts = new ApeCoinStaking.SingleNft[](arrayLength);
        ApeCoinStaking.PairNftDepositWithAmount[]
            memory _nftPairs = new ApeCoinStaking.PairNftDepositWithAmount[](
                arrayLength
            );
        vars.positionCap = isBAYC ? vars.baycMatchedCap : vars.maycMatchedCap;
        vars.accumulatedRewardsPerNft = poolState.accumulatedRewardsPerNft;
        for (uint256 index = 0; index < arrayLength; index++) {
            uint32 apeTokenId = apeTokenIds[index];
            uint32 bakcTokenId = bakcTokenIds[index];

            // check pair status
            {
                IApeStakingVault.PairingStatus
                    memory localPairStatus = poolState.pairStatus[apeTokenId];
                require(
                    localPairStatus.tokenId == bakcTokenId &&
                        localPairStatus.isPaired,
                    "wrong pair status"
                );
            }

            //update state
            poolState.rewardsDebt[apeTokenId] = vars.accumulatedRewardsPerNft;

            // construct staking data
            _nfts[index] = ApeCoinStaking.SingleNft({
                tokenId: apeTokenId,
                amount: vars.positionCap.toUint224()
            });
            _nftPairs[index] = ApeCoinStaking.PairNftDepositWithAmount({
                mainTokenId: apeTokenId,
                bakcTokenId: bakcTokenId,
                amount: vars.bakcMatchedCap.toUint184()
            });

            //emit event
            emit PairNFTStaked(isBAYC, apeTokenId, bakcTokenId);
        }

        // prepare Ape coin
        console.log("---------------------0");
        uint256 totalBorrow = (vars.positionCap + vars.bakcMatchedCap) *
            arrayLength;
        uint256 latestBorrowIndex = IPool(vars.pool).borrowPoolCApe(
            totalBorrow
        );
        IAutoCompoundApe(vars.cApe).withdraw(totalBorrow);
        uint256 cApeExchangeRate = ICApe(vars.cApe).getPooledApeByShares(
            WadRayMath.RAY
        );
        poolState.cApeDebtShare += totalBorrow.rayDiv(latestBorrowIndex).rayDiv(
            cApeExchangeRate
        );

        //stake in ApeCoinStaking
        ApeCoinStaking.PairNftDepositWithAmount[]
            memory _otherPairs = new ApeCoinStaking.PairNftDepositWithAmount[](
                0
            );
        if (isBAYC) {
            vars.apeCoinStaking.depositBAYC(_nfts);
            vars.apeCoinStaking.depositBAKC(_nftPairs, _otherPairs);
        } else {
            vars.apeCoinStaking.depositMAYC(_nfts);
            vars.apeCoinStaking.depositBAKC(_otherPairs, _nftPairs);
        }

        //update state
        poolState.totalPosition += arrayLength;
    }

    function withdrawPairNFT(
        IParaApeStaking.PoolState storage poolState,
        IParaApeStaking.ApeStakingVaultCacheVars memory vars,
        bool isBAYC,
        uint32[] calldata apeTokenIds,
        uint32[] calldata bakcTokenIds
    ) external {
        uint256 arrayLength = apeTokenIds.length;
        require(
            arrayLength == bakcTokenIds.length && arrayLength > 0,
            "wrong param"
        );

        _claimPairNFT(poolState, vars, isBAYC, apeTokenIds, bakcTokenIds);

        vars.apeStakingPoolId = isBAYC ? BAYC_POOL_ID : MAYC_POOL_ID;
        vars.apeToken = isBAYC ? vars.bayc : vars.mayc;
        vars.nApe = isBAYC ? vars.nBayc : vars.nMayc;
        vars.positionCap = isBAYC ? vars.baycMatchedCap : vars.maycMatchedCap;
        vars._nfts = new ApeCoinStaking.SingleNft[](arrayLength);
        vars._nftPairs = new ApeCoinStaking.PairNftWithdrawWithAmount[](
            arrayLength
        );
        for (uint256 index = 0; index < arrayLength; index++) {
            uint32 apeTokenId = apeTokenIds[index];
            uint32 bakcTokenId = bakcTokenIds[index];

            //check pair status
            require(
                poolState.pairStatus[apeTokenId].tokenId == bakcTokenId,
                "wrong ape and bakc pair"
            );

            //check ntoken owner
            {
                address nApeOwner = IERC721(vars.nApe).ownerOf(apeTokenId);
                address nBakcOwner = IERC721(vars.nBakc).ownerOf(bakcTokenId);
                address msgSender = msg.sender;
                require(
                    msgSender == nApeOwner || msgSender == nBakcOwner,
                    "not owner"
                );
            }

            // update pair status
            delete poolState.pairStatus[apeTokenId];

            // we only need to check pair staking position
            (, bool isPaired) = vars.apeCoinStaking.mainToBakc(
                vars.apeStakingPoolId,
                apeTokenId
            );
            if (isPaired) {
                vars._nfts[vars.stakingPair] = ApeCoinStaking.SingleNft({
                    tokenId: apeTokenId,
                    amount: vars.positionCap.toUint224()
                });

                vars._nftPairs[vars.stakingPair] = ApeCoinStaking
                    .PairNftWithdrawWithAmount({
                        mainTokenId: apeTokenId,
                        bakcTokenId: bakcTokenId,
                        amount: vars.bakcMatchedCap.toUint184(),
                        isUncommit: true
                    });
                vars.stakingPair++;
            }
        }

        //withdraw from ApeCoinStaking and compound
        if (vars.stakingPair > 0) {
            //update state
            uint256 totalPosition = poolState.totalPosition - vars.stakingPair;
            poolState.totalPosition = totalPosition;

            {
                ApeCoinStaking.SingleNft[] memory _nfts = vars._nfts;
                ApeCoinStaking.PairNftWithdrawWithAmount[]
                    memory _nftPairs = vars._nftPairs;
                uint256 stakingPair = vars.stakingPair;
                assembly {
                    mstore(_nfts, stakingPair)
                }
                assembly {
                    mstore(_nftPairs, stakingPair)
                }
            }

            vars.balanceBefore = IERC20(vars.apeCoin).balanceOf(address(this));
            ApeCoinStaking.PairNftWithdrawWithAmount[]
                memory _otherPairs = new ApeCoinStaking.PairNftWithdrawWithAmount[](
                    0
                );
            if (isBAYC) {
                vars.apeCoinStaking.withdrawBAYC(vars._nfts, address(this));
                vars.apeCoinStaking.withdrawBAKC(vars._nftPairs, _otherPairs);
            } else {
                vars.apeCoinStaking.withdrawMAYC(vars._nfts, address(this));
                vars.apeCoinStaking.withdrawBAKC(_otherPairs, vars._nftPairs);
            }
            vars.balanceAfter = IERC20(vars.apeCoin).balanceOf(address(this));
            uint256 balanceDiff = vars.balanceAfter - vars.balanceBefore;
            IAutoCompoundApe(vars.cApe).deposit(address(this), balanceDiff);

            _reayAndCompound(
                poolState,
                vars,
                balanceDiff,
                vars.positionCap + vars.bakcMatchedCap
            );
        }

        //transfer ape and BAKC bakc to nToken
        for (uint256 index = 0; index < arrayLength; index++) {
            uint32 apeTokenId = apeTokenIds[index];
            uint32 bakcTokenId = bakcTokenIds[index];

            IERC721(vars.apeToken).safeTransferFrom(
                address(this),
                vars.nApe,
                apeTokenId
            );
            IERC721(vars.bakc).safeTransferFrom(
                address(this),
                vars.nBakc,
                bakcTokenId
            );

            //emit event
            emit PairNFTWithdrew(isBAYC, apeTokenId, bakcTokenId);
        }
    }

    function claimPairNFT(
        IParaApeStaking.PoolState storage poolState,
        IParaApeStaking.ApeStakingVaultCacheVars memory vars,
        bool isBAYC,
        uint32[] calldata apeTokenIds,
        uint32[] calldata bakcTokenIds
    ) external {
        uint256 arrayLength = apeTokenIds.length;
        require(
            arrayLength == bakcTokenIds.length && arrayLength > 0,
            "wrong param"
        );

        _claimPairNFT(poolState, vars, isBAYC, apeTokenIds, bakcTokenIds);
    }

    function compoundPairNFT(
        IParaApeStaking.PoolState storage poolState,
        IParaApeStaking.ApeStakingVaultCacheVars memory vars,
        bool isBAYC,
        uint32[] calldata apeTokenIds,
        uint32[] calldata bakcTokenIds
    ) external {
        uint256 arrayLength = apeTokenIds.length;
        require(
            arrayLength == bakcTokenIds.length && arrayLength > 0,
            "wrong param"
        );

        uint256[] memory _nfts = new uint256[](arrayLength);
        ApeCoinStaking.PairNft[]
            memory _nftPairs = new ApeCoinStaking.PairNft[](arrayLength);
        for (uint256 index = 0; index < arrayLength; index++) {
            uint32 apeTokenId = apeTokenIds[index];
            uint32 bakcTokenId = bakcTokenIds[index];

            // check pair status
            IApeStakingVault.PairingStatus memory localPairStatus = poolState
                .pairStatus[apeTokenId];
            require(
                localPairStatus.tokenId == bakcTokenId &&
                    localPairStatus.isPaired,
                "wrong pair status"
            );

            // construct staking data
            _nfts[index] = apeTokenId;
            _nftPairs[index] = ApeCoinStaking.PairNft({
                mainTokenId: apeTokenId,
                bakcTokenId: bakcTokenId
            });

            //emit event
            emit PairNFTCompounded(isBAYC, apeTokenId, bakcTokenId);
        }

        vars.balanceBefore = IERC20(vars.apeCoin).balanceOf(address(this));

        //claim from ApeCoinStaking
        {
            ApeCoinStaking.PairNft[]
            memory _otherPairs = new ApeCoinStaking.PairNft[](0);
            if (isBAYC) {
                vars.apeCoinStaking.claimSelfBAYC(_nfts);
                vars.apeCoinStaking.claimSelfBAKC(_nftPairs, _otherPairs);
            } else {
                vars.apeCoinStaking.claimSelfMAYC(_nfts);
                vars.apeCoinStaking.claimSelfBAKC(_otherPairs, _nftPairs);
            }
        }

        vars.balanceAfter = IERC20(vars.apeCoin).balanceOf(address(this));
        uint256 balanceDiff = vars.balanceAfter - vars.balanceBefore;
        IAutoCompoundApe(vars.cApe).deposit(address(this), balanceDiff);

        //repay and compound
        vars.positionCap = isBAYC ? vars.baycMatchedCap : vars.maycMatchedCap;
        _reayAndCompound(
            poolState,
            vars,
            balanceDiff,
            vars.positionCap + vars.bakcMatchedCap
        );
    }

    function _claimPairNFT(
        IParaApeStaking.PoolState storage poolState,
        IParaApeStaking.ApeStakingVaultCacheVars memory vars,
        bool isBAYC,
        uint32[] calldata apeTokenIds,
        uint32[] calldata bakcTokenIds
    ) internal {
        vars.apeStakingPoolId = isBAYC ? BAYC_POOL_ID : MAYC_POOL_ID;
        vars.accumulatedRewardsPerNft = poolState.accumulatedRewardsPerNft;
        uint256 rewardShares;
        address claimFor;
        uint256 arrayLength = apeTokenIds.length;
        for (uint256 index = 0; index < arrayLength; index++) {
            uint32 apeTokenId = apeTokenIds[index];
            uint32 bakcTokenId = bakcTokenIds[index];

            //just need to check ape ntoken owner
            {
                address nApe = isBAYC ? vars.nBayc : vars.nMayc;
                address nApeOwner = IERC721(nApe).ownerOf(apeTokenId);
                if (claimFor == address(0)) {
                    claimFor = nApeOwner;
                } else {
                    require(nApeOwner == claimFor, "claim not for same owner");
                }
            }

            //check pair status
            require(
                poolState.pairStatus[apeTokenId].tokenId == bakcTokenId,
                "wrong ape and bakc pair"
            );
            (, bool isPaired) = vars.apeCoinStaking.mainToBakc(
                vars.apeStakingPoolId,
                apeTokenId
            );
            //if it's not staking in ApeCoinStaking, we skip calculating reward
            if (!isPaired) {
                continue;
            }

            //update reward, to save gas we don't claim pending reward in ApeCoinStaking.
            rewardShares += (vars.accumulatedRewardsPerNft -
                poolState.rewardsDebt[apeTokenId]);
            poolState.rewardsDebt[apeTokenId] = vars.accumulatedRewardsPerNft;

            //emit event
            emit PairNFTClaimed(isBAYC, apeTokenId, bakcTokenId);
        }

        if (rewardShares > 0) {
            IERC20(vars.cApe).safeTransfer(claimFor, rewardShares);
        }
    }

    function _reayAndCompound(
        IParaApeStaking.PoolState storage poolState,
        IParaApeStaking.ApeStakingVaultCacheVars memory vars,
        uint256 totalAmount,
        uint256 positionCap
    ) internal {
        console.log("_reayAndCompound---------------------------0");
        uint256 cApeExchangeRate = ICApe(vars.cApe).getPooledApeByShares(
            WadRayMath.RAY
        );
        uint256 latestBorrowIndex = IPool(vars.pool)
            .getReserveNormalizedVariableDebt(vars.cApe);
        uint256 cApeDebtShare = poolState.cApeDebtShare;
        uint256 debtInterest = _calculateCurrentPositionDebtInterest(
            cApeDebtShare,
            poolState.totalPosition,
            positionCap,
            cApeExchangeRate,
            latestBorrowIndex
        );
        console.log("_reayAndCompound---------------------------totalAmount:", totalAmount);
        console.log("_reayAndCompound---------------------------debtInterest:", debtInterest);
        if (debtInterest >= totalAmount) {
            console.log("_reayAndCompound---------------------------1");
            IERC20(vars.cApe).safeApprove(vars.pool, totalAmount);
            IPool(vars.pool).repay(vars.cApe, totalAmount, address(this));
            cApeDebtShare -= totalAmount.rayDiv(latestBorrowIndex).rayDiv(
                cApeExchangeRate
            );
        } else {
            //update reward index
            console.log("_reayAndCompound---------------------------2");
            IERC20(vars.cApe).safeApprove(vars.pool, debtInterest);
            IPool(vars.pool).repay(vars.cApe, debtInterest, address(this));
            uint256 remainingReward = totalAmount - debtInterest;
            uint256 shareAmount = remainingReward.rayDiv(cApeExchangeRate);
            poolState.accumulatedRewardsPerNft +=
                shareAmount /
                poolState.totalPosition;
            cApeDebtShare -= debtInterest.rayDiv(latestBorrowIndex).rayDiv(
                cApeExchangeRate
            );
        }
        console.log("_reayAndCompound---------------------------3");
        poolState.cApeDebtShare = cApeDebtShare;
    }

    function _calculateCurrentPositionDebtInterest(
        uint256 cApeDebtShare,
        uint256 totalPosition,
        uint256 perPositionCap,
        uint256 cApeExchangeRate,
        uint256 latestBorrowIndex
    ) internal pure returns (uint256) {
        uint256 currentDebt = cApeDebtShare.rayMul(cApeExchangeRate).rayMul(
            latestBorrowIndex
        );
        return (currentDebt - perPositionCap * totalPosition);
    }
}
