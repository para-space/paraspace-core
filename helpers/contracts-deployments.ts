import {MockContract} from "ethereum-waffle";
import {
  Account,
  AccountFactory,
  AccountRegistry,
  ACLManager,
  AirdropFlashClaimReceiver,
  ApeStakingLogic,
  AStETHDebtToken,
  ATokenDebtToken,
  AuctionLogic,
  AutoCompoundApe,
  AutoYieldApe,
  Azuki,
  BAYCSewerPass,
  BlurAdapter,
  BlurExchange,
  BoredApeYachtClub,
  BorrowLogic,
  CApeDebtToken,
  CLCETHSynchronicityPriceAdapter,
  CLExchangeRateSynchronicityPriceAdapter,
  CLFixedPriceSynchronicityPriceAdapter,
  CloneX,
  CLwstETHSynchronicityPriceAdapter,
  ConduitController,
  ConfiguratorLogic,
  CryptoPunksMarket,
  CurrencyManager,
  DefaultReserveAuctionStrategy,
  DefaultReserveInterestRateStrategy,
  DefaultTimeLockStrategy,
  DelegationAwarePToken,
  DelegateRegistry,
  DepositContract,
  Doodles,
  ERC20OracleWrapper,
  ERC721Delegate,
  ERC721OracleWrapper,
  ExecutionDelegate,
  ExecutionManager,
  ExecutorWithTimelock,
  FlashClaimLogic,
  HelperContract,
  HotWalletProxy,
  InitializableAdminUpgradeabilityProxy,
  InitializableImmutableAdminUpgradeabilityProxy,
  Land,
  LiquidationLogic,
  LooksRareAdapter,
  LooksRareExchange,
  MarketplaceLogic,
  Meebits,
  MerkleVerifier,
  MintableDelegationERC20,
  MintableERC20,
  MintableERC721,
  MintableERC721Logic,
  MockAggregator,
  MockAirdropProject,
  MockAStETH,
  MockAToken,
  MockCToken,
  MockedDelegateRegistry,
  MockFeePool,
  MockIncentivesController,
  MockInitializableFromConstructorImple,
  MockInitializableImple,
  MockInitializableImpleV2,
  MockMultiAssetAirdropProject,
  MockNToken,
  MockPToken,
  MockReentrantInitializableImple,
  MockReserveAuctionStrategy,
  MockReserveConfiguration,
  MockRETH,
  MockVariableDebtToken,
  Moonbirds,
  MutantApeYachtClub,
  NFTFloorOracle,
  NToken,
  NTokenBAKC,
  NTokenBAYC,
  NTokenMAYC,
  NTokenMoonBirds,
  NTokenOtherdeed,
  NTokenStakefish,
  NTokenUniswapV3,
  P2PPairStaking,
  ParaProxyInterfaces,
  ParaProxyInterfaces__factory,
  ParaProxy__factory,
  ParaSpaceAirdrop,
  ParaSpaceOracle,
  PausableZoneController,
  PolicyManager,
  PoolAddressesProvider,
  PoolAddressesProviderRegistry,
  PoolApeStaking,
  PoolApeStaking__factory,
  PoolConfigurator,
  PoolCore,
  PoolCore__factory,
  PoolLogic,
  PoolMarketplace,
  PoolMarketplace__factory,
  PoolParameters,
  PoolParameters__factory,
  PoolPositionMover,
  PoolPositionMover__factory,
  PositionMoverLogic,
  PriceOracle,
  ProtocolDataProvider,
  PToken,
  PTokenAStETH,
  PTokenAToken,
  PTokenCApe,
  PTokenSApe,
  PTokenStETH,
  PTokenStKSM,
  PYieldToken,
  ReservesSetupHelper,
  RoyaltyFeeManager,
  RoyaltyFeeRegistry,
  Seaport,
  SeaportAdapter,
  StakefishNFTManager,
  StakefishValidatorFactory,
  StakefishValidatorV1,
  StandardPolicyERC721,
  StETHDebtToken,
  StETHMocked,
  StKSMDebtToken,
  StrategyStandardSaleForFixedPrice,
  SupplyExtendedLogic,
  SupplyLogic,
  TimeLock,
  TransferManagerERC1155,
  TransferManagerERC721,
  TransferSelectorNFT,
  UiIncentiveDataProvider,
  UiPoolDataProvider,
  UniswapV3Factory,
  UniswapV3OracleWrapper,
  UniswapV3TwapOracleWrapper,
  UserFlashclaimRegistry,
  VariableDebtToken,
  WalletBalanceProvider,
  WETH9Mocked,
  WETHGateway,
  WPunk,
  WPunkGateway,
  WstETHMocked,
  X2Y2Adapter,
  X2Y2R1,
  PoolAAPositionMover__factory,
  PoolBorrowAndStake__factory,
  PoolBorrowAndStake,
  Pandora,
} from "../types";
import {
  getACLManager,
  getAllTokens,
  getAutoCompoundApe,
  getAutoYieldApe,
  getBAYCSewerPass,
  getContractFactory,
  getDelegationRegistry,
  getFirstSigner,
  getHelperContract,
  getInitializableAdminUpgradeabilityProxy,
  getNonfungiblePositionManager,
  getP2PPairStaking,
  getPoolProxy,
  getProtocolDataProvider,
  getPunks,
  getTimeLockProxy,
  getUniswapV3Factory,
  getUniswapV3SwapRouter,
  getWETH,
} from "./contracts-getters";
import {
  convertToCurrencyDecimals,
  getContractAddressInDb,
  getFunctionSignatures,
  getFunctionSignaturesFromDb,
  getParaSpaceAdmins,
  insertContractAddressInDb,
  withSaveAndVerify,
} from "./contracts-helpers";
import {
  DRE,
  getDb,
  getParaSpaceConfig,
  isMainnet,
  waitForTx,
} from "./misc-utils";
import {
  eContractid,
  ERC20TokenContractId,
  ERC721TokenContractId,
  tEthereumAddress,
  tStringTokenSmallUnits,
} from "./types";

import * as nFTDescriptor from "@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json";
import * as nonfungibleTokenPositionDescriptor from "@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json";
import {Contract} from "ethers";
import {Address, Libraries} from "hardhat-deploy/dist/types";

import {parseEther} from "ethers/lib/utils";
import fs from "fs";
import {pick, upperFirst} from "lodash";
import shell from "shelljs";
import {ZERO_ADDRESS} from "./constants";
import {GLOBAL_OVERRIDES, ZK_LIBRARIES_PATH} from "./hardhat-constants";

export const deployAllLibraries = async (verify?: boolean) => {
  const supplyLogic = await deploySupplyLogic(verify);
  const supplyExtendedLogic = await deploySupplyExtendedLogic(verify);
  const borrowLogic = await deployBorrowLogic(verify);
  const auctionLogic = await deployAuctionLogic(verify);
  const flashClaimLogic = await deployFlashClaimLogic(verify);
  const poolLogic = await deployPoolLogic(verify);
  const configuratorLogic = await deployConfiguratorLogic(verify);
  const mintableERC721Logic = await deployMintableERC721Logic(verify);
  const apeStakingLogic = await deployApeStakingLogic(verify);
  const merkleVerifier = await deployMerkleVerifier(verify);

  const libraries = {
    ["contracts/protocol/libraries/logic/AuctionLogic.sol"]: {
      AuctionLogic: auctionLogic.address,
    },
    ["contracts/protocol/libraries/logic/SupplyLogic.sol"]: {
      SupplyLogic: supplyLogic.address,
    },
    ["contracts/protocol/libraries/logic/SupplyExtendedLogic.sol"]: {
      SupplyLogic: supplyExtendedLogic.address,
    },
    ["contracts/protocol/libraries/logic/BorrowLogic.sol"]: {
      BorrowLogic: borrowLogic.address,
    },
    ["contracts/protocol/libraries/logic/FlashClaimLogic.sol"]: {
      FlashClaimLogic: flashClaimLogic.address,
    },
    "contracts/protocol/libraries/logic/PoolLogic.sol": {
      PoolLogic: poolLogic.address,
    },
    "contracts/protocol/tokenization/libraries/ApeStakingLogic.sol": {
      ApeStakingLogic: apeStakingLogic.address,
    },
    "contracts/protocol/tokenization/libraries/MintableERC721Logic.sol": {
      MintableERC721Logic: mintableERC721Logic.address,
    },
    "contracts/protocol/libraries/logic/ConfiguratorLogic.sol": {
      ConfiguratorLogic: configuratorLogic.address,
    },
    "contracts/dependencies/blur-exchange/MerkleVerifier.sol": {
      MerkleVerifier: merkleVerifier.address,
    },
    "contracts/protocol/libraries/logic/LiquidationLogic.sol": {
      LiquidationLogic: ZERO_ADDRESS,
    },
    "contracts/protocol/libraries/logic/PositionMoverLogic.sol": {
      PositionMoverLogic: ZERO_ADDRESS,
    },
    "contracts/protocol/libraries/logic/MarketplaceLogic.sol": {
      MarketplaceLogic: ZERO_ADDRESS,
    },
  };

  fs.writeFileSync(ZK_LIBRARIES_PATH, JSON.stringify(libraries));
  shell.exec("make build");

  const liquidationLogic = await deployLiquidationLogic(
    {
      ["contracts/protocol/libraries/logic/SupplyLogic.sol:SupplyLogic"]:
        supplyLogic.address,
    },
    verify
  );
  const positionMoverLogic = await deployPositionMoverLogic(
    {
      "contracts/protocol/libraries/logic/SupplyLogic.sol:SupplyLogic":
        supplyLogic.address,
      "contracts/protocol/libraries/logic/BorrowLogic.sol:BorrowLogic":
        borrowLogic.address,
    },
    verify
  );
  const marketplaceLogic = await deployMarketplaceLogic(
    {
      "contracts/protocol/libraries/logic/SupplyLogic.sol:SupplyLogic":
        supplyLogic.address,
      "contracts/protocol/libraries/logic/SupplyExtendedLogic.sol:SupplyExtendedLogic":
        supplyExtendedLogic.address,
      "contracts/protocol/libraries/logic/BorrowLogic.sol:BorrowLogic":
        borrowLogic.address,
    },
    verify
  );
  libraries["contracts/protocol/libraries/logic/PositionMoverLogic.sol"] = {
    PositionMoverLogic: positionMoverLogic.address,
  };
  libraries["contracts/protocol/libraries/logic/LiquidationLogic.sol"] = {
    LiquidationLogic: liquidationLogic.address,
  };
  libraries["contracts/protocol/libraries/logic/MarketplaceLogic.sol"] = {
    MarketplaceLogic: marketplaceLogic.address,
  };

  fs.writeFileSync(ZK_LIBRARIES_PATH, JSON.stringify(libraries));
  shell.exec("make build");
};

export const deployPoolAddressesProvider = async (
  marketId: string,
  owner: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("PoolAddressesProvider"),
    eContractid.PoolAddressesProvider,
    [marketId, owner],
    verify
  ) as Promise<PoolAddressesProvider>;

export const deployPoolAddressesProviderRegistry = async (
  owner: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("PoolAddressesProviderRegistry"),
    eContractid.PoolAddressesProviderRegistry,
    [owner],
    verify
  ) as Promise<PoolAddressesProviderRegistry>;

export const deployACLManager = async (
  provider: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("ACLManager"),
    eContractid.ACLManager,
    [provider],
    verify
  ) as Promise<ACLManager>;

export const deployConfiguratorLogic = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("ConfiguratorLogic"),
    eContractid.ConfiguratorLogic,
    [],
    verify
  ) as Promise<ConfiguratorLogic>;

export const deployPoolConfigurator = async (verify?: boolean) => {
  const configuratorLogic = await deployConfiguratorLogic(verify);
  const libraries = {
    ["contracts/protocol/libraries/logic/ConfiguratorLogic.sol:ConfiguratorLogic"]:
      configuratorLogic.address,
  };
  return withSaveAndVerify(
    await getContractFactory("PoolConfigurator", libraries),
    eContractid.PoolConfiguratorImpl,
    [],
    verify,
    false,
    libraries
  ) as Promise<PoolConfigurator>;
};

export const deploySupplyLogic = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("SupplyLogic"),
    eContractid.SupplyLogic,
    [],
    verify
  ) as Promise<SupplyLogic>;

