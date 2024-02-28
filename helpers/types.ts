import {BigNumber, BigNumberish, BytesLike} from "ethers";
import {Libraries} from "hardhat/types";

export enum AssetType {
  ERC20 = 0,
  ERC721 = 1,
}

export enum DryRunExecutor {
  TimeLock = "TimeLock",
  Safe = "Safe",
  SafeWithTimeLock = "SafeWithTimeLock",
  Run = "Run",
  None = "",
}

export enum EtherscanVerificationProvider {
  hardhat = "hardhat",
  foundry = "foundry",
}

export enum TimeLockOperation {
  Queue = "queue",
  Execute = "execute",
  Cancel = "cancel",
}

export type TimeLockData = {
  action: Action;
  actionHash: string;
  queueData: string;
  executeData: string;
  cancelData: string;
  executeTime: string;
  queueExpireTime: string;
  executeExpireTime: string;
};

export enum XTokenType {
  PhantomData = 0,
  NToken = 1,
  NTokenMoonBirds = 2,
  NTokenUniswapV3 = 3,
  NTokenBAYC = 4,
  NTokenMAYC = 5,
  PToken = 6,
  DelegationAwarePToken = 7,
  RebasingPToken = 8,
  PTokenAToken = 9,
  PTokenStETH = 10,
  PTokenSApe = 11,
  NTokenBAKC = 12,
  PYieldToken = 13,
  PTokenCApe = 14,
  NTokenOtherdeed = 15,
  NTokenStakefish = 16,
  NTokenChromieSquiggle = 17,
  PhantomData1 = 18,
  PhantomData2 = 19,
  PhantomData3 = 20,
  PhantomData4 = 21,
  PhantomData5 = 22,
  PhantomData6 = 23,
  PhantomData7 = 24,
  PhantomData8 = 25,
  PhantomData9 = 26,
  PhantomData10 = 27,
  PTokenStKSM = 28,
}

export type ConstructorArgs = (
  | string
  | string[]
  | number
  | number[]
  | boolean
  | boolean[]
)[];

export type LibraryAddresses = Libraries;

export type ParaSpaceLibraryAddresses = Libraries;

export enum eEthereumNetwork {
  ropsten = "ropsten",
  goerli = "goerli",
  sepolia = "sepolia",
  mainnet = "mainnet",
  hardhat = "hardhat",
  tenderlyMain = "tenderlyMain",
  ganache = "ganache",
  parallel = "parallel",
  localhost = "localhost",
  anvil = "anvil",
  moonbeam = "moonbeam",
  moonbase = "moonbase",
  arbitrum = "arbitrum",
  arbitrumGoerli = "arbitrumGoerli",
  arbitrumSepolia = "arbitrumSepolia",
  parallelDev = "parallelDev",
  polygon = "polygon",
  polygonMumbai = "polygonMumbai",
  polygonZkevm = "polygonZkevm",
  polygonZkevmGoerli = "polygonZkevmGoerli",
  zksync = "zksync",
  zksyncGoerli = "zksyncGoerli",
  linea = "linea",
  lineaGoerli = "lineaGoerli",
  manta = "manta",
  mantaTest = "mantaTest",
  neon = "neon",
}

