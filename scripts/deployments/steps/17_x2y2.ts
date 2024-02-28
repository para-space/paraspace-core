import {
  deployERC721Delegate,
  deployX2Y2Adapter,
  deployX2Y2R1,
} from "../../../helpers/contracts-deployments";
import {
  getFirstSigner,
  getPoolAddressesProvider,
} from "../../../helpers/contracts-getters";
import {X2Y2_ID} from "../../../helpers/constants";
import {
  getParaSpaceConfig,
  isLocalTestnet,
  isPublicTestnet,
  waitForTx,
} from "../../../helpers/misc-utils";
import {GLOBAL_OVERRIDES} from "../../../helpers/hardhat-constants";

export const step_17 = async (verify = false) => {
  try {
    const paraSpaceConfig = getParaSpaceConfig();
    if (!paraSpaceConfig.EnableX2Y2) {
      console.log("x2y2 not enable, skip deploy x2y2");
      return;
    }

    if (!isLocalTestnet() && !isPublicTestnet()) {
      return;
    }

    const deployer = await getFirstSigner();
    const addressesProvider = await getPoolAddressesProvider();
    const x2y2R1 = await deployX2Y2R1(verify);
    await waitForTx(
      await x2y2R1
        .connect(deployer)
        .initialize(0, await addressesProvider.getWETH(), GLOBAL_OVERRIDES)
    );
    const erc721Delegate = await deployERC721Delegate(verify);
    await waitForTx(
      await x2y2R1
        .connect(deployer)
        .updateDelegates([erc721Delegate.address], [], GLOBAL_OVERRIDES)
    );
    await waitForTx(
      await erc721Delegate
        .connect(deployer)
        .grantRole(
          await erc721Delegate.DELEGATION_CALLER(),
          x2y2R1.address,
          GLOBAL_OVERRIDES
        )
    );
    const x2y2Adapter = await deployX2Y2Adapter(
      addressesProvider.address,
      verify
    );

    await waitForTx(
      await addressesProvider.setMarketplace(
        X2Y2_ID,
        x2y2R1.address,
        x2y2Adapter.address,
        x2y2R1.address,
        false,
        GLOBAL_OVERRIDES
      )
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