export const deploySupplyExtendedLogic = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("SupplyExtendedLogic"),
    eContractid.SupplyExtendedLogic,
    [],
    verify
  ) as Promise<SupplyExtendedLogic>;

export const deployFlashClaimLogic = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("FlashClaimLogic"),
    eContractid.FlashClaimLogic,
    [],
    verify
  ) as Promise<FlashClaimLogic>;

export const deployBorrowLogic = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("BorrowLogic"),
    eContractid.BorrowLogic,
    [],
    verify
  ) as Promise<BorrowLogic>;

export const deployLiquidationLogic = async (
  libraries: Libraries,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("LiquidationLogic", libraries),
    eContractid.LiquidationLogic,
    [],
    verify,
    false,
    libraries
  ) as Promise<LiquidationLogic>;

export const deployAuctionLogic = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("AuctionLogic"),
    eContractid.AuctionLogic,
    [],
    verify
  ) as Promise<AuctionLogic>;

export const deployPoolLogic = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("PoolLogic"),
    eContractid.PoolLogic,
    [],
    verify
  ) as Promise<PoolLogic>;

export const deployPositionMoverLogic = async (
  libraries: Libraries,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("PositionMoverLogic", libraries),
    eContractid.PositionMoverLogic,
    [],
    verify,
    false,
    libraries
  ) as Promise<PositionMoverLogic>;

export const deployPoolCoreLibraries = async (
  verify?: boolean
): Promise<Libraries> => {
  const supplyLogic = await deploySupplyLogic(verify);
  const supplyExtendedLogic = await deploySupplyExtendedLogic(verify);
  const borrowLogic = await deployBorrowLogic(verify);
  const auctionLogic = await deployAuctionLogic(verify);
  const liquidationLogic = await deployLiquidationLogic(
    {
      ["contracts/protocol/libraries/logic/SupplyLogic.sol:SupplyLogic"]:
        supplyLogic.address,
    },
    verify
  );
  const flashClaimLogic = await deployFlashClaimLogic(verify);

  return {
    ["contracts/protocol/libraries/logic/AuctionLogic.sol:AuctionLogic"]:
      auctionLogic.address,
    ["contracts/protocol/libraries/logic/LiquidationLogic.sol:LiquidationLogic"]:
      liquidationLogic.address,
    ["contracts/protocol/libraries/logic/SupplyLogic.sol:SupplyLogic"]:
      supplyLogic.address,
    ["contracts/protocol/libraries/logic/SupplyExtendedLogic.sol:SupplyExtendedLogic"]:
      supplyExtendedLogic.address,
    ["contracts/protocol/libraries/logic/BorrowLogic.sol:BorrowLogic"]:
      borrowLogic.address,
    ["contracts/protocol/libraries/logic/FlashClaimLogic.sol:FlashClaimLogic"]:
      flashClaimLogic.address,
  };
};

export const deployPoolCore = async (provider: string, verify?: boolean) => {
  const coreLibraries = await deployPoolCoreLibraries(verify);
  const {poolCoreSelectors} = getPoolSignatures();

  const poolCore = (await withSaveAndVerify(
    await getContractFactory("PoolCore", coreLibraries),
    eContractid.PoolCoreImpl,
    [
      provider,
      (await getContractAddressInDb(eContractid.TimeLockProxy)) ||
        (
          await deployTimeLockProxy(verify)
        ).address,
    ],
    verify,
    false,
    coreLibraries,
    poolCoreSelectors
  )) as PoolCore;

  return {
    poolCore,
    poolCoreSelectors: poolCoreSelectors.map((s) => s.signature),
  };
};

export const deployPoolMarketplace = async (
  provider: string,
  verify?: boolean
) => {
  const supplyLogic = await deploySupplyLogic(verify);
  const supplyExtendedLogic = await deploySupplyExtendedLogic(verify);
  const borrowLogic = await deployBorrowLogic(verify);
  const marketplaceLogic = await deployMarketplaceLogic(
    {
      "contracts/protocol/libraries/logic/SupplyLogic.sol:SupplyLogic":
        supplyLogic.address,
      "contracts/protocol/libraries/logic/SupplyExtendedLogic.sol:SupplyExtendedLogic":
        supplyExtendedLogic.address,
      "contracts/protocol/libraries/logic/BorrowLogic.sol:BorrowLogic":
        borrowLogic.address,
    },
    verify
  );
  const marketplaceLibraries = {
    "contracts/protocol/libraries/logic/MarketplaceLogic.sol:MarketplaceLogic":
      marketplaceLogic.address,
  };

  const {poolMarketplaceSelectors} = getPoolSignatures();

  const poolMarketplace = (await withSaveAndVerify(
    await getContractFactory("PoolMarketplace", marketplaceLibraries),
    eContractid.PoolMarketplaceImpl,
    [provider],
    verify,
    false,
    marketplaceLibraries,
    poolMarketplaceSelectors
  )) as PoolCore;

  return {
    poolMarketplace,
    poolMarketplaceSelectors: poolMarketplaceSelectors.map((s) => s.signature),
  };
};

export const deployPoolApeStaking = async (
  provider: string,
  verify?: boolean
) => {
  const supplyLogic = await deploySupplyLogic(verify);
  const borrowLogic = await deployBorrowLogic(verify);

  const apeStakingLibraries = {
    "contracts/protocol/libraries/logic/SupplyLogic.sol:SupplyLogic":
      supplyLogic.address,
    "contracts/protocol/libraries/logic/BorrowLogic.sol:BorrowLogic":
      borrowLogic.address,
  };

  const APE_WETH_FEE = 3000;
  const WETH_USDC_FEE = 500;

  const {poolApeStakingSelectors} = await getPoolSignatures();

  const allTokens = await getAllTokens();

  const config = getParaSpaceConfig();
  const treasuryAddress = config.Treasury;

  const cApe = await getAutoCompoundApe();
  const poolApeStaking = (await withSaveAndVerify(
    await getContractFactory("PoolApeStaking", apeStakingLibraries),
    eContractid.PoolApeStakingImpl,
    [
      provider,
      cApe.address,
      allTokens.APE.address,
      allTokens.USDC.address,
      (await getUniswapV3SwapRouter()).address,
      allTokens.WETH.address,
      APE_WETH_FEE,
      WETH_USDC_FEE,
      treasuryAddress,
    ],
    verify,
    false,
    apeStakingLibraries,
    poolApeStakingSelectors
  )) as PoolApeStaking;

  return {
    poolApeStaking,
    poolApeStakingSelectors: poolApeStakingSelectors.map((s) => s.signature),
  };
};

export const deployPoolBorrowAndStake = async (
  provider: string,
  verify?: boolean
) => {
  const borrowLogic = await deployBorrowLogic(verify);

  const apeStakingLibraries = {
    "contracts/protocol/libraries/logic/BorrowLogic.sol:BorrowLogic":
      borrowLogic.address,
  };

  const {poolBorrowAndStakeSelectors} = await getPoolSignatures();

  const allTokens = await getAllTokens();
  const cApe = await getAutoCompoundApe();
  const poolBorrowAndStake = (await withSaveAndVerify(
    await getContractFactory("PoolBorrowAndStake", apeStakingLibraries),
    eContractid.PoolBorrowAndStakeImpl,
    [provider, cApe.address, allTokens.APE.address],
    verify,
    false,
    apeStakingLibraries,
    poolBorrowAndStakeSelectors
  )) as PoolApeStaking;

  return {
    poolBorrowAndStake,
    poolBorrowAndStakeSelectors: poolBorrowAndStakeSelectors.map(
      (s) => s.signature
    ),
  };
};

export const deployPoolParameters = async (
  provider: string,
  verify?: boolean
) => {
  const poolLogic = await deployPoolLogic(verify);

  const {poolParametersSelectors} = await getPoolSignatures();
  const parametersLibraries = {
    "contracts/protocol/libraries/logic/PoolLogic.sol:PoolLogic":
      poolLogic.address,
  };

  const poolParameters = (await withSaveAndVerify(
    await getContractFactory("PoolParameters", parametersLibraries),
    eContractid.PoolParametersImpl,
    [provider],
    verify,
    false,
    parametersLibraries,
    poolParametersSelectors
  )) as PoolParameters;

  return {
    poolParameters,
    poolParametersSelectors: poolParametersSelectors.map((s) => s.signature),
  };
};

export const deployPoolParaProxyInterfaces = async (verify?: boolean) => {
  const {poolParaProxyInterfacesSelectors} = await getPoolSignatures();
  const poolParaProxyInterfaces = (await withSaveAndVerify(
    await getContractFactory("ParaProxyInterfaces"),
    eContractid.ParaProxyInterfacesImpl,
    [],
    verify,
    false,
    undefined,
    poolParaProxyInterfacesSelectors
  )) as ParaProxyInterfaces;

  return {
    poolParaProxyInterfaces,
    poolParaProxyInterfacesSelectors: poolParaProxyInterfacesSelectors.map(
      (s) => s.signature
    ),
  };
};

export const deployAAPoolPositionMover = async (verify?: boolean) => {
  const {poolAAPositionMoverSelectors} = await getPoolSignatures();

  const poolAAPositionMover = (await withSaveAndVerify(
    await getContractFactory("PoolAAPositionMover"),
    eContractid.PoolAAPositionMoverImpl,
    [],
    verify,
    false,
    undefined,
    poolAAPositionMoverSelectors
  )) as PoolPositionMover;

  return {
    poolAAPositionMover,
    poolAAPositionMoverSelectors: poolAAPositionMoverSelectors.map(
      (s) => s.signature
    ),
  };
};

export const deployPoolPositionMover = async (
  provider: tEthereumAddress,
  bendDaoLendPoolLoan: tEthereumAddress,
  bendDaoLendPool: tEthereumAddress,
  poolV1: tEthereumAddress,
  protocolDataProviderV1: tEthereumAddress,
  capeV1: tEthereumAddress,
  capeV2: tEthereumAddress,
  apeCoin: tEthereumAddress,
  timeLockV1: tEthereumAddress,
  p2pPairStakingV1: tEthereumAddress,
  verify?: boolean
) => {
  const supplyLogic = await deploySupplyLogic(verify);
  const borrowLogic = await deployBorrowLogic(verify);
  const positionMoverLogicLibraries = {
    "contracts/protocol/libraries/logic/SupplyLogic.sol:SupplyLogic":
      supplyLogic.address,
    "contracts/protocol/libraries/logic/BorrowLogic.sol:BorrowLogic":
      borrowLogic.address,
  };
  const positionMoverLogic = await deployPositionMoverLogic(
    positionMoverLogicLibraries,
    verify
  );

  const positionMoverLibraries = {
    ["contracts/protocol/libraries/logic/PositionMoverLogic.sol:PositionMoverLogic"]:
      positionMoverLogic.address,
  };
  const {poolPositionMoverSelectors} = await getPoolSignatures();
  const libraries = {
    ["contracts/protocol/libraries/logic/PositionMoverLogic.sol:PositionMoverLogic"]:
      positionMoverLogic.address,
  };
  const poolPositionMover = (await withSaveAndVerify(
    await getContractFactory("PoolPositionMover", positionMoverLibraries),
    eContractid.PoolPositionMoverImpl,
    [
      provider,
      bendDaoLendPoolLoan,
      bendDaoLendPool,
      poolV1,
      protocolDataProviderV1,
      capeV1,
      capeV2,
      apeCoin,
      timeLockV1,
      p2pPairStakingV1,
    ],
    verify,
    false,
    libraries,
    poolPositionMoverSelectors
  )) as PoolPositionMover;

  return {
    poolPositionMover,
    poolPositionMoverSelectors: poolPositionMoverSelectors.map(
      (s) => s.signature
    ),
  };
};

export const deployPoolMarketplaceLibraries = async (
  coreLibraries: Libraries,
  verify?: boolean
): Promise<Libraries> => {
  const marketplaceLogic = await deployMarketplaceLogic(
    pick(coreLibraries, [
      "contracts/protocol/libraries/logic/SupplyLogic.sol:SupplyLogic",
      "contracts/protocol/libraries/logic/SupplyExtendedLogic.sol:SupplyExtendedLogic",
      "contracts/protocol/libraries/logic/BorrowLogic.sol:BorrowLogic",
    ]),
    verify
  );
  return {
    ["contracts/protocol/libraries/logic/MarketplaceLogic.sol:MarketplaceLogic"]:
      marketplaceLogic.address,
  };
};

