import dotenv from "dotenv";
import {BigNumberish, ethers} from "ethers";
import fs from "fs";
import {HttpNetworkAccountsUserConfig} from "hardhat/types";
import {input} from "./wallet-helpers";
import {version} from "../package.json";
import git from "git-rev-sync";
import {AccessListish} from "ethers/lib/utils";
import {ZERO_ADDRESS} from "./constants";

dotenv.config();

const getPrivateKeyfromEncryptedJson = (
  keystorePath: string | undefined
): string =>
  keystorePath && fs.existsSync(keystorePath)
    ? ethers.Wallet.fromEncryptedJsonSync(
        fs.readFileSync(keystorePath, "utf8"),
        DEPLOYER_PASSWORD || input("password: ")
      ).privateKey
    : "";

export const HARDHAT_CHAINID = 31337;
export const GOERLI_CHAINID = 5;
export const SEPOLIA_CHAINID = 11155111;
export const FORK_CHAINID = 522;
export const MAINNET_CHAINID = 1;
export const PARALLEL_CHAINID = 1024;
export const PARALLEL_DEV_CHAINID = 2982896226593698;
export const MOONBEAM_CHAINID = 1284;
export const MOONBASE_CHAINID = 1287;
export const ARBITRUM_ONE_CHAINID = 42161;
export const ARBITRUM_GOERLI_CHAINID = 421613;
export const ARBITRUM_SEPOLIA_CHAINID = 421613;
export const POLYGON_CHAINID = 137;
export const POLYGON_ZKEVM_CHAINID = 1101;
export const POLYGON_ZKEVM_GOERLI_CHAINID = 1442;
export const POLYGON_MUMBAI_CHAINID = 80001;
export const ZKSYNC_CHAINID = 324;
export const ZKSYNC_GOERLI_CHAINID = 280;
export const LINEA_GOERLI_CHAINID = 59140;
export const LINEA_CHAINID = 59144;
export const MANTA_CHAINID = 169;
export const MANTA_TEST_CHAINID = 3441005;
export const NEON_CHAINID = 245022934;

export const INFURA_KEY = process.env.INFURA_KEY || "";
export const ALCHEMY_KEY = process.env.ALCHEMY_KEY || "";

export const TENDERLY_FORK_ID = process.env.TENDERLY_FORK_ID || "";
export const TENDERLY_HEAD_ID = process.env.TENDERLY_HEAD_ID || "";
export const TENDERLY = process.env.TENDERLY === "true";
export const TENDERLY_PROJECT = process.env.TENDERLY_PROJECT || "";
export const TENDERLY_USERNAME = process.env.TENDERLY_USERNAME || "";

export const DEFENDER = process.env.DEFENDER === "true";
export const DEFENDER_API_KEY = process.env.DEFENDER_API_KEY || "";
export const DEFENDER_SECRET_KEY = process.env.DEFENDER_SECRET_KEY || "";

export const FORK = process.env.FORK || "";
export const FORK_BLOCK_NUMBER = process.env.FORK_BLOCK_NUMBER
  ? parseInt(process.env.FORK_BLOCK_NUMBER)
  : 0;

export const DEFAULT_BLOCK_GAS_LIMIT = 40000000;
export const HARDFORK = "london";
export const MOCHA_JOBS = parseInt(process.env.MOCHA_JOBS || "4");

export const REPORT_GAS = process.env.REPORT_GAS == "true" ? true : false;

export const DB_PATH = process.env.DB_PATH ?? ":memory:";

export const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY || "";
export const GOERLI_ETHERSCAN_KEY =
  process.env.GOERLI_ETHERSCAN_KEY || ETHERSCAN_KEY;
export const SEPOLIA_ETHERSCAN_KEY =
  process.env.SEPOLIA_ETHERSCAN_KEY || ETHERSCAN_KEY;
export const ARBITRUM_ETHERSCAN_KEY =
  process.env.ARBITRUM_ETHERSCAN_KEY || ETHERSCAN_KEY;
