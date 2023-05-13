// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.10;

import {WadRayMath} from "../protocol/libraries/math/WadRayMath.sol";
import {IACLManager} from "../interfaces/IACLManager.sol";
import {IPoolAddressesProvider} from "../interfaces/IPoolAddressesProvider.sol";
import {IETHStakingProviderStrategy} from "../interfaces/IETHStakingProviderStrategy.sol";

contract ETHUnstakePresentValue {
    enum StakingProvider {
        Validator,
        Lido,
        RocketPool,
        Coinbase
    }

    struct TokenInfo {
        StakingProvider provider;
        uint64 exitEpoch;
        uint64 withdrawableEpoch;
        uint256 balance;
        uint256 withdrawableTime;
    }

    struct ProviderConfiguration {
        uint64 slashingRisk;
        uint64 discountRate;
        uint64 stakingRate;
    }

    IPoolAddressesProvider internal immutable ADDRESSES_PROVIDER;

    mapping(uint256 => address) providerStrategyAddress;

    /**
     * @dev Constructor.
     * @param provider The address of the PoolAddressesProvider contract
     */
    constructor(IPoolAddressesProvider provider) {
        ADDRESSES_PROVIDER = provider;
    }

    /**
     * @dev Only pool admin can call functions marked by this modifier.
     **/
    modifier onlyPoolAdmin() {
        _onlyPoolAdmin();
        _;
    }

    function _onlyPoolAdmin() internal view virtual {
        require(
            IACLManager(ADDRESSES_PROVIDER.getACLManager()).isPoolAdmin(
                msg.sender
            ),
            Errors.CALLER_NOT_POOL_ADMIN
        );
    }

    function getPresentValueAndDiscountRate(uint256 tokenId, uint256 borrowRate)
        external
        returns (uint256 price, uint256 discountRate)
    {
        TokenInfo tokenInfo = getTokenInfo(tokenId);

        IETHStakingProviderStrategy strategy = providerStrategyAddress[
            tokenInfo.provider
        ];

        discountRate = strategy.getDiscountRate(tokenInfo, borrowRate);
        price = strategy.getTokenPresentValue(tokenInfo, discountRate);
    }

    function getPresentValueByDiscountRate(
        uint256 tokenId,
        uint256 discountRate
    ) external returns (uint256 price) {
        price = strategy.getTokenPresentValue(tokenInfo, discountRate);
    }

    function setProviderStrategyAddress(
        StakingProvider provider,
        address strategy
    ) external onlyPoolAdmin {
        providerConfiguration[provider] = strategy;
    }
}