export const deployPoolParametersLibraries = async (
  verify?: boolean
): Promise<Libraries> => {
  const poolLogic = await deployPoolLogic(verify);
  return {
    ["contracts/protocol/libraries/logic/PoolLogic.sol:PoolLogic"]:
      poolLogic.address,
  };
};

export const getPoolSignatures = () => {
  const poolCoreSelectors = getFunctionSignatures(PoolCore__factory.abi);

  const poolParametersSelectors = getFunctionSignatures(
    PoolParameters__factory.abi
  );

  const poolMarketplaceSelectors = getFunctionSignatures(
    PoolMarketplace__factory.abi
  );

  const poolApeStakingSelectors = getFunctionSignatures(
    PoolApeStaking__factory.abi
  );

  const poolBorrowAndStakeSelectors = getFunctionSignatures(
    PoolBorrowAndStake__factory.abi
  );

  const poolPositionMoverSelectors = getFunctionSignatures(
    PoolPositionMover__factory.abi
  );

  const poolAAPositionMoverSelectors = getFunctionSignatures(
    PoolAAPositionMover__factory.abi
  );

  const poolProxySelectors = getFunctionSignatures(ParaProxy__factory.abi);

  const poolParaProxyInterfacesSelectors = getFunctionSignatures(
    ParaProxyInterfaces__factory.abi
  );

  const allSelectors = {};
  const poolSelectors = [
    ...poolCoreSelectors,
    ...poolParametersSelectors,
    ...poolMarketplaceSelectors,
    ...poolApeStakingSelectors,
    ...poolBorrowAndStakeSelectors,
    ...poolProxySelectors,
    ...poolParaProxyInterfacesSelectors,
    ...poolPositionMoverSelectors,
    ...poolAAPositionMoverSelectors,
  ];
  for (const selector of poolSelectors) {
    if (!allSelectors[selector.signature]) {
      allSelectors[selector.signature] = selector;
    } else {
      throw new Error(
        `added function ${selector.name} conflict with exist function:${
          allSelectors[selector.signature].name
        }`
      );
    }
  }

  return {
    poolCoreSelectors,
    poolParametersSelectors,
    poolMarketplaceSelectors,
    poolApeStakingSelectors,
    poolBorrowAndStakeSelectors,
    poolParaProxyInterfacesSelectors,
    poolPositionMoverSelectors,
    poolAAPositionMoverSelectors,
  };
};

export const getPoolSignaturesFromDb = async () => {
  const poolCoreSelectors = await getFunctionSignaturesFromDb(
    eContractid.PoolCoreImpl
  );

  const poolParametersSelectors = await getFunctionSignaturesFromDb(
    eContractid.PoolParametersImpl
  );

  const poolMarketplaceSelectors = await getFunctionSignaturesFromDb(
    eContractid.PoolMarketplaceImpl
  );

  const poolApeStakingSelectors = await getFunctionSignaturesFromDb(
    eContractid.PoolApeStakingImpl
  );

  const poolParaProxyInterfacesSelectors = await getFunctionSignaturesFromDb(
    eContractid.ParaProxyInterfacesImpl
  );

  const poolPositionMoverSelectors = await getFunctionSignaturesFromDb(
    eContractid.PoolPositionMoverImpl
  );

  return {
    poolCoreSelectors,
    poolParametersSelectors,
    poolMarketplaceSelectors,
    poolApeStakingSelectors,
    poolParaProxyInterfacesSelectors,
    poolPositionMoverSelectors,
  };
};

export const deployPoolComponents = async (
  provider: string,
  verify?: boolean
) => {
  const coreLibraries = await deployPoolCoreLibraries(verify);
  const marketplaceLibraries = await deployPoolMarketplaceLibraries(
    coreLibraries,
    verify
  );

  const parametersLibraries = await deployPoolParametersLibraries(verify);

  const apeStakingLibraries = pick(coreLibraries, [
    "contracts/protocol/libraries/logic/BorrowLogic.sol:BorrowLogic",
    "contracts/protocol/libraries/logic/SupplyLogic.sol:SupplyLogic",
  ]);

  const allTokens = await getAllTokens();

  const APE_WETH_FEE = 3000;
  const WETH_USDC_FEE = 500;

  const {
    poolCoreSelectors,
    poolParametersSelectors,
    poolMarketplaceSelectors,
    poolApeStakingSelectors,
    poolBorrowAndStakeSelectors,
  } = getPoolSignatures();

  const poolCore = (await withSaveAndVerify(
    await getContractFactory("PoolCore", coreLibraries),
    eContractid.PoolCoreImpl,
    [
      provider,
      (await getContractAddressInDb(eContractid.TimeLockProxy)) ||
        (
          await deployTimeLockProxy(verify)
        ).address,
    ],
    verify,
    false,
    coreLibraries,
    poolCoreSelectors
  )) as PoolCore;

  const poolParameters = (await withSaveAndVerify(
    await getContractFactory("PoolParameters", parametersLibraries),
    eContractid.PoolParametersImpl,
    [provider],
    verify,
    false,
    parametersLibraries,
    poolParametersSelectors
  )) as PoolParameters;

  const poolMarketplace = (await withSaveAndVerify(
    await getContractFactory("PoolMarketplace", marketplaceLibraries),
    eContractid.PoolMarketplaceImpl,
    [provider],
    verify,
    false,
    marketplaceLibraries,
    poolMarketplaceSelectors
  )) as PoolMarketplace;

  const config = getParaSpaceConfig();
  let poolApeStaking;
  let poolBorrowAndStake;
  if (config.EnableApeStaking) {
    const treasuryAddress = config.Treasury;
    const cApe = await getAutoCompoundApe();
    poolApeStaking = allTokens.APE
      ? ((await withSaveAndVerify(
          await getContractFactory("PoolApeStaking", apeStakingLibraries),
          eContractid.PoolApeStakingImpl,
          [
            provider,
            cApe.address,
            allTokens.APE.address,
            allTokens.USDC.address,
            (await getUniswapV3SwapRouter()).address,
            allTokens.WETH.address,
            APE_WETH_FEE,
            WETH_USDC_FEE,
            treasuryAddress,
          ],
          verify,
          false,
          apeStakingLibraries,
          poolApeStakingSelectors
        )) as PoolApeStaking)
      : undefined;

    const BorrowAndStakeLibraries = pick(coreLibraries, [
      "contracts/protocol/libraries/logic/BorrowLogic.sol:BorrowLogic",
    ]);
    poolBorrowAndStake = allTokens.APE
      ? ((await withSaveAndVerify(
          await getContractFactory(
            "PoolBorrowAndStake",
            BorrowAndStakeLibraries
          ),
          eContractid.PoolBorrowAndStakeImpl,
          [provider, cApe.address, allTokens.APE.address],
          verify,
          false,
          BorrowAndStakeLibraries,
          poolBorrowAndStakeSelectors
        )) as PoolBorrowAndStake)
      : undefined;
  }

  return {
    poolCore,
    poolParameters,
    poolMarketplace,
    poolApeStaking,
    poolBorrowAndStake,
    poolCoreSelectors: poolCoreSelectors.map((s) => s.signature),
    poolParametersSelectors: poolParametersSelectors.map((s) => s.signature),
    poolMarketplaceSelectors: poolMarketplaceSelectors.map((s) => s.signature),
    poolApeStakingSelectors: poolApeStakingSelectors.map((s) => s.signature),
    poolBorrowAndStakeSelectors: poolBorrowAndStakeSelectors.map(
      (s) => s.signature
    ),
  };
};

export const deployPriceOracle = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("PriceOracle"),
    eContractid.PriceOracle,
    [],
    verify
  ) as Promise<PriceOracle>;

export const deployAggregator = async (
  symbol: string,
  price: tStringTokenSmallUnits,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("MockAggregator"),
    eContractid.Aggregator.concat(upperFirst(symbol)),
    [price],
    verify
  ) as Promise<MockAggregator>;

export const deployParaSpaceOracle = async (
  args: [
    tEthereumAddress,
    tEthereumAddress[],
    tEthereumAddress[],
    tEthereumAddress,
    tEthereumAddress,
    string
  ],
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("ParaSpaceOracle"),
    eContractid.ParaSpaceOracle,
    [...args],
    verify
  ) as Promise<ParaSpaceOracle>;

export const deployNFTFloorPriceOracle = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("NFTFloorOracle"),
    eContractid.NFTFloorOracle,
    [],
    verify
  ) as Promise<NFTFloorOracle>;

export const deployProtocolDataProvider = async (
  addressesProvider: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("ProtocolDataProvider"),
    eContractid.ProtocolDataProvider,
    [addressesProvider],
    verify
  ) as Promise<ProtocolDataProvider>;

export const deployMintableERC20 = async (
  args: [string, string, string],
  verify?: boolean
): Promise<MintableERC20> =>
  withSaveAndVerify(
    await getContractFactory("MintableERC20"),
    args[1],
    [...args],
    verify
  ) as Promise<MintableERC20>;

export const deployMintableERC721 = async (
  args: [string, string, string],
  verify?: boolean
): Promise<MintableERC721> =>
  withSaveAndVerify(
    await getContractFactory("MintableERC721"),
    args[1],
    [...args],
    verify
  ) as Promise<MintableERC721>;

export const deployMintableDelegationERC20 = async (
  args: [string, string, string],
  verify?: boolean
): Promise<MintableDelegationERC20> =>
  withSaveAndVerify(
    await getContractFactory("MintableDelegationERC20"),
    eContractid.MintableDelegationERC20,
    [...args],
    verify
  ) as Promise<MintableDelegationERC20>;

export const deployMockReserveAuctionStrategy = async (
  args: [string, string, string, string, string, string],
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("MockReserveAuctionStrategy"),
    eContractid.MockReserveAuctionStrategy,
    [...args],
    verify
  ) as Promise<MockReserveAuctionStrategy>;

export const deployReserveAuctionStrategy = async (
  strategyName: string,
  args: [string, string, string, string, string, string],
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("DefaultReserveAuctionStrategy"),
    strategyName,
    [...args],
    verify
  ) as Promise<DefaultReserveAuctionStrategy>;

export const deployReserveInterestRateStrategy = async (
  strategyName: string,
  args: [tEthereumAddress, string, string, string, string],
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("DefaultReserveInterestRateStrategy"),
    strategyName,
    [...args],
    verify
  ) as Promise<DefaultReserveInterestRateStrategy>;

export const deployGenericVariableDebtToken = async (
  poolAddress: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("VariableDebtToken"),
    eContractid.VariableDebtTokenImpl,
    [poolAddress],
    verify
  ) as Promise<VariableDebtToken>;

export const deployGenericPTokenImpl = async (
  poolAddress: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("PToken"),
    eContractid.PTokenImpl,
    [poolAddress],
    verify
  ) as Promise<PToken>;

export const deployGenericNTokenImpl = async (
  poolAddress: tEthereumAddress,
  atomicPricing: boolean,
  delegationRegistry: tEthereumAddress,
  verify?: boolean
) => {
  const mintableERC721Logic =
    (await getContractAddressInDb(eContractid.MintableERC721Logic)) ||
    (await deployMintableERC721Logic(verify)).address;

  const libraries = {
    ["contracts/protocol/tokenization/libraries/MintableERC721Logic.sol:MintableERC721Logic"]:
      mintableERC721Logic,
  };
  return withSaveAndVerify(
    await getContractFactory("NToken", libraries),
    eContractid.NTokenImpl,
    [poolAddress, atomicPricing, delegationRegistry],
    verify,
    false,
    libraries
  ) as Promise<NToken>;
};

export const deployUniswapV3NTokenImpl = async (
  poolAddress: tEthereumAddress,
  delegationRegistry: tEthereumAddress,
  verify?: boolean
) => {
  const mintableERC721Logic =
    (await getContractAddressInDb(eContractid.MintableERC721Logic)) ||
    (await deployMintableERC721Logic(verify)).address;

  const libraries = {
    ["contracts/protocol/tokenization/libraries/MintableERC721Logic.sol:MintableERC721Logic"]:
      mintableERC721Logic,
  };
  return withSaveAndVerify(
    await getContractFactory("NTokenUniswapV3", libraries),
    eContractid.NTokenUniswapV3Impl,
    [poolAddress, delegationRegistry],
    verify,
    false,
    libraries
  ) as Promise<NTokenUniswapV3>;
};