export const ARBITRUM_GOERLI_ETHERSCAN_KEY =
  process.env.ARBITRUM_GOERLI_ETHERSCAN_KEY || ARBITRUM_ETHERSCAN_KEY;
export const ARBITRUM_SEPOLIA_ETHERSCAN_KEY =
  process.env.ARBITRUM_SEPOLIA_ETHERSCAN_KEY || ARBITRUM_ETHERSCAN_KEY;
export const PARALLEL_DEV_ETHERSCAN_KEY =
  process.env.PARALLEL_DEV_ETHERSCAN_KEY || ETHERSCAN_KEY;
export const POLYGON_ETHERSCAN_KEY =
  process.env.POLYGON_ETHERSCAN_KEY || ETHERSCAN_KEY;
export const POLYGON_MUMBAI_ETHERSCAN_KEY =
  process.env.POLYGON_MUMBAI_ETHERSCAN_KEY || POLYGON_ETHERSCAN_KEY;
export const POLYGON_ZKEVM_ETHERSCAN_KEY =
  process.env.POLYGON_ZKEVM_ETHERSCAN_KEY || POLYGON_ETHERSCAN_KEY;
export const POLYGON_ZKEVM_GOERLI_ETHERSCAN_KEY =
  process.env.POLYGON_ZKEVM_GOERLI_ETHERSCAN_KEY || POLYGON_ZKEVM_ETHERSCAN_KEY;
export const MOONBEAM_ETHERSCAN_KEY =
  process.env.MOONBEAM_ETHERSCAN_KEY || ETHERSCAN_KEY;
export const MOONBASE_ETHERSCAN_KEY =
  process.env.MOONBASE_ETHERSCAN_KEY || MOONBEAM_ETHERSCAN_KEY;
export const LINEA_ETHERSCAN_KEY =
  process.env.LINEA_ETHERSCAN_KEY || ETHERSCAN_KEY;
export const LINEA_GOERLI_ETHERSCAN_KEY =
  process.env.LINEA_GOERLI_ETHERSCAN_KEY || LINEA_ETHERSCAN_KEY;
export const ETHERSCAN_VERIFICATION =
  process.env.ETHERSCAN_VERIFICATION === "true" ? true : false;
export const ETHERSCAN_VERIFICATION_PROVIDER =
  process.env.ETHERSCAN_VERIFICATION_PROVIDER || "hardhat";
export const ETHERSCAN_VERIFICATION_CONTRACTS =
  process.env.ETHERSCAN_VERIFICATION_CONTRACTS?.trim().split(/\s?,\s?/);
export const ETHERSCAN_VERIFICATION_JOBS = parseInt(
  process.env.ETHERSCAN_VERIFICATION_JOBS || "1"
);
export const ETHERSCAN_VERIFICATION_MAX_RETRIES = parseInt(
  process.env.ETHERSCAN_VERIFICATION_MAX_RETRIES || "3"
);
export const NEON_ETHERSCAN_KEY =
  process.env.NEON_ETHERSCAN_KEY || ETHERSCAN_KEY;
export const PARALLEL_ETHERSCAN_KEY =
  process.env.PARALLEL_ETHERSCAN_KEY || ETHERSCAN_KEY;