export enum eContractid {
  PoolAddressesProvider = "PoolAddressesProvider",
  MintableERC20 = "MintableERC20",
  MintableERC721 = "MintableERC721",
  MintableDelegationERC20 = "MintableDelegationERC20",
  PoolAddressesProviderRegistry = "PoolAddressesProviderRegistry",
  ACLManager = "ACLManager",
  PoolConfiguratorProxy = "PoolConfiguratorProxy",
  ValidationLogic = "ValidationLogic",
  ReserveLogic = "ReserveLogic",
  GenericLogic = "GenericLogic",
  SupplyLogic = "SupplyLogic",
  SupplyExtendedLogic = "SupplyExtendedLogic",
  BorrowLogic = "BorrowLogic",
  LiquidationLogic = "LiquidationLogic",
  AuctionLogic = "AuctionLogic",
  PoolLogic = "PoolLogic",
  ConfiguratorLogic = "ConfiguratorLogic",
  PoolProxy = "PoolProxy",
  PriceOracle = "PriceOracle",
  Aggregator = "Aggregator",
  ParaSpaceOracle = "ParaSpaceOracle",
  DefaultReserveInterestRateStrategy = "DefaultReserveInterestRateStrategy",
  DefaultReserveAuctionStrategy = "DefaultReserveAuctionStrategy",
  MockReserveAuctionStrategy = "MockReserveAuctionStrategy",
  InitializableImmutableAdminUpgradeabilityProxy = "InitializableImmutableAdminUpgradeabilityProxy",
  MockFlashLoanReceiver = "MockFlashLoanReceiver",
  PTokenImpl = "PTokenImpl",
  PTokenSApeImpl = "PTokenSApeImpl",
  PTokenATokenImpl = "PTokenATokenImpl",
  PTokenStETHImpl = "PTokenStETHImpl",
  PTokenStKSMImpl = "PTokenStKSMImpl",
  PTokenAStETHImpl = "PTokenAStETHImpl",
  PTokenCApeImpl = "PTokenCApeImpl",
  PYieldTokenImpl = "PYieldTokenImpl",
  NTokenImpl = "NTokenImpl",
  NTokenMoonBirdsImpl = "NTokenMoonBirdsImpl",
  NTokenUniswapV3Impl = "NTokenUniswapV3Impl",
  NTokenBAYCImpl = "NTokenBAYCImpl",
  NTokenMAYCImpl = "NTokenMAYCImpl",
  NTokenBAKCImpl = "NTokenBAKCImpl",
  DelegationAwarePTokenImpl = "DelegationAwarePTokenImpl",
  VariableDebtTokenImpl = "VariableDebtTokenImpl",
  MockVariableDebtToken = "MockVariableDebtToken",
  FlashClaimRegistry = "FlashClaimRegistry",
  UserFlashClaimRegistryProxy = "UserFlashClaimRegistryProxy",
  BAYCSewerPassClaim = "BAYCSewerPassClaim",
  AirdropFlashClaimReceiver = "AirdropFlashClaimReceiver",
  ProtocolDataProvider = "ProtocolDataProvider",
  MockPToken = "MockPToken",
  MockNToken = "MockNToken",
  IERC20Detailed = "IERC20Detailed",
  FeeProvider = "FeeProvider",
  TokenDistributor = "TokenDistributor",
  ReservesSetupHelper = "ReservesSetupHelper",
  WETH = "WETH",
  PoolConfiguratorImpl = "PoolConfiguratorImpl",
  MockIncentivesController = "MockIncentivesController",
  MockReserveConfiguration = "MockReserveConfiguration",
  MockPool = "MockPool",
  MockInitializableImple = "MockInitializableImple",
  MockInitializableImpleV2 = "MockInitializableImpleV2",
  MockInitializableFromConstructorImple = "MockInitializableFromConstructorImple",
  MockReentrantInitializableImple = "MockReentrantInitializableImple",
  MockPoolInherited = "MockPoolInherited",
  UiPoolDataProvider = "UiPoolDataProvider",
  UiIncentiveDataProvider = "UiIncentiveDataProvider",
  WalletBalanceProvider = "WalletBalanceProvider",
  WETHGatewayImpl = "WETHGatewayImpl",
  WETHGatewayProxy = "WETHGatewayProxy",
  ERC721OracleWrapper = "ERC721OracleWrapper",
  PUNKS = "PUNKS",
  WPunk = "WPUNKS",
  WPunkGatewayImpl = "WPunkGatewayImpl",
  WPunkGatewayProxy = "WPunkGatewayProxy",
  FlashClaimLogic = "FlashClaimLogic",
  NFTFloorOracle = "NFTFloorOracle",
  ParaSpace = "ParaSpace",
  sParaSpace = "sParaSpace",
  RewardsController = "RewardsController",
  PCV = "PCV",
  MockTokenFaucet = "MockTokenFaucet",
  BoredApeYachtClub = "BAYC",
  MutantApeYachtClub = "MAYC",
  Doodles = "DOODLE",
  MOONBIRD = "MOONBIRD",
  Meebits = "MEEBITS",
  Azuki = "AZUKI",
  CloneX = "CLONEX",
  OTHR = "OTHR",
  MoonBirdsGatewayImpl = "MoonBirdsGatewayImpl",
  MoonBirdsGatewayProxy = "MoonBirdsGatewayProxy",
  ConduitController = "ConduitController",
  PausableZoneController = "PausableZoneController",
  ConduitKey = "ConduitKey",
  Conduit = "Conduit",
  PausableZone = "PausableZone",
  Seaport = "Seaport",
  MarketplaceLogic = "MarketplaceLogic",
  SeaportAdapter = "SeaportAdapter",
  LooksRareAdapter = "LooksRareAdapter",
  X2Y2Adapter = "X2Y2Adapter",
  BlurAdapter = "BlurAdapter",
  CurrencyManager = "CurrencyManager",
  ExecutionManager = "ExecutionManager",
  LooksRareExchange = "LooksRareExchange",
  RoyaltyFeeManager = "RoyaltyFeeManager",
  RoyaltyFeeRegistry = "RoyaltyFeeRegistry",
  TransferSelectorNFT = "TransferSelectorNFT",
  TransferManagerERC721 = "TransferManagerERC721",
  TransferManagerERC1155 = "TransferManagerERC1155",
  StrategyStandardSaleForFixedPrice = "StrategyStandardSaleForFixedPrice",
  X2Y2R1 = "X2Y2R1",
  ERC721Delegate = "ERC721Delegate",
  MoonBirdHelper = "MoonBirdHelper",
  UniswapV3 = "UniswapV3",
  UniswapV3Factory = "UniswapV3Factory",
  UniswapV3SwapRouter = "UniswapV3SwapRouter",
  NFTDescriptor = "NFTDescriptor",
  NonfungibleTokenPositionDescriptor = "NonfungibleTokenPositionDescriptor",
  NonfungiblePositionManager = "NonfungiblePositionManager",
  PANDORA = "PANDORA",
  StETH = "stETH",
  WStETH = "wstETH",
  MockAToken = "MockAToken",
  MockCToken = "MockCToken",
  MockAirdropProject = "MockAirdropProject",
  PoolCoreImpl = "PoolCoreImpl",
  PoolMarketplaceImpl = "PoolMarketplaceImpl",
  PoolAAPositionMoverImpl = "PoolAAPositionMoverImpl",
  PoolParametersImpl = "PoolParametersImpl",
  PoolApeStakingImpl = "PoolApeStakingImpl",
  PoolBorrowAndStakeImpl = "PoolBorrowAndStakeImpl",
  ApeCoinStaking = "ApeCoinStaking",
  ATokenDebtToken = "ATokenDebtToken",
  StETHDebtToken = "StETHDebtToken",
  StKSMDebtToken = "StKSMDebtToken",
  CApeDebtToken = "CApeDebtToken",
  AStETHDebtToken = "AStETHDebtToken",
  ApeStakingLogic = "ApeStakingLogic",
  MintableERC721Logic = "MintableERC721Logic",
  MerkleVerifier = "MerkleVerifier",
  ExecutionDelegate = "ExecutionDelegate",
  PolicyManager = "PolicyManager",
  StandardPolicyERC721 = "StandardPolicyERC721",
  BlurExchangeImpl = "BlurExchangeImpl",
  BlurExchangeProxy = "BlurExchangeProxy",
  BAKC = "BAKC",
  SEWER = "SEWER",
  TimeLockExecutor = "TimeLockExecutor",
  MultiSendCallOnly = "MultiSendCallOnly",
  cAPE = "cAPE",
  cAPEImpl = "cAPEImpl",
  P2PPairStaking = "P2PPairStaking",
  HelperContractImpl = "HelperContractImpl",
  HelperContract = "HelperContract",
  P2PPairStakingImpl = "P2PPairStakingImpl",
  yAPE = "yAPE",
  yAPEImpl = "yAPEImpl",
  ParaProxyInterfacesImpl = "ParaProxyInterfacesImpl",
  MockedDelegateRegistry = "MockedDelegateRegistry",
  MockMultiAssetAirdropProject = "MockMultiAssetAirdropProject",
  ParaSpaceAirdrop = "ParaSpaceAirdrop",
  TimeLockProxy = "TimeLockProxy",
  TimeLockImpl = "TimeLockImpl",
  DefaultTimeLockStrategy = "DefaultTimeLockStrategy",
  NTokenOtherdeedImpl = "NTokenOtherdeedImpl",
  NTokenChromieSquiggleImpl = "NTokenChromieSquiggleImpl",
  NTokenStakefishImpl = "NTokenStakefishImpl",
  HotWalletProxy = "HotWalletProxy",
  SFVLDR = "SFVLDR",
  DelegationRegistry = "DelegationRegistry",
  StakefishValidator = "StakefishValidator",
  StakefishValidatorFactory = "StakefishValidatorFactory",
  DepositContract = "DepositContract",
  MockFeePool = "MockFeePool",
  HVMTL = "HVMTL",
  BEANZ = "BEANZ",
  DEGODS = "DEGODS",
  EXP = "EXP",
  VSL = "VSL",
  KODA = "KODA",
  BLOCKS = "BLOCKS",
  EXRP = "EXRP",
  WGLMR = "WGLMR",
  MockBendDaoLendPool = "MockBendDaoLendPool",
  PositionMoverLogic = "PositionMoverLogic",
  PoolPositionMoverImpl = "PoolPositionMoverImpl",
  Account = "Account",
  AccountFactory = "AccountFactory",
  AccountProxy = "AccountProxy",
  AccountRegistry = "AccountRegistry",
}

