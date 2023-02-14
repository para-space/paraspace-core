import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {AutoYieldApe, PToken, PYieldToken} from "../types";
import {TestEnv} from "./helpers/make-suite";
import {testEnvFixture} from "./helpers/setup-env";
import {
  changePriceAndValidate,
  mintAndValidate,
  supplyAndValidate,
} from "./helpers/validated-steps";
import {parseEther} from "ethers/lib/utils";
import {
  approveTo,
  createNewPool,
  fund,
  mintNewPosition,
} from "./helpers/uniswapv3-helper";
import {
  getAutoYieldApe,
  getParaSpaceOracle,
  getPToken,
  getPYieldToken,
} from "../helpers/contracts-getters";
import {MAX_UINT_AMOUNT} from "../helpers/constants";
import {advanceTimeAndBlock, waitForTx} from "../helpers/misc-utils";
import {convertToCurrencyDecimals} from "../helpers/contracts-helpers";
import {encodeSqrtRatioX96} from "@uniswap/v3-sdk";
import {BigNumber, BigNumberish} from "ethers";
import {deployAggregator} from "../helpers/contracts-deployments";

function almostEqual(value0: BigNumberish, value1: BigNumberish) {
  const maxDiff = BigNumber.from(value0.toString()).mul(4).div("1000").abs();
  const abs = BigNumber.from(value0.toString()).sub(value1.toString()).abs();
  if (!abs.lte(maxDiff)) {
    console.log("---------value0=" + value0 + ", --------value1=" + value1);
  }
  expect(abs.lte(maxDiff)).to.be.equal(true);
}

const MAX_SQRT_RATIO = BigNumber.from(
  "1461446703485210103287273052203988822378723970342"
);

