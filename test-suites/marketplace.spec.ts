import {expect} from "chai";
import {
  DRE,
  evmRevert,
  evmSnapshot,
  waitForTx,
} from "../deploy/helpers/misc-utils";
import {
  convertToCurrencyDecimals,
  createSeaportOrder,
  getEthersSigners,
} from "../deploy/helpers/contracts-helpers";
import {TestEnv} from "./helpers/make-suite";
import creditType from "../deploy/helpers/eip-712-types/credit";
import {
  AdvancedOrder,
  ConsiderationItem,
} from "../deploy/helpers/seaport-helpers/types";
import {
  buildResolver,
  convertSignatureToEIP2098,
  getOfferOrConsiderationItem,
  toBN,
  toFulfillment,
} from "../deploy/helpers/seaport-helpers/encoding";
import {PARASPACE_SEAPORT_ID} from "../deploy/helpers/constants";
import {formatEther, arrayify, splitSignature} from "ethers/lib/utils";
import {BigNumber, constants} from "ethers";
import {
  borrowAndValidate,
  changePriceAndValidate,
  mintAndValidate,
  supplyAndValidate,
} from "./helpers/validated-steps";
import {MintableERC20} from "../types";
import {
  getMintableERC20,
  getMintableERC721,
  getParaSpaceOracle,
} from "../deploy/helpers/contracts-getters";
import {ProtocolErrors} from "../deploy/helpers/types";
import {merkleTree} from "../deploy/helpers/seaport-helpers/criteria";
import {executeAcceptBidWithCredit} from "./helpers/marketplace-helper";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {testEnvFixture} from "./helpers/setup-env";

