import {expect} from "chai";
import {convertToCurrencyDecimals} from "../deploy/helpers/contracts-helpers";
import {ProtocolErrors} from "../deploy/helpers/types";
import {MAX_UINT_AMOUNT} from "../deploy/helpers/constants";
import {TestEnv} from "./helpers/make-suite";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {testEnvFixture} from "./helpers/setup-env";

describe("LTV validation", () => {
  let testEnv: TestEnv;
  const {LTV_VALIDATION_FAILED} = ProtocolErrors;

  before(async () => {
    testEnv = await loadFixture(testEnvFixture);
  });

  it("User 1 deposits 10 Dai, 10 USDC, user 2 deposits 0.071 WETH", async () => {
    const {
      pool,
      dai,
      usdc,
      weth,
      users: [user1, user2],
    } = testEnv;

    const daiAmount = await convertToCurrencyDecimals(dai.address, "10");
    const usdcAmount = await convertToCurrencyDecimals(usdc.address, "10");
    const wethAmount = await convertToCurrencyDecimals(weth.address, "0.071");

    await dai.connect(user1.signer).approve(pool.address, MAX_UINT_AMOUNT);
    await usdc.connect(user1.signer).approve(pool.address, MAX_UINT_AMOUNT);
    await weth.connect(user2.signer).approve(pool.address, MAX_UINT_AMOUNT);

    await dai.connect(user1.signer)["mint(uint256)"](daiAmount);
    await usdc.connect(user1.signer)["mint(uint256)"](usdcAmount);
    await weth.connect(user2.signer)["mint(uint256)"](wethAmount);

    await pool
      .connect(user1.signer)
      .supply(dai.address, daiAmount, user1.address, 0);

    await pool
      .connect(user1.signer)
      .supply(usdc.address, usdcAmount, user1.address, 0);

    await pool
      .connect(user2.signer)
      .supply(weth.address, wethAmount, user2.address, 0);
  });

  it("Sets the LTV of DAI to 0", async () => {
    const {configurator, dai, protocolDataProvider} = testEnv;

    expect(
      await configurator.configureReserveAsCollateral(
        dai.address,
        0,
        8000,
        10500
      )
    )
      .to.emit(configurator, "CollateralConfigurationChanged")
      .withArgs(dai.address, 0, 8000, 10500);

    const ltv = (
      await protocolDataProvider.getReserveConfigurationData(dai.address)
    ).ltv;

    expect(ltv).to.be.equal(0);
  });

  it("Borrows 0.000414 WETH", async () => {
    const {
      pool,
      weth,
      users: [user1],
    } = testEnv;
    const borrowedAmount = await convertToCurrencyDecimals(
      weth.address,
      "0.000414"
    );

    expect(
      await pool
        .connect(user1.signer)
        .borrow(weth.address, borrowedAmount, 0, user1.address)
    );
  });

  it("Tries to withdraw USDC (revert expected)", async () => {
    const {
      pool,
      usdc,
      users: [user1],
    } = testEnv;

    const withdrawnAmount = await convertToCurrencyDecimals(usdc.address, "1");

    await expect(
      pool
        .connect(user1.signer)
        .withdraw(usdc.address, withdrawnAmount, user1.address)
    ).to.be.revertedWith(LTV_VALIDATION_FAILED);
  });

  it("Withdraws DAI", async () => {
    const {
      pool,
      dai,
      pDai,
      users: [user1],
    } = testEnv;

    const pDaiBalanceBefore = await pDai.balanceOf(user1.address);

    const withdrawnAmount = await convertToCurrencyDecimals(dai.address, "1");

    expect(
      await pool
        .connect(user1.signer)
        .withdraw(dai.address, withdrawnAmount, user1.address)
    );

    const pDaiBalanceAfter = await pDai.balanceOf(user1.address);

    expect(pDaiBalanceAfter).to.be.eq(pDaiBalanceBefore.sub(withdrawnAmount));
  });

  it("User 1 deposit dai, DAI ltv drops to 0, then tries borrow", async () => {
    testEnv = await loadFixture(testEnvFixture);
    const {
      pool,
      dai,
      weth,
      users: [user1, user2],
      configurator,
      protocolDataProvider,
    } = testEnv;

    const daiAmount = await convertToCurrencyDecimals(dai.address, "10");
    const wethAmount = await convertToCurrencyDecimals(weth.address, "10");
    const borrowWethAmount = await convertToCurrencyDecimals(weth.address, "5");

    await dai.connect(user1.signer).approve(pool.address, MAX_UINT_AMOUNT);
    await weth.connect(user2.signer).approve(pool.address, MAX_UINT_AMOUNT);

    await dai.connect(user1.signer)["mint(uint256)"](daiAmount);
    await weth.connect(user2.signer)["mint(uint256)"](wethAmount);

    await pool
      .connect(user1.signer)
      .supply(dai.address, daiAmount, user1.address, 0);
    await pool
      .connect(user2.signer)
      .supply(weth.address, wethAmount, user2.address, 0);

    // Set DAI LTV = 0
    expect(
      await configurator.configureReserveAsCollateral(
        dai.address,
        0,
        8000,
        10500
      )
    )
      .to.emit(configurator, "CollateralConfigurationChanged")
      .withArgs(dai.address, 0, 8000, 10500);
    const ltv = (
      await protocolDataProvider.getReserveConfigurationData(dai.address)
    ).ltv;
    expect(ltv).to.be.equal(0);

    // Borrow all the weth because of issue in collateral needed.
    await expect(
      pool
        .connect(user1.signer)
        .borrow(weth.address, borrowWethAmount, 0, user1.address)
    ).to.be.revertedWith(LTV_VALIDATION_FAILED);

    const userData = await pool.getUserAccountData(user1.address);
    // failing here
    // expect(userData.totalCollateralBase).to.be.eq(parseUnits("10", 8));
    expect(userData.totalDebtBase).to.be.eq(0);
  });
});