import {BigNumber, BigNumberish} from "ethers";
import {
  evmRevert,
  evmSnapshot,
  increaseTime,
} from "../deploy/helpers/misc-utils";
import {MAX_UINT_AMOUNT, ZERO_ADDRESS} from "../deploy/helpers/constants";
import {
  PToken__factory,
  MintableERC20,
  MintableERC20__factory,
  // MockFlashLoanReceiver__factory,
  MockReserveInterestRateStrategy,
  MockReserveInterestRateStrategy__factory,
  VariableDebtToken__factory,
  DefaultReserveAuctionStrategy,
} from "../types";
import {
  getFirstSigner,
  getMockAggregator,
  getParaSpaceOracle,
} from "../deploy/helpers/contracts-getters";
import {TestEnv} from "./helpers/make-suite";
import {ConfiguratorInputTypes} from "../types/interfaces/IPoolConfigurator";
import {deployDefaultReserveAuctionStrategy} from "../deploy/helpers/contracts-deployments";
import {auctionStrategyExp} from "../deploy/market-config/auctionStrategies";
import {convertToCurrencyDecimals} from "../deploy/helpers/contracts-helpers";
import {expect} from "chai";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {testEnvFixture} from "./helpers/setup-env";

const SAFECAST_UINT128_OVERFLOW = "SafeCast: value doesn't fit in 128 bits";