/*
 * Error messages
 */
export enum ProtocolErrors {
  CALLER_NOT_POOL_ADMIN = "1", // 'The caller of the function is not a pool admin'
  CALLER_NOT_EMERGENCY_ADMIN = "2", // 'The caller of the function is not an emergency admin'
  CALLER_NOT_POOL_OR_EMERGENCY_ADMIN = "3", // 'The caller of the function is not a pool or emergency admin'
  CALLER_NOT_RISK_OR_POOL_ADMIN = "4", // 'The caller of the function is not a risk or pool admin'
  CALLER_NOT_ASSET_LISTING_OR_POOL_ADMIN = "5", // 'The caller of the function is not an asset listing or pool admin'
  CALLER_NOT_BRIDGE = "6", // 'The caller of the function is not a bridge'
  ADDRESSES_PROVIDER_NOT_REGISTERED = "7", // 'Pool addresses provider is not registered'
  INVALID_ADDRESSES_PROVIDER_ID = "8", // 'Invalid id for the pool addresses provider'
  NOT_CONTRACT = "9", // 'Address is not a contract'
  CALLER_NOT_POOL_CONFIGURATOR = "10", // 'The caller of the function is not the pool configurator'
  CALLER_NOT_XTOKEN = "11", // 'The caller of the function is not an PToken'
  INVALID_ADDRESSES_PROVIDER = "12", // 'The address of the pool addresses provider is invalid'
  RESERVE_ALREADY_ADDED = "14", // 'Reserve has already been added to reserve list'
  NO_MORE_RESERVES_ALLOWED = "15", // 'Maximum amount of reserves in the pool reached'
  RESERVE_LIQUIDITY_NOT_ZERO = "18", // 'The liquidity of the reserve needs to be 0'
  INVALID_RESERVE_PARAMS = "20", // 'Invalid risk parameters for the reserve'
  CALLER_MUST_BE_POOL = "23", // 'The caller of this function must be a pool'
  INVALID_MINT_AMOUNT = "24", // 'Invalid amount to mint'
  INVALID_BURN_AMOUNT = "25", // 'Invalid amount to burn'
  INVALID_AMOUNT = "26", // 'Amount must be greater than 0'
  RESERVE_INACTIVE = "27", // 'Action requires an active reserve'
  RESERVE_FROZEN = "28", // 'Action cannot be performed because the reserve is frozen'
  RESERVE_PAUSED = "29", // 'Action cannot be performed because the reserve is paused'
  BORROWING_NOT_ENABLED = "30", // 'Borrowing is not enabled'
  STABLE_BORROWING_NOT_ENABLED = "31", // 'Stable borrowing is not enabled'
  NOT_ENOUGH_AVAILABLE_USER_BALANCE = "32", // 'User cannot withdraw more than the available balance'
  INVALID_INTEREST_RATE_MODE_SELECTED = "33", // 'Invalid interest rate mode selected'
  COLLATERAL_BALANCE_IS_ZERO = "34", // 'The collateral balance is 0'
  HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD = "35", // 'Health factor is lesser than the liquidation threshold'
  COLLATERAL_CANNOT_COVER_NEW_BORROW = "36", // 'There is not enough collateral to cover a new borrow'
  COLLATERAL_SAME_AS_BORROWING_CURRENCY = "37", // 'Collateral is (mostly) the same currency that is being borrowed'
  AMOUNT_BIGGER_THAN_MAX_LOAN_SIZE_STABLE = "38", // 'The requested amount is greater than the max loan size in stable rate mode'
  NO_DEBT_OF_SELECTED_TYPE = "39", // 'For repayment of a specific type of debt, the user needs to have debt that type'
  NO_EXPLICIT_AMOUNT_TO_REPAY_ON_BEHALF = "40", // 'To repay on behalf of a user an explicit amount to repay is needed'
  NO_OUTSTANDING_STABLE_DEBT = "41", // 'User does not have outstanding stable rate debt on this reserve'
  NO_OUTSTANDING_VARIABLE_DEBT = "42", // 'User does not have outstanding variable rate debt on this reserve'
  UNDERLYING_BALANCE_ZERO = "43", // 'The underlying balance needs to be greater than 0'
  INTEREST_RATE_REBALANCE_CONDITIONS_NOT_MET = "44", // 'Interest rate rebalance conditions were not met'
  HEALTH_FACTOR_NOT_BELOW_THRESHOLD = "45", // 'Health factor is not below the threshold'
  COLLATERAL_CANNOT_BE_AUCTIONED_OR_LIQUIDATED = "46", // 'The collateral chosen cannot be auctioned OR liquidated'
  SPECIFIED_CURRENCY_NOT_BORROWED_BY_USER = "47", // 'User did not borrow the specified currency'
  SAME_BLOCK_BORROW_REPAY = "48", // 'Borrow and repay in same block is not allowed'
  BORROW_CAP_EXCEEDED = "50", // 'Borrow cap is exceeded'
  SUPPLY_CAP_EXCEEDED = "51", // 'Supply cap is exceeded'
  XTOKEN_SUPPLY_NOT_ZERO = "54", // 'PToken supply is not zero'
  STABLE_DEBT_NOT_ZERO = "55", // 'Stable debt supply is not zero'
  VARIABLE_DEBT_SUPPLY_NOT_ZERO = "56", // 'Variable debt supply is not zero'
  LTV_VALIDATION_FAILED = "57", // 'Ltv validation failed'
  PRICE_ORACLE_SENTINEL_CHECK_FAILED = "59", // 'Price oracle sentinel validation failed'
  RESERVE_ALREADY_INITIALIZED = "61", // 'Reserve has already been initialized'
  INVALID_LTV = "63", // 'Invalid ltv parameter for the reserve'
  INVALID_LIQ_THRESHOLD = "64", // 'Invalid liquidity threshold parameter for the reserve'
  INVALID_LIQ_BONUS = "65", // 'Invalid liquidity bonus parameter for the reserve'
  INVALID_DECIMALS = "66", // 'Invalid decimals parameter of the underlying asset of the reserve'
  INVALID_RESERVE_FACTOR = "67", // 'Invalid reserve factor parameter for the reserve'
  INVALID_BORROW_CAP = "68", // 'Invalid borrow cap for the reserve'
  INVALID_SUPPLY_CAP = "69", // 'Invalid supply cap for the reserve'
  INVALID_LIQUIDATION_PROTOCOL_FEE = "70", // 'Invalid liquidation protocol fee for the reserve'
  INVALID_DEBT_CEILING = "73", // 'Invalid debt ceiling for the reserve
  INVALID_RESERVE_INDEX = "74", // 'Invalid reserve index'
  ACL_ADMIN_CANNOT_BE_ZERO = "75", // 'ACL admin cannot be set to the zero address'
  INCONSISTENT_PARAMS_LENGTH = "76", // 'Array parameters that should be equal length are not'
  ZERO_ADDRESS_NOT_VALID = "77", // 'Zero address not valid'
  INVALID_EXPIRATION = "78", // 'Invalid expiration'
  INVALID_SIGNATURE = "79", // 'Invalid signature'
  OPERATION_NOT_SUPPORTED = "80", // 'Operation not supported'
  ASSET_NOT_LISTED = "82", // 'Asset is not listed'
  INVALID_OPTIMAL_USAGE_RATIO = "83", // 'Invalid optimal usage ratio'
  INVALID_OPTIMAL_STABLE_TO_TOTAL_DEBT_RATIO = "84", // 'Invalid optimal stable to total debt ratio'
  UNDERLYING_CANNOT_BE_RESCUED = "85", // 'The underlying asset cannot be rescued'
  ADDRESSES_PROVIDER_ALREADY_ADDED = "86", // 'Reserve has already been added to reserve list'
  POOL_ADDRESSES_DO_NOT_MATCH = "87", // 'The token implementation pool address and the pool address provided by the initializing pool do not match'
  STABLE_BORROWING_ENABLED = "88", // 'Stable borrowing is enabled'
  SILOED_BORROWING_VIOLATION = "89", // 'User is trying to borrow multiple assets including a siloed one'
  RESERVE_DEBT_NOT_ZERO = "90", // the total debt of the reserve needs to be 0
  NOT_THE_OWNER = "91", // user is not the owner of a given asset
  LIQUIDATION_AMOUNT_NOT_ENOUGH = "92",
  INVALID_ASSET_TYPE = "93", // invalid asset type for action.
  INVALID_FLASH_CLAIM_RECEIVER = "94", // invalid flash claim receiver.
  ERC721_HEALTH_FACTOR_NOT_BELOW_THRESHOLD = "95", // ERC721 Health factor is not below the threshold. Can only liquidate ERC20.
  UNDERLYING_ASSET_CAN_NOT_BE_TRANSFERRED = "96", //underlying asset can not be transferred.
  TOKEN_TRANSFERRED_CAN_NOT_BE_SELF_ADDRESS = "97", //token transferred can not be self address.
  INVALID_AIRDROP_CONTRACT_ADDRESS = "98", //invalid airdrop contract address.
  INVALID_AIRDROP_PARAMETERS = "99", //invalid airdrop parameters.
  CALL_AIRDROP_METHOD_FAILED = "100", //call airdrop method failed.
  SUPPLIER_NOT_NTOKEN = "101", //supplier is not the NToken contract
  CALL_MARKETPLACE_FAILED = "102", //call marketplace failed.
  INVALID_MARKETPLACE_ID = "103", //invalid marketplace id.
  INVALID_MARKETPLACE_ORDER = "104", //invalid marketplace id.
  CREDIT_DOES_NOT_MATCH_ORDER = "105", //credit doesn't match order.
  PAYNOW_NOT_ENOUGH = "106", //paynow not enough.
  INVALID_CREDIT_SIGNATURE = "107", //invalid credit signature.
  INVALID_ORDER_TAKER = "108", //invalid order taker.
  MARKETPLACE_PAUSED = "109", //marketplace paused.
  INVALID_AUCTION_RECOVERY_HEALTH_FACTOR = "110", //invalid auction recovery health factor.
  AUCTION_ALREADY_STARTED = "111", //auction already started.
  AUCTION_NOT_STARTED = "112", //auction not started yet.
  AUCTION_NOT_ENABLED = "113", //auction not enabled on the reserve.
  ERC721_HEALTH_FACTOR_NOT_ABOVE_THRESHOLD = "114", //ERC721 Health factor is not above the threshold.
  TOKEN_IN_AUCTION = "115", //tokenId is in auction.
  AUCTIONED_BALANCE_NOT_ZERO = "116", //auctioned balance not zero

