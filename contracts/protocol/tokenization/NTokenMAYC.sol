// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.10;

import {NTokenApeStaking} from "./NTokenApeStaking.sol";
import {IPool} from "../../interfaces/IPool.sol";
import {XTokenType} from "../../interfaces/IXTokenType.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";

/**
 * @title MAYC NToken
 *
 * @notice Implementation of the NToken for the ParaSpace protocol
 */
contract NTokenMAYC is NTokenApeStaking {
    constructor(IPool pool, address delegateRegistry)
        NTokenApeStaking(pool, delegateRegistry)
    {}

    function isBayc() internal pure virtual override returns (bool) {
        return false;
    }

    function getXTokenType() external pure override returns (XTokenType) {
        return XTokenType.NTokenMAYC;
    }
}