describe("Auto Yield Ape Test", () => {
  let testEnv: TestEnv;
  let yApe: AutoYieldApe;
  let yApePToken: PYieldToken;
  let yUSDC: PToken;

  const fixture = async () => {
    testEnv = await loadFixture(testEnvFixture);
    const {
      ape,
      users: [user1, user2, user3, , , , user7],
      apeCoinStaking,
      pool,
      protocolDataProvider,
      usdc,
      nftPositionManager,
      poolAdmin,
      gatewayAdmin,
    } = testEnv;

    yApe = await getAutoYieldApe();

    const {xTokenAddress: pyApeAddress} =
      await protocolDataProvider.getReserveTokensAddresses(yApe.address);
    yApePToken = await getPYieldToken(pyApeAddress);
    const {xTokenAddress: pUSDCAddress} =
      await protocolDataProvider.getReserveTokensAddresses(usdc.address);
    yUSDC = await getPToken(pUSDCAddress);

    await waitForTx(
      await ape.connect(user1.signer).approve(yApe.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await ape.connect(user2.signer).approve(yApe.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await ape.connect(user3.signer).approve(yApe.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await yApe.connect(user1.signer).approve(pool.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await yApe.connect(user2.signer).approve(pool.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await yApe.connect(user3.signer).approve(pool.address, MAX_UINT_AMOUNT)
    );

    await waitForTx(
      await yApe.connect(gatewayAdmin.signer).setHarvestOperator(user3.address)
    );

    // send extra tokens to the apestaking contract for rewards
    await waitForTx(
      await ape
        .connect(user1.signer)
        ["mint(address,uint256)"](
          apeCoinStaking.address,
          parseEther("100000000000")
        )
    );

    //yApe Oracle
    const yApeOracle = await deployAggregator(
      "yAPE",
      parseEther("0.01").toString(),
      false
    );
    const ParaSpaceOracle = await getParaSpaceOracle();
    await waitForTx(
      await ParaSpaceOracle.connect(poolAdmin.signer).setAssetSources(
        [yApe.address],
        [yApeOracle.address]
      )
    );

    ////////////////////////////////////////////////////////////////////////////////
    // Uniswap
    ////////////////////////////////////////////////////////////////////////////////
    const userApeAmount = await convertToCurrencyDecimals(
      ape.address,
      "10000000000"
    );
    const userUsdcAmount = await convertToCurrencyDecimals(
      usdc.address,
      "10000000000"
    );
    await fund({token: ape, user: user7, amount: userApeAmount});
    await fund({token: usdc, user: user7, amount: userUsdcAmount});
    const nft = nftPositionManager.connect(user7.signer);
    await approveTo({
      target: nftPositionManager.address,
      token: ape,
      user: user7,
    });
    await approveTo({
      target: nftPositionManager.address,
      token: usdc,
      user: user7,
    });
    const fee = 3000;
    const tickSpacing = fee / 50;
    const initialPrice = encodeSqrtRatioX96(1000000000000000000, 1000000);
    const lowerPrice = encodeSqrtRatioX96(100000000000000000, 1000000);
    const upperPrice = encodeSqrtRatioX96(10000000000000000000, 1000000);
    await createNewPool({
      positionManager: nft,
      token0: usdc,
      token1: ape,
      fee: fee,
      initialSqrtPrice: initialPrice.toString(),
    });
    await mintNewPosition({
      nft: nft,
      token0: usdc,
      token1: ape,
      fee: fee,
      user: user7,
      tickSpacing: tickSpacing,
      lowerPrice,
      upperPrice,
      token0Amount: userUsdcAmount,
      token1Amount: userApeAmount,
    });

    return testEnv;
  };

  it("yApe yield reward calculation as expected", async () => {
    const {
      users: [user1, user2, user3],
      ape,
      usdc,
      apeCoinStaking,
    } = await loadFixture(fixture);

    await mintAndValidate(ape, "200", user1);
    await mintAndValidate(ape, "200", user2);

    await waitForTx(
      await yApe.connect(user1.signer).deposit(user1.address, parseEther("200"))
    );

    await waitForTx(
      await yApe.connect(user2.signer).deposit(user2.address, parseEther("200"))
    );
    expect(
      await yApe.connect(user1.signer).balanceOf(user1.address)
    ).to.be.equal(parseEther("200"));
    expect(
      await yApe.connect(user1.signer).balanceOf(user2.address)
    ).to.be.equal(parseEther("200"));
    expect(
      (await apeCoinStaking.addressPosition(yApe.address)).stakedAmount
    ).to.be.equal(parseEther("400"));

    await advanceTimeAndBlock(3600);
    await waitForTx(
      await yApe.connect(user3.signer).harvest(MAX_SQRT_RATIO.sub(1))
    );

    await waitForTx(await yApe.connect(user1.signer).claim());
    await waitForTx(await yApe.connect(user2.signer).claim());
    almostEqual(
      await yUSDC.balanceOf(user1.address),
      await convertToCurrencyDecimals(usdc.address, "1800")
    );
    almostEqual(
      await yUSDC.balanceOf(user2.address),
      await convertToCurrencyDecimals(usdc.address, "1800")
    );

    await waitForTx(
      await yApe
        .connect(user1.signer)
        .transfer(user3.address, parseEther("100"))
    );

    await advanceTimeAndBlock(3600);
    await waitForTx(
      await yApe.connect(user3.signer).harvest(MAX_SQRT_RATIO.sub(1))
    );

    await waitForTx(await yApe.connect(user1.signer).claim());
    await waitForTx(await yApe.connect(user2.signer).claim());
    await waitForTx(await yApe.connect(user3.signer).claim());
    almostEqual(
      await yUSDC.balanceOf(user1.address),
      await convertToCurrencyDecimals(usdc.address, "2700")
    );
    almostEqual(
      await yUSDC.balanceOf(user2.address),
      await convertToCurrencyDecimals(usdc.address, "3600")
    );
    almostEqual(
      await yUSDC.balanceOf(user3.address),
      await convertToCurrencyDecimals(usdc.address, "900")
    );

    await waitForTx(
      await yApe
        .connect(user2.signer)
        .transfer(user3.address, parseEther("100"))
    );

    await advanceTimeAndBlock(3600);
    await waitForTx(
      await yApe.connect(user3.signer).harvest(MAX_SQRT_RATIO.sub(1))
    );

    await waitForTx(await yApe.connect(user1.signer).claim());
    await waitForTx(await yApe.connect(user2.signer).claim());
    await waitForTx(await yApe.connect(user3.signer).claim());
    almostEqual(
      await yUSDC.balanceOf(user1.address),
      await convertToCurrencyDecimals(usdc.address, "3600")
    );
    almostEqual(
      await yUSDC.balanceOf(user2.address),
      await convertToCurrencyDecimals(usdc.address, "4500")
    );
    almostEqual(
      await yUSDC.balanceOf(user3.address),
      await convertToCurrencyDecimals(usdc.address, "2700")
    );
  });

  it("lending pool support for yApe work as expected", async () => {
    const {
      users: [user1, user2, user3],
      ape,
      usdc,
      pool,
    } = await loadFixture(fixture);

    await mintAndValidate(ape, "200", user1);
    await mintAndValidate(ape, "200", user2);

    await waitForTx(
      await yApe.connect(user1.signer).deposit(user1.address, parseEther("200"))
    );

    await waitForTx(
      await yApe.connect(user2.signer).deposit(user2.address, parseEther("200"))
    );
    await waitForTx(
      await pool
        .connect(user1.signer)
        .supply(yApe.address, parseEther("200"), user1.address, 0)
    );
    await waitForTx(
      await pool
        .connect(user2.signer)
        .supply(yApe.address, parseEther("200"), user2.address, 0)
    );

    await advanceTimeAndBlock(3600);
    await waitForTx(
      await yApe.connect(user3.signer).harvest(MAX_SQRT_RATIO.sub(1))
    );
    await waitForTx(await yApePToken.connect(user1.signer).claimYield());
    await waitForTx(await yApePToken.connect(user2.signer).claimYield());

    almostEqual(
      await yUSDC.balanceOf(user1.address),
      await convertToCurrencyDecimals(usdc.address, "1800")
    );
    almostEqual(
      await yUSDC.balanceOf(user2.address),
      await convertToCurrencyDecimals(usdc.address, "1800")
    );

    await waitForTx(
      await yApePToken
        .connect(user1.signer)
        .transfer(user3.address, parseEther("100"))
    );

    await advanceTimeAndBlock(3600);
    await waitForTx(
      await yApe.connect(user3.signer).harvest(MAX_SQRT_RATIO.sub(1))
    );
    await waitForTx(await yApePToken.connect(user1.signer).claimYield());
    await waitForTx(await yApePToken.connect(user2.signer).claimYield());
    await waitForTx(await yApePToken.connect(user3.signer).claimYield());
    //1800 + 900
    almostEqual(
      await yUSDC.balanceOf(user1.address),
      await convertToCurrencyDecimals(usdc.address, "2700")
    );
    almostEqual(
      await yUSDC.balanceOf(user2.address),
      await convertToCurrencyDecimals(usdc.address, "3600")
    );
    almostEqual(
      await yUSDC.balanceOf(user3.address),
      await convertToCurrencyDecimals(usdc.address, "900")
    );

    await waitForTx(
      await yApePToken
        .connect(user2.signer)
        .transfer(user3.address, parseEther("100"))
    );

    await advanceTimeAndBlock(3600);
    await waitForTx(
      await yApe.connect(user3.signer).harvest(MAX_SQRT_RATIO.sub(1))
    );
    await waitForTx(await yApePToken.connect(user1.signer).claimYield());
    await waitForTx(await yApePToken.connect(user2.signer).claimYield());
    await waitForTx(await yApePToken.connect(user3.signer).claimYield());
    //1800 + 900
    almostEqual(
      await yUSDC.balanceOf(user1.address),
      await convertToCurrencyDecimals(usdc.address, "3600")
    );
    almostEqual(
      await yUSDC.balanceOf(user2.address),
      await convertToCurrencyDecimals(usdc.address, "4500")
    );
    almostEqual(
      await yUSDC.balanceOf(user3.address),
      await convertToCurrencyDecimals(usdc.address, "2700")
    );
  });

  it("yApe can be liquidated as expected", async () => {
    const {
      users: [user1, user2, user3],
      ape,
      usdc,
      weth,
      pool,
    } = await loadFixture(fixture);

    await mintAndValidate(usdc, "20000", user1);
    await usdc.connect(user1.signer).transfer(yApe.address, "20000000000");
    await mintAndValidate(ape, "2000", user1);
    await supplyAndValidate(weth, "100", user2, true);

    await changePriceAndValidate(yApe, "0.01");

    // user1 deposit yApe
    await waitForTx(
      await yApe
        .connect(user1.signer)
        .deposit(user1.address, parseEther("2000"))
    );

    // user1 supply yApe
    await waitForTx(
      await pool
        .connect(user1.signer)
        .supply(yApe.address, parseEther("2000"), user1.address, 0)
    );

    // user1 borrow weth
    await waitForTx(
      await pool
        .connect(user1.signer)
        .borrow(weth.address, parseEther("1"), 0, user1.address)
    );

    await advanceTimeAndBlock(3600);
    await waitForTx(
      await yApe.connect(user3.signer).harvest(MAX_SQRT_RATIO.sub(1))
    );
    almostEqual(
      await yUSDC.balanceOf(yApe.address),
      await convertToCurrencyDecimals(usdc.address, "3600")
    );

    // price change
    await changePriceAndValidate(yApe, "0.00001");

    // user2 liquidate user1
    await mintAndValidate(weth, "2", user2);
    await waitForTx(
      await weth.connect(user2.signer).approve(pool.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await pool
        .connect(user2.signer)
        .liquidateERC20(
          yApe.address,
          weth.address,
          user1.address,
          parseEther("2000"),
          false
        )
    );

    expect(await yApe.balanceOf(user2.address)).to.be.equal(parseEther("2000"));

    await waitForTx(await yApePToken.connect(user1.signer).claimYield());
    almostEqual(
      await yUSDC.balanceOf(user1.address),
      await convertToCurrencyDecimals(usdc.address, "3600")
    );
  });
});
