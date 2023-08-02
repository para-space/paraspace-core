// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

import {IPool} from "../../interfaces/IPool.sol";
import "../../interfaces/IParaApeStaking.sol";
import {IERC20, SafeERC20} from "../../dependencies/openzeppelin/contracts/SafeERC20.sol";
import "../../dependencies/yoga-labs/ApeCoinStaking.sol";
import {PercentageMath} from "../../protocol/libraries/math/PercentageMath.sol";
import "../../interfaces/IAutoCompoundApe.sol";
import "../../interfaces/ICApe.sol";
import "../../dependencies/openzeppelin/contracts/SafeCast.sol";
import {WadRayMath} from "../../protocol/libraries/math/WadRayMath.sol";
import "./ApeStakingCommonLogic.sol";
import "../../protocol/libraries/helpers/Errors.sol";

/**
 * @title ApeStakingPairPoolLogic library
 *
 * @notice Implements the base logic for ape staking vault
 */
library ApeStakingPairPoolLogic {
    using PercentageMath for uint256;
    using SafeCast for uint256;
    using SafeERC20 for IERC20;
    using WadRayMath for uint256;

    event PairNFTDeposited(
        bool isBAYC,
        uint256 apeTokenId,
        uint256 bakcTokenId
    );
    event PairNFTStaked(bool isBAYC, uint256 apeTokenId, uint256 bakcTokenId);
    event PairNFTWithdrew(bool isBAYC, uint256 apeTokenId, uint256 bakcTokenId);
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
            Errors.INVALID_PARAMETER
        );

        if (isBAYC) {
            vars.apeStakingPoolId = ApeStakingCommonLogic.BAYC_POOL_ID;
            vars.apeToken = vars.bayc;
            vars.nApe = vars.nBayc;
        } else {
            vars.apeStakingPoolId = ApeStakingCommonLogic.MAYC_POOL_ID;
            vars.apeToken = vars.mayc;
            vars.nApe = vars.nMayc;
        }
        address msgSender = msg.sender;
        uint128 accumulatedRewardsPerNft = poolState.accumulatedRewardsPerNft;
        for (uint256 index = 0; index < arrayLength; index++) {
            uint32 apeTokenId = apeTokenIds[index];
            uint32 bakcTokenId = bakcTokenIds[index];

            //check ntoken owner
            {
                address nApeOwner = IERC721(vars.nApe).ownerOf(apeTokenId);
                address nBakcOwner = IERC721(vars.nBakc).ownerOf(bakcTokenId);
                require(
                    msgSender == nApeOwner && msgSender == nBakcOwner,
                    Errors.NOT_THE_OWNER
                );
            }

            // check both ape and bakc are not staking
            {
                (uint256 stakedAmount, ) = vars.apeCoinStaking.nftPosition(
                    vars.apeStakingPoolId,
                    apeTokenId
                );
                require(stakedAmount == 0, Errors.APE_POSITION_EXISTED);
                (stakedAmount, ) = vars.apeCoinStaking.nftPosition(
                    ApeStakingCommonLogic.BAKC_POOL_ID,
                    bakcTokenId
                );
                require(stakedAmount == 0, Errors.BAKC_POSITION_EXISTED);
                (, bool isPaired) = vars.apeCoinStaking.mainToBakc(
                    vars.apeStakingPoolId,
                    apeTokenId
                );
                require(!isPaired, Errors.PAIR_POSITION_EXISTED);
            }

            //update token status
            poolState.tokenStatus[apeTokenId] = IParaApeStaking.TokenStatus({
                rewardsDebt: accumulatedRewardsPerNft,
                isInPool: true,
                bakcTokenId: bakcTokenId,
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

        poolState.totalPosition += arrayLength.toUint24();
    }

    function stakingPairNFT(
        IParaApeStaking.PoolState storage poolState,
        IParaApeStaking.ApeStakingVaultCacheVars memory vars,
        bool isBAYC,
        uint32[] calldata apeTokenIds,
        uint32[] calldata bakcTokenIds
    ) external {
        uint256 arrayLength = apeTokenIds.length;
        require(
            arrayLength == bakcTokenIds.length && arrayLength > 0,
            Errors.INVALID_PARAMETER
        );

        ApeCoinStaking.SingleNft[]
            memory _nfts = new ApeCoinStaking.SingleNft[](arrayLength);
        ApeCoinStaking.PairNftDepositWithAmount[]
            memory _nftPairs = new ApeCoinStaking.PairNftDepositWithAmount[](
                arrayLength
            );
        vars.positionCap = isBAYC ? vars.baycMatchedCap : vars.maycMatchedCap;
        for (uint256 index = 0; index < arrayLength; index++) {
            uint32 apeTokenId = apeTokenIds[index];
            uint32 bakcTokenId = bakcTokenIds[index];

            // check pair status
            {
                IParaApeStaking.TokenStatus memory localTokenStatus = poolState
                    .tokenStatus[apeTokenId];
                require(
                    localTokenStatus.bakcTokenId == bakcTokenId &&
                        localTokenStatus.isPaired,
                    Errors.NOT_PAIRED_APE_AND_BAKC
                );
            }

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
        uint256 totalBorrow = (vars.positionCap + vars.bakcMatchedCap) *
            arrayLength;
        uint256 cApeDebtShare = ApeStakingCommonLogic.borrowCApeFromPool(
            vars,
            totalBorrow
        );
        poolState.cApeDebtShare += cApeDebtShare.toUint104();

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

        poolState.stakingPosition += arrayLength.toUint24();
    }

    function withdrawPairNFT(
        IParaApeStaking.PoolState storage poolState,
        mapping(address => uint256) storage cApeShareBalance,
        IParaApeStaking.ApeStakingVaultCacheVars memory vars,
        bool isBAYC,
        uint32[] calldata apeTokenIds,
        uint32[] calldata bakcTokenIds
    ) external {
        uint256 arrayLength = apeTokenIds.length;
        require(
            arrayLength == bakcTokenIds.length && arrayLength > 0,
            Errors.INVALID_PARAMETER
        );

        if (isBAYC) {
            vars.apeStakingPoolId = ApeStakingCommonLogic.BAYC_POOL_ID;
            vars.apeToken = vars.bayc;
            vars.nApe = vars.nBayc;
            vars.positionCap = vars.baycMatchedCap;
        } else {
            vars.apeStakingPoolId = ApeStakingCommonLogic.MAYC_POOL_ID;
            vars.apeToken = vars.mayc;
            vars.nApe = vars.nMayc;
            vars.positionCap = vars.maycMatchedCap;
        }

        vars.nApeOwner = ApeStakingCommonLogic.claimPendingReward(
            poolState,
            vars,
            isBAYC
                ? ApeStakingCommonLogic.BAYC_BAKC_PAIR_POOL_ID
                : ApeStakingCommonLogic.MAYC_BAKC_PAIR_POOL_ID,
            vars.apeToken,
            vars.nApe,
            false,
            apeTokenIds
        );

        ApeCoinStaking.SingleNft[]
            memory _nfts = new ApeCoinStaking.SingleNft[](arrayLength);
        ApeCoinStaking.PairNftWithdrawWithAmount[]
            memory _nftPairs = new ApeCoinStaking.PairNftWithdrawWithAmount[](
                arrayLength
            );
        uint24 stakingPair = 0;
        for (uint256 index = 0; index < arrayLength; index++) {
            uint32 apeTokenId = apeTokenIds[index];
            uint32 bakcTokenId = bakcTokenIds[index];

            //check ntoken owner
            {
                if (vars.nApeOwner != msg.sender) {
                    address nBakcOwner = IERC721(vars.nBakc).ownerOf(
                        bakcTokenId
                    );
                    require(msg.sender == nBakcOwner, Errors.NOT_THE_OWNER);
                }
            }

            // update pair status
            delete poolState.tokenStatus[apeTokenId];

            // we only need to check pair staking position
            (, vars.isPaired) = vars.apeCoinStaking.mainToBakc(
                vars.apeStakingPoolId,
                apeTokenId
            );
            if (vars.isPaired) {
                _nfts[stakingPair] = ApeCoinStaking.SingleNft({
                    tokenId: apeTokenId,
                    amount: vars.positionCap.toUint224()
                });

                _nftPairs[stakingPair] = ApeCoinStaking
                    .PairNftWithdrawWithAmount({
                        mainTokenId: apeTokenId,
                        bakcTokenId: bakcTokenId,
                        amount: vars.bakcMatchedCap.toUint184(),
                        isUncommit: true
                    });
                stakingPair++;
            }
        }

        //update state
        poolState.totalPosition -= arrayLength.toUint24();

        //withdraw from ApeCoinStaking and compound
        if (stakingPair > 0) {
            poolState.stakingPosition -= stakingPair;

            assembly {
                mstore(_nfts, stakingPair)
            }
            assembly {
                mstore(_nftPairs, stakingPair)
            }

            vars.balanceBefore = IERC20(vars.apeCoin).balanceOf(address(this));
            ApeCoinStaking.PairNftWithdrawWithAmount[]
                memory _otherPairs = new ApeCoinStaking.PairNftWithdrawWithAmount[](
                    0
                );
            if (isBAYC) {
                vars.apeCoinStaking.withdrawSelfBAYC(_nfts);
                vars.apeCoinStaking.withdrawBAKC(_nftPairs, _otherPairs);
            } else {
                vars.apeCoinStaking.withdrawSelfMAYC(_nfts);
                vars.apeCoinStaking.withdrawBAKC(_otherPairs, _nftPairs);
            }
            vars.balanceAfter = IERC20(vars.apeCoin).balanceOf(address(this));
            vars.totalClaimedApe = vars.balanceAfter - vars.balanceBefore;
            IAutoCompoundApe(vars.cApe).deposit(
                address(this),
                vars.totalClaimedApe
            );

            vars.cApeExchangeRate = ICApe(vars.cApe).getPooledApeByShares(
                WadRayMath.RAY
            );
            vars.latestBorrowIndex = IPool(vars.pool)
                .getReserveNormalizedVariableDebt(vars.cApe);
            (vars.totalRepay, vars.totalCompoundFee) = ApeStakingCommonLogic
                .calculateRepayAndCompound(
                    poolState,
                    vars,
                    vars.positionCap + vars.bakcMatchedCap
                );

            if (vars.totalRepay > 0) {
                IPool(vars.pool).repay(
                    vars.cApe,
                    vars.totalRepay,
                    address(this)
                );
            }
            if (vars.totalCompoundFee > 0) {
                cApeShareBalance[address(this)] += vars.totalCompoundFee;
            }
        }

        //transfer ape and BAKC back to nToken
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

    function compoundPairNFT(
        IParaApeStaking.PoolState storage poolState,
        mapping(address => uint256) storage cApeShareBalance,
        IParaApeStaking.ApeStakingVaultCacheVars memory vars,
        bool isBAYC,
        uint32[] calldata apeTokenIds,
        uint32[] calldata bakcTokenIds
    ) external {
        uint256 arrayLength = apeTokenIds.length;
        require(
            arrayLength == bakcTokenIds.length && arrayLength > 0,
            Errors.INVALID_PARAMETER
        );

        uint256[] memory _nfts = new uint256[](arrayLength);
        ApeCoinStaking.PairNft[]
            memory _nftPairs = new ApeCoinStaking.PairNft[](arrayLength);
        for (uint256 index = 0; index < arrayLength; index++) {
            uint32 apeTokenId = apeTokenIds[index];
            uint32 bakcTokenId = bakcTokenIds[index];

            // check pair status
            IParaApeStaking.TokenStatus memory localTokenStatus = poolState
                .tokenStatus[apeTokenId];
            require(
                localTokenStatus.bakcTokenId == bakcTokenId &&
                    localTokenStatus.isPaired,
                Errors.NOT_PAIRED_APE_AND_BAKC
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
        vars.totalClaimedApe = vars.balanceAfter - vars.balanceBefore;
        IAutoCompoundApe(vars.cApe).deposit(
            address(this),
            vars.totalClaimedApe
        );

        //repay and compound
        vars.positionCap = isBAYC ? vars.baycMatchedCap : vars.maycMatchedCap;
        vars.cApeExchangeRate = ICApe(vars.cApe).getPooledApeByShares(
            WadRayMath.RAY
        );
        vars.latestBorrowIndex = IPool(vars.pool)
            .getReserveNormalizedVariableDebt(vars.cApe);
        (vars.totalRepay, vars.totalCompoundFee) = ApeStakingCommonLogic
            .calculateRepayAndCompound(
                poolState,
                vars,
                vars.positionCap + vars.bakcMatchedCap
            );

        if (vars.totalRepay > 0) {
            IPool(vars.pool).repay(vars.cApe, vars.totalRepay, address(this));
        }
        if (vars.totalCompoundFee > 0) {
            cApeShareBalance[address(this)] += vars.totalCompoundFee;
        }
    }
}