export const ETHERSCAN_NETWORKS = [
  "localhost",
  "mainnet",
  "goerli",
  "arbitrum",
  "arbitrumGoerli",
  "arbitrumSepolia",
  "parallelDev",
  "polygon",
  "matic",
  "polygonMumbai",
  "polygonZkevm",
  "polygonZkevmGoerli",
  "zksync",
  "zksyncGoerli",
  "linea",
  "lineaGoerli",
  "moonbeam",
  "moonbase",
  "neon",
  "parallel",
];
export const ETHERSCAN_APIS = {
  localhost: "http://localhost:4000/api",
  mainnet: "https://api.etherscan.io/api",
  goerli: "https://api-goerli.etherscan.io/api",
  arbitrum: "https://api.arbiscan.io/api",
  arbitrumGoerli: "https://api-goerli.arbiscan.io/api",
  arbitrumSepolia: "https://api-sepolia.arbiscan.io/api",
  parallelDev:
    "https://explorerl2new-surprised-harlequin-bonobo-fvcy2k9oqh.t.conduit.xyz/api",
  polygon: "https://api.polygonscan.com/api",
  matic: "https://api.polygonscan.com/api",
  polygonMumbai: "https://api-mumbai.polygonscan.com/api",
  polygonZkevm: "https://api-zkevm.polygonscan.com/api",
  polygonZkevmGoerli: "https://api-testnet-zkevm.polygonscan.com/api",
  zksync: "https://zksync2-mainnet-explorer.zksync.io/contract_verification",
  zksyncGoerli:
    "https://zksync2-testnet-explorer.zksync.dev/contract_verification",
  moonbeam: "https://api-moonbeam.moonscan.io/api",
  moonbase: "https://api-moonbase.moonscan.io/api",
  linea: "http://explorer.linea.build/api",
  lineaGoerli: "https://explorer.goerli.linea.build/api",
  neon: "https://neonscan.org/api",
  parallel: "https://explorer.parallel.fi/api",
};
export const BROWSER_URLS = {
  localhost: "http://localhost:4000",
  mainnet: "https://etherscan.io",
  goerli: "https://goerli.etherscan.io",
  arbitrum: "https://arbiscan.io",
  arbitrumGoerli: "https://goerli.arbiscan.io",
  arbitrumSepolia: "https://sepolia.arbiscan.io",
  polygonZkevm: "https://zkevm.polygonscan.com",
  polygonZkevmGoerli: "https://testnet-zkevm.polygonscan.com",
  parallelDev:
    "https://explorerl2new-surprised-harlequin-bonobo-fvcy2k9oqh.t.conduit.xyz",
  polygon: "https://polygonscan.com",
  matic: "https://polygonscan.com",
  polygonMumbai: "https://mumbai.polygonscan.com",
  zksync: "https://zksync2-mainnet-explorer.zksync.io",
  zksyncGoerli: "https://zksync2-testnet-explorer.zksync.dev",
  moonbeam: "https://moonscan.io",
  moonbase: "https://moonbase.moonscan.io",
  linea: "https://explorer.linea.build",
  lineaGoerli: "https://explorer.goerli.linea.build",
  neon: "https://neonscan.org",
  parallel: "https://explorer.parallel.fi",
};

export const DEPLOY_START = parseInt(process.env.DEPLOY_START || "0");
export const DEPLOY_END = parseInt(process.env.DEPLOY_END || "25");
export const DEPLOY_INCREMENTAL =
  process.env.DEPLOY_INCREMENTAL == "true" ? true : false;

export const KEYSTORE_PATH = "keystore";
export const DEPLOYER_PRIVATE_KEY = (
  process.env.DEPLOYER_PRIVATE_KEY ||
  getPrivateKeyfromEncryptedJson(process.env.DEPLOYER_KEYSTORE_PATH)
).trim();
export const DEPLOYER_MNEMONIC = (
  process.env.DEPLOYER_MNEMONIC ||
  "test test test test test test test test test test test junk"
).trim();
export const DEPLOYER_PASSWORD = process.env.DEPLOYER_PASSWORD || "";
export const DEPLOYER: HttpNetworkAccountsUserConfig = DEPLOYER_PRIVATE_KEY
  ? [DEPLOYER_PRIVATE_KEY]
  : {
      mnemonic: DEPLOYER_MNEMONIC,
    };

export const BLOCKSCOUT_DISABLE_INDEXER =
  process.env.BLOCKSCOUT_DISABLE_INDEXER == "false" ? false : true;

export interface Overrides {
  gasLimit?: BigNumberish;
  gasPrice?: BigNumberish;
  maxFeePerGas?: BigNumberish;
  maxPriorityFeePerGas?: BigNumberish;
  nonce?: BigNumberish;
  type?: number;
  accessList?: AccessListish;
  customData?: Record<string, any>;
  ccipReadEnabled?: boolean;
}