export const deployGenericMoonbirdNTokenImpl = async (
  poolAddress: tEthereumAddress,
  delegationRegistry: tEthereumAddress,
  verify?: boolean
) => {
  const mintableERC721Logic =
    (await getContractAddressInDb(eContractid.MintableERC721Logic)) ||
    (await deployMintableERC721Logic(verify)).address;
  const paraSpaceConfig = getParaSpaceConfig();

  const timeLockV1 = paraSpaceConfig.ParaSpaceV1?.TimeLockV1 || ZERO_ADDRESS;

  const libraries = {
    ["contracts/protocol/tokenization/libraries/MintableERC721Logic.sol:MintableERC721Logic"]:
      mintableERC721Logic,
  };
  return withSaveAndVerify(
    await getContractFactory("NTokenMoonBirds", libraries),
    eContractid.NTokenMoonBirdsImpl,
    [poolAddress, delegationRegistry, timeLockV1],
    verify,
    false,
    libraries
  ) as Promise<NTokenMoonBirds>;
};

export const deployDelegationAwarePTokenImpl = async (
  poolAddress: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("DelegationAwarePToken"),
    eContractid.DelegationAwarePTokenImpl,
    [poolAddress],
    verify
  ) as Promise<DelegationAwarePToken>;

export const deployAllERC20Tokens = async (verify?: boolean) => {
  const tokens: {
    [symbol: string]:
      | MockContract
      | MintableERC20
      | WETH9Mocked
      | StETHMocked
      | WstETHMocked
      | MockAToken
      | AutoYieldApe
      | AutoCompoundApe;
  } = {};

  const paraSpaceConfig = getParaSpaceConfig();
  const reservesConfig = paraSpaceConfig.ReservesConfig;
  const tokensConfig = paraSpaceConfig.Tokens;

  for (const tokenSymbol of Object.keys(ERC20TokenContractId)) {
    const db = getDb();
    const contractAddress = db
      .get(`${tokenSymbol}.${DRE.network.name}`)
      .value()?.address;
    const reserveConfig = reservesConfig[tokenSymbol];
    if (!reserveConfig) {
      continue;
    }

    // if contract address is already in db, then skip to next tokenSymbol
    if (contractAddress) {
      console.log("contract address is already in db", tokenSymbol);
      continue;
    } else if (tokensConfig[tokenSymbol]) {
      console.log("contract address is already in db", tokenSymbol);
      await insertContractAddressInDb(
        tokenSymbol,
        tokensConfig[tokenSymbol],
        false
      );

      if (
        tokenSymbol === ERC20TokenContractId.sAPE &&
        paraSpaceConfig.YogaLabs.ApeCoinStaking
      ) {
        await insertContractAddressInDb(
          eContractid.ApeCoinStaking,
          paraSpaceConfig.YogaLabs.ApeCoinStaking,
          false
        );
      }
      if (
        tokenSymbol === ERC20TokenContractId.sAPE &&
        paraSpaceConfig.YogaLabs.BAKC
      ) {
        await insertContractAddressInDb(
          eContractid.BAKC,
          paraSpaceConfig.YogaLabs.BAKC,
          false
        );
      }
      continue;
    } else {
      console.log("deploying now", tokenSymbol);
      if (tokenSymbol === ERC20TokenContractId.WETH) {
        tokens[tokenSymbol] = await deployWETH(verify);
        continue;
      }

      if (tokenSymbol === ERC20TokenContractId.stETH) {
        tokens[tokenSymbol] = await deployStETH(verify);
        continue;
      }

      if (tokenSymbol === ERC20TokenContractId.wstETH) {
        tokens[tokenSymbol] = await deployWStETH(
          tokens[ERC20TokenContractId.stETH].address,
          verify
        );
        continue;
      }

      if (
        tokenSymbol === ERC20TokenContractId.aWETH ||
        tokenSymbol === ERC20TokenContractId.awstETH
      ) {
        tokens[tokenSymbol] = await deployMockAToken(
          [tokenSymbol, tokenSymbol, reserveConfig.reserveDecimals],
          verify
        );
        continue;
      }

      if (tokenSymbol === ERC20TokenContractId.astETH) {
        tokens[tokenSymbol] = await deployMockAStETH(
          [tokenSymbol, tokenSymbol, reserveConfig.reserveDecimals],
          verify
        );
        continue;
      }

      if (tokenSymbol === ERC20TokenContractId.rETH) {
        tokens[tokenSymbol] = await deployMockRETH(
          [tokenSymbol, tokenSymbol, reserveConfig.reserveDecimals],
          verify
        );
        continue;
      }

      if (tokenSymbol === ERC20TokenContractId.cETH) {
        tokens[tokenSymbol] = await deployMockCToken(
          [tokenSymbol, tokenSymbol, ZERO_ADDRESS],
          verify
        );
        continue;
      }

      if (tokenSymbol === ERC20TokenContractId.cAPE) {
        tokens[tokenSymbol] = await getAutoCompoundApe(
          (
            await deployAutoCompoundApeProxy(verify)
          ).address
        );
        continue;
      }
      if (tokenSymbol === ERC20TokenContractId.yAPE) {
        tokens[tokenSymbol] = await getAutoYieldApe(
          (
            await deployAutoYieldApeProxy(verify)
          ).address
        );
        continue;
      }

      tokens[tokenSymbol] = await deployMintableERC20(
        [tokenSymbol, tokenSymbol, reserveConfig.reserveDecimals],
        verify
      );
    }
  }

  return tokens;
};

export const deployAllERC721Tokens = async (verify?: boolean) => {
  const tokens: {
    [symbol: string]:
      | MockContract
      | MintableERC721
      | WPunk
      | CryptoPunksMarket
      | Doodles
      | BoredApeYachtClub
      | MutantApeYachtClub
      | Azuki
      | CloneX
      | Land
      | Meebits
      | Moonbirds
      | Pandora
      | Contract
      | StakefishNFTManager;
  } = {};
  const paraSpaceConfig = getParaSpaceConfig();
  const reservesConfig = paraSpaceConfig.ReservesConfig;
  const tokensConfig = paraSpaceConfig.Tokens;
  const deployer = await getFirstSigner();
  const deployerAddress = await deployer.getAddress();

  for (const tokenSymbol of Object.keys(ERC721TokenContractId)) {
    const db = getDb();
    const contractAddress = db
      .get(`${tokenSymbol}.${DRE.network.name}`)
      .value()?.address;
    const reserveConfig = reservesConfig[tokenSymbol];
    if (!reserveConfig) {
      continue;
    }

    // if contract address is already in db, then skip to next tokenSymbol
    if (contractAddress) {
      console.log("contract address is already in db", tokenSymbol);
      continue;
    } else if (tokensConfig[tokenSymbol]) {
      console.log("contract address is set in market config", tokenSymbol);
      await insertContractAddressInDb(
        tokenSymbol,
        tokensConfig[tokenSymbol],
        false
      );
      if (
        tokenSymbol === ERC721TokenContractId.UniswapV3 &&
        paraSpaceConfig.Uniswap.V3Factory
      ) {
        await insertContractAddressInDb(
          eContractid.UniswapV3Factory,
          paraSpaceConfig.Uniswap.V3Factory,
          false
        );
      }
      if (
        tokenSymbol === ERC721TokenContractId.UniswapV3 &&
        paraSpaceConfig.Uniswap.V3Router
      ) {
        await insertContractAddressInDb(
          eContractid.UniswapV3SwapRouter,
          paraSpaceConfig.Uniswap.V3Router,
          false
        );
      }
      if (
        tokenSymbol === ERC721TokenContractId.WPUNKS &&
        paraSpaceConfig.Tokens.PUNKS
      ) {
        await insertContractAddressInDb(
          eContractid.PUNKS,
          paraSpaceConfig.Tokens.PUNKS,
          false
        );
      }
      if (
        tokenSymbol === ERC721TokenContractId.SFVLDR &&
        paraSpaceConfig.Stakefish.StakefishManager
      ) {
        await insertContractAddressInDb(
          eContractid.SFVLDR,
          paraSpaceConfig.Stakefish.StakefishManager,
          false
        );
      }
      continue;
    } else {
      console.log("deploying now ", tokenSymbol);

      // we are using hardhat, we want to use mock ERC721 contracts
      if (tokenSymbol === ERC721TokenContractId.WPUNKS) {
        const punks = await deployPunks([], verify);
        tokens[eContractid.PUNKS] = punks;
        tokens[tokenSymbol] = await deployWPunks([punks.address], verify);
        continue;
      }

      if (tokenSymbol === ERC721TokenContractId.PANDORA) {
        tokens[tokenSymbol] = await deployPandora(
          await deployer.getAddress(),
          verify
        );
        continue;
      }

      if (tokenSymbol === ERC721TokenContractId.BAYC) {
        tokens[tokenSymbol] = await deployBAYC(
          [tokenSymbol, tokenSymbol, "8000", "0"],
          verify
        );
        continue;
      }

      if (tokenSymbol === ERC721TokenContractId.MAYC) {
        tokens[tokenSymbol] = await deployMAYC(
          [tokenSymbol, tokenSymbol, ZERO_ADDRESS, ZERO_ADDRESS],
          verify
        );
        continue;
      }

      if (tokenSymbol === ERC721TokenContractId.DOODLE) {
        tokens[tokenSymbol] = await deployDoodle([], verify);
        continue;
      }

      if (tokenSymbol === ERC721TokenContractId.AZUKI) {
        tokens[tokenSymbol] = await deployAzuki([5, 10000, 8900, 200], verify);
        continue;
      }

      if (tokenSymbol === ERC721TokenContractId.CLONEX) {
        tokens[tokenSymbol] = await deployCloneX([], verify);
        continue;
      }

      if (tokenSymbol === ERC721TokenContractId.SEWER) {
        tokens[tokenSymbol] = await deploySewerPass(
          ["SEWER", "SEWER", deployerAddress],
          verify
        );
        continue;
      }

      if (tokenSymbol === ERC721TokenContractId.MEEBITS) {
        const punks = await getPunks();
        tokens[tokenSymbol] = await deployMeebits(
          [punks.address, ZERO_ADDRESS, paraSpaceConfig.ParaSpaceTeam],
          verify
        );
        continue;
      }

      if (tokenSymbol === ERC721TokenContractId.OTHR) {
        tokens[tokenSymbol] = await deployOTHR(
          [
            "OTHR",
            "OTHR",
            [ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS],
            [10, 100, 1000, 10000],
            [[paraSpaceConfig.ParaSpaceTeam, 100]],
            paraSpaceConfig.ParaSpaceTeam,
            paraSpaceConfig.ParaSpaceTeam,
            "0x63616e6469646174653100000000000000000000000000000000000000000000",
            5,
            paraSpaceConfig.ParaSpaceTeam,
          ],
          verify
        );
        continue;
      }

      if (tokenSymbol === ERC721TokenContractId.MOONBIRD) {
        tokens[tokenSymbol] = await deployMoonbirds(
          [
            "Moonbirds",
            "MOONBIRD",
            "0x0000000000000000000000000000000000000000",
            paraSpaceConfig.ParaSpaceTeam,
            paraSpaceConfig.ParaSpaceTeam,
          ],
          verify
        );
        await (tokens[tokenSymbol] as Moonbirds).setNestingOpen(
          true,
          GLOBAL_OVERRIDES
        );
        continue;
      }

      if (tokenSymbol === ERC721TokenContractId.UniswapV3) {
        const weth = await getWETH();
        const positionDescriptor =
          await deployNonfungibleTokenPositionDescriptor(
            [
              weth.address,
              // 'ETH' as a bytes32 string
              "0x4554480000000000000000000000000000000000000000000000000000000000",
            ],
            verify
          );
        let factory;
        if (!paraSpaceConfig.Uniswap.V3Factory) {
          factory = await deployUniswapV3Factory([], verify);
        } else {
          factory = await getUniswapV3Factory();
        }

        if (!paraSpaceConfig.Uniswap.V3Router) {
          await deployUniswapSwapRouter(
            [factory.address, weth.address],
            verify
          );
        }

        let nonfungiblePositionManager;
        if (!paraSpaceConfig.Uniswap.V3NFTPositionManager) {
          nonfungiblePositionManager = await deployNonfungiblePositionManager(
            [factory.address, weth.address, positionDescriptor.address],
            verify
          );
        } else {
          nonfungiblePositionManager = await getNonfungiblePositionManager();
        }
        tokens[tokenSymbol] = nonfungiblePositionManager;
        continue;
      }

      if (tokenSymbol === ERC721TokenContractId.SFVLDR) {
        const depositContract = await deployDepositContract(verify);
        const {paraSpaceAdminAddress} = await getParaSpaceAdmins();
        const validatorImpl = await deployStakefishValidator(
          depositContract.address,
          verify
        );

        const factory = await deployStakefishValidatorFactory(
          validatorImpl.address,
          paraSpaceAdminAddress,
          verify
        );

        const nftManager = await deployStakefishNFTManager(
          factory.address,
          verify
        );
        await waitForTx(await factory.setDeployer(nftManager.address, true));

        tokens[tokenSymbol] = nftManager;
        continue;
      }

      tokens[tokenSymbol] = await deployMintableERC721(
        [tokenSymbol, tokenSymbol, ""],
        verify
      );
    }
  }

  return tokens;
};