  LIQUIDATOR_CAN_NOT_BE_SELF = "117", //user can not liquidate himself
  FLASHCLAIM_NOT_ALLOWED = "119", //flash claim is not allowed for UniswapV3
  NTOKEN_BALANCE_EXCEEDED = "120", //ntoken balance exceed limit.
  ORACLE_PRICE_NOT_READY = "121", //oracle price not ready
  SET_ORACLE_SOURCE_NOT_ALLOWED = "122", //set oracle source not allowed
  RESERVE_NOT_ACTIVE_FOR_UNIV3 = "123", //reserve is not active for UniswapV3.
  XTOKEN_TYPE_NOT_ALLOWED = "124", //the corresponding xTokenType not allowed in this action
  SAPE_NOT_ALLOWED = "128", //operation is not allow for sApe.
  TOTAL_STAKING_AMOUNT_WRONG = "129", //cash plus borrow amount not equal to total staking amount.
  NOT_THE_BAKC_OWNER = "130", //user is not the bakc owner.
  INVALID_STATE = "134", //invalid token status

  INVALID_TOKEN_ID = "135", //invalid token id

  // SafeCast
  SAFECAST_UINT128_OVERFLOW = "SafeCast: value doesn't fit in 128 bits",

  // Ownable
  OWNABLE_ONLY_OWNER = "Ownable: caller is not the owner",

