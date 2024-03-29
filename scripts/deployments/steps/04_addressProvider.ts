import {
  deployPoolAddressesProvider,
  deployPoolAddressesProviderRegistry,
} from "../../../helpers/contracts-deployments";
import {getAllTokens, getFirstSigner} from "../../../helpers/contracts-getters";
import {GLOBAL_OVERRIDES} from "../../../helpers/hardhat-constants";
import {getParaSpaceConfig, waitForTx} from "../../../helpers/misc-utils";

export const step_04 = async (verify = false) => {
  const deployer = await getFirstSigner();
  const deployerAddress = await deployer.getAddress();
  const allTokens = await getAllTokens();
  const paraSpaceConfig = getParaSpaceConfig();

  try {
    const addressesProviderRegistry = await deployPoolAddressesProviderRegistry(
      deployerAddress,
      verify
    );
    const addressesProvider = await deployPoolAddressesProvider(
      getParaSpaceConfig().MarketId,
      deployerAddress,
      verify
    );
    await waitForTx(
      await addressesProviderRegistry.registerAddressesProvider(
        addressesProvider.address,
        getParaSpaceConfig().ProviderId,
        GLOBAL_OVERRIDES
      )
    );
    await waitForTx(
      await addressesProvider.setACLAdmin(deployerAddress, GLOBAL_OVERRIDES)
    );
    await waitForTx(
      await addressesProvider.setWETH(
        allTokens[paraSpaceConfig.WrappedNativeTokenId].address,
        GLOBAL_OVERRIDES
      )
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