export const deployMoonbirds = async (
  args: [string, string, tEthereumAddress, tEthereumAddress, tEthereumAddress],
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("Moonbirds"),
    eContractid.MOONBIRD,
    [...args],
    verify
  ) as Promise<Moonbirds>;

export const deployReservesSetupHelper = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("ReservesSetupHelper"),
    eContractid.ReservesSetupHelper,
    [],
    verify
  ) as Promise<ReservesSetupHelper>;

export const deployInitializableImmutableAdminUpgradeabilityProxy = async (
  args: [tEthereumAddress],
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("InitializableImmutableAdminUpgradeabilityProxy"),
    eContractid.InitializableImmutableAdminUpgradeabilityProxy,
    [...args],
    verify
  ) as Promise<InitializableImmutableAdminUpgradeabilityProxy>;

export const deployWETH = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("WETH9Mocked"),
    eContractid.WETH,
    [],
    verify
  ) as Promise<WETH9Mocked>;

export const deployUiPoolDataProvider = async (
  arg1: string,
  arg2: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("UiPoolDataProvider"),
    eContractid.UiPoolDataProvider,
    [arg1, arg2],
    verify
  ) as Promise<UiPoolDataProvider>;

export const deployUiIncentiveDataProvider = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("UiIncentiveDataProvider"),
    eContractid.UiIncentiveDataProvider,
    [],
    verify
  ) as Promise<UiIncentiveDataProvider>;

export const deployWalletBalanceProvider = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("WalletBalanceProvider"),
    eContractid.WalletBalanceProvider,
    [],
    verify
  ) as Promise<WalletBalanceProvider>;

export const deployWETHGateway = async (
  weth: string,
  pool: Address,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("WETHGateway"),
    eContractid.WETHGatewayImpl,
    [weth, pool],
    verify
  ) as Promise<WETHGateway>;

export const deployWETHGatewayProxy = async (
  admin: string,
  impl: string,
  initData: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("InitializableImmutableAdminUpgradeabilityProxy"),
    eContractid.WETHGatewayProxy,
    [admin, impl, initData],
    verify,
    true
  ) as Promise<InitializableImmutableAdminUpgradeabilityProxy>;

export const deployMeebits = async (
  args: [tEthereumAddress, tEthereumAddress, tEthereumAddress],
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("Meebits"),
    eContractid.Meebits,
    [...args],
    verify
  ) as Promise<Meebits>;

export const deployAzuki = async (
  args: [number, number, number, number],
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("Azuki"),
    eContractid.Azuki,
    [...args],
    verify
  ) as Promise<Azuki>;

export const deployOTHR = async (
  // eslint-disable-next-line
  args: [any, any, any, any, any, any, any, any, any, any],
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("Land"),
    eContractid.OTHR,
    [...args],
    verify
  ) as Promise<Land>;

export const deployCloneX = async (args: [], verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("CloneX"),
    eContractid.CloneX,
    [...args],
    verify
  ) as Promise<CloneX>;

export const deploySewerPass = async (
  args: [string, string, string],
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("BAYCSewerPass"),
    eContractid.SEWER,
    [...args],
    verify
  ) as Promise<BAYCSewerPass>;

export const deployDoodle = async (args: [], verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("Doodles"),
    eContractid.Doodles,
    [...args],
    verify
  ) as Promise<Doodles>;

export const deployMAYC = async (
  args: [string, string, string, string],
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("MutantApeYachtClub"),
    eContractid.MutantApeYachtClub,
    [...args],
    verify
  ) as Promise<MutantApeYachtClub>;

export const deployBAYC = async (
  args: [string, string, string, string],
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("BoredApeYachtClub"),
    eContractid.BoredApeYachtClub,
    [...args],
    verify
  ) as Promise<BoredApeYachtClub>;

export const deployERC721OracleWrapper = async (
  addressesProvider: string,
  oracleAddress: string,
  asset: string,
  symbol: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("ERC721OracleWrapper"),
    eContractid.Aggregator.concat(upperFirst(symbol)),
    [addressesProvider, oracleAddress, asset],
    verify
  ) as Promise<ERC721OracleWrapper>;

export const deployERC20OracleWrapper = async (
  pyth: string,
  feedId: string,
  expirationPeriod: string,
  decimals: string,
  symbol: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("ERC20OracleWrapper"),
    eContractid.Aggregator.concat(upperFirst(symbol)),
    [pyth, feedId, expirationPeriod, decimals],
    verify
  ) as Promise<ERC20OracleWrapper>;

export const deployPunks = async (args: [], verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("CryptoPunksMarket"),
    eContractid.PUNKS,
    [...args],
    verify
  ) as Promise<CryptoPunksMarket>;

export const deployWPunks = async (
  args: [tEthereumAddress],
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("WPunk"),
    eContractid.WPunk,
    [...args],
    verify
  ) as Promise<WPunk>;

export const deployPunkGateway = async (
  args: [
    tEthereumAddress,
    tEthereumAddress,
    // tEthereumAddress,
    tEthereumAddress
  ],
  verify?: boolean
) => {
  const punkImpl = await getContractFactory("WPunkGateway");
  return withSaveAndVerify(
    punkImpl,
    eContractid.WPunkGatewayImpl,
    [...args],
    verify
  ) as Promise<WPunkGateway>;
};

export const deployPunkGatewayProxy = async (
  admin: string,
  punkGateway: string,
  initData: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("InitializableImmutableAdminUpgradeabilityProxy"),
    eContractid.WPunkGatewayProxy,
    [admin, punkGateway, initData],
    verify,
    true
  ) as Promise<InitializableImmutableAdminUpgradeabilityProxy>;

export const deploySeaportAdapter = async (
  provider: tEthereumAddress,
  verify?: boolean
) => {
  const seaportAdapter = await getContractFactory("SeaportAdapter");

  return withSaveAndVerify(
    seaportAdapter,
    eContractid.SeaportAdapter,
    [provider],
    verify
  ) as Promise<SeaportAdapter>;
};

export const deployLooksRareAdapter = async (
  provider: tEthereumAddress,
  strategy: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("LooksRareAdapter"),
    eContractid.LooksRareAdapter,
    [provider, strategy],
    verify
  ) as Promise<LooksRareAdapter>;

export const deployX2Y2Adapter = async (
  provider: tEthereumAddress,
  verify?: boolean
) => {
  const x2y2Adapter = await getContractFactory("X2Y2Adapter");

  return withSaveAndVerify(
    x2y2Adapter,
    eContractid.X2Y2Adapter,
    [provider],
    verify
  ) as Promise<X2Y2Adapter>;
};

export const deployMarketplaceLogic = async (
  libraries: Libraries,
  verify?: boolean
) => {
  const marketplaceLogic = await getContractFactory(
    "MarketplaceLogic",
    libraries
  );

  return withSaveAndVerify(
    marketplaceLogic,
    eContractid.MarketplaceLogic,
    [],
    verify,
    false,
    libraries
  ) as Promise<MarketplaceLogic>;
};

export const deployConduitController = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("ConduitController"),
    eContractid.ConduitController,
    [],
    verify
  ) as Promise<ConduitController>;

export const deployPausableZoneController = async (
  owner: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("PausableZoneController"),
    eContractid.PausableZoneController,
    [owner],
    verify
  ) as Promise<PausableZoneController>;

export const deploySeaport = async (
  conduitController: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("Seaport"),
    eContractid.Seaport,
    [conduitController],
    verify
  ) as Promise<Seaport>;

export const deployCurrencyManager = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("CurrencyManager"),
    eContractid.CurrencyManager,
    [],
    verify
  ) as Promise<CurrencyManager>;

export const deployExecutionManager = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("ExecutionManager"),
    eContractid.ExecutionManager,
    [],
    verify
  ) as Promise<ExecutionManager>;

export const deployLooksRareExchange = async (
  currencyManager: string,
  executionManager: string,
  royaltyFeeManager: string,
  weth: string,
  protocolFeeRecipient: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("LooksRareExchange"),
    eContractid.LooksRareExchange,
    [
      currencyManager,
      executionManager,
      royaltyFeeManager,
      weth,
      protocolFeeRecipient,
    ],
    verify
  ) as Promise<LooksRareExchange>;

export const deployRoyaltyFeeManager = async (
  royaltyFeeRegistry: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("RoyaltyFeeManager"),
    eContractid.RoyaltyFeeManager,
    [royaltyFeeRegistry],
    verify
  ) as Promise<RoyaltyFeeManager>;

export const deployRoyaltyFeeRegistry = async (
  royaltyFeeLimit: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("RoyaltyFeeRegistry"),
    eContractid.RoyaltyFeeRegistry,
    [royaltyFeeLimit],
    verify
  ) as Promise<RoyaltyFeeRegistry>;

export const deployTransferSelectorNFT = async (
  transferManagerERC721: string,
  transferManagerERC1155: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("TransferSelectorNFT"),
    eContractid.TransferSelectorNFT,
    [transferManagerERC721, transferManagerERC1155],
    verify
  ) as Promise<TransferSelectorNFT>;

export const deployTransferManagerERC721 = async (
  looksRareExchange: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("TransferManagerERC721"),
    eContractid.TransferManagerERC721,
    [looksRareExchange],
    verify
  ) as Promise<TransferManagerERC721>;

export const deployTransferManagerERC1155 = async (
  looksRareExchange: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("TransferManagerERC1155"),
    eContractid.TransferManagerERC1155,
    [looksRareExchange],
    verify
  ) as Promise<TransferManagerERC1155>;

export const deployStrategyStandardSaleForFixedPrice = async (
  protocolFee: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("StrategyStandardSaleForFixedPrice"),
    eContractid.StrategyStandardSaleForFixedPrice,
    [protocolFee],
    verify
  ) as Promise<StrategyStandardSaleForFixedPrice>;

export const deployX2Y2R1 = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("X2Y2R1"),
    eContractid.X2Y2R1,
    [],
    verify
  ) as Promise<X2Y2R1>;

export const deployERC721Delegate = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("ERC721Delegate"),
    eContractid.ERC721Delegate,
    [],
    verify
  ) as Promise<ERC721Delegate>;

export const deployUniswapV3Factory = async (args: [], verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("UniswapV3Factory"),
    eContractid.UniswapV3Factory,
    [...args],
    verify
  ) as Promise<UniswapV3Factory>;

export const deployNonfungibleTokenPositionDescriptor = async (
  args: [string, string],
  verify?: boolean
) => {
  const nftDescriptorLibraryContract = await withSaveAndVerify(
    {
      artifact: nFTDescriptor,
      factory: (
        await DRE.ethers.getContractFactoryFromArtifact(nFTDescriptor)
      ).connect(await getFirstSigner()),
      customData: undefined,
    },
    eContractid.NFTDescriptor,
    [],
    verify
  );
  const libraries = {
    NFTDescriptor: nftDescriptorLibraryContract.address,
  };

  return withSaveAndVerify(
    {
      artifact: nonfungibleTokenPositionDescriptor,
      factory: (
        await DRE.ethers.getContractFactoryFromArtifact(
          nonfungibleTokenPositionDescriptor,
          {
            libraries,
          }
        )
      ).connect(await getFirstSigner()),
      customData: undefined,
    },
    eContractid.NonfungibleTokenPositionDescriptor,
    [...args],
    verify,
    false,
    libraries
  );
};

