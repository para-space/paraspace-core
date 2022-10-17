import {expect} from "chai";
import {utils} from "ethers";
import {ProtocolErrors} from "../deploy/helpers/types";
import {MAX_UINT_AMOUNT} from "../deploy/helpers/constants";
import {convertToCurrencyDecimals} from "../deploy/helpers/contracts-helpers";
// import {MockFlashLoanReceiver} from "../types";
// import {getMockFlashLoanReceiver} from "../helpers/contracts-getters";
import {TestEnv} from "./helpers/make-suite";
import "./helpers/utils/wadraymath";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {testEnvFixture} from "./helpers/setup-env";

describe("PausableReserve", () => {
  let testEnv: TestEnv;
  const {RESERVE_PAUSED} = ProtocolErrors;
  const INVALID_TO_BALANCE_AFTER_TRANSFER =
    "Invalid 'TO' balance after transfer!";
  const INVALID_FROM_BALANCE_AFTER_TRANSFER =
    "Invalid 'FROMO' balance after transfer!";

  before(async () => {
    testEnv = await loadFixture(testEnvFixture);
  });

  it("User 0 supplies 1000 DAI. Configurator pauses pool. Transfers to user 1 reverts. Configurator unpauses the network and next transfer succeeds", async () => {
    const {users, pool, dai, pDai, configurator, emergencyAdmin} = testEnv;
    const amountDAItoDeposit = await convertToCurrencyDecimals(
      dai.address,
      "1000"
    );
    await dai.connect(users[0].signer)["mint(uint256)"](amountDAItoDeposit);
    // user 0 supplys 1000 DAI
    await dai.connect(users[0].signer).approve(pool.address, MAX_UINT_AMOUNT);
    await pool
      .connect(users[0].signer)
      .supply(dai.address, amountDAItoDeposit, users[0].address, "0");
    const user0Balance = await pDai.balanceOf(users[0].address);
    const user1Balance = await pDai.balanceOf(users[1].address);
    // Configurator pauses the pool
    await configurator
      .connect(emergencyAdmin.signer)
      .setReservePause(dai.address, true);
    // User 0 tries the transfer to User 1
    await expect(
      pDai
        .connect(users[0].signer)
        .transfer(users[1].address, amountDAItoDeposit)
    ).to.revertedWith(RESERVE_PAUSED);
    const pausedFromBalance = await pDai.balanceOf(users[0].address);
    const pausedToBalance = await pDai.balanceOf(users[1].address);
    expect(pausedFromBalance).to.be.equal(
      user0Balance.toString(),
      INVALID_TO_BALANCE_AFTER_TRANSFER
    );
    expect(pausedToBalance.toString()).to.be.equal(
      user1Balance.toString(),
      INVALID_FROM_BALANCE_AFTER_TRANSFER
    );
    // Configurator unpauses the pool
    await configurator
      .connect(emergencyAdmin.signer)
      .setReservePause(dai.address, false);
    // User 0 succeeds transfer to User 1
    expect(
      await pDai
        .connect(users[0].signer)
        .transfer(users[1].address, amountDAItoDeposit)
    );
    const fromBalance = await pDai.balanceOf(users[0].address);
    const toBalance = await pDai.balanceOf(users[1].address);
    expect(fromBalance.toString()).to.be.equal(
      user0Balance.sub(amountDAItoDeposit),
      INVALID_FROM_BALANCE_AFTER_TRANSFER
    );
    expect(toBalance.toString()).to.be.equal(
      user1Balance.add(amountDAItoDeposit),
      INVALID_TO_BALANCE_AFTER_TRANSFER
    );
  });

  it("Deposit", async () => {
    const {users, pool, dai, configurator, emergencyAdmin} = testEnv;
    const amountDAItoDeposit = await convertToCurrencyDecimals(
      dai.address,
      "1000"
    );
    await dai.connect(users[0].signer)["mint(uint256)"](amountDAItoDeposit);
    // user 0 supplys 1000 DAI
    await dai.connect(users[0].signer).approve(pool.address, MAX_UINT_AMOUNT);
    // Configurator pauses the pool
    await configurator
      .connect(emergencyAdmin.signer)
      .setReservePause(dai.address, true);
    await expect(
      pool
        .connect(users[0].signer)
        .supply(dai.address, amountDAItoDeposit, users[0].address, "0")
    ).to.revertedWith(RESERVE_PAUSED);
    // Configurator unpauses the pool
    await configurator
      .connect(emergencyAdmin.signer)
      .setReservePause(dai.address, false);
  });

  it("Withdraw", async () => {
    const {users, pool, dai, configurator, emergencyAdmin} = testEnv;
    const amountDAItoDeposit = await convertToCurrencyDecimals(
      dai.address,
      "1000"
    );
    await dai.connect(users[0].signer)["mint(uint256)"](amountDAItoDeposit);
    // user 0 supplys 1000 DAI
    await dai.connect(users[0].signer).approve(pool.address, MAX_UINT_AMOUNT);
    await pool
      .connect(users[0].signer)
      .supply(dai.address, amountDAItoDeposit, users[0].address, "0");
    // Configurator pauses the pool
    await configurator
      .connect(emergencyAdmin.signer)
      .setReservePause(dai.address, true);
    // user tries to burn
    await expect(
      pool
        .connect(users[0].signer)
        .withdraw(dai.address, amountDAItoDeposit, users[0].address)
    ).to.revertedWith(RESERVE_PAUSED);
    // Configurator unpauses the pool
    await configurator
      .connect(emergencyAdmin.signer)
      .setReservePause(dai.address, false);
  });

  it("Borrow", async () => {
    const {pool, dai, configurator, emergencyAdmin} = testEnv;
    const user = emergencyAdmin;
    // Pause the pool
    await configurator
      .connect(emergencyAdmin.signer)
      .setReservePause(dai.address, true);
    // Try to execute liquidation
    await expect(
      pool.connect(user.signer).borrow(dai.address, "1", "0", user.address)
    ).to.be.revertedWith(RESERVE_PAUSED);
    // Unpause the pool
    await configurator
      .connect(emergencyAdmin.signer)
      .setReservePause(dai.address, false);
  });

  it("Repay", async () => {
    const {pool, dai, configurator, emergencyAdmin} = testEnv;
    const user = emergencyAdmin;
    // Pause the pool
    await configurator
      .connect(emergencyAdmin.signer)
      .setReservePause(dai.address, true);
    // Try to execute liquidation
    await expect(
      pool.connect(user.signer).repay(dai.address, "1", user.address)
    ).to.be.revertedWith(RESERVE_PAUSED);
    // Unpause the pool
    await configurator
      .connect(emergencyAdmin.signer)
      .setReservePause(dai.address, false);
  });

  // it("Flash loan", async () => {
  //   const { dai, pool, weth, users, configurator } = testEnv;
  //   const caller = users[3];
  //   const flashAmount = utils.parseEther("0.8");
  //   await _mockFlashLoanReceiver.setFailExecutionTransfer(true);
  //   // Pause pool
  //   await configurator
  //     .connect(emergencyAdmin.signer)
  //     .setReservePause(weth.address, true);
  //   await expect(
  //     pool
  //       .connect(caller.signer)
  //       .flashLoan(
  //         _mockFlashLoanReceiver.address,
  //         [weth.address],
  //         [flashAmount],
  //         [1],
  //         caller.address,
  //         "0x10",
  //         "0"
  //       )
  //   ).to.be.revertedWith(RESERVE_PAUSED);
  //   // Unpause pool
  //   await configurator
  //     .connect(emergencyAdmin.signer)
  //     .setReservePause(weth.address, false);
  // });

  it("Liquidation call", async () => {
    const {
      users,
      pool,
      usdc,
      oracle,
      weth,
      configurator,
      protocolDataProvider,
      emergencyAdmin,
    } = testEnv;
    const supplyor = users[3];
    const borrower = users[4];
    //mints USDC to supplyor
    await usdc
      .connect(supplyor.signer)
      ["mint(uint256)"](await convertToCurrencyDecimals(usdc.address, "1000"));
    //approve protocol to access supplyor wallet
    await usdc.connect(supplyor.signer).approve(pool.address, MAX_UINT_AMOUNT);
    //user 3 supplys 1000 USDC
    const amountUSDCtoDeposit = await convertToCurrencyDecimals(
      usdc.address,
      "1000"
    );
    await pool
      .connect(supplyor.signer)
      .supply(usdc.address, amountUSDCtoDeposit, supplyor.address, "0");
    //user 4 supplys ETH
    const amountETHtoDeposit = await convertToCurrencyDecimals(
      weth.address,
      "0.06775"
    );
    //mints WETH to borrower
    await weth.connect(borrower.signer)["mint(uint256)"](amountETHtoDeposit);
    //approve protocol to access borrower wallet
    await weth.connect(borrower.signer).approve(pool.address, MAX_UINT_AMOUNT);
    await pool
      .connect(borrower.signer)
      .supply(weth.address, amountETHtoDeposit, borrower.address, "0");
    //user 4 borrows
    const userGlobalData = await pool.getUserAccountData(borrower.address);
    const usdcPrice = await oracle.getAssetPrice(usdc.address);
    const amountUSDCToBorrow = await convertToCurrencyDecimals(
      usdc.address,
      userGlobalData.availableBorrowsBase
        .div(usdcPrice)
        .percentMul(9502)
        .toString()
    );
    await pool
      .connect(borrower.signer)
      .borrow(usdc.address, amountUSDCToBorrow, "0", borrower.address);
    // Drops HF below 1
    await oracle.setAssetPrice(usdc.address, usdcPrice.percentMul(12000));
    //mints dai to the liquidator
    await usdc["mint(uint256)"](
      await convertToCurrencyDecimals(usdc.address, "1000")
    );
    await usdc.approve(pool.address, MAX_UINT_AMOUNT);
    const userReserveDataBefore = await protocolDataProvider.getUserReserveData(
      usdc.address,
      borrower.address
    );
    const amountToLiquidate = userReserveDataBefore.currentVariableDebt.div(2);
    // Pause pool
    await configurator
      .connect(emergencyAdmin.signer)
      .setReservePause(usdc.address, true);
    // Do liquidation
    await expect(
      pool.liquidationCall(
        weth.address,
        usdc.address,
        borrower.address,
        amountToLiquidate,
        true
      )
    ).to.be.revertedWith(RESERVE_PAUSED);
    // Unpause pool
    await configurator
      .connect(emergencyAdmin.signer)
      .setReservePause(usdc.address, false);
  });

  it("setUserUseERC20AsCollateral", async () => {
    const {pool, weth, configurator, emergencyAdmin} = testEnv;
    const user = emergencyAdmin;
    const amountWETHToDeposit = utils.parseEther("1");
    await weth.connect(user.signer)["mint(uint256)"](amountWETHToDeposit);
    await weth.connect(user.signer).approve(pool.address, MAX_UINT_AMOUNT);
    await pool
      .connect(user.signer)
      .supply(weth.address, amountWETHToDeposit, user.address, "0");
    // Pause pool
    await configurator
      .connect(emergencyAdmin.signer)
      .setReservePause(weth.address, true);
    await expect(
      pool.connect(user.signer).setUserUseERC20AsCollateral(weth.address, false)
    ).to.be.revertedWith(RESERVE_PAUSED);
    // Unpause pool
    await configurator
      .connect(emergencyAdmin.signer)
      .setReservePause(weth.address, false);
  });
});
