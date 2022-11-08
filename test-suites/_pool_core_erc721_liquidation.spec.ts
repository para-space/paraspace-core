import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {BigNumber} from "ethers";
import {ZERO_ADDRESS} from "../deploy/helpers/constants";
import {
  getAggregator,
  getParaSpaceOracle,
} from "../deploy/helpers/contracts-getters";
import {
  advanceTimeAndBlock,
  DRE,
  waitForTx,
} from "../deploy/helpers/misc-utils";
import {ProtocolErrors} from "../deploy/helpers/types";
import {TestEnv} from "./helpers/make-suite";
import {testEnvFixture} from "./helpers/setup-env";
import {getUserData} from "./helpers/utils/helpers";
import {
  borrowAndValidate,
  changePriceAndValidate,
  liquidateAndValidate,
  liquidateAndValidateReverted,
  supplyAndValidate,
} from "./helpers/validated-steps";
import {parseEther} from "ethers/lib/utils";

describe("ERC-721 Liquidation", () => {
  let testEnv: TestEnv;

  beforeEach(async () => {
    testEnv = await loadFixture(testEnvFixture);
    const {
      users: [borrower, liquidator],
      bayc,
      dai,
      weth,
      configurator,
    } = testEnv;

    // assure asset prices for correct health factor calculations
    await changePriceAndValidate(bayc, "101");

    const daiAgg = await getAggregator(undefined, "DAI");
    await daiAgg.updateLatestAnswer("908578801039414");

    // Borrower deposits BAYC
    await supplyAndValidate(bayc, "1", borrower, true);

    // Liquidator deposits 100k DAI and 100 wETH
    await supplyAndValidate(weth, "100", liquidator, true, "1000");
    await supplyAndValidate(dai, "100000", liquidator, true, "200000");

    // disable auction to test original liquidation
    await waitForTx(
      await configurator.setReserveAuctionStrategyAddress(
        bayc.address,
        ZERO_ADDRESS
      )
    );
  });

  it("TC-erc721-liquidation-01 Liquidator tries to liquidate a healthy position (HF & ERC721_HF ~ 1.0 - 1.1) (revert expected)", async () => {
    const {
      users: [borrower, liquidator],
      dai,
      bayc,
      weth,
    } = testEnv;
    // borrow 10k DAI
    await borrowAndValidate(dai, "10000", borrower);

    // drop BAYC price to near liquidation limit (HF ~ 1.0 - 1.1)
    await changePriceAndValidate(bayc, "13"); // HF = 1.00156

    await liquidateAndValidateReverted(
      bayc,
      weth,
      "100",
      liquidator,
      borrower,
      false,
      ProtocolErrors.ERC721_HEALTH_FACTOR_NOT_BELOW_THRESHOLD
    );
  });

  it("TC-erc721-liquidation-02 Liquidator attempts to liquidate ERC-721 when HF < 1, ERC721 HF  > 1 (should be reverted)", async () => {
    const {
      users: [borrower, liquidator],
      dai,
      bayc,
      weth,
    } = testEnv;
    // supply 10k DAI
    await supplyAndValidate(dai, "10000", borrower, true);
    // borrow 19k DAI
    await borrowAndValidate(dai, "19000", borrower);

    // drop BAYC price to near liquidation limit (HF ~ 1.0 - 1.1)
    await changePriceAndValidate(bayc, "13");
    // HF: 0.948142276914844611
    // ERC-721 HF: 1.056927044691003946

    await liquidateAndValidateReverted(
      bayc,
      weth,
      "100",
      liquidator,
      borrower,
      false,
      ProtocolErrors.ERC721_HEALTH_FACTOR_NOT_BELOW_THRESHOLD
    );
  });

  it("TC-erc721-liquidation-03 Liquidator liquidates NFT - with full debt in non-wETH currency", async () => {
    const {
      users: [borrower, liquidator],
      dai,
      bayc,
      weth,
    } = testEnv;
    // borrow 10k DAI
    await borrowAndValidate(dai, "10000", borrower);

    // drop BAYC price to liquidation range
    await changePriceAndValidate(bayc, "10");

    // liquidate the NFT
    await liquidateAndValidate(
      bayc,
      weth,
      "50000",
      liquidator,
      borrower,
      false
    );
  });

  it("TC-erc721-liquidation-04 Liquidator liquidates NFT - with full global debt in WETH", async () => {
    const {
      users: [borrower, liquidator],
      dai,
      bayc,
      weth,
    } = testEnv;
    // borrow 10 WETH
    await borrowAndValidate(weth, "10", borrower);

    // drop BAYC price to liquidation range
    await changePriceAndValidate(bayc, "10");

    // liquidate the NFT
    await liquidateAndValidate(
      bayc,
      weth,
      "50000",
      liquidator,
      borrower,
      false
    );
  });

  it("TC-erc721-liquidation-05 Liquidator liquidates NFT - with partial debt in WETH", async () => {
    const {
      users: [borrower, liquidator],
      dai,
      bayc,
      weth,
    } = testEnv;
    // borrow 5 WETH
    await borrowAndValidate(weth, "5", borrower);
    // borrow 5k DAI
    await borrowAndValidate(dai, "5000", borrower);

    // drop BAYC price to liquidation range
    await changePriceAndValidate(bayc, "10");

    // liquidate the NFT
    await liquidateAndValidate(
      bayc,
      weth,
      "50000",
      liquidator,
      borrower,
      false
    );
  });

  it("TC-erc721-liquidation-06 Liquidator liquidates NFT - gets nToken", async () => {
    const {
      users: [borrower, liquidator],
      dai,
      bayc,
      weth,
      pool,
      protocolDataProvider,
    } = testEnv;
    // borrow 10k DAI
    await borrowAndValidate(dai, "10000", borrower);

    // drop BAYC price to liquidation range
    const baycPrice = "10";
    await changePriceAndValidate(bayc, baycPrice);

    // try to liquidate wih DAI
    await liquidateAndValidate(bayc, weth, "50000", liquidator, borrower, true);
  });

  it("TC-erc721-liquidation-07 Liquidator liquidates ERC-721 using ETH", async () => {
    const {
      users: [borrower, liquidator],
      pool,
      bayc,
      nBAYC,
      dai,
      weth,
      protocolDataProvider,
    } = await loadFixture(testEnvFixture);

    // assure asset prices for correct health factor calculations
    await changePriceAndValidate(bayc, "101");

    const daiAgg = await getAggregator(undefined, "DAI");
    await daiAgg.updateLatestAnswer("908578801039414");

    // Borrower deposits BAYC
    await supplyAndValidate(bayc, "1", borrower, true);

    // Liquidator deposits 100k DAI and 100 wETH
    await supplyAndValidate(weth, "100", liquidator, true, "1000");
    await supplyAndValidate(dai, "100000", liquidator, true, "200000");

    // 10k DAI ~= 9 ETH
    await borrowAndValidate(dai, "10000", borrower);

    // drop BAYC price to liquidation levels (HF = 0.6)
    await changePriceAndValidate(bayc, "8");

    // start auction
    await waitForTx(
      await pool
        .connect(liquidator.signer)
        .startAuction(borrower.address, bayc.address, 0)
    );
    const {startTime, tickLength} = await pool.getAuctionData(nBAYC.address, 0);
    await advanceTimeAndBlock(
      startTime.add(tickLength.mul(BigNumber.from(40))).toNumber()
    );
    const liquidatorBalanceBefore = await pool.provider.getBalance(
      liquidator.address
    );
    const auctionDataAfter = await pool.getAuctionData(nBAYC.address, 0);
    const actualPriceMultiplier = auctionDataAfter.currentPriceMultiplier.lte(
      auctionDataAfter.minPriceMultiplier
    )
      ? auctionDataAfter.minPriceMultiplier
      : auctionDataAfter.currentPriceMultiplier;
    let baycPrice = await (await getParaSpaceOracle())
      .connect(borrower.address)
      .getAssetPrice(bayc.address);
    baycPrice = baycPrice
      .wadMul(actualPriceMultiplier)
      .wadDiv(DRE.ethers.utils.parseUnits("1", 18));
    // liquidate the NFT
    const actualLiquidationAmount = baycPrice;
    const liquidationAmount = parseEther("10").toString();
    const tx = pool
      .connect(liquidator.signer)
      .liquidateERC721(
        bayc.address,
        borrower.address,
        0,
        liquidationAmount,
        false,
        {
          gasLimit: 5000000,
          value: liquidationAmount,
        }
      );

    const txReceipt = await (await tx).wait();
    const gasUsed = txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice);

    const liquidatorBalanceAfter = await pool.provider.getBalance(
      liquidator.address
    );
    const borrowerWethReserveDataAfter = await getUserData(
      pool,
      protocolDataProvider,
      weth.address,
      borrower.address
    );
    //assert nbayc fully swap to pweth
    expect(borrowerWethReserveDataAfter.currentPTokenBalance).to.be.eq(
      baycPrice
    );
    expect(liquidatorBalanceAfter).to.be.eq(
      liquidatorBalanceBefore.sub(actualLiquidationAmount).sub(gasUsed)
    );
  });
});
