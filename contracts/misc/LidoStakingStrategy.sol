import {WadRayMath} from "../protocol/libraries/math/WadRayMath.sol";
import {IACLManager} from "../interfaces/IACLManager.sol";
import {IPoolAddressesProvider} from "../interfaces/IPoolAddressesProvider.sol";
import {IETHStakingProviderStrategy} from "../interfaces/IETHStakingProviderStrategy.sol";
import {PercentageMath} from "../protocol/libraries/math/PercentageMath.sol";

contract LidoStakingStrategy is IETHStakingProviderStrategy {
    uint256 constant SLASHING_RISK =
        PercentageMath.percentMul(WadRayMath.WAD, 50);
    uint256 constant STAKING_RATE =
        PercentageMath.percentMul(WadRayMath.WAD, 50);
    uint256 constant DURATION_FACTOR =
        PercentageMath.percentMul(WadRayMath.WAD, 10);
    uint256 constant PROVIDER_PREMIUM =
        PercentageMath.percentMul(WadRayMath.WAD, 15);

    function getTokenPresentValue(TokenInfo tokenInfo, uint256 discountRate)
        external
        returns (uint256 price)
    {
        uint256 redemptionRate = getLidoRedemptionRate(
            tokenInfo.underlyingTokenId
        );

        uint256 unstakeTime = (SLASHING_RISK *
            tokenInfo.unstakeTime -
            block.timestamp) / 86400;

        return
            (tokenInfo.principal *
                redemptionRate *
                (WadRayMath.WAD - SLASHING_RISK * unstakeTime)) /
            (WadRayMath.WAD + discountRate)**unstakeTime;
    }

    function getDiscountRate(TokenInfo tokenInfo, uint256 borrowRate)
        external
        returns (uint256 discountRate)
    {
        uint256 unstakeTime = (SLASHING_RISK *
            tokenInfo.unstakeTime -
            block.timestamp) / 86400;

        return borrowRate + borrowRate * DURATION_FACTOR * PROVIDER_PREMIUM;
    }

    function getSlashingRisk(uint256 tokenId)
        external
        returns (uint256 slashingRisk)
    {
        return SLASHING_RISK;
    }

    function getStakingRate(uint256 tokenId)
        external
        returns (uint256 stakingRate)
    {
        return STAKING_RATE;
    }

    function getLidoRedemptionRate(uint256 tokenId) internal returns (uint256) {
        return WadRayMath.WAD;
    }
}
