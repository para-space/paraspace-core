// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {IERC20} from "../../dependencies/openzeppelin/contracts/IERC20.sol";
import {IERC721} from "../../dependencies/openzeppelin/contracts/IERC721.sol";
import {IERC1155} from "../../dependencies/openzeppelin/contracts/IERC1155.sol";
import {IERC721Metadata} from "../../dependencies/openzeppelin/contracts/IERC721Metadata.sol";
import {Address} from "../../dependencies/openzeppelin/contracts/Address.sol";
import {SafeERC20} from "../../dependencies/openzeppelin/contracts/SafeERC20.sol";
import {SafeCast} from "../../dependencies/openzeppelin/contracts/SafeCast.sol";
import {Errors} from "../libraries/helpers/Errors.sol";
import {IPool} from "../../interfaces/IPool.sol";
import {NToken} from "./NToken.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {IWETH} from "../../misc/interfaces/IWETH.sol";
import {INTokenLiquidity} from "../../interfaces/INTokenLiquidity.sol";
import {Helpers} from "../../protocol/libraries/helpers/Helpers.sol";

/**
 * @title NTokenLiquidity
 *
 * @notice Implementation of the interest bearing token for the ParaSpace protocol
 */
abstract contract NTokenLiquidity is NToken, INTokenLiquidity {
    using SafeERC20 for IERC20;

    /**
     * @dev Constructor.
     * @param pool The address of the Pool contract
     */
    constructor(IPool pool, address delegateRegistry)
        NToken(pool, true, delegateRegistry)
    {
        _ERC721Data.balanceLimit = 30;
    }

    function _underlyingAsset(address, uint256)
        internal
        view
        virtual
        returns (address, address)
    {
        return (address(0), address(0));
    }

    function _decreaseLiquidity(
        address,
        uint256,
        uint128,
        uint256,
        uint256
    ) internal virtual {}

    function _increaseLiquidity(
        address,
        uint256,
        uint256,
        uint256,
        uint256,
        uint256
    ) internal virtual returns (uint256, uint256) {
        return (0, 0);
    }

    function _collect(
        address,
        uint256,
        address,
        bool
    ) internal virtual returns (uint256, uint256) {
        return (0, 0);
    }

    function _refundETH(address) internal virtual {}

    function underlyingAsset(uint256 tokenId)
        external
        view
        returns (address token0, address token1)
    {
        return _underlyingAsset(_ERC721Data.underlyingAsset, tokenId);
    }

    /// @inheritdoc INTokenLiquidity
    function decreaseLiquidity(
        address user,
        uint256 tokenId,
        uint128 liquidityDecrease,
        uint256 amount0Min,
        uint256 amount1Min,
        bool receiveEth
    ) external onlyPool nonReentrant {
        require(user == ownerOf(tokenId), Errors.NOT_THE_OWNER);

        address positionManager = _ERC721Data.underlyingAsset;
        if (liquidityDecrease > 0) {
            _decreaseLiquidity(
                positionManager,
                tokenId,
                liquidityDecrease,
                amount0Min,
                amount1Min
            );
        }

        (address token0, address token1) = _underlyingAsset(
            positionManager,
            tokenId
        );

        address weth;
        if (receiveEth) {
            weth = _addressesProvider.getWETH();
            receiveEth = (token0 == weth || token1 == weth);
        }

        (uint256 amount0, uint256 amount1) = _collect(
            positionManager,
            tokenId,
            user,
            receiveEth
        );

        if (receiveEth) {
            if (amount0 > 0) {
                transferTokenOut(user, token0, amount0, weth);
            }
            if (amount1 > 0) {
                transferTokenOut(user, token1, amount1, weth);
            }
        }
    }

    /// @inheritdoc INTokenLiquidity
    function increaseLiquidity(
        address payer,
        uint256 tokenId,
        uint256 amountAdd0,
        uint256 amountAdd1,
        uint256 amount0Min,
        uint256 amount1Min
    ) external payable onlyPool nonReentrant {
        address positionManager = _ERC721Data.underlyingAsset;

        (address token0, address token1) = _underlyingAsset(
            positionManager,
            tokenId
        );

        // move underlying into this contract
        bool token0IsETH;
        bool token1IsETH;
        if (msg.value > 0) {
            address weth = _addressesProvider.getWETH();
            token0IsETH = (token0 == weth);
            token1IsETH = (token1 == weth);
        }
        if (token0IsETH) {
            require(msg.value == amountAdd0, Errors.INVALID_AMOUNT);
        } else {
            IERC20(token0).safeTransferFrom(payer, address(this), amountAdd0);
            checkAllownance(token0, positionManager);
        }
        if (token1IsETH) {
            require(msg.value == amountAdd1, Errors.INVALID_AMOUNT);
        } else {
            IERC20(token1).safeTransferFrom(payer, address(this), amountAdd1);
            checkAllownance(token1, positionManager);
        }

        (uint256 amount0, uint256 amount1) = _increaseLiquidity(
            positionManager,
            tokenId,
            amountAdd0,
            amountAdd1,
            amount0Min,
            amount1Min
        );

        // refund unused tokens
        if (amount0 < amountAdd0) {
            uint256 refund0 = amountAdd0 - amount0;
            if (token0IsETH) {
                _refundETH(positionManager);
                Helpers.safeTransferETH(payer, refund0);
            } else {
                IERC20(token0).safeTransfer(payer, refund0);
            }
        }
        if (amount1 < amountAdd1) {
            uint256 refund1 = amountAdd1 - amount1;
            if (token1IsETH) {
                _refundETH(positionManager);
                Helpers.safeTransferETH(payer, refund1);
            } else {
                IERC20(token1).safeTransfer(payer, refund1);
            }
        }
    }

    function transferTokenOut(
        address user,
        address token,
        uint256 amount,
        address weth
    ) internal {
        if (token == weth) {
            IWETH(weth).withdraw(amount);
            Helpers.safeTransferETH(user, amount);
        } else {
            IERC20(token).safeTransfer(user, amount);
        }
    }

    function checkAllownance(address token, address spender) internal {
        uint256 allownance = IERC20(token).allowance(address(this), spender);
        if (allownance == 0) {
            IERC20(token).safeApprove(spender, type(uint256).max);
        }
    }

    function setTraitsMultipliers(uint256[] calldata, uint256[] calldata)
        external
        override
        onlyPoolAdmin
        nonReentrant
    {
        revert();
    }

    receive() external payable {}
}
