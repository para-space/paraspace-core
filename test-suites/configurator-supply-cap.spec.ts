import {expect} from "chai";
import {utils} from "ethers";
import {MAX_UINT_AMOUNT, MAX_SUPPLY_CAP} from "../deploy/helpers/constants";
import {convertToCurrencyDecimals} from "../deploy/helpers/contracts-helpers";
import {advanceTimeAndBlock} from "../deploy/helpers/misc-utils";
import {ProtocolErrors} from "../deploy/helpers/types";
import {TestEnv} from "./helpers/make-suite";
import {testEnvFixture} from "./helpers/setup-env";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";

describe("PoolConfigurator: Supply Cap", () => {
  let testEnv: TestEnv;
  const {SUPPLY_CAP_EXCEEDED, INVALID_SUPPLY_CAP} = ProtocolErrors;

  before(async () => {
    testEnv = await loadFixture(testEnvFixture);
    const {weth, pool, dai, usdc} = testEnv;

    const mintedAmount = utils.parseEther("1000000000");
    await dai["mint(uint256)"](mintedAmount);
    await weth["mint(uint256)"](mintedAmount);
    await usdc["mint(uint256)"](mintedAmount);

    await dai.approve(pool.address, MAX_UINT_AMOUNT);
    await weth.approve(pool.address, MAX_UINT_AMOUNT);
    await usdc.approve(pool.address, MAX_UINT_AMOUNT);
  });

  it("Reserves should initially have supply cap disabled (supplyCap = 0)", async () => {
    const {dai, usdc, protocolDataProvider} = testEnv;

    const usdcSupplyCap = (
      await protocolDataProvider.getReserveCaps(usdc.address)
    ).supplyCap;
    const daiSupplyCap = (
      await protocolDataProvider.getReserveCaps(dai.address)
    ).supplyCap;

    expect(usdcSupplyCap).to.be.equal("0");
    expect(daiSupplyCap).to.be.equal("0");
  });

  it("Supply 1000 Dai, 1000 USDC and 1000 WETH", async () => {
    const {weth, pool, dai, usdc, deployer} = testEnv;

    const suppliedAmount = "1000";

    await pool.supply(
      usdc.address,
      await convertToCurrencyDecimals(usdc.address, suppliedAmount),
      deployer.address,
      0
    );

    await pool.supply(
      dai.address,
      await convertToCurrencyDecimals(dai.address, suppliedAmount),
      deployer.address,
      0
    );
    await pool.supply(
      weth.address,
      await convertToCurrencyDecimals(weth.address, suppliedAmount),
      deployer.address,
      0
    );
  });

  it("Sets the supply cap for DAI and USDC to 1000 Unit, leaving 0 Units to reach the limit", async () => {
    const {configurator, dai, usdc, protocolDataProvider} = testEnv;

    const {supplyCap: oldUsdcSupplyCap} =
      await protocolDataProvider.getReserveCaps(usdc.address);
    const {supplyCap: oldDaiSupplyCap} =
      await protocolDataProvider.getReserveCaps(dai.address);

    const newCap = "1000";

    expect(await configurator.setSupplyCap(usdc.address, newCap))
      .to.emit(configurator, "SupplyCapChanged")
      .withArgs(usdc.address, oldUsdcSupplyCap, newCap);
    expect(await configurator.setSupplyCap(dai.address, newCap))
      .to.emit(configurator, "SupplyCapChanged")
      .withArgs(dai.address, oldDaiSupplyCap, newCap);

    const {supplyCap: usdcSupplyCap} =
      await protocolDataProvider.getReserveCaps(usdc.address);
    const {supplyCap: daiSupplyCap} = await protocolDataProvider.getReserveCaps(
      dai.address
    );

    expect(usdcSupplyCap).to.be.equal(newCap);
    expect(daiSupplyCap).to.be.equal(newCap);
  });

  it("Tries to supply any DAI or USDC (> SUPPLY_CAP) (revert expected)", async () => {
    const {usdc, pool, dai, deployer} = testEnv;
    const suppliedAmount = "10";

    await expect(
      pool.supply(usdc.address, suppliedAmount, deployer.address, 0)
    ).to.be.revertedWith(SUPPLY_CAP_EXCEEDED);

    await expect(
      pool.supply(
        dai.address,
        await convertToCurrencyDecimals(dai.address, suppliedAmount),
        deployer.address,
        0
      )
    ).to.be.revertedWith(SUPPLY_CAP_EXCEEDED);
  });

  it("Tries to set the supply cap for USDC and DAI to > MAX_SUPPLY_CAP (revert expected)", async () => {
    const {configurator, usdc, dai} = testEnv;
    const newCap = Number(MAX_SUPPLY_CAP) + 1;

    await expect(
      configurator.setSupplyCap(usdc.address, newCap)
    ).to.be.revertedWith(INVALID_SUPPLY_CAP);
    await expect(
      configurator.setSupplyCap(dai.address, newCap)
    ).to.be.revertedWith(INVALID_SUPPLY_CAP);
  });

  it("Sets the supply cap for usdc and DAI to 1110 Units, leaving 110 Units to reach the limit", async () => {
    const {configurator, usdc, dai, protocolDataProvider} = testEnv;

    const {supplyCap: oldUsdcSupplyCap} =
      await protocolDataProvider.getReserveCaps(usdc.address);
    const {supplyCap: oldDaiSupplyCap} =
      await protocolDataProvider.getReserveCaps(dai.address);

    const newCap = "1110";
    expect(await configurator.setSupplyCap(usdc.address, newCap))
      .to.emit(configurator, "SupplyCapChanged")
      .withArgs(usdc.address, oldUsdcSupplyCap, newCap);
    expect(await configurator.setSupplyCap(dai.address, newCap))
      .to.emit(configurator, "SupplyCapChanged")
      .withArgs(dai.address, oldDaiSupplyCap, newCap);

    const {supplyCap: usdcSupplyCap} =
      await protocolDataProvider.getReserveCaps(usdc.address);
    const {supplyCap: daiSupplyCap} = await protocolDataProvider.getReserveCaps(
      dai.address
    );

    expect(usdcSupplyCap).to.be.equal(newCap);
    expect(daiSupplyCap).to.be.equal(newCap);
  });

  it("Supply 10 DAI and 10 USDC, leaving 100 Units to reach the limit", async () => {
    const {usdc, pool, dai, deployer} = testEnv;

    const suppliedAmount = "10";
    await pool.supply(
      usdc.address,
      await convertToCurrencyDecimals(usdc.address, suppliedAmount),
      deployer.address,
      0
    );

    await pool.supply(
      dai.address,
      await convertToCurrencyDecimals(dai.address, suppliedAmount),
      deployer.address,
      0
    );
  });

  it("Tries to supply 101 DAI and 101 USDC (> SUPPLY_CAP) 1 unit above the limit (revert expected)", async () => {
    const {usdc, pool, dai, deployer} = testEnv;

    const suppliedAmount = "101";

    await expect(
      pool.supply(
        usdc.address,
        await convertToCurrencyDecimals(usdc.address, suppliedAmount),
        deployer.address,
        0
      )
    ).to.be.revertedWith(SUPPLY_CAP_EXCEEDED);

    await expect(
      pool.supply(
        dai.address,
        await convertToCurrencyDecimals(dai.address, suppliedAmount),
        deployer.address,
        0
      )
    ).to.be.revertedWith(SUPPLY_CAP_EXCEEDED);
  });

  it("Supply 99 DAI and 99 USDC (< SUPPLY_CAP), leaving 1 Units to reach the limit", async () => {
    const {usdc, pool, dai, deployer} = testEnv;

    const suppliedAmount = "99";
    await pool.supply(
      usdc.address,
      await convertToCurrencyDecimals(usdc.address, suppliedAmount),
      deployer.address,
      0
    );

    await pool.supply(
      dai.address,
      await convertToCurrencyDecimals(dai.address, suppliedAmount),
      deployer.address,
      0
    );
  });

  it("Supply 1 DAI and 1 USDC (= SUPPLY_CAP), reaching the limit", async () => {
    const {usdc, pool, dai, deployer} = testEnv;

    const suppliedAmount = "1";
    await pool.supply(
      usdc.address,
      await convertToCurrencyDecimals(usdc.address, suppliedAmount),
      deployer.address,
      0
    );

    await pool.supply(
      dai.address,
      await convertToCurrencyDecimals(dai.address, suppliedAmount),
      deployer.address,
      0
    );
  });

  it("Time flies and DAI and USDC supply amount goes above the limit due to accrued interests", async () => {
    const {usdc, dai, protocolDataProvider} = testEnv;

    // Advance blocks
    await advanceTimeAndBlock(3600);

    const daiData = await protocolDataProvider.getReserveData(dai.address);
    const daiCaps = await protocolDataProvider.getReserveCaps(dai.address);
    const usdcData = await protocolDataProvider.getReserveData(usdc.address);
    const usdcCaps = await protocolDataProvider.getReserveCaps(usdc.address);

    expect(daiData.totalPToken).gt(daiCaps.supplyCap);
    expect(usdcData.totalPToken).gt(usdcCaps.supplyCap);
  });

  it("Raises the supply cap for USDC and DAI to 2000 Units, leaving 800 Units to reach the limit", async () => {
    const {configurator, usdc, dai, protocolDataProvider} = testEnv;

    const {supplyCap: oldUsdcSupplyCap} =
      await protocolDataProvider.getReserveCaps(usdc.address);
    const {supplyCap: oldDaiSupplyCap} =
      await protocolDataProvider.getReserveCaps(dai.address);

    const newCap = "2000";
    expect(await configurator.setSupplyCap(usdc.address, newCap))
      .to.emit(configurator, "SupplyCapChanged")
      .withArgs(usdc.address, oldUsdcSupplyCap, newCap);
    expect(await configurator.setSupplyCap(dai.address, newCap))
      .to.emit(configurator, "SupplyCapChanged")
      .withArgs(dai.address, oldDaiSupplyCap, newCap);

    const {supplyCap: usdcSupplyCap} =
      await protocolDataProvider.getReserveCaps(usdc.address);
    const {supplyCap: daiSupplyCap} = await protocolDataProvider.getReserveCaps(
      dai.address
    );

    expect(usdcSupplyCap).to.be.equal(newCap);
    expect(daiSupplyCap).to.be.equal(newCap);
  });

  it("Supply 100 DAI and 100 USDC, leaving 700 Units to reach the limit", async () => {
    const {usdc, pool, dai, deployer} = testEnv;

    const suppliedAmount = "100";
    await pool.supply(
      usdc.address,
      await convertToCurrencyDecimals(usdc.address, suppliedAmount),
      deployer.address,
      0
    );

    await pool.supply(
      dai.address,
      await convertToCurrencyDecimals(dai.address, suppliedAmount),
      deployer.address,
      0
    );
  });

  it("Lowers the supply cap for USDC and DAI to 1200 Units (suppliedAmount > supplyCap)", async () => {
    const {configurator, usdc, dai, protocolDataProvider} = testEnv;

    const {supplyCap: oldUsdcSupplyCap} =
      await protocolDataProvider.getReserveCaps(usdc.address);
    const {supplyCap: oldDaiSupplyCap} =
      await protocolDataProvider.getReserveCaps(dai.address);

    const newCap = "1200";
    expect(await configurator.setSupplyCap(usdc.address, newCap))
      .to.emit(configurator, "SupplyCapChanged")
      .withArgs(usdc.address, oldUsdcSupplyCap, newCap);
    expect(await configurator.setSupplyCap(dai.address, newCap))
      .to.emit(configurator, "SupplyCapChanged")
      .withArgs(dai.address, oldDaiSupplyCap, newCap);

    const {supplyCap: usdcSupplyCap} =
      await protocolDataProvider.getReserveCaps(usdc.address);
    const {supplyCap: daiSupplyCap} = await protocolDataProvider.getReserveCaps(
      dai.address
    );

    expect(usdcSupplyCap).to.be.equal(newCap);
    expect(daiSupplyCap).to.be.equal(newCap);
  });

  it("Tries to supply 100 DAI and 100 USDC (> SUPPLY_CAP) (revert expected)", async () => {
    const {usdc, pool, dai, deployer} = testEnv;

    const suppliedAmount = "100";

    await expect(
      pool.supply(
        usdc.address,
        await convertToCurrencyDecimals(usdc.address, suppliedAmount),
        deployer.address,
        0
      )
    ).to.be.revertedWith(SUPPLY_CAP_EXCEEDED);

    await expect(
      pool.supply(
        dai.address,
        await convertToCurrencyDecimals(dai.address, suppliedAmount),
        deployer.address,
        0
      )
    ).to.be.revertedWith(SUPPLY_CAP_EXCEEDED);
  });

  it("Raises the supply cap for USDC and DAI to MAX_SUPPLY_CAP", async () => {
    const {configurator, usdc, dai, protocolDataProvider} = testEnv;

    const {supplyCap: oldUsdcSupplyCap} =
      await protocolDataProvider.getReserveCaps(usdc.address);
    const {supplyCap: oldDaiSupplyCap} =
      await protocolDataProvider.getReserveCaps(dai.address);

    const newCap = MAX_SUPPLY_CAP;
    expect(await configurator.setSupplyCap(usdc.address, newCap))
      .to.emit(configurator, "SupplyCapChanged")
      .withArgs(usdc.address, oldUsdcSupplyCap, newCap);
    expect(await configurator.setSupplyCap(dai.address, newCap))
      .to.emit(configurator, "SupplyCapChanged")
      .withArgs(dai.address, oldDaiSupplyCap, newCap);

    const {supplyCap: usdcSupplyCap} =
      await protocolDataProvider.getReserveCaps(usdc.address);
    const {supplyCap: daiSupplyCap} = await protocolDataProvider.getReserveCaps(
      dai.address
    );

    expect(usdcSupplyCap).to.be.equal(newCap);
    expect(daiSupplyCap).to.be.equal(newCap);
  });

  it("Supply 100 DAI and 100 USDC", async () => {
    const {usdc, pool, dai, deployer} = testEnv;

    const suppliedAmount = "100";
    await pool.supply(
      usdc.address,
      await convertToCurrencyDecimals(usdc.address, suppliedAmount),
      deployer.address,
      0
    );

    await pool.supply(
      dai.address,
      await convertToCurrencyDecimals(dai.address, suppliedAmount),
      deployer.address,
      0
    );
  });
});