describe("Leveraged Bid - Positive tests", () => {
  let testEnv: TestEnv;
  beforeEach("Take Blockchain Snapshot", async () => {
    testEnv = await loadFixture(testEnvFixture);
  });

  it("ERC20 <=> ERC721 via paraspace - no loan", async () => {
    const {
      doodles,
      usdc,
      users: [maker, taker],
    } = testEnv;
    const makerInitialBalance = "1000";
    const payNowAmount = await convertToCurrencyDecimals(
      usdc.address,
      makerInitialBalance
    );
    const payLaterAmount = 0; // no loan!
    const startAmount = payNowAmount.add(payLaterAmount);
    const endAmount = startAmount; // fixed price, taker can afford this
    const nftId = 0;

    // mint USDC to maker
    await mintAndValidate(usdc, makerInitialBalance, maker);
    // mint DOODLE to taker
    await mintAndValidate(doodles, "1", taker);

    expect(
      await executeAcceptBidWithCredit(
        doodles,
        usdc,
        startAmount,
        endAmount,
        payLaterAmount,
        nftId,
        maker,
        taker
      )
    );
  });

  it("ERC20 <=> ERC721 via paraspace - partial borrow", async () => {
    const {
      mayc,
      usdc,
      pool,
      users: [maker, taker, middleman],
    } = testEnv;
    const payNowAmount = await convertToCurrencyDecimals(usdc.address, "800");
    const creditAmount = await convertToCurrencyDecimals(usdc.address, "200");
    const startAmount = payNowAmount.add(creditAmount);
    const endAmount = startAmount; // fixed price but offerer cannot afford this
    const nftId = 0;

    // mint USDC to offerer and middleman
    const mintableUsdc = await getMintableERC20(usdc.address);
    await waitForTx(
      await mintableUsdc
        .connect(middleman.signer)
        ["mint(uint256)"](creditAmount)
    );
    await waitForTx(
      await mintableUsdc.connect(maker.signer)["mint(uint256)"](payNowAmount)
    );
    expect(await usdc.balanceOf(maker.address)).to.be.equal(payNowAmount);
    expect(await usdc.balanceOf(middleman.address)).to.be.equal(creditAmount);

    // middleman supplies USDC to pool to be borrowed by offerer later
    await waitForTx(
      await usdc.connect(middleman.signer).approve(pool.address, creditAmount)
    );
    await waitForTx(
      await pool
        .connect(middleman.signer)
        .supply(usdc.address, creditAmount, middleman.address, 0)
    );
    expect(
      await usdc.balanceOf(
        (
          await pool.getReserveData(usdc.address)
        ).xTokenAddress
      )
    ).to.be.equal(creditAmount);

    // mint MAYC
    const mintableMayc = await getMintableERC721(mayc.address);
    await waitForTx(
      await mintableMayc.connect(taker.signer)["mint(address)"](taker.address)
    );
    expect(await mayc.ownerOf(nftId)).to.be.equal(taker.address);

    await executeAcceptBidWithCredit(
      mayc,
      usdc,
      startAmount,
      endAmount,
      creditAmount,
      nftId,
      maker,
      taker
    );

    expect(await mayc.balanceOf(taker.address)).to.be.equal(0);
    expect(await mayc.ownerOf(nftId)).to.be.equal(
      (await pool.getReserveData(mayc.address)).xTokenAddress
    );
    expect(await usdc.balanceOf(taker.address)).to.be.equal(startAmount);
  });

  it("ERC20 <=> ERC721 via paraspace - full borrow", async () => {
    const {
      bayc,
      nBAYC,
      usdc,
      pool,
      users: [maker, taker, middleman],
    } = testEnv;
    const middlemanInitialBalance = "1000";
    const payLaterAmount = await convertToCurrencyDecimals(
      usdc.address,
      "1000"
    );
    const startAmount = payLaterAmount; // full borrow
    const endAmount = startAmount; // fixed price but taker cannot afford this
    const nftId = 0;

    // mint USDC to middleman
    await mintAndValidate(usdc, middlemanInitialBalance, middleman);
    // middleman supplies USDC to pool to be borrowed by maker later
    await supplyAndValidate(usdc, middlemanInitialBalance, middleman);

    // mint BAYC to taker
    await mintAndValidate(bayc, "1", taker);

    await executeAcceptBidWithCredit(
      bayc,
      usdc,
      startAmount,
      endAmount,
      payLaterAmount,
      nftId,
      maker,
      taker
    );

    expect(await bayc.balanceOf(taker.address)).to.be.equal(0);
    expect(await nBAYC.balanceOf(maker.address)).to.be.equal(1);
    expect(await bayc.ownerOf(nftId)).to.be.equal(
      (await pool.getReserveData(bayc.address)).xTokenAddress
    );
    expect(await usdc.balanceOf(taker.address)).to.be.equal(startAmount);
  });

  it("ERC20 <=> NToken via paraspace - partial borrow", async () => {
    const {
      bayc,
      nBAYC,
      usdc,
      pool,
      users: [maker, taker, middleman],
    } = testEnv;
    const payNowAmount = await convertToCurrencyDecimals(usdc.address, "800");
    const creditAmount = await convertToCurrencyDecimals(usdc.address, "200");
    const startAmount = payNowAmount.add(creditAmount);
    const endAmount = startAmount; // fixed price but offerer cannot afford this
    const nftId = 0;

    // mint USDC to taker and middleman
    const mintableUsdc = await getMintableERC20(usdc.address);
    await waitForTx(
      await mintableUsdc
        .connect(middleman.signer)
        ["mint(uint256)"](creditAmount)
    );
    await waitForTx(
      await mintableUsdc.connect(maker.signer)["mint(uint256)"](payNowAmount)
    );
    expect(await usdc.balanceOf(maker.address)).to.be.equal(payNowAmount);
    expect(await usdc.balanceOf(middleman.address)).to.be.equal(creditAmount);

    // middleman supplies USDC to pool to be borrowed by taker later
    await waitForTx(
      await usdc.connect(middleman.signer).approve(pool.address, creditAmount)
    );
    await waitForTx(
      await pool
        .connect(middleman.signer)
        .supply(usdc.address, creditAmount, middleman.address, 0)
    );
    expect(
      await usdc.balanceOf(
        (
          await pool.getReserveData(usdc.address)
        ).xTokenAddress
      )
    ).to.be.equal(creditAmount);

    // mint BAYC
    const mintableBayc = await getMintableERC721(bayc.address);
    await waitForTx(
      await mintableBayc.connect(taker.signer)["mint(address)"](taker.address)
    );
    expect(await bayc.ownerOf(nftId)).to.be.equal(taker.address);

    await waitForTx(
      await bayc.connect(taker.signer).approve(pool.address, nftId)
    );
    await waitForTx(
      await pool
        .connect(taker.signer)
        .supplyERC721(
          bayc.address,
          [{tokenId: nftId, useAsCollateral: true}],
          taker.address,
          0
        )
    );

    expect(await nBAYC.ownerOf(nftId)).to.be.equal(taker.address);
    expect(await nBAYC.collaterizedBalanceOf(taker.address)).to.be.equal(1);

    // before acceptBidWithCredit totalCollateralBase for the taker
    // is just the bayc
    const totalCollateralBaseBefore = (
      await pool.getUserAccountData(taker.address)
    ).totalCollateralBase;
    const assetPrice = await (await getParaSpaceOracle())
      .connect(taker.signer)
      .getAssetPrice(bayc.address);
    const depositedAmountInBaseUnits = BigNumber.from(1).mul(assetPrice);
    expect(totalCollateralBaseBefore).to.be.eq(depositedAmountInBaseUnits);
    // and there is no debt for maker
    const totalDebtBefore = (await pool.getUserAccountData(maker.address))
      .totalDebtBase;
    expect(totalDebtBefore).to.be.eq(0);

    await waitForTx(
      await usdc.connect(taker.signer).approve(pool.address, startAmount)
    );

    await executeAcceptBidWithCredit(
      nBAYC,
      usdc,
      startAmount,
      endAmount,
      creditAmount,
      nftId,
      maker,
      taker
    );

    expect(await nBAYC.balanceOf(taker.address)).to.be.equal(0);
    expect(await nBAYC.ownerOf(nftId)).to.be.equal(maker.address);
    expect(await usdc.balanceOf(taker.address)).to.be.equal(startAmount);

    // after the swap offer's totalCollateralBase should be same as taker's before
    const totalCollateralBaseAfter = (
      await pool.getUserAccountData(maker.address)
    ).totalCollateralBase;
    expect(totalCollateralBaseAfter).to.be.eq(totalCollateralBaseBefore);
    // but has some debt now
    const totalDebtAfter = (await pool.getUserAccountData(maker.address))
      .totalDebtBase;
    expect(totalDebtAfter).to.be.gt(0);
  });

  it("ERC20 <=> Punk via paraspace - partial borrow", async () => {
    const {
      usdc,
      cryptoPunksMarket: punk,
      wPunk,
      nWPunk,
      conduitKey,
      conduit,
      pausableZone,
      seaport,
      pool,
      users: [offer, offerer, middleman],
      wPunkGateway,
    } = testEnv;
    const payNowAmount = await convertToCurrencyDecimals(usdc.address, "800");
    const creditAmount = await convertToCurrencyDecimals(usdc.address, "200");
    const startAmount = payNowAmount.add(creditAmount);
    const endAmount = startAmount; // fixed price but offerer cannot afford this
    const nftId = "0";

    // mint USDC to offerer and middleman
    const mintableUsdc = await getMintableERC20(usdc.address);
    await waitForTx(
      await mintableUsdc
        .connect(middleman.signer)
        ["mint(uint256)"](creditAmount)
    );
    await waitForTx(
      await mintableUsdc.connect(offer.signer)["mint(uint256)"](payNowAmount)
    );
    expect(await usdc.balanceOf(offer.address)).to.be.equal(payNowAmount);
    expect(await usdc.balanceOf(middleman.address)).to.be.equal(creditAmount);

    // middleman supplies USDC to pool to be borrowed by offerer later
    await waitForTx(
      await usdc.connect(middleman.signer).approve(pool.address, creditAmount)
    );
    await waitForTx(
      await pool
        .connect(middleman.signer)
        .supply(usdc.address, creditAmount, middleman.address, 0)
    );
    expect(
      await usdc.balanceOf(
        (
          await pool.getReserveData(usdc.address)
        ).xTokenAddress
      )
    ).to.be.equal(creditAmount);

    // get Punk and offer for sale
    await waitForTx(
      await punk.connect(offerer.signer)["getPunk(uint256)"](nftId)
    );
    expect(await punk.punkIndexToAddress(nftId)).to.be.equal(offerer.address);
    await waitForTx(
      await punk.connect(offerer.signer).offerPunkForSale(nftId, 0)
    );

    // approve
    await waitForTx(
      await wPunk
        .connect(offerer.signer)
        .setApprovalForAll(conduit.address, true)
    );
    await waitForTx(
      await usdc.connect(offer.signer).approve(conduit.address, startAmount)
    );

    const getSellOrder = async (): Promise<AdvancedOrder> => {
      const offers = [
        getOfferOrConsiderationItem(
          1,
          usdc.address,
          toBN(0),
          startAmount,
          endAmount
        ),
      ];

      const considerations = [
        getOfferOrConsiderationItem(
          2,
          wPunk.address,
          nftId,
          toBN(1),
          toBN(1),
          pool.address
        ),
      ];

      return createSeaportOrder(
        seaport,
        offer,
        offers,
        considerations,
        2,
        pausableZone.address,
        conduitKey
      );
    };

    const getBuyOrder = async (): Promise<AdvancedOrder> => {
      const offers = [
        getOfferOrConsiderationItem(2, wPunk.address, nftId, toBN(1), toBN(1)),
      ];

      const considerations = [
        getOfferOrConsiderationItem(
          1,
          usdc.address,
          toBN(0),
          startAmount,
          endAmount,
          offerer.address
        ),
      ];

      return createSeaportOrder(
        seaport,
        offerer,
        offers,
        considerations,
        2,
        pausableZone.address,
        conduitKey
      );
    };

    const fulfillment = [
      [[[0, 0]], [[1, 0]]],
      [[[1, 0]], [[0, 0]]],
    ].map(([offerArr, considerationArr]) =>
      toFulfillment(offerArr, considerationArr)
    );

    const sellOrder = await getSellOrder();
    const buyOrder = await getBuyOrder();

    const encodedData = seaport.interface.encodeFunctionData(
      "matchAdvancedOrders",
      [[sellOrder, buyOrder], [], fulfillment]
    );

    const domainData = {
      name: "ParaSpace",
      version: "1.1",
      chainId: (await DRE.ethers.provider.getNetwork()).chainId,
      verifyingContract: pool.address,
    };

    const credit = {
      token: usdc.address,
      amount: creditAmount,
      orderId: arrayify(sellOrder.signature),
    };

    const signature = await DRE.ethers.provider
      .getSigner(offer.address)
      ._signTypedData(domainData, creditType, credit);

    const vrs = splitSignature(convertSignatureToEIP2098(signature));

    const tx = wPunkGateway.connect(offerer.signer).acceptBidWithCredit(
      PARASPACE_SEAPORT_ID,
      `0x${encodedData.slice(10)}`,
      {
        ...credit,
        ...vrs,
      },
      [nftId],
      0,
      {
        gasLimit: 5000000,
      }
    );

    await (await tx).wait();
    expect(await wPunk.balanceOf(offerer.address)).to.be.equal(0);
    expect(await wPunk.ownerOf(nftId)).to.be.equal(nWPunk.address);
    expect(await usdc.balanceOf(offerer.address)).to.be.equal(startAmount);
  });

  it("ERC20 <=> (ERC-721 & NToken) via paraspace - partial borrow", async () => {
    const {
      nBAYC,
      bayc,
      usdc,
      pool,
      seaport,
      conduit,
      conduitKey,
      pausableZone,
      users: [maker, taker, middleman],
    } = testEnv;
    const makerInitialBalance = "800";
    const payNowAmount = await convertToCurrencyDecimals(
      usdc.address,
      makerInitialBalance
    );
    const middlemanInitialBalance = "1200";
    const payLaterAmount = await convertToCurrencyDecimals(usdc.address, "200");
    const startAmount = payNowAmount.add(payLaterAmount);
    const endAmount = startAmount; // fixed price but taker cannot afford this
    const nftId = 0;

    // mint USDC to maker and middleman
    await mintAndValidate(usdc, middlemanInitialBalance, middleman);
    await mintAndValidate(usdc, makerInitialBalance, maker);

    // middleman supplies USDC to pool to be borrowed by maker later
    await supplyAndValidate(usdc, middlemanInitialBalance, middleman);

    const payLaterAmount2 = await convertToCurrencyDecimals(
      usdc.address,
      "1000"
    );
    const startAmount2 = payLaterAmount2;
    const endAmount2 = startAmount2; // fixed price but taker cannot afford this
    const nftId2 = 1;

    // mint BAYC to taker
    await mintAndValidate(bayc, "2", taker);
    // supply BAYC
    await supplyAndValidate(bayc, "1", taker);

    // approve - on accept bid case, user must approve full pay+loan amount
    await waitForTx(
      await usdc
        .connect(maker.signer)
        .approve(conduit.address, startAmount.add(startAmount2))
    );
    await waitForTx(
      await nBAYC.connect(taker.signer).approve(conduit.address, nftId)
    );
    await waitForTx(
      await bayc.connect(taker.signer).approve(conduit.address, nftId2)
    );

    // prepare sell order 1
    const getSellOrder = async (): Promise<AdvancedOrder> => {
      const offers = [
        getOfferOrConsiderationItem(
          1,
          usdc.address,
          toBN(0),
          startAmount,
          endAmount
        ),
      ];

      const considerations = [
        getOfferOrConsiderationItem(
          2,
          nBAYC.address,
          nftId,
          toBN(1),
          toBN(1),
          pool.address
        ),
      ];

      return createSeaportOrder(
        seaport,
        maker,
        offers,
        considerations,
        2,
        pausableZone.address,
        conduitKey
      );
    };

    // prepare sell order 2
    const getSellOrder2 = async (): Promise<AdvancedOrder> => {
      const offers = [
        getOfferOrConsiderationItem(
          1,
          usdc.address,
          toBN(0),
          startAmount2,
          endAmount2
        ),
      ];

      const considerations = [
        getOfferOrConsiderationItem(
          2,
          bayc.address,
          nftId2,
          toBN(1),
          toBN(1),
          pool.address
        ),
      ];

      return createSeaportOrder(
        seaport,
        maker,
        offers,
        considerations as ConsiderationItem[],
        2,
        pausableZone.address,
        conduitKey
      );
    };

    // prepare buy order 1
    const getBuyOrder = async (): Promise<AdvancedOrder> => {
      const offers = [
        getOfferOrConsiderationItem(2, nBAYC.address, nftId, toBN(1), toBN(1)),
      ];

      const considerations = [
        getOfferOrConsiderationItem(
          1,
          usdc.address,
          toBN(0),
          startAmount,
          endAmount,
          taker.address
        ),
      ];

      return createSeaportOrder(
        seaport,
        taker,
        offers,
        considerations,
        2,
        pausableZone.address,
        conduitKey
      );
    };

    // prepare buy order 2
    const getBuyOrder2 = async (): Promise<AdvancedOrder> => {
      const offers = [
        getOfferOrConsiderationItem(2, bayc.address, nftId2, toBN(1), toBN(1)),
      ];

      const considerations = [
        getOfferOrConsiderationItem(
          1,
          usdc.address,
          toBN(0),
          startAmount2,
          endAmount2,
          taker.address
        ),
      ];

      return createSeaportOrder(
        seaport,
        taker,
        offers,
        considerations,
        2,
        pausableZone.address,
        conduitKey
      );
    };

    const fulfillment = [
      [[[0, 0]], [[1, 0]]],
      [[[1, 0]], [[0, 0]]],
    ].map(([makerArr, considerationArr]) =>
      toFulfillment(makerArr, considerationArr)
    );

    const sellOrder = await getSellOrder();
    const buyOrder = await getBuyOrder();
    const sellOrder2 = await getSellOrder2();
    const buyOrder2 = await getBuyOrder2();

    // encode order 1
    const encodedData = seaport.interface.encodeFunctionData(
      "matchAdvancedOrders",
      [[sellOrder, buyOrder], [], fulfillment]
    );
    // encode order 2
    const encodedData2 = seaport.interface.encodeFunctionData(
      "matchAdvancedOrders",
      [[sellOrder2, buyOrder2], [], fulfillment]
    );

    const domainData = {
      name: "ParaSpace",
      version: "1.1",
      chainId: (await DRE.ethers.provider.getNetwork()).chainId,
      verifyingContract: pool.address,
    };

    const payLater = {
      token: usdc.address,
      amount: payLaterAmount,
      orderId: arrayify(sellOrder.signature),
    };
    const payLater2 = {
      token: usdc.address,
      amount: payLaterAmount2,
      orderId: arrayify(sellOrder2.signature),
    };

    const signature = await DRE.ethers.provider
      .getSigner(maker.address)
      ._signTypedData(domainData, creditType, payLater);
    const signature2 = await DRE.ethers.provider
      .getSigner(maker.address)
      ._signTypedData(domainData, creditType, payLater2);

    const vrs = splitSignature(convertSignatureToEIP2098(signature));
    const vrs2 = splitSignature(convertSignatureToEIP2098(signature2));

    const tx = pool.connect(taker.signer).batchAcceptBidWithCredit(
      [PARASPACE_SEAPORT_ID, PARASPACE_SEAPORT_ID],
      [`0x${encodedData.slice(10)}`, `0x${encodedData2.slice(10)}`],
      [
        {
          ...payLater,
          ...vrs,
        },
        {
          ...payLater2,
          ...vrs2,
        },
      ],
      taker.address,
      0,
      {
        gasLimit: 5000000,
      }
    );
    await (await tx).wait();

    expect(await nBAYC.ownerOf(nftId)).to.be.equal(maker.address);
    expect(await usdc.balanceOf(taker.address)).to.be.equal(
      startAmount.add(startAmount2)
    );
    expect(await bayc.balanceOf(taker.address)).to.be.equal(0);
    expect(await nBAYC.balanceOf(maker.address)).to.be.equal(2);
    expect(await bayc.ownerOf(nftId2)).to.be.equal(
      (await pool.getReserveData(bayc.address)).xTokenAddress
    );
  });

  it("AcceptBidWithCredit(collection bid)", async () => {
    const {
      mayc,
      usdc,
      conduitKey,
      conduit,
      pausableZone,
      seaport,
      pool,
      users: [buyer, seller, middleman],
    } = testEnv;
    const payNowAmount = await convertToCurrencyDecimals(usdc.address, "800");
    const creditAmount = await convertToCurrencyDecimals(usdc.address, "200");
    const startAmount = payNowAmount.add(creditAmount);
    const endAmount = startAmount; // fixed price but offerer cannot afford this
    const nftId = "0";

    // mint USDC to offerer and middleman
    const mintableUsdc = await getMintableERC20(usdc.address);
    await waitForTx(
      await mintableUsdc
        .connect(middleman.signer)
        ["mint(uint256)"](creditAmount)
    );
    await waitForTx(
      await mintableUsdc.connect(buyer.signer)["mint(uint256)"](payNowAmount)
    );
    expect(await usdc.balanceOf(buyer.address)).to.be.equal(payNowAmount);
    expect(await usdc.balanceOf(middleman.address)).to.be.equal(creditAmount);

    // middleman supplies USDC to pool to be borrowed by offerer later
    await waitForTx(
      await usdc.connect(middleman.signer).approve(pool.address, creditAmount)
    );
    await waitForTx(
      await pool
        .connect(middleman.signer)
        .supply(usdc.address, creditAmount, middleman.address, 0)
    );
    expect(
      await usdc.balanceOf(
        (
          await pool.getReserveData(usdc.address)
        ).xTokenAddress
      )
    ).to.be.equal(creditAmount);

    // mint MAYC
    const mintableMayc = await getMintableERC721(mayc.address);
    await waitForTx(
      await mintableMayc.connect(seller.signer)["mint(address)"](seller.address)
    );
    expect(await mayc.ownerOf(nftId)).to.be.equal(seller.address);

    // approve
    await waitForTx(
      await mayc.connect(seller.signer).approve(conduit.address, nftId)
    );
    await waitForTx(
      await usdc.connect(buyer.signer).approve(conduit.address, startAmount)
    );

    const getSellOrder = async (): Promise<AdvancedOrder> => {
      const offers = [
        getOfferOrConsiderationItem(2, mayc.address, nftId, toBN(1), toBN(1)),
      ];

      const considerations = [
        getOfferOrConsiderationItem(
          1,
          usdc.address,
          toBN(0),
          startAmount,
          endAmount,
          seller.address
        ),
      ];

      return createSeaportOrder(
        seaport,
        seller,
        offers,
        considerations,
        2,
        pausableZone.address,
        conduitKey
      );
    };

    const getBuyOrder = async (): Promise<AdvancedOrder> => {
      const offers = [
        getOfferOrConsiderationItem(1, usdc.address, 0, startAmount, endAmount),
      ];

      const considerations = [
        getOfferOrConsiderationItem(
          4,
          mayc.address,
          toBN(0),
          1,
          1,
          pool.address
        ),
      ];

      return createSeaportOrder(
        seaport,
        buyer,
        offers,
        considerations as ConsiderationItem[],
        2,
        pausableZone.address,
        conduitKey
      );
    };

    const fulfillment = [
      [[[0, 0]], [[1, 0]]],
      [[[1, 0]], [[0, 0]]],
    ].map(([offerArr, considerationArr]) =>
      toFulfillment(offerArr, considerationArr)
    );

    const sellOrder = await getSellOrder();
    const buyOrder = await getBuyOrder();

    const criteriaResolvers = [
      buildResolver(0, 1, 0, BigNumber.from(nftId), []),
    ];

    const encodedData = seaport.interface.encodeFunctionData(
      "matchAdvancedOrders",
      [[buyOrder, sellOrder], criteriaResolvers, fulfillment]
    );

    const domainData = {
      name: "ParaSpace",
      version: "1.1",
      chainId: (await DRE.ethers.provider.getNetwork()).chainId,
      verifyingContract: pool.address,
    };

    const credit = {
      token: usdc.address,
      amount: creditAmount,
      orderId: arrayify(buyOrder.signature),
    };

    const signature = await DRE.ethers.provider
      .getSigner(buyer.address)
      ._signTypedData(domainData, creditType, credit);

    const vrs = splitSignature(convertSignatureToEIP2098(signature));

    const tx = pool.connect(seller.signer).acceptBidWithCredit(
      PARASPACE_SEAPORT_ID,
      `0x${encodedData.slice(10)}`,
      {
        ...credit,
        ...vrs,
      },
      seller.address,
      0,
      {
        gasLimit: 5000000,
      }
    );

    await (await tx).wait();
    expect(await mayc.balanceOf(seller.address)).to.be.equal(0);
    expect(await mayc.ownerOf(nftId)).to.be.equal(
      (await pool.getReserveData(mayc.address)).xTokenAddress
    );
    expect(await usdc.balanceOf(seller.address)).to.be.equal(startAmount);
  });

  it("AcceptBidWithCredit(collection set bid)", async () => {
    const {
      mayc,
      usdc,
      conduitKey,
      conduit,
      pausableZone,
      seaport,
      pool,
      users: [buyer, seller, middleman],
    } = testEnv;
    const payNowAmount = await convertToCurrencyDecimals(usdc.address, "800");
    const creditAmount = await convertToCurrencyDecimals(usdc.address, "200");
    const startAmount = payNowAmount.add(creditAmount);
    const endAmount = startAmount; // fixed price but offerer cannot afford this
    const nftId1 = BigNumber.from(1);
    const nftId2 = BigNumber.from(2);
    const nftId3 = BigNumber.from(3);
    const tokenIds = [nftId1, nftId2, nftId3];
    const {root, proofs} = merkleTree(tokenIds);

    // mint USDC to offerer and middleman
    const mintableUsdc = await getMintableERC20(usdc.address);
    await waitForTx(
      await mintableUsdc
        .connect(middleman.signer)
        ["mint(uint256)"](creditAmount)
    );
    await waitForTx(
      await mintableUsdc.connect(buyer.signer)["mint(uint256)"](payNowAmount)
    );
    expect(await usdc.balanceOf(buyer.address)).to.be.equal(payNowAmount);
    expect(await usdc.balanceOf(middleman.address)).to.be.equal(creditAmount);

    // middleman supplies USDC to pool to be borrowed by offerer later
    await waitForTx(
      await usdc.connect(middleman.signer).approve(pool.address, creditAmount)
    );
    await waitForTx(
      await pool
        .connect(middleman.signer)
        .supply(usdc.address, creditAmount, middleman.address, 0)
    );
    expect(
      await usdc.balanceOf(
        (
          await pool.getReserveData(usdc.address)
        ).xTokenAddress
      )
    ).to.be.equal(creditAmount);

    // mint MAYC
    const mintableMayc = await getMintableERC721(mayc.address);
    for (let i = 0; i < 4; i++) {
      await waitForTx(
        await mintableMayc
          .connect(seller.signer)
          ["mint(address)"](seller.address)
      );
      expect(await mayc.ownerOf(i)).to.be.equal(seller.address);
    }
    expect(await mayc.balanceOf(seller.address)).to.be.equal(4);

    // approve
    await waitForTx(
      await mayc.connect(seller.signer).approve(conduit.address, nftId1)
    );
    await waitForTx(
      await usdc.connect(buyer.signer).approve(conduit.address, startAmount)
    );

    const getSellOrder = async (): Promise<AdvancedOrder> => {
      const offers = [
        getOfferOrConsiderationItem(2, mayc.address, nftId1, toBN(1), toBN(1)),
      ];

      const considerations = [
        getOfferOrConsiderationItem(
          1,
          usdc.address,
          toBN(0),
          startAmount,
          endAmount,
          seller.address
        ),
      ];

      return createSeaportOrder(
        seaport,
        seller,
        offers,
        considerations,
        2,
        pausableZone.address,
        conduitKey
      );
    };

    const getBuyOrder = async (): Promise<AdvancedOrder> => {
      const offers = [
        getOfferOrConsiderationItem(1, usdc.address, 0, startAmount, endAmount),
      ];

      const considerations = [
        getOfferOrConsiderationItem(4, mayc.address, root, 1, 1, pool.address),
      ];

      return createSeaportOrder(
        seaport,
        buyer,
        offers,
        considerations as ConsiderationItem[],
        2,
        pausableZone.address,
        conduitKey
      );
    };

    const fulfillment = [
      [[[0, 0]], [[1, 0]]],
      [[[1, 0]], [[0, 0]]],
    ].map(([offerArr, considerationArr]) =>
      toFulfillment(offerArr, considerationArr)
    );

    const sellOrder = await getSellOrder();
    const buyOrder = await getBuyOrder();

    const criteriaResolvers = [
      buildResolver(0, 1, 0, nftId1, proofs[nftId1.toString()]),
    ];

    const encodedData = seaport.interface.encodeFunctionData(
      "matchAdvancedOrders",
      [[buyOrder, sellOrder], criteriaResolvers, fulfillment]
    );

    const domainData = {
      name: "ParaSpace",
      version: "1.1",
      chainId: (await DRE.ethers.provider.getNetwork()).chainId,
      verifyingContract: pool.address,
    };

    const credit = {
      token: usdc.address,
      amount: creditAmount,
      orderId: arrayify(buyOrder.signature),
    };

    const signature = await DRE.ethers.provider
      .getSigner(buyer.address)
      ._signTypedData(domainData, creditType, credit);

    const vrs = splitSignature(convertSignatureToEIP2098(signature));

    const tx = pool.connect(seller.signer).acceptBidWithCredit(
      PARASPACE_SEAPORT_ID,
      `0x${encodedData.slice(10)}`,
      {
        ...credit,
        ...vrs,
      },
      seller.address,
      0,
      {
        gasLimit: 5000000,
      }
    );

    await (await tx).wait();
    expect(await mayc.balanceOf(seller.address)).to.be.equal(3);
    expect(await mayc.ownerOf(nftId1)).to.be.equal(
      (await pool.getReserveData(mayc.address)).xTokenAddress
    );
    expect(await usdc.balanceOf(seller.address)).to.be.equal(startAmount);
  });

  it("AcceptBidWithCredit(with 2 platform fee item)", async () => {
    const {
      mayc,
      usdc,
      conduitKey,
      conduit,
      pausableZone,
      seaport,
      pool,
      users: [buyer, seller, middleman, platform, platform1],
    } = testEnv;
    const payNowAmount = await convertToCurrencyDecimals(usdc.address, "800");
    const creditAmount = await convertToCurrencyDecimals(usdc.address, "200");
    const startAmount = payNowAmount.add(creditAmount);
    const endAmount = startAmount; // fixed price but offerer cannot afford this
    const nftId = "0";

    // mint USDC to offerer and middleman
    const mintableUsdc = await getMintableERC20(usdc.address);
    await waitForTx(
      await mintableUsdc
        .connect(middleman.signer)
        ["mint(uint256)"](creditAmount)
    );
    await waitForTx(
      await mintableUsdc.connect(buyer.signer)["mint(uint256)"](payNowAmount)
    );
    expect(await usdc.balanceOf(buyer.address)).to.be.equal(payNowAmount);
    expect(await usdc.balanceOf(middleman.address)).to.be.equal(creditAmount);

    // middleman supplies USDC to pool to be borrowed by offerer later
    await waitForTx(
      await usdc.connect(middleman.signer).approve(pool.address, creditAmount)
    );
    await waitForTx(
      await pool
        .connect(middleman.signer)
        .supply(usdc.address, creditAmount, middleman.address, 0)
    );
    expect(
      await usdc.balanceOf(
        (
          await pool.getReserveData(usdc.address)
        ).xTokenAddress
      )
    ).to.be.equal(creditAmount);

    // mint MAYC
    const mintableMayc = await getMintableERC721(mayc.address);
    await waitForTx(
      await mintableMayc.connect(seller.signer)["mint(address)"](seller.address)
    );
    expect(await mayc.ownerOf(nftId)).to.be.equal(seller.address);

    // approve
    await waitForTx(
      await mayc.connect(seller.signer).approve(conduit.address, nftId)
    );
    await waitForTx(
      await usdc.connect(buyer.signer).approve(conduit.address, startAmount)
    );

    const getSellOrder = async (): Promise<AdvancedOrder> => {
      const offers = [
        getOfferOrConsiderationItem(2, mayc.address, nftId, toBN(1), toBN(1)),
      ];

      const considerations = [
        getOfferOrConsiderationItem(
          1,
          usdc.address,
          toBN(0),
          startAmount.mul(98).div(100),
          endAmount.mul(98).div(100),
          seller.address
        ),
      ];

      return createSeaportOrder(
        seaport,
        seller,
        offers,
        considerations,
        2,
        pausableZone.address,
        conduitKey
      );
    };

    const getBuyOrder = async (): Promise<AdvancedOrder> => {
      const offers = [
        getOfferOrConsiderationItem(1, usdc.address, 0, startAmount, endAmount),
      ];

      const considerations = [
        getOfferOrConsiderationItem(
          4,
          mayc.address,
          toBN(0),
          1,
          1,
          pool.address
        ),
        getOfferOrConsiderationItem(
          1,
          usdc.address,
          toBN(0),
          startAmount.div(100),
          endAmount.div(100),
          platform.address
        ),
        getOfferOrConsiderationItem(
          1,
          usdc.address,
          toBN(0),
          startAmount.div(100),
          endAmount.div(100),
          platform1.address
        ),
      ];

      return createSeaportOrder(
        seaport,
        buyer,
        offers,
        considerations as ConsiderationItem[],
        2,
        pausableZone.address,
        conduitKey
      );
    };

    const fulfillment = [
      [[[0, 0]], [[1, 0]]],
      [[[0, 0]], [[0, 1]]],
      [[[0, 0]], [[0, 2]]],
      [[[1, 0]], [[0, 0]]],
    ].map(([offerArr, considerationArr]) =>
      toFulfillment(offerArr, considerationArr)
    );

    const sellOrder = await getSellOrder();
    const buyOrder = await getBuyOrder();

    const criteriaResolvers = [
      buildResolver(0, 1, 0, BigNumber.from(nftId), []),
    ];

    const encodedData = seaport.interface.encodeFunctionData(
      "matchAdvancedOrders",
      [[buyOrder, sellOrder], criteriaResolvers, fulfillment]
    );

    const domainData = {
      name: "ParaSpace",
      version: "1.1",
      chainId: (await DRE.ethers.provider.getNetwork()).chainId,
      verifyingContract: pool.address,
    };

    const credit = {
      token: usdc.address,
      amount: creditAmount,
      orderId: arrayify(buyOrder.signature),
    };

    const signature = await DRE.ethers.provider
      .getSigner(buyer.address)
      ._signTypedData(domainData, creditType, credit);

    const vrs = splitSignature(convertSignatureToEIP2098(signature));

    const tx = pool.connect(seller.signer).acceptBidWithCredit(
      PARASPACE_SEAPORT_ID,
      `0x${encodedData.slice(10)}`,
      {
        ...credit,
        ...vrs,
      },
      seller.address,
      0,
      {
        gasLimit: 5000000,
      }
    );

    await (await tx).wait();
    expect(await mayc.balanceOf(seller.address)).to.be.equal(0);
    expect(await mayc.ownerOf(nftId)).to.be.equal(
      (await pool.getReserveData(mayc.address)).xTokenAddress
    );
    expect(await usdc.balanceOf(seller.address)).to.be.equal(
      startAmount.mul(98).div(100)
    );
  });

  it("List NFT first before supplying", async () => {
    const {
      bayc,
      nBAYC,
      conduitKey,
      conduit,
      usdc,
      pausableZone,
      seaport,
      pool,
      users: [offer, offerer, middleman],
    } = testEnv;
    const payNowAmount = await convertToCurrencyDecimals(usdc.address, "800");
    const creditAmount = await convertToCurrencyDecimals(usdc.address, "200");
    const startAmount = payNowAmount.add(creditAmount);
    const endAmount = startAmount; // fixed price but offerer cannot afford this
    const nftId = "0";
    // mint USDT to offerer and middleman
    const mintableUsdt = await getMintableERC20(usdc.address);
    await waitForTx(
      await mintableUsdt
        .connect(middleman.signer)
        ["mint(uint256)"](creditAmount)
    );
    await waitForTx(
      await mintableUsdt.connect(offerer.signer)["mint(uint256)"](payNowAmount)
    );
    expect(await usdc.balanceOf(offerer.address)).to.be.equal(payNowAmount);
    expect(await usdc.balanceOf(middleman.address)).to.be.equal(creditAmount);
    // middleman supplies USDT to pool to be borrowed by offerer later
    await waitForTx(
      await usdc.connect(middleman.signer).approve(pool.address, creditAmount)
    );
    await waitForTx(
      await pool
        .connect(middleman.signer)
        .supply(usdc.address, creditAmount, middleman.address, 0)
    );
    expect(
      await usdc.balanceOf(
        (
          await pool.getReserveData(usdc.address)
        ).xTokenAddress
      )
    ).to.be.equal(creditAmount);
    const mintableBayc = await getMintableERC721(bayc.address);
    await waitForTx(
      await mintableBayc.connect(offer.signer)["mint(address)"](offer.address)
    );
    expect(await bayc.ownerOf(nftId)).to.be.equal(offer.address);
    await waitForTx(
      await bayc.connect(offer.signer).approve(pool.address, nftId)
    );
    await waitForTx(
      await pool
        .connect(offer.signer)
        .supplyERC721(
          bayc.address,
          [{tokenId: nftId, useAsCollateral: true}],
          offer.address,
          0
        )
    );
    expect(await nBAYC.ownerOf(nftId)).to.be.equal(offer.address);
    expect(await nBAYC.collaterizedBalanceOf(offer.address)).to.be.equal(1);

    await waitForTx(
      await nBAYC.connect(offer.signer).setApprovalForAll(conduit.address, true)
    );

    await waitForTx(
      await usdc.connect(offerer.signer).approve(pool.address, startAmount)
    );
    const getSellOrder = async (): Promise<AdvancedOrder> => {
      const offers = [
        getOfferOrConsiderationItem(2, bayc.address, nftId, toBN(1), toBN(1)),
      ];
      const considerations = [
        getOfferOrConsiderationItem(
          1,
          usdc.address,
          toBN(0),
          startAmount,
          endAmount,
          offer.address
        ),
      ];
      return createSeaportOrder(
        seaport,
        offer,
        offers,
        considerations,
        2,
        pausableZone.address,
        conduitKey
      );
    };
    const encodedData = seaport.interface.encodeFunctionData(
      "fulfillAdvancedOrder",
      [await getSellOrder(), [], conduitKey, pool.address]
    );
    const tx = pool.connect(offerer.signer).buyWithCredit(
      PARASPACE_SEAPORT_ID,
      `0x${encodedData.slice(10)}`,
      {
        token: usdc.address,
        amount: creditAmount,
        orderId: constants.HashZero,
        v: 0,
        r: constants.HashZero,
        s: constants.HashZero,
      },
      0,
      {
        gasLimit: 5000000,
      }
    );
    await (await tx).wait();
    expect(await nBAYC.ownerOf(nftId)).to.be.equal(offerer.address);
    expect(await nBAYC.collaterizedBalanceOf(offerer.address)).to.be.equal(1);
    expect(await usdc.balanceOf(offer.address)).to.be.equal(startAmount);
  });

  it("Accept underlyingAsset bid using NToken", async () => {
    const {
      bayc,
      nBAYC,
      usdc,
      conduitKey,
      conduit,
      pausableZone,
      seaport,
      pool,
      users: [offer, offerer, middleman],
    } = testEnv;
    const payNowAmount = await convertToCurrencyDecimals(usdc.address, "800");
    const creditAmount = await convertToCurrencyDecimals(usdc.address, "200");
    const startAmount = payNowAmount.add(creditAmount);
    const endAmount = startAmount; // fixed price but offerer cannot afford this
    const nftId = "0";

    // mint USDC to offerer and middleman
    const mintableUsdc = await getMintableERC20(usdc.address);
    await waitForTx(
      await mintableUsdc
        .connect(middleman.signer)
        ["mint(uint256)"](creditAmount)
    );
    await waitForTx(
      await mintableUsdc.connect(offer.signer)["mint(uint256)"](payNowAmount)
    );
    expect(await usdc.balanceOf(offer.address)).to.be.equal(payNowAmount);
    expect(await usdc.balanceOf(middleman.address)).to.be.equal(creditAmount);

    // middleman supplies USDC to pool to be borrowed by offerer later
    await waitForTx(
      await usdc.connect(middleman.signer).approve(pool.address, creditAmount)
    );
    await waitForTx(
      await pool
        .connect(middleman.signer)
        .supply(usdc.address, creditAmount, middleman.address, 0)
    );
    expect(
      await usdc.balanceOf(
        (
          await pool.getReserveData(usdc.address)
        ).xTokenAddress
      )
    ).to.be.equal(creditAmount);

    // mint BAYC
    const mintableBayc = await getMintableERC721(bayc.address);
    await waitForTx(
      await mintableBayc
        .connect(offerer.signer)
        ["mint(address)"](offerer.address)
    );
    expect(await bayc.ownerOf(nftId)).to.be.equal(offerer.address);

    const getSellOrder = async (): Promise<AdvancedOrder> => {
      const offers = [
        getOfferOrConsiderationItem(
          1,
          usdc.address,
          toBN(0),
          startAmount,
          endAmount
        ),
      ];

      const considerations = [
        getOfferOrConsiderationItem(
          2,
          bayc.address,
          nftId,
          toBN(1),
          toBN(1),
          pool.address
        ),
      ];

      return createSeaportOrder(
        seaport,
        offer,
        offers,
        considerations,
        2,
        pausableZone.address,
        conduitKey
      );
    };

    const getBuyOrder = async (): Promise<AdvancedOrder> => {
      const offers = [
        getOfferOrConsiderationItem(2, bayc.address, nftId, toBN(1), toBN(1)),
      ];

      const considerations = [
        getOfferOrConsiderationItem(
          1,
          usdc.address,
          toBN(0),
          startAmount,
          endAmount,
          offerer.address
        ),
      ];

      return createSeaportOrder(
        seaport,
        offerer,
        offers,
        considerations,
        2,
        pausableZone.address,
        conduitKey
      );
    };

    await waitForTx(
      await bayc.connect(offerer.signer).approve(pool.address, nftId)
    );
    await waitForTx(
      await pool
        .connect(offerer.signer)
        .supplyERC721(
          bayc.address,
          [{tokenId: nftId, useAsCollateral: false}],
          offerer.address,
          0
        )
    );

    expect(await nBAYC.ownerOf(nftId)).to.be.equal(offerer.address);
    expect(await nBAYC.collaterizedBalanceOf(offerer.address)).to.be.equal(0);

    // approve
    await waitForTx(
      await nBAYC
        .connect(offerer.signer)
        .setApprovalForAll(conduit.address, true)
    );
    await waitForTx(
      await usdc.connect(offer.signer).approve(conduit.address, startAmount)
    );

    const fulfillment = [
      [[[0, 0]], [[1, 0]]],
      [[[1, 0]], [[0, 0]]],
    ].map(([offerArr, considerationArr]) =>
      toFulfillment(offerArr, considerationArr)
    );

    const sellOrder = await getSellOrder();
    const buyOrder = await getBuyOrder();

    const encodedData = seaport.interface.encodeFunctionData(
      "matchAdvancedOrders",
      [[sellOrder, buyOrder], [], fulfillment]
    );

    const domainData = {
      name: "ParaSpace",
      version: "1.1",
      chainId: (await DRE.ethers.provider.getNetwork()).chainId,
      verifyingContract: pool.address,
    };

    const credit = {
      token: usdc.address,
      amount: creditAmount,
      orderId: arrayify(sellOrder.signature),
    };

    const signature = await DRE.ethers.provider
      .getSigner(offer.address)
      ._signTypedData(domainData, creditType, credit);

    const vrs = splitSignature(convertSignatureToEIP2098(signature));

    const tx = pool.connect(offerer.signer).acceptBidWithCredit(
      PARASPACE_SEAPORT_ID,
      `0x${encodedData.slice(10)}`,
      {
        ...credit,
        ...vrs,
      },
      offerer.address,
      0,
      {
        gasLimit: 5000000,
      }
    );

    await (await tx).wait();
    expect(await nBAYC.balanceOf(offerer.address)).to.be.equal(0);
    expect(await nBAYC.ownerOf(nftId)).to.be.equal(offer.address);
    expect(await nBAYC.collaterizedBalanceOf(offer.address)).to.be.equal(1);
    expect(await usdc.balanceOf(offerer.address)).to.be.equal(startAmount);
  });
});

