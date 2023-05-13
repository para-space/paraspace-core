// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.10;

/**
 * @title IETHStakingProviderStrategy
 *
 * @notice Interface for the calculation of current eth derivative parameters
 */
interface IETHStakingProviderStrategy {
    struct TokenInfo {
        StakingProvider provider;
        uint64 exitEpoch;
        uint64 withdrawableEpoch;
        uint256 balance;
        uint256 withdrawableTime;
    }

    function getTokenPresentValue(TokenInfo tokenInfo, uint256 discountRate)
        external
        returns (uint256 price);

    function getDiscountRate(TokenInfo tokenInfo, uint256 borrowRate)
        external
        returns (uint256 discountRate);

    function getSlashingRisk(uint256 tokenId)
        external
        returns (uint256 slashingRisk);

    function getStakingRate(uint256 tokenId)
        external
        returns (uint256 stakingRate);
}