export const GLOBAL_OVERRIDES: Overrides = {
  // maxFeePerGas: ethers.utils.parseUnits("20", "gwei"),
  // maxPriorityFeePerGas: ethers.utils.parseUnits("1.5", "gwei"),
  type: 2,
  // gasLimit: 30_000_000,
};

export const L1_RPC_URL = process.env.L1_RPC_URL || "";
export const L2_RPC_URL = process.env.L2_RPC_URL || "";
export const RPC_URL = process.env.RPC_URL || L1_RPC_URL || L2_RPC_URL || "";
export const JSONRPC_VARIANT = process.env.JSONRPC_VARIANT || "hardhat";
export const VERBOSE = process.env.VERBOSE == "true" ? true : false;
export const DRY_RUN = process.env.DRY_RUN || "";

export const TIME_LOCK_BUFFERING_TIME = parseInt(
  process.env.TIME_LOCK_BUFFERING_TIME || "14400"
);
export const TIME_LOCK_DEFAULT_OPERATION =
  process.env.TIME_LOCK_DEFAULT_OPERATION || "queue";

export const IMPERSONATE_ADDRESS = process.env.IMPERSONATE_ADDRESS || "";
export const MULTI_SIG = process.env.MULTI_SIG || "";
export const MULTI_SEND = process.env.MULTI_SEND || "";
export const MULTI_SIG_NONCE = process.env.MULTI_SIG_NONCE
  ? parseInt(process.env.MULTI_SIG_NONCE)
  : undefined;
export const MULTI_SEND_CHUNK_SIZE = parseInt(
  process.env.MULTI_SEND_CHUNK_SIZE || "45"
);

export const VERSION = version;
export const COMMIT = git.short();
export const COMPILER_OPTIMIZER_RUNS = 200;
export const COMPILER_VERSION = "0.8.21";
export const PKG_DATA = {
  version: VERSION,
  git: {
    commit: COMMIT,
  },
  compiler: {
    version: "v" + COMPILER_VERSION,
    optimizer: {
      runs: COMPILER_OPTIMIZER_RUNS,
    },
  },
};

export const FLASHBOTS_RELAY_RPC = "https://relay.flashbots.net";

export const TIME_LOCK_SIGS = {
  "0xc1a287e2": "GRACE_PERIOD()",
  "0x7d645fab": "MAXIMUM_DELAY()",
  "0xb1b43ae5": "MINIMUM_DELAY()",
  "0x0e18b681": "acceptAdmin()",
  "0x1dc40b51": "cancelTransaction(address,uint256,string,bytes,uint256,bool)",
  "0x8902ab65": "executeTransaction(address,uint256,string,bytes,uint256,bool)",
  "0x6e9960c3": "getAdmin()",
  "0xcebc9a82": "getDelay()",
  "0xd0468156": "getPendingAdmin()",
  "0xb1fc8796": "isActionQueued(bytes32)",
  "0x8d8fe2e3": "queueTransaction(address,uint256,string,bytes,uint256,bool)",
  "0xe177246e": "setDelay(uint256)",
  "0x4dd18bf5": "setPendingAdmin(address)",
};