  // ERC20
  ERC20_TRANSFER_AMOUNT_EXCEEDS_BALANCE = "ERC20: transfer amount exceeds balance",

  // old
  INVALID_FROM_BALANCE_AFTER_TRANSFER = "Invalid from balance after transfer",
  INVALID_TO_BALANCE_AFTER_TRANSFER = "Invalid from balance after transfer",
  INVALID_HF = "Invalid health factor",
  //disable calls
  EMEGENCY_DISABLE_CALL = "emergency disable call",

  MAKER_SAME_AS_TAKER = "132",
}

export type tEthereumAddress = string;
export type tStringTokenBigUnits = string; // 1 ETH, or 10e6 USDC or 10e18 DAI
export type tBigNumberTokenBigUnits = BigNumber;
export type tStringTokenSmallUnits = string; // 1 wei, or 1 basic unit of USDC, or 1 basic unit of DAI
export type tBigNumberTokenSmallUnits = BigNumber;

export interface iFunctionSignature {
  name: string;
  signature: string;
}

export interface iAssetCommon<T> {
  [key: string]: T;
}
export interface iAssetBase<T> {
  DAI: T;
  WETH: T;
  USDC: T;
  aUSDC: T;
  USDT: T;
  FRAX: T;
  WBTC: T;
  stETH: T;
  wstETH: T;
  bendETH: T;
  cbETH: T;
  rETH: T;
  astETH: T;
  awstETH: T;
  aWETH: T;
  APE: T;
  sAPE: T;
  cAPE: T;
  yAPE: T;
  cETH: T;
  PUNK: T;
  xcDOT: T;
  xcUSDT: T;
  stDOT: T;
  USDCWH: T;
  WETHWH: T;
  WBTCWH: T;
  WGLMR: T;
  BLUR: T;
  ARB: T;
  GMX: T;
  LINK: T;
  UNI: T;
  BAL: T;
  AAVE: T;
  RDNT: T;
  MATIC: T;
  stMATIC: T;
  CRV: T;
  BAYC: T;
  WPUNKS: T;
  PUNKS: T;
  MAYC: T;
  DOODLE: T;
  MOONBIRD: T;
  MEEBITS: T;
  AZUKI: T;
  OTHR: T;
  CLONEX: T;
  BAKC: T;
  HVMTL: T;
  BEANZ: T;
  DEGODS: T;
  EXP: T;
  VSL: T;
  KODA: T;
  BLOCKS: T;
  EXRP: T;
  uBAYC: T;
  uPPG: T;
  WUSDM: T;
  STONE: T;
  TIA: T;
  MANTA: T;
}