export const deployUniswapV3OracleWrapper = async (
  factory: string,
  manager: string,
  addressProvider: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("UniswapV3OracleWrapper"),
    eContractid.Aggregator.concat(upperFirst(eContractid.UniswapV3)),
    [factory, manager, addressProvider],
    verify
  ) as Promise<UniswapV3OracleWrapper>;

export const deployUniswapV3TwapOracleWrapper = async (
  pool: string,
  baseCurrency: string,
  twapWindow: string,
  symbol: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("UniswapV3TwapOracleWrapper"),
    eContractid.Aggregator.concat(upperFirst(symbol)),
    [pool, baseCurrency, twapWindow],
    verify
  ) as Promise<UniswapV3TwapOracleWrapper>;

export const deployNonfungiblePositionManager = async (
  args: [string, string, string],
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("NonfungiblePositionManager"),
    eContractid.UniswapV3,
    [...args],
    verify
  );

export const deployUniswapSwapRouter = async (
  args: [string, string],
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("SwapRouter"),
    eContractid.UniswapV3SwapRouter,
    [...args],
    verify
  );

export const deployPandora = async (
  owner: string,
  verify?: boolean
): Promise<Pandora> =>
  withSaveAndVerify(
    await getContractFactory("Pandora"),
    eContractid.PANDORA,
    [owner],
    verify
  ) as Promise<Pandora>;

export const deployStETH = async (verify?: boolean): Promise<StETHMocked> =>
  withSaveAndVerify(
    await getContractFactory("StETHMocked"),
    eContractid.StETH,
    [],
    verify
  ) as Promise<StETHMocked>;

export const deployWStETH = async (
  stETHAddress: tEthereumAddress,
  verify?: boolean
): Promise<WstETHMocked> =>
  withSaveAndVerify(
    await getContractFactory("WstETHMocked"),
    eContractid.WStETH,
    [stETHAddress],
    verify
  ) as Promise<WstETHMocked>;

export const deployMockAToken = async (
  args: [string, string, string],
  verify?: boolean
): Promise<MockAToken> =>
  withSaveAndVerify(
    await getContractFactory("MockAToken"),
    args[1],
    [...args],
    verify
  ) as Promise<MockAToken>;

export const deployMockCToken = async (
  args: [string, string, string],
  verify?: boolean
): Promise<MockCToken> =>
  withSaveAndVerify(
    await getContractFactory("MockCToken"),
    args[1],
    [...args],
    verify
  ) as Promise<MockCToken>;

export const deployMockAStETH = async (
  args: [string, string, string],
  verify?: boolean
): Promise<MockAStETH> =>
  withSaveAndVerify(
    await getContractFactory("MockAStETH"),
    args[1],
    [...args],
    verify
  ) as Promise<MockAStETH>;

export const deployMockRETH = async (
  args: [string, string, string],
  verify?: boolean
): Promise<MockRETH> =>
  withSaveAndVerify(
    await getContractFactory("MockRETH"),
    args[1],
    [...args],
    verify
  ) as Promise<MockRETH>;

export const deployPTokenAToken = async (
  poolAddress: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("PTokenAToken"),
    eContractid.PTokenATokenImpl,
    [poolAddress],
    verify
  ) as Promise<PTokenAToken>;

export const deployPTokenStETH = async (
  poolAddress: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("PTokenStETH"),
    eContractid.PTokenStETHImpl,
    [poolAddress],
    verify
  ) as Promise<PTokenStETH>;

export const deployPTokenStKSM = async (
  poolAddress: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("PTokenStKSM"),
    eContractid.PTokenStKSMImpl,
    [poolAddress],
    verify
  ) as Promise<PTokenStKSM>;

export const deployPTokenAStETH = async (
  poolAddress: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("PTokenAStETH"),
    eContractid.PTokenAStETHImpl,
    [poolAddress],
    verify
  ) as Promise<PTokenAStETH>;

export const deployPTokenSApe = async (
  poolAddress: tEthereumAddress,
  nBAYC: tEthereumAddress,
  nMAYC: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("PTokenSApe"),
    eContractid.PTokenSApeImpl,
    [poolAddress, nBAYC, nMAYC],
    verify
  ) as Promise<PTokenSApe>;

export const deployUserFlashClaimRegistry = async (
  receiverImpl: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("UserFlashclaimRegistry"),
    eContractid.FlashClaimRegistry,
    [receiverImpl],
    verify
  ) as Promise<UserFlashclaimRegistry>;

export const deployUserFlashClaimRegistryProxy = async (
  admin: string,
  registryImpl: string,
  // eslint-disable-next-line
  initData: any,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("InitializableImmutableAdminUpgradeabilityProxy"),
    eContractid.UserFlashClaimRegistryProxy,
    [admin, registryImpl, initData],
    verify,
    true
  ) as Promise<InitializableImmutableAdminUpgradeabilityProxy>;

export const deployBAYCSewerPassClaim = async (
  bayc: string,
  mayc: string,
  bakc: string,
  sewerPass: string,
  verify?: boolean
) => {
  const deployer = await getFirstSigner();
  const deployerAddress = await deployer.getAddress();
  const baycSewerPassClaim = await withSaveAndVerify(
    await getContractFactory("BAYCSewerPassClaim"),
    eContractid.BAYCSewerPassClaim,
    [bayc, mayc, bakc, sewerPass, deployerAddress],
    verify
  );

  const baycSewerPass = await getBAYCSewerPass(sewerPass);
  await baycSewerPass.setRegistryAddress(
    baycSewerPassClaim.address,
    GLOBAL_OVERRIDES
  );
  await baycSewerPass.flipMintIsActiveState(GLOBAL_OVERRIDES);
  await baycSewerPassClaim.flipClaimIsActiveState(GLOBAL_OVERRIDES);
  await baycSewerPass.toggleMinterContract(
    baycSewerPassClaim.address,
    GLOBAL_OVERRIDES
  );

  return baycSewerPassClaim;
};

export const deployAirdropFlashClaimReceiver = async (
  poolAddress: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("AirdropFlashClaimReceiver"),
    eContractid.AirdropFlashClaimReceiver,
    [poolAddress],
    verify
  ) as Promise<AirdropFlashClaimReceiver>;

export const deployMockAirdropProject = async (
  underlyingAddress: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("MockAirdropProject"),
    eContractid.MockAirdropProject,
    [underlyingAddress],
    verify
  ) as Promise<MockAirdropProject>;

export const deployMockMultiAssetAirdropProject = async (
  underlyingAddress1: tEthereumAddress,
  underlyingAddress2: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("MockMultiAssetAirdropProject"),
    eContractid.MockMultiAssetAirdropProject,
    [underlyingAddress1, underlyingAddress2],
    verify
  ) as Promise<MockMultiAssetAirdropProject>;

export const deployApeCoinStaking = async (verify?: boolean) => {
  const allTokens = await getAllTokens();
  const args = [
    allTokens.APE.address,
    allTokens.BAYC.address,
    allTokens.MAYC.address,
    allTokens.BAKC.address,
  ];

  const apeCoinStaking = await withSaveAndVerify(
    await getContractFactory("ApeCoinStaking"),
    eContractid.ApeCoinStaking,
    [...args],
    verify
  );
  const amount = await convertToCurrencyDecimals(
    allTokens.APE.address,
    "94694400"
  );

  await apeCoinStaking.addTimeRange(
    0,
    amount,
    "1666771200",
    "1761465600",
    parseEther("10000"),
    GLOBAL_OVERRIDES
  );
  await apeCoinStaking.addTimeRange(
    1,
    amount,
    "1666771200",
    "1761465600",
    parseEther("200000"),
    GLOBAL_OVERRIDES
  );
  await apeCoinStaking.addTimeRange(
    2,
    amount,
    "1666771200",
    "1761465600",
    parseEther("100000"),
    GLOBAL_OVERRIDES
  );
  await apeCoinStaking.addTimeRange(
    3,
    amount,
    "1666771200",
    "1761465600",
    parseEther("100000"),
    GLOBAL_OVERRIDES
  );
  return apeCoinStaking;
};

export const deployApeStakingLogic = async (verify?: boolean) => {
  return withSaveAndVerify(
    await getContractFactory("ApeStakingLogic"),
    eContractid.ApeStakingLogic,
    [],
    verify
  ) as Promise<ApeStakingLogic>;
};

export const deployNTokenBAYCImpl = async (
  apeCoinStaking: tEthereumAddress,
  poolAddress: tEthereumAddress,
  delegationRegistry: tEthereumAddress,
  verify?: boolean
) => {
  const apeStakingLogic =
    (await getContractAddressInDb(eContractid.ApeStakingLogic)) ||
    (await deployApeStakingLogic(verify)).address;
  const mintableERC721Logic =
    (await getContractAddressInDb(eContractid.MintableERC721Logic)) ||
    (await deployMintableERC721Logic(verify)).address;

  const libraries = {
    ["contracts/protocol/tokenization/libraries/ApeStakingLogic.sol:ApeStakingLogic"]:
      apeStakingLogic,
    ["contracts/protocol/tokenization/libraries/MintableERC721Logic.sol:MintableERC721Logic"]:
      mintableERC721Logic,
  };

  return withSaveAndVerify(
    await getContractFactory("NTokenBAYC", libraries),
    eContractid.NTokenBAYCImpl,
    [poolAddress, apeCoinStaking, delegationRegistry],
    verify,
    false,
    libraries
  ) as Promise<NTokenBAYC>;
};

export const deployNTokenMAYCImpl = async (
  apeCoinStaking: tEthereumAddress,
  poolAddress: tEthereumAddress,
  delegationRegistry: tEthereumAddress,
  verify?: boolean
) => {
  const apeStakingLogic =
    (await getContractAddressInDb(eContractid.ApeStakingLogic)) ||
    (await deployApeStakingLogic(verify)).address;
  const mintableERC721Logic =
    (await getContractAddressInDb(eContractid.MintableERC721Logic)) ||
    (await deployMintableERC721Logic(verify)).address;

  const libraries = {
    ["contracts/protocol/tokenization/libraries/ApeStakingLogic.sol:ApeStakingLogic"]:
      apeStakingLogic,
    ["contracts/protocol/tokenization/libraries/MintableERC721Logic.sol:MintableERC721Logic"]:
      mintableERC721Logic,
  };
  return withSaveAndVerify(
    await getContractFactory("NTokenMAYC", libraries),
    eContractid.NTokenMAYCImpl,
    [poolAddress, apeCoinStaking, delegationRegistry],
    verify,
    false,
    libraries
  ) as Promise<NTokenMAYC>;
};

export const deployNTokenBAKCImpl = async (
  poolAddress: tEthereumAddress,
  apeCoinStaking: tEthereumAddress,
  nBAYC: tEthereumAddress,
  nMAYC: tEthereumAddress,
  delegationRegistry: tEthereumAddress,
  verify?: boolean
) => {
  const mintableERC721Logic =
    (await getContractAddressInDb(eContractid.MintableERC721Logic)) ||
    (await deployMintableERC721Logic(verify)).address;
  const libraries = {
    ["contracts/protocol/tokenization/libraries/MintableERC721Logic.sol:MintableERC721Logic"]:
      mintableERC721Logic,
  };
  return withSaveAndVerify(
    await getContractFactory("NTokenBAKC", libraries),
    eContractid.NTokenBAKCImpl,
    [poolAddress, apeCoinStaking, nBAYC, nMAYC, delegationRegistry],
    verify,
    false,
    libraries
  ) as Promise<NTokenBAKC>;
};

export const deployATokenDebtToken = async (
  poolAddress: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("ATokenDebtToken"),
    eContractid.ATokenDebtToken,
    [poolAddress],
    verify
  ) as Promise<ATokenDebtToken>;

export const deployStETHDebtToken = async (
  poolAddress: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("StETHDebtToken"),
    eContractid.StETHDebtToken,
    [poolAddress],
    verify
  ) as Promise<StETHDebtToken>;

export const deployStKSMDebtToken = async (
  poolAddress: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("StKSMDebtToken"),
    eContractid.StKSMDebtToken,
    [poolAddress],
    verify
  ) as Promise<StKSMDebtToken>;

