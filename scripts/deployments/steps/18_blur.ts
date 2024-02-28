import {
  deployBlurAdapter,
  deployBlurExchangeImpl,
  deployBlurExchangeProxy,
  deployExecutionDelegate,
  deployPolicyManager,
  deployStandardPolicyERC721,
} from "../../../helpers/contracts-deployments";
import {
  getAllERC20Tokens,
  getBlurExchangeProxy,
  getPoolAddressesProvider,
} from "../../../helpers/contracts-getters";
import {BLUR_ID, ZERO_ADDRESS} from "../../../helpers/constants";
import {
  getParaSpaceConfig,
  isLocalTestnet,
  isPublicTestnet,
  waitForTx,
} from "../../../helpers/misc-utils";
import {GLOBAL_OVERRIDES} from "../../../helpers/hardhat-constants";

export const step_18 = async (verify = false) => {
  const paraSpaceConfig = getParaSpaceConfig();
  if (!paraSpaceConfig.EnableBLUR) {
    console.log("blur not enable, skip deploy blur");
    return;
  }

  const allERC20Tokens = await getAllERC20Tokens();
  try {
    if ((!isLocalTestnet() && !isPublicTestnet()) || !allERC20Tokens.WETH) {
      return;
    }

    const addressesProvider = await getPoolAddressesProvider();

    const blurExchangeImpl = await deployBlurExchangeImpl(verify);

    const executionDelegate = await deployExecutionDelegate(verify);
    const policyManager = await deployPolicyManager(verify);
    const standardPolicyERC721 = await deployStandardPolicyERC721(verify);

    await waitForTx(
      await policyManager.addPolicy(
        standardPolicyERC721.address,
        GLOBAL_OVERRIDES
      )
    );

    const blurExchangeEncodedInitialize =
      blurExchangeImpl.interface.encodeFunctionData("initialize", [
        executionDelegate.address,
        policyManager.address,
        ZERO_ADDRESS,
        allERC20Tokens.WETH.address,
        0,
      ]);

    await deployBlurExchangeProxy(
      ZERO_ADDRESS, // disable upgradeability
      blurExchangeImpl.address,
      blurExchangeEncodedInitialize,
      verify
    );
    const blurExchange = await getBlurExchangeProxy();

    await waitForTx(
      await executionDelegate.approveContract(
        blurExchange.address,
        GLOBAL_OVERRIDES
      )
    );

    const blurAdapter = await deployBlurAdapter(
      addressesProvider.address,
      standardPolicyERC721.address,
      verify
    );

    await waitForTx(
      await addressesProvider.setMarketplace(
        BLUR_ID,
        blurExchange.address,
        blurAdapter.address,
        executionDelegate.address,
        false,
        GLOBAL_OVERRIDES
      )
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
