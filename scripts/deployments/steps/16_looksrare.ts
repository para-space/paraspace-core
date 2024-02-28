import {constants} from "ethers";
import {
  deployCurrencyManager,
  deployExecutionManager,
  deployLooksRareAdapter,
  deployLooksRareExchange,
  deployRoyaltyFeeManager,
  deployRoyaltyFeeRegistry,
  deployStrategyStandardSaleForFixedPrice,
  deployTransferManagerERC1155,
  deployTransferManagerERC721,
  deployTransferSelectorNFT,
} from "../../../helpers/contracts-deployments";
import {
  getAllTokens,
  getPoolAddressesProvider,
} from "../../../helpers/contracts-getters";
import {LOOKSRARE_ID} from "../../../helpers/constants";
import {
  waitForTx,
  isLocalTestnet,
  isPublicTestnet,
  getParaSpaceConfig,
} from "../../../helpers/misc-utils";
import {GLOBAL_OVERRIDES} from "../../../helpers/hardhat-constants";

export const step_16 = async (verify = false) => {
  const paraSpaceConfig = getParaSpaceConfig();
  if (!paraSpaceConfig.EnableLooksrare) {
    console.log("looksrare not enable, skip deploy looksrare");
    return;
  }

  const allTokens = await getAllTokens();
  try {
    if ((!isLocalTestnet() && !isPublicTestnet()) || !allTokens.WETH) {
      return;
    }

    const currencyManager = await deployCurrencyManager(verify);
    const addressesProvider = await getPoolAddressesProvider();

    if (allTokens.DAI) {
      await waitForTx(
        await currencyManager.addCurrency(
          allTokens.DAI.address,
          GLOBAL_OVERRIDES
        )
      );
    }
    await waitForTx(
      await currencyManager.addCurrency(
        allTokens.WETH.address,
        GLOBAL_OVERRIDES
      )
    );

    const executionManager = await deployExecutionManager(verify);

    const royaltyFeeRegistry = await deployRoyaltyFeeRegistry("0", verify);
    const royaltyFeeManager = await deployRoyaltyFeeManager(
      royaltyFeeRegistry.address,
      verify
    );

    const protocolFeeRecipient = constants.AddressZero;
    const looksRareExchange = await deployLooksRareExchange(
      currencyManager.address,
      executionManager.address,
      royaltyFeeManager.address,
      allTokens.WETH.address,
      protocolFeeRecipient,
      verify
    );
    const standardSaleForFixedPrice =
      await deployStrategyStandardSaleForFixedPrice("0", verify);
    const looksRareAdapter = await deployLooksRareAdapter(
      addressesProvider.address,
      standardSaleForFixedPrice.address,
      verify
    );
    await waitForTx(
      await addressesProvider.setMarketplace(
        LOOKSRARE_ID,
        looksRareExchange.address,
        looksRareAdapter.address,
        looksRareExchange.address,
        false,
        GLOBAL_OVERRIDES
      )
    );

    const transferManagerERC721 = await deployTransferManagerERC721(
      looksRareExchange.address,
      verify
    );
    const transferManagerERC1155 = await deployTransferManagerERC1155(
      looksRareExchange.address,
      verify
    );
    const transferSelectorNFT = await deployTransferSelectorNFT(
      transferManagerERC721.address,
      transferManagerERC1155.address,
      verify
    );
    await waitForTx(
      await looksRareExchange.updateTransferSelectorNFT(
        transferSelectorNFT.address,
        GLOBAL_OVERRIDES
      )
    );
    await waitForTx(
      await executionManager.addStrategy(
        standardSaleForFixedPrice.address,
        GLOBAL_OVERRIDES
      )
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