export const ZK_LIBRARIES_PATH = "zk-libraries.json";
export const ZK_LIBRARIES = fs.existsSync(ZK_LIBRARIES_PATH)
  ? JSON.parse(fs.readFileSync(ZK_LIBRARIES_PATH, "utf8"))
  : {
      "contracts/protocol/libraries/logic/BorrowLogic.sol": {
        BorrowLogic: ZERO_ADDRESS,
      },
      "contracts/protocol/libraries/logic/SupplyLogic.sol": {
        SupplyLogic: ZERO_ADDRESS,
      },
      "contracts/protocol/libraries/logic/SupplyExtendedLogic.sol": {
        SupplyExtendedLogic: ZERO_ADDRESS,
      },
      "contracts/protocol/libraries/logic/LiquidationLogic.sol": {
        LiquidationLogic: ZERO_ADDRESS,
      },
      "contracts/protocol/libraries/logic/AuctionLogic.sol": {
        AuctionLogic: ZERO_ADDRESS,
      },
      "contracts/protocol/libraries/logic/PositionMoverLogic.sol": {
        PositionMoverLogic: ZERO_ADDRESS,
      },
      "contracts/protocol/libraries/logic/PoolLogic.sol": {
        PoolLogic: ZERO_ADDRESS,
      },
      "contracts/protocol/libraries/logic/MarketplaceLogic.sol": {
        MarketplaceLogic: ZERO_ADDRESS,
      },
      "contracts/protocol/libraries/logic/FlashClaimLogic.sol": {
        FlashClaimLogic: ZERO_ADDRESS,
      },
      "contracts/protocol/tokenization/libraries/ApeStakingLogic.sol": {
        ApeStakingLogic: ZERO_ADDRESS,
      },
      "contracts/protocol/tokenization/libraries/MintableERC721Logic.sol": {
        MintableERC721Logic: ZERO_ADDRESS,
      },
      "contracts/protocol/libraries/logic/ConfiguratorLogic.sol": {
        ConfiguratorLogic: ZERO_ADDRESS,
      },
      "contracts/dependencies/blur-exchange/MerkleVerifier.sol": {
        MerkleVerifier: ZERO_ADDRESS,
      },
    };

export const DEPLOY_MAX_RETRIES = parseInt(
  process.env.DEPLOY_MAX_RETRIES || "6"
);
export const DEPLOY_RETRY_INTERVAL = parseInt(
  process.env.DEPLOY_RETRY_INTERVAL || "1500"
);