export type iAssetsWithoutETH<T> = Omit<iAssetBase<T>, "ETH">;

export type iAssetsWithoutUSD<T> = Omit<iAssetBase<T>, "USD">;

export type iParaSpacePoolAssets<T> = Pick<
  iAssetsWithoutUSD<T>,
  | "DAI"
  | "WETH"
  | "USDC"
  | "USDT"
  | "FRAX"
  | "WBTC"
  | "stETH"
  | "wstETH"
  | "bendETH"
  | "cbETH"
  | "rETH"
  | "astETH"
  | "awstETH"
  | "aWETH"
  | "APE"
  | "sAPE"
  | "cAPE"
  | "yAPE"
  | "cETH"
  | "PUNK"
  | "xcDOT"
  | "xcUSDT"
  | "stDOT"
  | "USDCWH"
  | "WETHWH"
  | "WBTCWH"
  | "WGLMR"
  | "BLUR"
  | "ARB"
  | "GMX"
  | "LINK"
  | "UNI"
  | "BAL"
  | "AAVE"
  | "RDNT"
  | "MATIC"
  | "stMATIC"
  | "CRV"
  | "BAYC"
  | "PUNKS"
  | "WPUNKS"
  | "MAYC"
  | "DOODLE"
  | "AZUKI"
  | "CLONEX"
  | "MOONBIRD"
  | "MEEBITS"
  | "OTHR"
  | "BAKC"
  | "HVMTL"
  | "BEANZ"
  | "DEGODS"
  | "EXP"
  | "VSL"
  | "KODA"
  | "BLOCKS"
  | "EXRP"
  | "uBAYC"
  | "uPPG"
  | "WUSDM"
  | "STONE"
  | "TIA"
  | "MANTA"
>;

export type iMultiPoolsAssets<T> = iAssetCommon<T> | iParaSpacePoolAssets<T>;

export type iAssetAggregatorBase<T> = iAssetsWithoutETH<T>;

export enum ERC20TokenContractId {
  DAI = "DAI",
  WETH = "WETH",
  USDC = "USDC",
  aUSDC = "aUSDC",
  USDT = "USDT",
  FRAX = "FRAX",
  WBTC = "WBTC",
  stETH = "stETH",
  wstETH = "wstETH",
  bendETH = "bendETH",
  cbETH = "cbETH",
  rETH = "rETH",
  astETH = "astETH",
  awstETH = "awstETH",
  aWETH = "aWETH",
  APE = "APE",
  sAPE = "sAPE",
  cAPE = "cAPE",
  yAPE = "yAPE",
  cETH = "cETH",
  PUNK = "PUNK",
  xcDOT = "xcDOT",
  xcUSDT = "xcUSDT",
  stDOT = "stDOT",
  USDCWH = "USDCWH",
  WETHWH = "WETHWH",
  WBTCWH = "WBTCWH",
  WGLMR = "WGLMR",
  BLUR = "BLUR",
  ARB = "ARB",
  GMX = "GMX",
  LINK = "LINK",
  UNI = "UNI",
  BAL = "BAL",
  AAVE = "AAVE",
  RDNT = "RDNT",
  MATIC = "MATIC",
  stMATIC = "stMATIC",
  CRV = "CRV",
  WMATIC = "WMATIC",
  uBAYC = "uBAYC",
  uPPG = "uPPG",
  WUSDM = "WUSDM",
  STONE = "STONE",
  TIA = "TIA",
  MANTA = "MANTA",
}

export enum ERC721TokenContractId {
  DOODLE = "DOODLE",
  WPUNKS = "WPUNKS",
  BAYC = "BAYC",
  MAYC = "MAYC",
  AZUKI = "AZUKI",
  CLONEX = "CLONEX",
  MOONBIRD = "MOONBIRD",
  MEEBITS = "MEEBITS",
  OTHR = "OTHR",
  UniswapV3 = "UniswapV3",
  BAKC = "BAKC",
  SEWER = "SEWER",
  PPG = "PPG",
  SFVLDR = "SFVLDR",
  HVMTL = "HVMTL",
  BEANZ = "BEANZ",
  DEGODS = "DEGODS",
  EXP = "EXP",
  VSL = "VSL",
  KODA = "KODA",
  BLOCKS = "BLOCKS",
  EXRP = "EXRP",
  PANDORA = "PANDORA",
}

