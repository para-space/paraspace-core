// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.10;

import {WadRayMath} from "../protocol/libraries/math/WadRayMath.sol";
import {IACLManager} from "../interfaces/IACLManager.sol";
import {IPoolAddressesProvider} from "../interfaces/IPoolAddressesProvider.sol";

contract ETHUnstakePresentValue {
    enum StakingProvider {
        Validator,
        Lido,
        RocketPool,
        Coinbase
    }

    struct ParaETH {
        uint256 principal;
        uint256 unstakeTime;
        StakingProvider provider;
        uint256 underlyingTokenId; // in case there's an NFT representing the withdraw
        uint256 unclaimedRewards;
    }

    struct ProviderConfiguration {
        uint64 slashingRisk;
        uint64 discountRate;
        uint64 stakingRate;
    }

    IPoolAddressesProvider internal immutable ADDRESSES_PROVIDER;

    mapping(uint256 => ProviderConfiguration) providerConfiguration;

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

    function getTokenPrice(uint256 tokenId) external returns (uint256 price) {
        ParaETH tokenInfo = getTokenInfo(tokenId);

        if (tokenInfo.provider == StakingProvider.Lido) {
            return calculateLidoValue(tokenInfo);
        } else if (tokenInfo.provider == StakingProvider.Validator) {
            return calculateValidatorValue(tokenInfo);
        } else {
            return calculateOtherLSDValue(tokenInfo);
        }
    }

    function calculateLidoValue(ParaETH tokenInfo)
        internal
        returns (uint256 price)
    {
        uint256 redemptionRate = getLidoRedemptionRate(
            tokenInfo.underlyingTokenId
        );
        (uint64 slashingRisk, uint64 discountRate, ) = getProviderConfiguration(
            tokenInfo.provider
        );
        uint256 unstakeTime = slashingRisk *
            tokenInfo.unstakeTime -
            block.timestamp;
        // TODO convert unstakeTime to days
        return
            (tokenInfo.principal *
                redemptionRate *
                (WadRayMath.WAD - unstakeTime)) /
            (WadRayMath.WAD + discountRate)**unstakeTime;
    }

    function calculateOtherLSDValue(ParaETH tokenInfo)
        internal
        returns (uint256 price)
    {
        (
            uint64 slashingRisk,
            uint64 discountRate,
            uint64 stakingRate
        ) = getProviderConfiguration(tokenInfo.provider);
        uint256 unstakeTime = slashingRisk *
            tokenInfo.unstakeTime -
            block.timestamp;

        return
            (tokenInfo.principal *
                (WadRayMath.WAD - slashingRisk * unstakeTime)) /
            (WadRayMath.WAD + discountRate)**unstakeTime;
    }

    function calculateValidatorValue(ParaETH tokenInfo)
        internal
        returns (uint256 price)
    {
        (
            uint64 slashingRisk,
            uint64 discountRate,
            uint64 stakingRate
        ) = getProviderConfiguration(tokenInfo.provider);
        uint256 unstakeTime = slashingRisk *
            tokenInfo.unstakeTime -
            block.timestamp;

        return
            (tokenInfo.principal *
                (WadRayMath.WAD - slashingRisk * unstakeTime)) /
            (WadRayMath.WAD + discountRate)**unstakeTime;
    }

    function getProviderConfiguration(StakingProvider provider)
        public
        returns (
            uint64 slashingRisk,
            uint64 discountRate,
            uint64 stakingRate
        )
    {
        ProviderConfiguration memory configs = providerConfiguration[provider];

        return (
            configs.slashingRisk,
            configs.discountRate,
            configs.stakingRate
        );
    }

    function setProviderConfiguration(
        StakingProvider provider,
        ProviderConfiguration memory configs
    ) external onlyPoolAdmin {
        providerConfiguration[provider] = configs;
    }

    function getLidoRedemptionRate(uint256 tokenId) internal returns (uint256) {
        return WadRayMath.WAD;
    }
}