export const eContractidToContractName = {
  PoolAddressesProvider: "PoolAddressesProvider",
  MintableERC20: "MintableERC20",
  MintableERC721: "MintableERC721",
  MintableDelegationERC20: "MintableDelegationERC20",
  PoolAddressesProviderRegistry: "PoolAddressesProviderRegistry",
  ACLManager: "ACLManager",
  PoolConfiguratorProxy: "PoolConfiguratorProxy",
  ValidationLogic: "ValidationLogic",
  ReserveLogic: "ReserveLogic",
  GenericLogic: "GenericLogic",
  SupplyLogic: "SupplyLogic",
  BorrowLogic: "BorrowLogic",
  LiquidationLogic: "LiquidationLogic",
  AuctionLogic: "AuctionLogic",
  PoolLogic: "PoolLogic",
  ConfiguratorLogic: "ConfiguratorLogic",
  PoolProxy: "ParaProxy",
  PriceOracle: "PriceOracle",
  Aggregator: "Aggregator",
  ParaSpaceOracle: "ParaSpaceOracle",
  DefaultReserveInterestRateStrategy: "DefaultReserveInterestRateStrategy",
  DefaultReserveAuctionStrategy: "DefaultReserveAuctionStrategy",
  MockReserveAuctionStrategy: "MockReserveAuctionStrategy",
  InitializableImmutableAdminUpgradeabilityProxy:
    "InitializableImmutableAdminUpgradeabilityProxy",
  MockFlashLoanReceiver: "MockFlashLoanReceiver",
  PTokenImpl: "PToken",
  PTokenSApeImpl: "PTokenSApe",
  PTokenATokenImpl: "PTokenAToken",
  PTokenStETHImpl: "PTokenStETH",
  PTokenStKSMImpl: "PTokenStKSM",
  PTokenAStETHImpl: "PTokenAStETH",
  PTokenCApeImpl: "PTokenCApe",
  PYieldTokenImpl: "PYieldToken",
  NTokenImpl: "NToken",
  NTokenMoonBirdsImpl: "NTokenMoonBirds",
  NTokenUniswapV3Impl: "NTokenUniswapV3",
  NTokenBAYCImpl: "NTokenBAYC",
  NTokenMAYCImpl: "NTokenMAYC",
  NTokenBAKCImpl: "NTokenBAKC",
  DelegationAwarePTokenImpl: "DelegationAwarePToken",
  VariableDebtTokenImpl: "VariableDebtToken",
  MockVariableDebtToken: "MockVariableDebtToken",
  FlashClaimRegistry: "UserFlashclaimRegistry",
  UserFlashClaimRegistryProxy: "InitializableImmutableAdminUpgradeabilityProxy",
  BAYCSewerPassClaim: "BAYCSewerPassClaim",
  AirdropFlashClaimReceiver: "AirdropFlashClaimReceiver",
  ProtocolDataProvider: "ProtocolDataProvider",
  MockPToken: "MockPToken",
  MockNToken: "MockNToken",
  FeeProvider: "FeeProvider",
  TokenDistributor: "TokenDistributor",
  ReservesSetupHelper: "ReservesSetupHelper",
  WETH: "WETH9Mocked",
  PoolConfiguratorImpl: "PoolConfigurator",
  MockIncentivesController: "MockIncentivesController",
  MockReserveConfiguration: "MockReserveConfiguration",
  MockPool: "MockPool",
  MockInitializableImple: "MockInitializableImple",
  MockInitializableImpleV2: "MockInitializableImpleV2",
  MockInitializableFromConstructorImple:
    "MockInitializableFromConstructorImple",
  MockReentrantInitializableImple: "MockReentrantInitializableImple",
  MockPoolInherited: "MockPoolInherited",
  UiPoolDataProvider: "UiPoolDataProvider",
  UiIncentiveDataProvider: "UiIncentiveDataProvider",
  WalletBalanceProvider: "WalletBalanceProvider",
  WETHGatewayImpl: "WETHGateway",
  WETHGatewayProxy: "InitializableAdminUpgradeabilityProxy",
  ERC721OracleWrapper: "ERC721OracleWrapper",
  PUNKS: "CryptoPunksMarket",
  WPunk: "WPunk",
  WPunkGatewayImpl: "WPunkGateway",
  WPunkGatewayProxy: "InitializableAdminUpgradeabilityProxy",
  FlashClaimLogic: "FlashClaimLogic",
  NFTFloorOracle: "NFTFloorOracle",
  ParaSpace: "ParaSpace",
  sParaSpace: "sParaSpace",
  RewardsController: "RewardsController",
  PCV: "PCV",
  MockTokenFaucet: "MockTokenFaucet",
  BoredApeYachtClub: "BAYC",
  MutantApeYachtClub: "MAYC",
  Doodles: "Doodles",
  MOONBIRD: "Moonbirds",
  Meebits: "Meebits",
  Azuki: "Azuki",
  CloneX: "CloneX",
  OTHR: "MintableERC721",
  ConduitController: "ConduitController",
  PausableZoneController: "PausableZoneController",
  ConduitKey: "ConduitKey",
  Conduit: "Conduit",
  PausableZone: "PausableZone",
  Seaport: "Seaport",
  MarketplaceLogic: "MarketplaceLogic",
  SeaportAdapter: "SeaportAdapter",
  LooksRareAdapter: "LooksRareAdapter",
  X2Y2Adapter: "X2Y2Adapter",
  BlurAdapter: "BlurAdapter",
  CurrencyManager: "CurrencyManager",
  ExecutionManager: "ExecutionManager",
  LooksRareExchange: "LooksRareExchange",
  RoyaltyFeeManager: "RoyaltyFeeManager",
  RoyaltyFeeRegistry: "RoyaltyFeeRegistry",
  TransferSelectorNFT: "TransferSelectorNFT",
  TransferManagerERC721: "TransferManagerERC721",
  TransferManagerERC1155: "TransferManagerERC1155",
  StrategyStandardSaleForFixedPrice: "StrategyStandardSaleForFixedPrice",
  X2Y2R1: "X2Y2R1",
  ERC721Delegate: "ERC721Delegate",
  MoonBirdHelper: "MoonBirdHelper",
  UniswapV3: "UniswapV3",
  UniswapV3Factory: "UniswapV3Factory",
  UniswapV3SwapRouter: "UniswapV3SwapRouter",
  NFTDescriptor: "NFTDescriptor",
  NonfungibleTokenPositionDescriptor: "NonfungibleTokenPositionDescriptor",
  NonfungiblePositionManager: "NonfungiblePositionManager",
  StETH: "StETHMocked",
  WStETH: "WstETHMocked",
  MockAToken: "MockAToken",
  MockCToken: "MockCToken",
  MockAirdropProject: "MockAirdropProject",
  PoolCoreImpl: "PoolCore",
  PoolMarketplaceImpl: "PoolMarketplace",
  PoolParametersImpl: "PoolParameters",
  PoolApeStakingImpl: "PoolApeStaking",
  PoolBorrowAndStakeImpl: "PoolBorrowAndStake",
  ApeCoinStaking: "ApeCoinStaking",
  ATokenDebtToken: "ATokenDebtToken",
  StETHDebtToken: "StETHDebtToken",
  StKSMDebtToken: "StKSMDebtToken",
  CApeDebtToken: "CApeDebtToken",
  AStETHDebtToken: "AStETHDebtToken",
  ApeStakingLogic: "ApeStakingLogic",
  MintableERC721Logic: "MintableERC721Logic",
  MerkleVerifier: "MerkleVerifier",
  ExecutionDelegate: "ExecutionDelegate",
  PolicyManager: "PolicyManager",
  StandardPolicyERC721: "StandardPolicyERC721",
  BlurExchangeImpl: "BlurExchange",
  BlurExchangeProxy: "InitializableAdminUpgradeabilityProxy",
  BAKC: "MintableERC721",
  SEWER: "BAYCSewerPass",
  TimeLockExecutor: "ExecutorWithTimelock",
  MultiSendCallOnly: "MultiSendCallOnly",
  cAPE: "InitializableAdminUpgradeabilityProxy",
  cAPEImpl: "AutoCompoundApe",
  P2PPairStaking: "P2PPairStaking",
  HelperContractImpl: "HelperContract",
  HelperContract: "InitializableAdminUpgradeabilityProxy",
  P2PPairStakingImpl: "P2PPairStaking",
  yAPE: "InitializableAdminUpgradeabilityProxy",
  yAPEImpl: "AutoYieldApe",
  ParaProxyInterfacesImpl: "ParaProxyInterfaces",
  MockedDelegateRegistry: "MockedDelegateRegistry",
  MockMultiAssetAirdropProject: "MockMultiAssetAirdropProject",
  ParaSpaceAirdrop: "ParaSpaceAirdrop",
  TimeLockProxy: "InitializableAdminUpgradeabilityProxy",
  TimeLockImpl: "TimeLock",
  DefaultTimeLockStrategy: "DefaultTimeLockStrategy",
  NTokenOtherdeedImpl: "NTokenOtherdeed",
  NTokenChromieSquiggleImpl: "NTokenChromieSquiggle",
  NTokenStakefishImpl: "NTokenStakefish",
  HotWalletProxy: "HotWalletProxy",
  SFVLDR: "StakefishNFTManager",
  DelegationRegistry: "DelegationRegistry",
  StakefishValidator: "StakefishValidatorV1",
  StakefishValidatorFactory: "StakefishValidatorFactory",
  DepositContract: "DepositContract",
  MockFeePool: "MockFeePool",
  HVMTL: "MintableERC721",
  BEANZ: "MintableERC721",
  DEGODS: "MintableERC721",
  EXP: "MintableERC721",
  VSL: "MintableERC721",
  KODA: "MintableERC721",
  BLOCKS: "MintableERC721",
  EXRP: "MintableERC721",
  WGLMR: "MintableERC721",
  MockBendDaoLendPool: "MockLendPool",
  PositionMoverLogic: "PositionMoverLogic",
  PoolPositionMoverImpl: "PoolPositionMover",
  PANDORA: "Pandora",
};

export const XTOKEN_TYPE_UPGRADE_WHITELIST =
  process.env.XTOKEN_TYPE_UPGRADE_WHITELIST?.trim()
    .split(/\s?,\s?/)
    .map((x) => +x);
export const XTOKEN_SYMBOL_UPGRADE_WHITELIST =
  process.env.XTOKEN_SYMBOL_UPGRADE_WHITELIST?.trim().split(/\s?,\s?/);

export const STACKUP_KEY = process.env.STACKUP_KEY || "";