export const deployAStETHDebtToken = async (
  poolAddress: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("AStETHDebtToken"),
    eContractid.AStETHDebtToken,
    [poolAddress],
    verify
  ) as Promise<AStETHDebtToken>;

export const deployMintableERC721Logic = async (verify?: boolean) => {
  return withSaveAndVerify(
    await getContractFactory("MintableERC721Logic"),
    eContractid.MintableERC721Logic,
    [],
    verify
  ) as Promise<MintableERC721Logic>;
};

export const deployMerkleVerifier = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("MerkleVerifier"),
    eContractid.MerkleVerifier,
    [],
    verify
  ) as Promise<MerkleVerifier>;

export const deployExecutionDelegate = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("ExecutionDelegate"),
    eContractid.ExecutionDelegate,
    [],
    verify
  ) as Promise<ExecutionDelegate>;

export const deployPolicyManager = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("PolicyManager"),
    eContractid.PolicyManager,
    [],
    verify
  ) as Promise<PolicyManager>;

export const deployStandardPolicyERC721 = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("StandardPolicyERC721"),
    eContractid.StandardPolicyERC721,
    [],
    verify
  ) as Promise<StandardPolicyERC721>;

export const deployBlurExchangeImpl = async (verify?: boolean) => {
  const merkleVerifier = await deployMerkleVerifier(verify);
  const blurExchangeLibraries = {
    ["contracts/dependencies/blur-exchange/MerkleVerifier.sol:MerkleVerifier"]:
      merkleVerifier.address,
  };
  const blurExchange = await getContractFactory(
    "BlurExchange",
    blurExchangeLibraries
  );

  return withSaveAndVerify(
    blurExchange,
    eContractid.BlurExchangeImpl,
    [],
    verify,
    false,
    blurExchangeLibraries
  ) as Promise<BlurExchange>;
};

export const deployBlurExchangeProxy = async (
  admin: string,
  blurExchange: string,
  initData: string,
  verify?: boolean
) => {
  return withSaveAndVerify(
    await getContractFactory("InitializableImmutableAdminUpgradeabilityProxy"),
    eContractid.BlurExchangeProxy,
    [admin, blurExchange, initData],
    verify,
    true
  ) as Promise<InitializableImmutableAdminUpgradeabilityProxy>;
};

export const deployBlurAdapter = async (
  provider: tEthereumAddress,
  policy: tEthereumAddress,
  verify?: boolean
) => {
  return withSaveAndVerify(
    await getContractFactory("BlurAdapter"),
    eContractid.BlurAdapter,
    [provider, policy],
    verify
  ) as Promise<BlurAdapter>;
};

export const deployTimeLockExecutor = async (
  args: string[],
  verify?: boolean
) => {
  return withSaveAndVerify(
    await getContractFactory("ExecutorWithTimelock"),
    eContractid.TimeLockExecutor,
    [...args],
    verify
  ) as Promise<ExecutorWithTimelock>;
};

export const deployAutoCompoundApeImpl = async (verify?: boolean) => {
  const allTokens = await getAllTokens();
  const apeCoinStaking =
    (await getContractAddressInDb(eContractid.ApeCoinStaking)) ||
    (await deployApeCoinStaking(verify)).address;
  const aclManager = await getACLManager();
  const args = [allTokens.APE.address, apeCoinStaking, aclManager.address];

  return withSaveAndVerify(
    await getContractFactory("AutoCompoundApe"),
    eContractid.cAPEImpl,
    [...args],
    verify
  ) as Promise<AutoCompoundApe>;
};

export const deployAutoCompoundApeProxy = async (verify?: boolean) => {
  const proxyInstance = await withSaveAndVerify(
    await getContractFactory("InitializableAdminUpgradeabilityProxy"),
    eContractid.cAPE,
    [],
    verify
  );

  return proxyInstance as InitializableAdminUpgradeabilityProxy;
};

export const deployAutoCompoundApeImplAndAssignItToProxy = async (
  verify?: boolean
) => {
  const cApeImplementation = await deployAutoCompoundApeImpl(verify);

  const deployer = await getFirstSigner();
  const deployerAddress = await deployer.getAddress();

  const initData =
    cApeImplementation.interface.encodeFunctionData("initialize");

  const proxyInstance = await getInitializableAdminUpgradeabilityProxy(
    (
      await getAutoCompoundApe()
    ).address
  );

  await waitForTx(
    await proxyInstance["initialize(address,address,bytes)"](
      cApeImplementation.address,
      deployerAddress,
      initData,
      GLOBAL_OVERRIDES
    )
  );
};

export const deployP2PPairStakingImpl = async (verify?: boolean) => {
  const allTokens = await getAllTokens();
  const protocolDataProvider = await getProtocolDataProvider();
  const nBAYC = (
    await protocolDataProvider.getReserveTokensAddresses(allTokens.BAYC.address)
  ).xTokenAddress;
  const nMAYC = (
    await protocolDataProvider.getReserveTokensAddresses(allTokens.MAYC.address)
  ).xTokenAddress;
  const nBAKC = (
    await protocolDataProvider.getReserveTokensAddresses(allTokens.BAKC.address)
  ).xTokenAddress;
  const apeCoinStaking =
    (await getContractAddressInDb(eContractid.ApeCoinStaking)) ||
    (await deployApeCoinStaking(verify)).address;
  const paraSpaceConfig = getParaSpaceConfig();
  const delegationRegistry =
    paraSpaceConfig.DelegationRegistry ||
    (await getDelegationRegistry()).address;
  const args = [
    allTokens.BAYC.address,
    allTokens.MAYC.address,
    allTokens.BAKC.address,
    nBAYC,
    nMAYC,
    nBAKC,
    allTokens.APE.address,
    allTokens.cAPE.address,
    apeCoinStaking,
    delegationRegistry,
  ];

  return withSaveAndVerify(
    await getContractFactory("P2PPairStaking"),
    eContractid.P2PPairStakingImpl,
    [...args],
    verify
  ) as Promise<P2PPairStaking>;
};

export const deployP2PPairStaking = async (verify?: boolean) => {
  const p2pImplementation = await deployP2PPairStakingImpl(verify);

  const deployer = await getFirstSigner();
  const deployerAddress = await deployer.getAddress();

  const initData = p2pImplementation.interface.encodeFunctionData("initialize");

  const proxyInstance = await withSaveAndVerify(
    await getContractFactory("InitializableAdminUpgradeabilityProxy"),
    eContractid.P2PPairStaking,
    [],
    verify
  );

  await waitForTx(
    await (proxyInstance as InitializableAdminUpgradeabilityProxy)[
      "initialize(address,address,bytes)"
    ](p2pImplementation.address, deployerAddress, initData, GLOBAL_OVERRIDES)
  );

  return await getP2PPairStaking(proxyInstance.address);
};

export const deployAutoYieldApeImpl = async (verify?: boolean) => {
  const allTokens = await getAllTokens();
  const apeCoinStaking =
    (await getContractAddressInDb(eContractid.ApeCoinStaking)) ||
    (await deployApeCoinStaking(verify)).address;
  const pool = await getPoolProxy();
  const swapRouter = await getUniswapV3SwapRouter();
  const aclManager = await getACLManager();
  const args = [
    apeCoinStaking,
    allTokens.APE.address,
    allTokens.USDC.address,
    pool.address,
    swapRouter.address,
    aclManager.address,
  ];

  return withSaveAndVerify(
    await getContractFactory("AutoYieldApe"),
    eContractid.yAPEImpl,
    [...args],
    verify
  ) as Promise<AutoYieldApe>;
};

export const deployAutoYieldApeProxy = async (verify?: boolean) => {
  const proxyInstance = await withSaveAndVerify(
    await getContractFactory("InitializableAdminUpgradeabilityProxy"),
    eContractid.yAPE,
    [],
    verify
  );

  return proxyInstance as InitializableAdminUpgradeabilityProxy;
};

export const deployAutoYieldApeImplAndAssignItToProxy = async (
  verify?: boolean
) => {
  const yApeImplementation = await deployAutoYieldApeImpl(verify);

  const deployer = await getFirstSigner();
  const deployerAddress = await deployer.getAddress();

  const initData =
    yApeImplementation.interface.encodeFunctionData("initialize");

  const proxyInstance = await getInitializableAdminUpgradeabilityProxy(
    (
      await getAutoYieldApe()
    ).address
  );

  await waitForTx(
    await proxyInstance["initialize(address,address,bytes)"](
      yApeImplementation.address,
      deployerAddress,
      initData,
      GLOBAL_OVERRIDES
    )
  );
};

export const deployHelperContractImpl = async (
  cApeV1: tEthereumAddress,
  verify?: boolean
) => {
  const allTokens = await getAllTokens();
  const protocolDataProvider = await getProtocolDataProvider();
  const pCApe = (
    await protocolDataProvider.getReserveTokensAddresses(allTokens.cAPE.address)
  ).xTokenAddress;
  const pool = await getPoolProxy();
  const args = [
    allTokens.APE.address,
    cApeV1,
    allTokens.cAPE.address,
    pCApe,
    pool.address,
  ];

  return withSaveAndVerify(
    await getContractFactory("HelperContract"),
    eContractid.HelperContractImpl,
    [...args],
    verify
  ) as Promise<HelperContract>;
};

export const deployHelperContract = async (
  cApeV1: tEthereumAddress,
  verify?: boolean
) => {
  const helperImplementation = await deployHelperContractImpl(cApeV1, verify);

  const deployer = await getFirstSigner();
  const deployerAddress = await deployer.getAddress();

  const initData =
    helperImplementation.interface.encodeFunctionData("initialize");

  const proxyInstance = await withSaveAndVerify(
    await getContractFactory("InitializableAdminUpgradeabilityProxy"),
    eContractid.HelperContract,
    [],
    verify
  );

  await waitForTx(
    await (proxyInstance as InitializableAdminUpgradeabilityProxy)[
      "initialize(address,address,bytes)"
    ](helperImplementation.address, deployerAddress, initData, GLOBAL_OVERRIDES)
  );

  return await getHelperContract(proxyInstance.address);
};

export const deployPTokenCApe = async (
  poolAddress: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("PTokenCApe"),
    eContractid.PTokenCApeImpl,
    [poolAddress],
    verify
  ) as Promise<PTokenCApe>;

export const deployCApeDebtToken = async (
  poolAddress: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("CApeDebtToken"),
    eContractid.CApeDebtToken,
    [poolAddress],
    verify
  ) as Promise<CApeDebtToken>;

export const deployPYieldToken = async (
  poolAddress: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("PYieldToken"),
    eContractid.PYieldTokenImpl,
    [poolAddress],
    verify
  ) as Promise<PYieldToken>;

export const deployCLwstETHSynchronicityPriceAdapter = async (
  stETHAggregator: tEthereumAddress,
  stETH: tEthereumAddress,
  decimals: number,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("CLwstETHSynchronicityPriceAdapter"),
    eContractid.Aggregator.concat(upperFirst(eContractid.WStETH)),
    [stETHAggregator, stETH, decimals],
    verify
  ) as Promise<CLwstETHSynchronicityPriceAdapter>;

export const deployExchangeRateSynchronicityPriceAdapter = async (
  asset: tEthereumAddress,
  symbol: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("CLExchangeRateSynchronicityPriceAdapter"),
    eContractid.Aggregator.concat(upperFirst(symbol)),
    [asset],
    verify
  ) as Promise<CLExchangeRateSynchronicityPriceAdapter>;

export const deployCTokenSynchronicityPriceAdapter = async (
  asset: tEthereumAddress,
  symbol: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("CLCETHSynchronicityPriceAdapter"),
    eContractid.Aggregator.concat(upperFirst(symbol)),
    [asset],
    verify
  ) as Promise<CLCETHSynchronicityPriceAdapter>;

export const deployFixedPriceSynchronicityPriceAdapter = async (
  fixedPrice: string,
  symbol: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("CLFixedPriceSynchronicityPriceAdapter"),
    eContractid.Aggregator.concat(upperFirst(symbol)),
    [fixedPrice],
    verify
  ) as Promise<CLFixedPriceSynchronicityPriceAdapter>;

