import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {deployDefaultTimeLockStrategy} from "../helpers/contracts-deployments";
import {
  getPoolConfiguratorProxy,
  getTimeLockProxy,
} from "../helpers/contracts-getters";
import {convertToCurrencyDecimals} from "../helpers/contracts-helpers";
import {advanceTimeAndBlock, waitForTx} from "../helpers/misc-utils";
import {testEnvFixture} from "./helpers/setup-env";
import {supplyAndValidate} from "./helpers/validated-steps";

describe("TimeLock functionality tests", () => {
  const minTime = 5;
  const midTime = 300;
  const maxTime = 3600;
  let timeLockProxy;

  const fixture = async () => {
    const testEnv = await loadFixture(testEnvFixture);
    const {
      dai,
      usdc,
      users: [user1, user2],
      poolAdmin,
    } = testEnv;

    // User 1 - Deposit dai
    await supplyAndValidate(dai, "20000000", user1, true);
    // User 2 - Deposit usdc
    await supplyAndValidate(usdc, "200000", user2, true);
    const minThreshold = await convertToCurrencyDecimals(usdc.address, "1000");
    const midThreshold = await convertToCurrencyDecimals(usdc.address, "2000");

    const defaultStrategy = await deployDefaultTimeLockStrategy(
      minThreshold.toString(),
      midThreshold.toString(),
      minTime.toString(),
      midTime.toString(),
      maxTime.toString(),
      midThreshold.mul(10).toString(),
      (12 * 3600).toString(),
      (24 * 3600).toString()
    );

    const poolConfigurator = await getPoolConfiguratorProxy();
    await waitForTx(
      await poolConfigurator
        .connect(poolAdmin.signer)
        .setReserveTimeLockStrategyAddress(
          usdc.address,
          defaultStrategy.address
        )
    );

    return testEnv;
  };

  before(async () => {
    await loadFixture(testEnvFixture);

    timeLockProxy = await getTimeLockProxy();
  });

  it("borrowed amount below minThreshold should be time locked for 1 block only", async () => {
    const {
      pool,
      users: [user1],
      usdc,
    } = await loadFixture(fixture);

    const amount = await convertToCurrencyDecimals(usdc.address, "100");
    //FIXME(alan): may we have a error code for this.

    await waitForTx(
      await pool
        .connect(user1.signer)
        .borrow(usdc.address, amount, "0", user1.address, {
          gasLimit: 5000000,
        })
    );

    await expect(await usdc.balanceOf(pool.TIME_LOCK())).to.be.eq(amount);

    const balanceBefore = await usdc.balanceOf(user1.address);

    await advanceTimeAndBlock(10);

    await waitForTx(await timeLockProxy.connect(user1.signer).claim("0"));

    const balanceAfter = await usdc.balanceOf(user1.address);

    await expect(balanceAfter).to.be.eq(balanceBefore.add(amount));
  });

  it("borrowed amount below above min and below mid thresholds should be time locked for 300 seconds", async () => {
    const {
      pool,
      users: [user1],
      usdc,
    } = await loadFixture(fixture);

    const amount = await convertToCurrencyDecimals(usdc.address, "1200");
    //FIXME(alan): may we have a error code for this.

    await waitForTx(
      await pool
        .connect(user1.signer)
        .borrow(usdc.address, amount, "0", user1.address, {
          gasLimit: 5000000,
        })
    );

    await expect(await usdc.balanceOf(pool.TIME_LOCK())).to.be.eq(amount);

    const balanceBefore = await usdc.balanceOf(user1.address);

    await advanceTimeAndBlock(10);

    await expect(timeLockProxy.connect(user1.signer).claim("0")).to.be.reverted;

    await advanceTimeAndBlock(300);

    await waitForTx(await timeLockProxy.connect(user1.signer).claim("0"));
    const balanceAfter = await usdc.balanceOf(user1.address);

    await expect(balanceAfter).to.be.eq(balanceBefore.add(amount));
  });

  it("borrowed amount below above max thresholds should be time locked for 3600 seconds", async () => {
    const {
      pool,
      users: [user1],
      usdc,
    } = await loadFixture(fixture);

    const amount = await convertToCurrencyDecimals(usdc.address, "2200");
    //FIXME(alan): may we have a error code for this.

    await waitForTx(
      await pool
        .connect(user1.signer)
        .borrow(usdc.address, amount, "0", user1.address, {
          gasLimit: 5000000,
        })
    );

    await expect(await usdc.balanceOf(pool.TIME_LOCK())).to.be.eq(amount);

    const balanceBefore = await usdc.balanceOf(user1.address);

    await advanceTimeAndBlock(300);

    await expect(timeLockProxy.connect(user1.signer).claim("0")).to.be.reverted;

    await advanceTimeAndBlock(3400);

    await waitForTx(await timeLockProxy.connect(user1.signer).claim("0"));
    const balanceAfter = await usdc.balanceOf(user1.address);

    await expect(balanceAfter).to.be.eq(balanceBefore.add(amount));
  });
});