describe("Leveraged Bid - Negative tests", () => {
  const nftId = 0;
  let startAmount: BigNumber;
  let endAmount: BigNumber;
  let payLaterAmount: BigNumber;
  let testEnv: TestEnv;
  const {COLLATERAL_CANNOT_COVER_NEW_BORROW} = ProtocolErrors;

  before(async () => {
    testEnv = await loadFixture(testEnvFixture);
    const {
      bayc,
      dai,
      conduit,
      pool,
      users: [maker, taker, middleman],
    } = testEnv;
    const makerInitialBalance = "800";
    const payNowAmount = await convertToCurrencyDecimals(
      dai.address,
      makerInitialBalance
    );
    const middlemanInitialBalance = "1200";
    payLaterAmount = await convertToCurrencyDecimals(dai.address, "200");
    startAmount = payNowAmount.add(payLaterAmount);
    endAmount = startAmount; // fixed price but taker cannot afford this

    // mint DAI to middleman
    await mintAndValidate(dai, middlemanInitialBalance, middleman);
    // mint DAI to maker
    await mintAndValidate(dai, makerInitialBalance, maker);

    // middleman supplies DAI to the pool
    await supplyAndValidate(dai, middlemanInitialBalance, middleman);

    // mint BAYC to taker
    await mintAndValidate(bayc, "1", taker);

    // approve
    await waitForTx(
      await bayc.connect(taker.signer).approve(conduit.address, nftId)
    );
    await waitForTx(
      await dai.connect(maker.signer).approve(pool.address, payNowAmount)
    );
  });

  let snapShot: string;
  beforeEach(async () => {
    snapShot = await evmSnapshot();
  });

  afterEach(async () => {
    await evmRevert(snapShot);
  });

  it("Cannot purchase nToken in collateral covering an ongoing borrow position", async () => {
    const {
      nBAYC,
      dai,
      bayc,
      conduit,
      users: [maker, taker],
    } = testEnv;

    // taker supplies BAYC
    await supplyAndValidate(bayc, "1", taker);

    // approve
    await waitForTx(
      await nBAYC.connect(taker.signer).approve(conduit.address, nftId)
    );

    // taker borrows DAI
    await borrowAndValidate(dai, "800", taker);

    await expect(
      executeAcceptBidWithCredit(
        nBAYC, // using nToken
        dai,
        startAmount,
        endAmount,
        payLaterAmount,
        nftId,
        maker,
        taker
      )
    ).to.be.revertedWith(
      ProtocolErrors.HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD
    );
  });

  it("Accept bid with credit is not possible without enough liquidity in the pool", async () => {
    const {
      bayc,
      dai,
      pool,
      mayc,
      users: [maker, taker],
    } = testEnv;

    // maker supplies MAYC and borrows 1100 DAI, so 100 are left in protocol liquidity
    await supplyAndValidate(mayc, "1", maker, true);
    await borrowAndValidate(dai, "1100", maker);

    await waitForTx(
      await dai.connect(maker.signer).approve(pool.address, startAmount)
    );

    // then taker tries to pay later another 200 DAI
    await expect(
      executeAcceptBidWithCredit(
        bayc,
        dai,
        startAmount,
        endAmount,
        payLaterAmount,
        nftId,
        maker,
        taker
      )
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });

  it("Cannot purchase a non-matching NFT id", async () => {
    const {
      bayc,
      dai,
      users: [maker, taker],
    } = testEnv;

    await expect(
      executeAcceptBidWithCredit(
        bayc,
        dai,
        startAmount,
        endAmount,
        payLaterAmount,
        1, // nft id 1 is not listed
        maker,
        taker
      )
    ).to.be.revertedWith("ERC721: owner query for nonexistent token");
  });

  it("Cannot perform same purchase twice", async () => {
    const {
      bayc,
      dai,
      users: [maker, taker],
    } = testEnv;

    await executeAcceptBidWithCredit(
      bayc,
      dai,
      startAmount,
      endAmount,
      payLaterAmount,
      nftId,
      maker,
      taker
    );
    // try same purchase again, should revert
    await expect(
      executeAcceptBidWithCredit(
        bayc,
        dai,
        startAmount,
        endAmount,
        payLaterAmount,
        nftId,
        maker,
        taker
      )
    ).to.be.revertedWith(
      "ERC721: approve caller is not owner nor approved for all"
    );
  });

  it("Cannot proceed with purchase using a unsupported currency", async () => {
    const {
      bayc,
      pDai,
      users: [maker, taker],
    } = testEnv;

    await expect(
      executeAcceptBidWithCredit(
        bayc,
        pDai as unknown as MintableERC20, // using aDai contract as payment currency
        startAmount,
        endAmount,
        payLaterAmount,
        nftId,
        maker,
        taker
      )
    ).to.be.revertedWith(ProtocolErrors.ASSET_NOT_LISTED);
  });

  it("Cannot pay later an amount above the NFT's LTV", async () => {
    const {
      bayc,
      dai,
      users: [maker, taker],
      paraspaceOracle,
      protocolDataProvider,
    } = testEnv;
    const [deployer] = await getEthersSigners();

    // drop NFT price enough so that the NFT cannot cover a paylater of 200 DAI
    await changePriceAndValidate(bayc, "0.5");

    const nftPrice = await paraspaceOracle
      .connect(deployer)
      .getAssetPrice(bayc.address);
    const ltvRatio = (
      await protocolDataProvider.getReserveConfigurationData(bayc.address)
    ).ltv;
    const availableToBorrowInBaseUnits = nftPrice.mul(ltvRatio).div(10000);
    const daiPrice = await paraspaceOracle
      .connect(deployer)
      .getAssetPrice(dai.address);
    // this is how much DAI I can borrow by putting this NFT in collateral
    const availableToBorrowInDai =
      +formatEther(availableToBorrowInBaseUnits.toString()) /
      +formatEther(daiPrice.toString());

    // buyer cannot get the needed credit
    expect(Math.floor(availableToBorrowInDai)).to.be.lt(payLaterAmount);

    await expect(
      executeAcceptBidWithCredit(
        bayc,
        dai,
        startAmount,
        endAmount,
        payLaterAmount,
        nftId,
        maker,
        taker
      )
    ).to.be.revertedWith(COLLATERAL_CANNOT_COVER_NEW_BORROW);
  });

  it("Cannot purchase the NFT if the order price is greater than taker's balance + pay later amount", async () => {
    const {
      bayc,
      dai,
      users: [maker, taker],
    } = testEnv;
    // credit amount not enough to reach purchase price
    payLaterAmount = await convertToCurrencyDecimals(dai.address, "50");
    await expect(
      executeAcceptBidWithCredit(
        bayc,
        dai,
        startAmount,
        endAmount,
        payLaterAmount,
        nftId,
        maker,
        taker
      )
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });
});