export const deployParaSpaceAirdrop = async (
  token: tEthereumAddress,
  deadline: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("ParaSpaceAirdrop"),
    eContractid.ParaSpaceAirdrop,
    [token, deadline],
    verify
  ) as Promise<ParaSpaceAirdrop>;

export const deployTimeLockImpl = async (
  provider: tEthereumAddress,
  verify?: boolean
) => {
  const allTokens = await getAllTokens();
  const wPunks = allTokens.WPUNKS?.address || ZERO_ADDRESS;
  const instance = await withSaveAndVerify(
    await getContractFactory("TimeLock"),
    eContractid.TimeLockImpl,
    [provider, wPunks],
    verify
  );
  return instance as TimeLock;
};

export const deployTimeLockProxy = async (verify?: boolean) => {
  const proxyInstance = await withSaveAndVerify(
    await getContractFactory("InitializableAdminUpgradeabilityProxy"),
    eContractid.TimeLockProxy,
    [],
    verify
  );

  return proxyInstance as InitializableAdminUpgradeabilityProxy;
};

export const deployTimeLockImplAndAssignItToProxy = async (
  provider: tEthereumAddress,
  verify?: boolean
) => {
  const proxyInstance = await getInitializableAdminUpgradeabilityProxy(
    (
      await getTimeLockProxy()
    ).address
  );

  const impl = await deployTimeLockImpl(provider, verify);

  const deployer = await getFirstSigner();
  const deployerAddress = await deployer.getAddress();

  const initData = impl.interface.encodeFunctionData("initialize");

  await waitForTx(
    await proxyInstance["initialize(address,address,bytes)"](
      impl.address,
      deployerAddress,
      initData,
      GLOBAL_OVERRIDES
    )
  );
};

export const deployReserveTimeLockStrategy = async (
  name: string,
  pool: string,
  minThreshold: string,
  midThreshold: string,
  minWaitTime: string,
  midWaitTime: string,
  maxWaitTime: string,
  maxPoolPeriodRate: string,
  maxPoolPeriodWaitTime: string,
  period: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("DefaultTimeLockStrategy"),
    name,
    [
      pool,
      minThreshold,
      midThreshold,
      minWaitTime,
      midWaitTime,
      maxWaitTime,
      maxPoolPeriodRate,
      maxPoolPeriodWaitTime,
      period,
    ],
    verify
  ) as Promise<DefaultTimeLockStrategy>;

export const deployOtherdeedNTokenImpl = async (
  poolAddress: tEthereumAddress,
  warmWallet: tEthereumAddress,
  delegationRegistryAddress: tEthereumAddress,
  verify?: boolean
) => {
  const mintableERC721Logic =
    (await getContractAddressInDb(eContractid.MintableERC721Logic)) ||
    (await deployMintableERC721Logic(verify)).address;

  const libraries = {
    ["contracts/protocol/tokenization/libraries/MintableERC721Logic.sol:MintableERC721Logic"]:
      mintableERC721Logic,
  };
  return withSaveAndVerify(
    await getContractFactory("NTokenOtherdeed", libraries),
    eContractid.NTokenOtherdeedImpl,
    [poolAddress, warmWallet, delegationRegistryAddress],
    verify,
    false,
    libraries
  ) as Promise<NTokenOtherdeed>;
};

export const deployChromieSquiggleNTokenImpl = async (
  poolAddress: tEthereumAddress,
  delegationRegistryAddress: tEthereumAddress,
  verify?: boolean
) => {
  const mintableERC721Logic =
    (await getContractAddressInDb(eContractid.MintableERC721Logic)) ||
    (await deployMintableERC721Logic(verify)).address;

  const libraries = {
    ["contracts/protocol/tokenization/libraries/MintableERC721Logic.sol:MintableERC721Logic"]:
      mintableERC721Logic,
  };
  const [startTokenId, endTokenId] = isMainnet() ? [0, 9763] : [0, 20];

  return withSaveAndVerify(
    await getContractFactory("NTokenChromieSquiggle", libraries),
    eContractid.NTokenChromieSquiggleImpl,
    [poolAddress, delegationRegistryAddress, startTokenId, endTokenId],
    verify,
    false,
    libraries
  ) as Promise<NTokenStakefish>;
};

export const deployStakefishNTokenImpl = async (
  poolAddress: tEthereumAddress,
  delegationRegistryAddress: tEthereumAddress,
  verify?: boolean
) => {
  const mintableERC721Logic =
    (await getContractAddressInDb(eContractid.MintableERC721Logic)) ||
    (await deployMintableERC721Logic(verify)).address;

  const libraries = {
    ["contracts/protocol/tokenization/libraries/MintableERC721Logic.sol:MintableERC721Logic"]:
      mintableERC721Logic,
  };
  return withSaveAndVerify(
    await getContractFactory("NTokenStakefish", libraries),
    eContractid.NTokenStakefishImpl,
    [poolAddress, delegationRegistryAddress],
    verify,
    false,
    libraries
  ) as Promise<NTokenStakefish>;
};

export const deployHotWalletProxy = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("HotWalletProxy"),
    eContractid.HotWalletProxy,
    [],
    verify
  ) as Promise<HotWalletProxy>;

export const deployDelegationRegistry = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("DelegateRegistry"),
    eContractid.DelegationRegistry,
    [],
    verify
  ) as Promise<DelegateRegistry>;

export const deployStakefishValidatorFactory = async (
  genesisImplementation: tEthereumAddress,
  operator: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("StakefishValidatorFactory"),
    eContractid.StakefishValidatorFactory,
    [genesisImplementation, operator],
    verify
  ) as Promise<StakefishValidatorFactory>;

export const deployStakefishNFTManager = async (
  factory: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("StakefishNFTManager"),
    eContractid.SFVLDR,
    [factory],
    verify
  ) as Promise<StakefishNFTManager>;

export const deployDepositContract = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("DepositContract"),
    eContractid.DepositContract,
    [],
    verify
  ) as Promise<DepositContract>;

export const deployStakefishValidator = async (
  depositContract: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("StakefishValidatorV1"),
    eContractid.StakefishValidator,
    [depositContract],
    verify
  ) as Promise<StakefishValidatorV1>;

export const deployAccount = async (
  entryPoint: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("Account"),
    eContractid.Account,
    [entryPoint],
    verify
  ) as Promise<Account>;

export const deployAccountFactory = async (
  entryPoint: tEthereumAddress,
  verify?: boolean
) => {
  const accountImpl = await deployAccount(entryPoint, verify);
  const accountRegistry = await deployAccountRegistry(
    accountImpl.address,
    verify
  );
  return withSaveAndVerify(
    await getContractFactory("AccountFactory"),
    eContractid.AccountFactory,
    [accountRegistry.address],
    verify
  ) as Promise<AccountFactory>;
};

export const deployAccountRegistry = async (
  impl: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("AccountRegistry"),
    eContractid.AccountRegistry,
    [impl],
    verify
  ) as Promise<AccountRegistry>;

////////////////////////////////////////////////////////////////////////////////
//  MOCK
////////////////////////////////////////////////////////////////////////////////
export const deployGenericPToken = async (
  [
    poolAddress,
    underlyingAssetAddress,
    treasuryAddress,
    incentivesController,
    name,
    symbol,
  ]: [
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    string,
    string
  ],
  verify?: boolean
) => {
  const instance = await withSaveAndVerify(
    await getContractFactory("PToken"),
    eContractid.PTokenImpl,
    [poolAddress],
    verify
  );

  await instance.initialize(
    poolAddress,
    treasuryAddress,
    underlyingAssetAddress,
    incentivesController,
    "18",
    name,
    symbol,
    "0x10"
  );

  return instance;
};

export const deployDelegationAwarePToken = async (
  [
    poolAddress,
    underlyingAssetAddress,
    treasuryAddress,
    incentivesController,
    name,
    symbol,
  ]: [
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    string,
    string
  ],
  verify?: boolean
) => {
  const instance = await withSaveAndVerify(
    await getContractFactory("DelegationAwarePToken"),
    eContractid.DelegationAwarePTokenImpl,
    [poolAddress],
    verify
  );

  await instance.initialize(
    poolAddress,
    treasuryAddress,
    underlyingAssetAddress,
    incentivesController,
    "18",
    name,
    symbol,
    "0x10"
  );

  return instance;
};

export const deployMockVariableDebtToken = async (
  args: [
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    string,
    string,
    string
  ],
  verify?: boolean
) => {
  const instance = (await withSaveAndVerify(
    await getContractFactory("MockVariableDebtToken"),
    eContractid.MockVariableDebtToken,
    [args[0]],
    verify
  )) as MockVariableDebtToken;

  await instance.initialize(
    args[0],
    args[1],
    args[2],
    "18",
    args[3],
    args[4],
    args[5],
    GLOBAL_OVERRIDES
  );

  return instance;
};

export const deployMockNToken = async (
  args: [
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    string,
    string,
    string
  ],
  verify?: boolean
) => {
  const mintableERC721Logic =
    (await getContractAddressInDb(eContractid.MintableERC721Logic)) ||
    (await deployMintableERC721Logic(verify)).address;

  const libraries = {
    ["contracts/protocol/tokenization/libraries/MintableERC721Logic.sol:MintableERC721Logic"]:
      mintableERC721Logic,
  };

  const instance = (await withSaveAndVerify(
    await getContractFactory("MockNToken", libraries),
    eContractid.MockNToken,
    [args[0], ZERO_ADDRESS, false],
    verify
  )) as MockNToken;

  await instance.initialize(
    args[0],
    args[1],
    args[2],
    args[3],
    args[4],
    args[5],
    GLOBAL_OVERRIDES
  );

  return instance;
};

export const deployMockPToken = async (
  args: [
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    string,
    string,
    string
  ],
  verify?: boolean
) => {
  const instance = (await withSaveAndVerify(
    await getContractFactory("MockPToken"),
    eContractid.MockPToken,
    [args[0]],
    verify
  )) as MockPToken;

  await instance.initialize(
    args[0],
    args[2],
    args[1],
    args[3],
    "18",
    args[4],
    args[5],
    args[6],
    GLOBAL_OVERRIDES
  );

  return instance;
};

export const deployMockIncentivesController = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("MockIncentivesController"),
    eContractid.MockIncentivesController,
    [],
    verify
  ) as Promise<MockIncentivesController>;

export const deployMockReserveConfiguration = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("MockReserveConfiguration"),
    eContractid.MockReserveConfiguration,
    [],
    verify
  ) as Promise<MockReserveConfiguration>;

export const deployMockInitializableImple = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("MockInitializableImple"),
    eContractid.MockInitializableImple,
    [],
    verify
  ) as Promise<MockInitializableImple>;

export const deployMockInitializableImpleV2 = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("MockInitializableImpleV2"),
    eContractid.MockInitializableImpleV2,
    [],
    verify
  ) as Promise<MockInitializableImpleV2>;

export const deployMockInitializableFromConstructorImple = async (
  args: [string],
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("MockInitializableFromConstructorImple"),
    eContractid.MockInitializableFromConstructorImple,
    [...args],
    verify
  ) as Promise<MockInitializableFromConstructorImple>;

export const deployMockReentrantInitializableImple = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("MockReentrantInitializableImple"),
    eContractid.MockReentrantInitializableImple,
    [],
    verify
  ) as Promise<MockReentrantInitializableImple>;

export const deployMockTokenFaucet = async (
  erc20configs,
  erc721configs,
  punkConfig,
  verify?: boolean
) =>
  withSaveAndVerify(
    await getContractFactory("MockTokenFaucet"),
    eContractid.MockTokenFaucet,
    [erc20configs, erc721configs, punkConfig],
    verify
  );

export const deployMockedDelegateRegistry = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("MockedDelegateRegistry"),
    eContractid.MockedDelegateRegistry,
    [],
    verify
  ) as Promise<MockedDelegateRegistry>;

export const deployMockFeePool = async (verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("MockFeePool"),
    eContractid.MockFeePool,
    [],
    verify
  ) as Promise<MockFeePool>;

export const deployMockBendDaoLendPool = async (weth, verify?: boolean) =>
  withSaveAndVerify(
    await getContractFactory("MockLendPool"),
    eContractid.MockBendDaoLendPool,
    [weth],
    verify
  );
////////////////////////////////////////////////////////////////////////////////
//  PLS ONLY APPEND MOCK CONTRACTS HERE!
////////////////////////////////////////////////////////////////////////////////