export enum NTokenContractId {
  nBAYC = "nBAYC",
  nMAYC = "nMAYC",
  nDOODLE = "nDOODLE",
  nWPUNKS = "nWPUNKS",
  nMOONBIRD = "nMOONBIRD",
  nUniswapV3 = "nUniswapV3",
  nBAKC = "nBAKC",
  nSEWER = "nSEWER",
  nPPG = "nPPG",
  nOTHR = "nOTHR",
  nSFVLDR = "nSFVLDR",
  nBLOCKS = "nBLOCKS",
  nEXRP = "nEXRP",
}

export enum PTokenContractId {
  pDAI = "pDAI",
  pUSDC = "pUSDC",
  pWETH = "pWETH",
  paWETH = "paWETH",
  pstETH = "pstETH",
  pwstETH = "pwstETH",
  pcETH = "pcETH",
  pcAPE = "pcAPE",
}

export interface IReserveParams
  extends IReserveBorrowParams,
    IReserveCollateralParams {
  xTokenImpl: eContractid;
  reserveFactor: string;
  supplyCap: string;
  strategy: IInterestRateStrategyParams;
  auctionStrategy: IAuctionStrategyParams;
  timeLockStrategy: ITimeLockStrategyParams;
}

export interface IInterestRateStrategyParams {
  name: string;
  optimalUsageRatio: string;
  baseVariableBorrowRate: string;
  variableRateSlope1: string;
  variableRateSlope2: string;
}

export interface IAuctionStrategyParams {
  name: string;

  maxPriceMultiplier: string;

  minExpPriceMultiplier: string;
  minPriceMultiplier: string;
  stepLinear: string;
  stepExp: string;
  tickLength: string;
}

export interface ITimeLockStrategyParams {
  name: string;
  minThreshold: string;
  midThreshold: string;
  minWaitTime: string;
  midWaitTime: string;
  maxWaitTime: string;
  poolPeriodWaitTime: string;
  poolPeriodLimit: string;
  period: string;
}

export interface IReserveBorrowParams {
  borrowingEnabled: boolean;
  reserveDecimals: string;
  borrowCap: string;
}

export interface IReserveCollateralParams {
  baseLTVAsCollateral: string;
  liquidationProtocolFeePercentage: string;
  liquidationThreshold: string;
  liquidationBonus: string;
}
export interface IMarketRates {
  borrowRate: string;
}

export type iParamsPerNetwork<T> = iEthereumParamsPerNetwork<T>;

export type iParamsPerNetworkAll<T> = iEthereumParamsPerNetwork<T>;

export interface iEthereumParamsPerNetwork<T> {
  [eEthereumNetwork.goerli]: T;
  [eEthereumNetwork.sepolia]: T;
  [eEthereumNetwork.mainnet]: T;
  [eEthereumNetwork.hardhat]: T;
  [eEthereumNetwork.anvil]: T;
  [eEthereumNetwork.ganache]: T;
  [eEthereumNetwork.parallel]: T;
  [eEthereumNetwork.tenderlyMain]: T;
  [eEthereumNetwork.moonbeam]: T;
  [eEthereumNetwork.moonbase]: T;
  [eEthereumNetwork.arbitrum]: T;
  [eEthereumNetwork.arbitrumGoerli]: T;
  [eEthereumNetwork.arbitrumSepolia]: T;
  [eEthereumNetwork.parallelDev]: T;
  [eEthereumNetwork.polygon]: T;
  [eEthereumNetwork.polygonMumbai]: T;
  [eEthereumNetwork.polygonZkevm]: T;
  [eEthereumNetwork.polygonZkevmGoerli]: T;
  [eEthereumNetwork.zksync]: T;
  [eEthereumNetwork.zksyncGoerli]: T;
  [eEthereumNetwork.linea]: T;
  [eEthereumNetwork.lineaGoerli]: T;
  [eEthereumNetwork.manta]: T;
  [eEthereumNetwork.mantaTest]: T;
  [eEthereumNetwork.neon]: T;
}

export enum RateMode {
  None = "0",
  Stable = "1",
  Variable = "2",
}

export interface IUniswapV2Config {
  Factory: tEthereumAddress;
  Router: tEthereumAddress;
}

export interface IUniswapV3Config {
  Factory: tEthereumAddress;
  NFTPositionManager: tEthereumAddress;
}

export interface IMarketplaceConfig {
  Seaport?: tEthereumAddress;
}

