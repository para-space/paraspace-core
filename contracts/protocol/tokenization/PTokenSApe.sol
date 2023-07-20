// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

import {IPool} from "../../interfaces/IPool.sol";
import {PToken} from "./PToken.sol";
import {WadRayMath} from "../libraries/math/WadRayMath.sol";
import {XTokenType} from "../../interfaces/IXTokenType.sol";
import {ApeCoinStaking} from "../../dependencies/yoga-labs/ApeCoinStaking.sol";
import {INToken} from "../../interfaces/INToken.sol";
import {IPToken} from "../../interfaces/IPToken.sol";
import {IERC20} from "../../dependencies/openzeppelin/contracts/IERC20.sol";
import {IScaledBalanceToken} from "../../interfaces/IScaledBalanceToken.sol";
import {IncentivizedERC20} from "./base/IncentivizedERC20.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {IParaApeStaking} from "../../interfaces/IParaApeStaking.sol";

/**
 * @title sApe PToken
 *
 * @notice Implementation of the interest bearing token for the ParaSpace protocol
 */
contract PTokenSApe is PToken {
    using WadRayMath for uint256;

    IParaApeStaking immutable paraApeStaking;

    constructor(IPool pool) PToken(pool) {
        paraApeStaking = IParaApeStaking(pool.paraApeStaking());
    }

    function mint(
        address,
        address,
        uint256,
        uint256
    ) external virtual override onlyPool returns (bool) {
        revert("not allowed");
    }

    function burn(
        address,
        address,
        uint256,
        uint256,
        DataTypes.TimeLockParams calldata
    ) external virtual override onlyPool {
        revert("not allowed");
    }

    function balanceOf(address user) public view override returns (uint256) {
        return paraApeStaking.totalSApeBalance(user);
    }

    function scaledBalanceOf(address user)
        public
        view
        override
        returns (uint256)
    {
        return balanceOf(user);
    }

    function transferUnderlyingTo(
        address,
        uint256,
        DataTypes.TimeLockParams calldata
    ) external virtual override onlyPool {
        revert("not allowed");
    }

    function transferOnLiquidation(
        address from,
        address to,
        uint256 value
    ) external override onlyPool {
        return paraApeStaking.transferSApeBalance(from, to, value);
    }

    function _transfer(
        address,
        address,
        uint128
    ) internal virtual override {
        revert("not allowed");
    }

    function getXTokenType()
        external
        pure
        virtual
        override
        returns (XTokenType)
    {
        return XTokenType.PTokenSApe;
    }
}