describe("Interest Rate and Index Overflow", () => {
  let mockToken: MintableERC20;
  let mockRateStrategy: MockReserveInterestRateStrategy;
  let mockAuctionStrategy: DefaultReserveAuctionStrategy;
  let testEnv: TestEnv;

  let snap: string;

  before(async () => {
    testEnv = await loadFixture(testEnvFixture);
    const {
      pool,
      poolAdmin,
      configurator,
      dai,
      protocolDataProvider,
      addressesProvider,
    } = testEnv;

    mockToken = await new MintableERC20__factory(await getFirstSigner()).deploy(
      "MOCK",
      "MOCK",
      "18"
    );

    const variableDebtTokenImplementation =
      await new VariableDebtToken__factory(await getFirstSigner()).deploy(
        pool.address
      );
    const xTokenImplementation = await new PToken__factory(
      await getFirstSigner()
    ).deploy(pool.address);

    mockRateStrategy = await new MockReserveInterestRateStrategy__factory(
      await getFirstSigner()
    ).deploy(addressesProvider.address, 0, 0, 0, 0);

    mockAuctionStrategy = await await deployDefaultReserveAuctionStrategy([
      auctionStrategyExp.maxPriceMultiplier,
      auctionStrategyExp.minExpPriceMultiplier,
      auctionStrategyExp.minPriceMultiplier,
      auctionStrategyExp.stepLinear,
      auctionStrategyExp.stepExp,
      auctionStrategyExp.tickLength,
    ]);

    // Init the reserve
    const initInputParams: ConfiguratorInputTypes.InitReserveInputStruct[] = [
      {
        xTokenImpl: xTokenImplementation.address,
        variableDebtTokenImpl: variableDebtTokenImplementation.address,
        underlyingAssetDecimals: 18,
        interestRateStrategyAddress: mockRateStrategy.address,
        auctionStrategyAddress: mockAuctionStrategy.address,
        assetType: 0,
        underlyingAsset: mockToken.address,
        treasury: ZERO_ADDRESS,
        incentivesController: ZERO_ADDRESS,
        xTokenName: "PMOCK",
        xTokenSymbol: "PMOCK",
        variableDebtTokenName: "VMOCK",
        variableDebtTokenSymbol: "VMOCK",
        params: "0x10",
      },
    ];

    await configurator.connect(poolAdmin.signer).initReserves(initInputParams);

    // Configuration
    const daiReserveConfigurationData =
      await protocolDataProvider.getReserveConfigurationData(dai.address);

    const maxCap = 68719476735;
    const inputParams: {
      asset: string;
      baseLTV: BigNumberish;
      liquidationThreshold: BigNumberish;
      liquidationBonus: BigNumberish;
      reserveFactor: BigNumberish;
      borrowCap: BigNumberish;
      supplyCap: BigNumberish;
      borrowingEnabled: boolean;
    }[] = [
      {
        asset: mockToken.address,
        baseLTV: daiReserveConfigurationData.ltv,
        liquidationThreshold: daiReserveConfigurationData.liquidationThreshold,
        liquidationBonus: daiReserveConfigurationData.liquidationBonus,
        reserveFactor: daiReserveConfigurationData.reserveFactor,
        borrowCap: maxCap,
        supplyCap: maxCap,
        borrowingEnabled: true,
      },
    ];

    const i = 0;
    await configurator
      .connect(poolAdmin.signer)
      .configureReserveAsCollateral(
        inputParams[i].asset,
        inputParams[i].baseLTV,
        inputParams[i].liquidationThreshold,
        inputParams[i].liquidationBonus
      );
    await configurator
      .connect(poolAdmin.signer)
      .setReserveBorrowing(inputParams[i].asset, true);

    await configurator
      .connect(poolAdmin.signer)
      .setSupplyCap(inputParams[i].asset, inputParams[i].supplyCap);
    await configurator
      .connect(poolAdmin.signer)
      .setReserveFactor(inputParams[i].asset, inputParams[i].reserveFactor);

    await (
      await getParaSpaceOracle()
    ).setAssetSources(
      [mockToken.address],
      [(await getMockAggregator(undefined, "DAI")).address]
    );
  });

  beforeEach(async () => {
    snap = await evmSnapshot();
  });

  afterEach(async () => {
    await evmRevert(snap);
  });

  it("ReserveLogic `updateInterestRates` with nextLiquidityRate > type(uint128).max (revert expected)", async () => {
    const {
      pool,
      users: [user],
    } = testEnv;

    await mockToken
      .connect(user.signer)
      ["mint(uint256)"](
        await convertToCurrencyDecimals(mockToken.address, "10000")
      );
    await mockToken.connect(user.signer).approve(pool.address, MAX_UINT_AMOUNT);

    await mockRateStrategy.setLiquidityRate(MAX_UINT_AMOUNT);

    await expect(
      pool
        .connect(user.signer)
        .supply(
          mockToken.address,
          await convertToCurrencyDecimals(mockToken.address, "1000"),
          user.address,
          0
        )
    ).to.be.revertedWith(SAFECAST_UINT128_OVERFLOW);
  });

  it("ReserveLogic `updateInterestRates` with nextVariableRate > type(uint128).max (revert expected)", async () => {
    const {
      pool,
      users: [user],
    } = testEnv;

    await mockToken
      .connect(user.signer)
      ["mint(uint256)"](
        await convertToCurrencyDecimals(mockToken.address, "10000")
      );
    await mockToken.connect(user.signer).approve(pool.address, MAX_UINT_AMOUNT);

    await mockRateStrategy.setVariableBorrowRate(MAX_UINT_AMOUNT);

    await expect(
      pool
        .connect(user.signer)
        .supply(
          mockToken.address,
          await convertToCurrencyDecimals(mockToken.address, "1000"),
          user.address,
          0
        )
    ).to.be.revertedWith(SAFECAST_UINT128_OVERFLOW);
  });

  it("ReserveLogic `_updateIndexes` with nextLiquidityIndex > type(uint128).max (revert expected)", async () => {
    const {
      pool,
      users: [user],
      dai,
    } = testEnv;

    await dai
      .connect(user.signer)
      ["mint(uint256)"](
        await convertToCurrencyDecimals(mockToken.address, "10000")
      );
    await dai.connect(user.signer).approve(pool.address, MAX_UINT_AMOUNT);
    await pool
      .connect(user.signer)
      .supply(
        dai.address,
        await convertToCurrencyDecimals(mockToken.address, "1000"),
        user.address,
        0
      );

    await mockToken
      .connect(user.signer)
      ["mint(uint256)"](
        await convertToCurrencyDecimals(mockToken.address, "1000")
      );
    await mockToken.connect(user.signer).approve(pool.address, MAX_UINT_AMOUNT);

    await pool
      .connect(user.signer)
      .supply(
        mockToken.address,
        await convertToCurrencyDecimals(mockToken.address, "1000"),
        user.address,
        0
      );
    // Set liquidity rate to max
    await mockRateStrategy.setLiquidityRate(BigNumber.from(2).pow(128).sub(1));

    // Borrow funds
    await pool
      .connect(user.signer)
      .borrow(
        mockToken.address,
        await convertToCurrencyDecimals(mockToken.address, "100"),
        0,
        user.address
      );

    // set borrow rate to max
    await mockRateStrategy.setVariableBorrowRate(
      BigNumber.from(2).pow(128).sub(1)
    );

    // Increase time such that the next liquidity index overflow because of interest
    await increaseTime(60 * 60 * 24 * 500);

    await expect(
      pool
        .connect(user.signer)
        .supply(
          mockToken.address,
          await convertToCurrencyDecimals(mockToken.address, "1000"),
          user.address,
          0
        )
    ).to.be.revertedWith(SAFECAST_UINT128_OVERFLOW);
  });

  it("ReserveLogic `_updateIndexes` with nextVariableBorrowIndex > type(uint128).max (revert expected)", async () => {
    const {
      pool,
      users: [user],
      dai,
    } = testEnv;

    await dai
      .connect(user.signer)
      ["mint(uint256)"](
        await convertToCurrencyDecimals(mockToken.address, "10000")
      );
    await dai.connect(user.signer).approve(pool.address, MAX_UINT_AMOUNT);
    await pool
      .connect(user.signer)
      .supply(
        dai.address,
        await convertToCurrencyDecimals(mockToken.address, "10000"),
        user.address,
        0
      );

    await mockToken
      .connect(user.signer)
      ["mint(uint256)"](
        await convertToCurrencyDecimals(mockToken.address, "10000")
      );
    await mockToken.connect(user.signer).approve(pool.address, MAX_UINT_AMOUNT);

    await pool
      .connect(user.signer)
      .supply(
        mockToken.address,
        await convertToCurrencyDecimals(mockToken.address, "1000"),
        user.address,
        0
      );

    await mockRateStrategy.setLiquidityRate(BigNumber.from(10).pow(27));
    await mockRateStrategy.setVariableBorrowRate(
      BigNumber.from(2).pow(110).sub(1)
    );
    await pool
      .connect(user.signer)
      .borrow(
        mockToken.address,
        await convertToCurrencyDecimals(mockToken.address, "100"),
        0,
        user.address
      );

    await increaseTime(60 * 60 * 24 * 365);

    await expect(
      pool
        .connect(user.signer)
        .supply(
          mockToken.address,
          await convertToCurrencyDecimals(mockToken.address, "1000"),
          user.address,
          0
        )
    ).to.be.revertedWith(SAFECAST_UINT128_OVERFLOW);
  });
});