export interface IChainlinkConfig {
  // ERC20
  WETH?: tEthereumAddress;
  aWETH?: tEthereumAddress;
  stETH?: tEthereumAddress;
  wstETH?: tEthereumAddress;
  cbETH?: tEthereumAddress;
  rETH?: tEthereumAddress;
  astETH?: tEthereumAddress;
  awstETH?: tEthereumAddress;
  bendETH?: tEthereumAddress;
  DAI?: tEthereumAddress;
  USDC?: tEthereumAddress;
  USDT?: tEthereumAddress;
  FRAX?: tEthereumAddress;
  WBTC?: tEthereumAddress;
  STETH?: tEthereumAddress;
  APE?: tEthereumAddress;
  PUNK?: tEthereumAddress;
  sAPE?: tEthereumAddress;
  cAPE?: tEthereumAddress;
  yAPE?: tEthereumAddress;
  xcDOT?: tEthereumAddress;
  xcUSDT?: tEthereumAddress;
  stDOT?: tEthereumAddress;
  USDCWH?: tEthereumAddress;
  WETHWH?: tEthereumAddress;
  WBTCWH?: tEthereumAddress;
  WGLMR?: tEthereumAddress;
  ARB?: tEthereumAddress;
  GMX?: tEthereumAddress;
  LINK?: tEthereumAddress;
  UNI?: tEthereumAddress;
  AAVE?: tEthereumAddress;
  BAL?: tEthereumAddress;
  RDNT?: tEthereumAddress;
  WMATIC?: tEthereumAddress;
  stMATIC?: tEthereumAddress;
  CRV?: tEthereumAddress;
  BLUR?: tEthereumAddress;
  WUSDM?: tEthereumAddress;
  STONE?: tEthereumAddress;
  TIA?: tEthereumAddress;
  WSTETH?: tEthereumAddress;
  MANTA?: tEthereumAddress;
  // ERC721
  DOODLE?: tEthereumAddress;
  BAYC?: tEthereumAddress;
  BAKC?: tEthereumAddress;
  MAYC?: tEthereumAddress;
  WPUNKS?: tEthereumAddress;
  MOONBIRD?: tEthereumAddress;
  MEEBITS?: tEthereumAddress;
  AZUKI?: tEthereumAddress;
  OTHR?: tEthereumAddress;
  CLONEX?: tEthereumAddress;
  HVMTL?: tEthereumAddress;
  BEANZ?: tEthereumAddress;
  DEGODS?: tEthereumAddress;
  EXP?: tEthereumAddress;
  VSL?: tEthereumAddress;
  KODA?: tEthereumAddress;
  BLOCKS?: tEthereumAddress;
  EXRP?: tEthereumAddress;
  UniswapV3?: tEthereumAddress;
  SFVLDR?: tEthereumAddress;
  SEWER?: tEthereumAddress;
}

export interface IYogaLabs {
  ApeCoinStaking?: tEthereumAddress;
  BAKC?: tEthereumAddress;
}

export interface IUniswapConfig {
  V2Factory?: tEthereumAddress;
  V2Router?: tEthereumAddress;
  V3Factory?: tEthereumAddress;
  V3Router?: tEthereumAddress;
  V3NFTPositionManager?: tEthereumAddress;
}

export interface IBendDAOConfig {
  LendingPool?: tEthereumAddress;
  LendingPoolLoan?: tEthereumAddress;
}

export interface IParaSpaceV1Config {
  PoolV1: tEthereumAddress;
  ProtocolDataProviderV1: tEthereumAddress;
  CApeV1: tEthereumAddress;
  TimeLockV1: tEthereumAddress;
  P2PPairStakingV1: tEthereumAddress;
}

export interface IStakefish {
  StakefishManager?: tEthereumAddress;
}

export interface IOracleConfig {
  // ParaSpaceOracle
  BaseCurrency: ERC20TokenContractId | string;
  BaseCurrencyUnit: BigNumber;
  BaseCurrencyDecimals: number;
  // NFTFloorOracle
  ExpirationPeriod: number;
  DeviationRate: number;
  Nodes: tEthereumAddress[];
}

export interface IGovernanceConfig {
  Multisend: tEthereumAddress;
  Multisig: tEthereumAddress;
}

export interface IMocksConfig {
  USDPriceInWEI: string;
  AllAssetsInitialPrices: iAssetBase<string>;
  TokenFaucetMintValue: {[key: string]: number};
}

export interface IRate {
  borrowRate: string;
}

export interface IAccountAbstraction {
  rpcUrl: string;
  paymasterUrl: string;
}

export interface ICommonConfiguration {
  WrappedNativeTokenId: ERC20TokenContractId;
  MarketId: string;
  ParaSpaceTeam: tEthereumAddress;
  PTokenNamePrefix: string;
  VariableDebtTokenNamePrefix: string;
  SymbolPrefix: string;
  ProviderId: number;
  AuctionRecoveryHealthFactor: string | number;
  Mocks?: IMocksConfig;
  ParaSpaceAdmin: tEthereumAddress | undefined;
  ParaSpaceAdminIndex: number;
  EmergencyAdmins: tEthereumAddress[];
  EmergencyAdminIndex: number;

  RiskAdmin: tEthereumAddress | undefined;
  RiskAdminIndex: number;

  GatewayAdmin: tEthereumAddress | undefined;
  GatewayAdminIndex: number;
  Tokens: iMultiPoolsAssets<tEthereumAddress>;
  YogaLabs: IYogaLabs;
  Uniswap: IUniswapConfig;
  BendDAO: IBendDAOConfig;
  ParaSpaceV1: IParaSpaceV1Config | undefined;
  Stakefish: IStakefish;
  Marketplace: IMarketplaceConfig;
  Chainlink: IChainlinkConfig;
  ReservesConfig: iMultiPoolsAssets<IReserveParams>;
  Treasury: tEthereumAddress;
  IncentivesController: tEthereumAddress;
  Oracle: IOracleConfig;
  HotWallet: tEthereumAddress;
  DelegationRegistry: tEthereumAddress;
  EnableSeaport: boolean;
  EnableLooksrare: boolean;
  EnableX2Y2: boolean;
  EnableBLUR: boolean;
  EnableApeStaking: boolean;

  Governance: IGovernanceConfig;

  AccountAbstraction: IAccountAbstraction | undefined;
}

export interface IParaSpaceConfiguration extends ICommonConfiguration {
  ReservesConfig: iMultiPoolsAssets<IReserveParams>;
}

export type PoolConfiguration = ICommonConfiguration | IParaSpaceConfiguration;

export type Action = [
  string, // target
  BigNumberish, // value
  string, // signature
  BytesLike, // data
  BigNumberish, // executeTime
  boolean // withDelegatecall
];
