import {ZERO_ADDRESS} from "../helpers/constants";
import {MULTI_SEND, MULTI_SIG} from "../helpers/hardhat-constants";
import {
  eEthereumNetwork,
  ERC20TokenContractId,
  IParaSpaceConfiguration,
} from "../helpers/types";
import {MocksConfig, MocksUSDConfig} from "./mocks";
import {
  ArbitrumOracleConfig,
  LineaOracleConfig,
  MainnetOracleConfig,
  MoonbeamOracleConfig,
  PolygonOracleConfig,
  TestnetOracleConfig,
  ZkSyncOracleConfig,
} from "./oracle";
import {
  strategyDAI,
  strategyUSDC,
  strategyUSDT,
  strategyWETH,
  strategyBAYC,
  strategyWPunks,
  strategyAPE,
  strategyWBTC,
  strategySTETH,
  strategyMAYC,
  strategyDoodles,
  strategyAWETH,
  strategyCETH,
  strategyPUNK,
  strategyMoonbird,
  strategyAzuki,
  strategyOthr,
  strategyUniswapV3,
  strategyClonex,
  strategyMeebits,
  strategySAPE,
  strategyCAPE,
  strategyYAPE,
  strategyXCDOT,
  strategyWGLMR,
  strategyBAKC,
  strategyWSTETH,
  strategySEWER,
  strategyPudgyPenguins,
  strategyBLUR,
  strategyCBETH,
  strategyASTETH,
  strategyAWSTETH,
  strategyRETH,
  strategyBENDETH,
  strategyFRAX,
  strategyStakefishValidator,
  strategyHVMTL,
  strategyBEANZ,
  strategyDEGODS,
  strategyEXP,
  strategyVSL,
  strategyKODA,
  strategyBLOCKS,
  strategyGMX,
  strategyARB,
  strategyBAL,
  strategyLINK,
  strategyAAVE,
  strategyUNI,
  strategyRDNT,
  strategySTMATIC,
  strategyCRV,
  strategyWMATIC,
  strategyXCUSDT,
  strategyUSDCWH,
  strategyWETHWH,
  strategyWBTCWH,
  strategySTDOT,
  strategyEXRP,
} from "./reservesConfigs";

export const CommonConfig: Pick<
  IParaSpaceConfiguration,
  | "WrappedNativeTokenId"
  | "MarketId"
  | "PTokenNamePrefix"
  | "VariableDebtTokenNamePrefix"
  | "SymbolPrefix"
  | "ProviderId"
  | "AuctionRecoveryHealthFactor"
  | "ParaSpaceAdmin"
  | "EmergencyAdmins"
  | "RiskAdmin"
  | "GatewayAdmin"
  | "ParaSpaceAdminIndex"
  | "EmergencyAdminIndex"
  | "RiskAdminIndex"
  | "GatewayAdminIndex"
  | "Mocks"
  | "Oracle"
  | "HotWallet"
  | "DelegationRegistry"
  | "IncentivesController"
  | "Governance"
  | "ParaSpaceV1"
  | "AccountAbstraction"
> = {
  WrappedNativeTokenId: ERC20TokenContractId.WETH,
  MarketId: "ParaSpaceMM",
  PTokenNamePrefix: "ParaSpace Derivative Token",
  VariableDebtTokenNamePrefix: "ParaSpace Variable Debt Token",
  SymbolPrefix: "",
  ProviderId: 1,
  AuctionRecoveryHealthFactor: "1500000000000000000",
  // ACL CONFIGURATION
  ParaSpaceAdmin: undefined,
  EmergencyAdmins: [],
  RiskAdmin: undefined,
  GatewayAdmin: undefined,
  ParaSpaceAdminIndex: 4, // ACL Admin, Pool Admin, Asset Listing Admin
  EmergencyAdminIndex: 3, // Emergency Admin, >1 is a must to make tests pass
  RiskAdminIndex: 2, // Risk Admin, >1 is a must to make tests pass
  GatewayAdminIndex: 1, // Gateway Admin, for polkadot evm only 5 accounts initialized
  // MOCKS
  Mocks: MocksConfig,
  // Oracle
  Oracle: TestnetOracleConfig,
  // 3rd party services
  HotWallet: ZERO_ADDRESS,
  DelegationRegistry: ZERO_ADDRESS,
  IncentivesController: ZERO_ADDRESS,
  // Governance
  Governance: {
    Multisend: MULTI_SEND || ZERO_ADDRESS,
    Multisig: MULTI_SIG || ZERO_ADDRESS,
  },
  // ParaSpaceV1
  ParaSpaceV1: undefined,
  AccountAbstraction: {
    rpcUrl: `https://api.stackup.sh/v1/node/${process.env.STACKUP_KEY}`,
    paymasterUrl: `https://api.stackup.sh/v1/paymaster/${process.env.STACKUP_KEY}`,
  },
};

export const HardhatConfig: IParaSpaceConfiguration = {
  // BASIC INFO
  ...CommonConfig,
  ParaSpaceTeam: "0xc783df8a850f42e7F7e57013759C285caa701eB6",
  Treasury: "0xc783df8a850f42e7F7e57013759C285caa701eB6",
  Tokens: {
    sAPE: "0x0000000000000000000000000000000000000001",
  },
  YogaLabs: {},
  Uniswap: {},
  Marketplace: {},
  Chainlink: {},
  BendDAO: {},
  Stakefish: {},
  // RESERVE ASSETS - CONFIG, ASSETS, BORROW RATES,
  ReservesConfig: {
    DAI: strategyDAI,
    USDC: strategyUSDC,
    USDT: strategyUSDT,
    FRAX: strategyFRAX,
    WETH: strategyWETH,
    APE: strategyAPE,
    WBTC: strategyWBTC,
    stETH: strategySTETH,
    wstETH: strategyWSTETH,
    aWETH: strategyAWETH,
    cETH: strategyCETH,
    PUNK: strategyPUNK,
    BLUR: strategyBLUR,
    DOODLE: strategyDoodles,
    BAYC: strategyBAYC,
    MAYC: strategyMAYC,
    WPUNKS: strategyWPunks,
    MOONBIRD: strategyMoonbird,
    MEEBITS: strategyMeebits,
    AZUKI: strategyAzuki,
    OTHR: strategyOthr,
    CLONEX: strategyClonex,
    UniswapV3: strategyUniswapV3,
    sAPE: strategySAPE,
    cAPE: strategyCAPE,
    yAPE: strategyYAPE,
    BAKC: strategyBAKC,
    BLOCKS: strategyBLOCKS,
    SEWER: strategySEWER,
    PPG: strategyPudgyPenguins,
    SFVLDR: strategyStakefishValidator,
  },
};

export const MoonbeamConfig: IParaSpaceConfiguration = {
  // BASIC INFO
  ...CommonConfig,
  WrappedNativeTokenId: ERC20TokenContractId.WGLMR,
  ParaSpaceAdmin: "0x4a84d250419697440FDCea4826E2421b84af69Fe",
  EmergencyAdmins: [
    "0x17816E9A858b161c3E37016D139cf618056CaCD4",
    "0x69FAD68De47D5666Ad668C7D682dDb8FD6322949",
    "0x2f2d07d60ea7330DD2314f4413CCbB2dC25276EF",
    "0x001e2bcC5c1BfC3131d33Ba074B12c2F1237FB04",
    "0x4a84d250419697440FDCea4826E2421b84af69Fe",
    "0x4AC3fD073786a971e1B8dE5a526959c9B3B2B407",
  ],
  RiskAdmin: "0x4a84d250419697440FDCea4826E2421b84af69Fe",
  GatewayAdmin: "0x4a84d250419697440FDCea4826E2421b84af69Fe",
  ParaSpaceTeam: "0x4a84d250419697440FDCea4826E2421b84af69Fe",
  Treasury: "0x4a84d250419697440FDCea4826E2421b84af69Fe",
  Tokens: {
    WGLMR: "0xAcc15dC74880C9944775448304B263D191c6077F",
    xcDOT: "0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080",
    xcUSDT: "0xFFFFFFfFea09FB06d082fd1275CD48b191cbCD1d",
    stDOT: "0xFA36Fe1dA08C89eC72Ea1F0143a35bFd5DAea108",
    USDC: "0x931715fee2d06333043d11f658c8ce934ac61d0c",
    WETH: "0xab3f0245b83feb11d15aaffefd7ad465a59817ed",
    WBTC: "0xe57ebd2d67b462e9926e04a8e33f01cd0d64346d",
    EXRP: "0x515e20e6275CEeFe19221FC53e77E38cc32b80Fb",
  },
  YogaLabs: {},
  Uniswap: {},
  Marketplace: {},
  BendDAO: {},
  Stakefish: {},
  Chainlink: {
    WGLMR: "0x4497B606be93e773bbA5eaCFCb2ac5E2214220Eb",
    xcDOT: "0x1466b4bD0C4B6B8e1164991909961e0EE6a66d8c",
    xcUSDT: "0xd925c5bf88bd0ca09312625d429240f811b437c6",
    stDOT: "0xd925c5bf88bd0ca09312625d429240f811b437c6",
    USDC: "0xa122591f60115d63421f66f752ef9f6e0bc73abc",
    WETH: "0x9ce2388a1696e22f870341c3fc1e89710c7569b5",
    WBTC: "0x8211b991d713ddae32326fd69e1e2510f4a653b0",
  },
  // RESERVE ASSETS - CONFIG, ASSETS, BORROW RATES,
  ReservesConfig: {
    xcDOT: strategyXCDOT,
    xcUSDT: strategyXCUSDT,
    stDOT: strategySTDOT,
    WGLMR: strategyWGLMR,
    USDC: strategyUSDCWH,
    WETH: strategyWETHWH,
    WBTC: strategyWBTCWH,
    EXRP: strategyEXRP,
  },
  Mocks: undefined,
  Oracle: MoonbeamOracleConfig,
  Governance: {
    Multisend: MULTI_SEND || "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D",
    Multisig: MULTI_SIG || "0x4a84d250419697440FDCea4826E2421b84af69Fe",
  },
};

export const MoonbaseConfig: IParaSpaceConfiguration = {
  // BASIC INFO
  ...CommonConfig,
  WrappedNativeTokenId: ERC20TokenContractId.WGLMR,
  ParaSpaceTeam: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Treasury: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  ParaSpaceAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  EmergencyAdmins: ["0x018281853eCC543Aa251732e8FDaa7323247eBeB"],
  RiskAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  GatewayAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Tokens: {
    WGLMR: "0xD909178CC99d318e4D46e7E66a972955859670E1",
  },
  YogaLabs: {},
  Uniswap: {},
  Marketplace: {},
  BendDAO: {},
  Stakefish: {},
  Chainlink: {},
  // RESERVE ASSETS - CONFIG, ASSETS, BORROW RATES,
  ReservesConfig: {
    xcDOT: strategyXCDOT,
    xcUSDT: strategyXCUSDT,
    stDOT: strategySTDOT,
    WGLMR: strategyWGLMR,
    USDC: strategyUSDCWH,
    WETH: strategyWETHWH,
    WBTC: strategyWBTCWH,
    EXRP: strategyEXRP,
  },
  Mocks: MocksUSDConfig,
  Oracle: MoonbeamOracleConfig,
};
export const GoerliConfig: IParaSpaceConfiguration = {
  // BASIC INFO
  ...CommonConfig,
  ParaSpaceTeam: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Treasury: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  ParaSpaceAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  EmergencyAdmins: ["0x018281853eCC543Aa251732e8FDaa7323247eBeB"],
  RiskAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  GatewayAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Tokens: {
    APE: "0x328507DC29C95c170B56a1b3A758eB7a9E73455c",
    BAYC: "0xF40299b626ef6E197F5d9DE9315076CAB788B6Ef",
    MAYC: "0x3f228cBceC3aD130c45D21664f2C7f5b23130d23",
    BAKC: "0xd60d682764Ee04e54707Bee7B564DC65b31884D0",
    sAPE: "0x0000000000000000000000000000000000000001",
    WETH: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    aWETH: "0x7649e0d153752c556b8b23DB1f1D3d42993E83a5",
    bendETH: "0x57FEbd640424C85b72b4361fE557a781C8d2a509",
    UniswapV3: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    PPG: "0xf140558cA4d4e10f63661504D4F3f74FADDDe3E8",
    SEWER: "0x3aa026cd539fa1f6ae58ae238a10e2f1cf831454",
    SFVLDR: "0x5b41ffb9c448c02ff3d0401b0374b67efcb73c7e",
  },
  YogaLabs: {
    ApeCoinStaking: "0xeF37717B1807a253c6D140Aca0141404D23c26D4",
    BAKC: "0xd60d682764Ee04e54707Bee7B564DC65b31884D0",
  },
  Uniswap: {
    V2Factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    V2Router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    V3Factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    V3Router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    V3NFTPositionManager: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  },
  Marketplace: {
    Seaport: "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC",
  },
  BendDAO: {
    LendingPool: "0x84a47EaEca69f8B521C21739224251c8c4566Bbc",
    LendingPoolLoan: "0x7F64c32a3c13Bd245a7141a607A7E60DA585BA86",
  },
  Stakefish: {
    StakefishManager: "0x5b41ffb9c448c02ff3d0401b0374b67efcb73c7e",
  },
  Chainlink: {
    WETH: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    BAYC: "0xB677bfBc9B09a3469695f40477d05bc9BcB15F50",
    MAYC: "0xCbDcc8788019226d09FcCEb4C727C48A062D8124",
    CLONEX: "0xE42f272EdF974e9c70a6d38dCb47CAB2A28CED3F",
    WPUNKS: "0x5c13b249846540F81c093Bc342b5d963a7518145",
    DOODLE: "0xEDA76D1C345AcA04c6910f5824EC337C8a8F36d2",
    AZUKI: "0x9F6d70CDf08d893f0063742b51d3E9D1e18b7f74",
  },
  // RESERVE ASSETS - CONFIG, ASSETS, BORROW RATES,
  ReservesConfig: {
    DAI: strategyDAI,
    USDC: strategyUSDC,
    USDT: strategyUSDT,
    FRAX: strategyFRAX,
    WETH: strategyWETH,
    APE: strategyAPE,
    WBTC: strategyWBTC,
    stETH: strategySTETH,
    wstETH: strategyWSTETH,
    aWETH: strategyAWETH,
    bendETH: strategyBENDETH,
    cbETH: strategyCBETH,
    rETH: strategyRETH,
    astETH: strategyASTETH,
    awstETH: strategyAWSTETH,
    cETH: strategyCETH,
    PUNK: strategyPUNK,
    BLUR: strategyBLUR,
    DOODLE: strategyDoodles,
    BAYC: strategyBAYC,
    MAYC: strategyMAYC,
    WPUNKS: strategyWPunks,
    MOONBIRD: strategyMoonbird,
    MEEBITS: strategyMeebits,
    AZUKI: strategyAzuki,
    OTHR: strategyOthr,
    CLONEX: strategyClonex,
    UniswapV3: strategyUniswapV3,
    sAPE: strategySAPE,
    cAPE: strategyCAPE,
    yAPE: strategyYAPE,
    BAKC: strategyBAKC,
    SEWER: strategySEWER,
    PPG: strategyPudgyPenguins,
    SFVLDR: strategyStakefishValidator,
    HVMTL: strategyHVMTL,
    BEANZ: strategyBEANZ,
    DEGODS: strategyDEGODS,
    EXP: strategyEXP,
    VSL: strategyVSL,
    KODA: strategyKODA,
    BLOCKS: strategyBLOCKS,
  },
  DelegationRegistry: "0x00000000000076A84feF008CDAbe6409d2FE638B",
};

export const PolygonConfig: IParaSpaceConfiguration = {
  // BASIC INFO
  ...CommonConfig,
  WrappedNativeTokenId: ERC20TokenContractId.WMATIC,
  ParaSpaceAdmin: "0xeeE8Fd9B887ee57CAf2905851175470c03DE64F6",
  EmergencyAdmins: [
    "0x17816E9A858b161c3E37016D139cf618056CaCD4",
    "0x69FAD68De47D5666Ad668C7D682dDb8FD6322949",
    "0x2f2d07d60ea7330DD2314f4413CCbB2dC25276EF",
    "0x001e2bcC5c1BfC3131d33Ba074B12c2F1237FB04",
    "0xeeE8Fd9B887ee57CAf2905851175470c03DE64F6",
    "0x4AC3fD073786a971e1B8dE5a526959c9B3B2B407",
  ],
  RiskAdmin: "0xeeE8Fd9B887ee57CAf2905851175470c03DE64F6",
  GatewayAdmin: "0xeeE8Fd9B887ee57CAf2905851175470c03DE64F6",
  ParaSpaceTeam: "0xeeE8Fd9B887ee57CAf2905851175470c03DE64F6",
  Treasury: "0xeeE8Fd9B887ee57CAf2905851175470c03DE64F6",
  Tokens: {
    WMATIC: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
    stMATIC: "0x3a58a54c066fdc0f2d55fc9c89f0415c92ebf3c4",
    WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    WBTC: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    USDC: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    UNI: "0xb33EaAd8d922B1083446DC23f610c2567fB5180f",
    LINK: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39",
    AAVE: "0xD6DF932A45C0f255f85145f286eA0b292B21C90B",
    BAL: "0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3",
    CRV: "0x172370d5Cd63279eFa6d502DAB29171933a610AF",
    UniswapV3: "0xc36442b4a4522e871399cd717abdd847ab11fe88",
  },
  YogaLabs: {},
  Uniswap: {
    V3Factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    V3NFTPositionManager: "0xc36442b4a4522e871399cd717abdd847ab11fe88",
    V3Router: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  },
  Marketplace: {
    Seaport: "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC",
  },
  BendDAO: {},
  Stakefish: {},
  Chainlink: {
    DAI: "0x4746dec9e833a82ec7c2c1356372ccf2cfcd2f3d",
    USDT: "0x0a6513e40db6eb1b165753ad52e80663aea50545",
    USDC: "0xfe4a8cc5b5b2366c1b58bea3858e81843581b2f7",
    WETH: "0xf9680d99d6c9589e2a93a78a04a279e509205945",
    WBTC: "0xc907e116054ad103354f2d350fd2514433d57f6f",
    WMATIC: "0xab594600376ec9fd91f8e885dadf0ce036862de0",
    LINK: "0xd9ffdb71ebe7496cc440152d43986aae0ab76665",
    UNI: "0xdf0fb4e4f928d2dcb76f438575fdd8682386e13c",
    AAVE: "0x72484b12719e23115761d5da1646945632979bb6",
    BAL: "0xd106b538f2a868c28ca1ec7e298c3325e0251d66",
    CRV: "0x336584C8E6Dc19637A5b36206B1c79923111b405",
    stMATIC: "0xEe96b77129cF54581B5a8FECCcC50A6A067034a1",
  },
  ReservesConfig: {
    DAI: strategyDAI,
    USDT: strategyUSDT,
    USDC: strategyUSDC,
    WETH: strategyWETH,
    WBTC: strategyWBTC,
    WMATIC: strategyWMATIC,
    stMATIC: strategySTMATIC,
    AAVE: strategyAAVE,
    LINK: strategyLINK,
    BAL: strategyBAL,
    UNI: strategyUNI,
    CRV: strategyCRV,
    UniswapV3: strategyUniswapV3,
  },
  Mocks: undefined,
  Oracle: PolygonOracleConfig,
  Governance: {
    Multisend: MULTI_SEND || "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D",
    Multisig: MULTI_SIG || "0xeeE8Fd9B887ee57CAf2905851175470c03DE64F6",
  },
};

export const PolygonZkevmConfig: IParaSpaceConfiguration = {
  // BASIC INFO
  ...CommonConfig,
  ParaSpaceTeam: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Treasury: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  ParaSpaceAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  EmergencyAdmins: ["0x018281853eCC543Aa251732e8FDaa7323247eBeB"],
  RiskAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  GatewayAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Tokens: {},
  YogaLabs: {},
  Uniswap: {},
  Marketplace: {},
  BendDAO: {},
  Stakefish: {},
  Chainlink: {},
  ReservesConfig: {
    DAI: strategyDAI,
    USDC: strategyUSDC,
    USDT: strategyUSDT,
    FRAX: strategyFRAX,
    WETH: strategyWETH,
    WBTC: strategyWBTC,
    stETH: strategySTETH,
    wstETH: strategyWSTETH,
    WMATIC: strategyWMATIC,
    stMATIC: strategySTMATIC,
    CRV: strategyCRV,
    UniswapV3: strategyUniswapV3,
  },
  Mocks: MocksUSDConfig,
  Oracle: PolygonOracleConfig,
};

export const PolygonMumbaiConfig: IParaSpaceConfiguration = {
  // BASIC INFO
  ...CommonConfig,
  WrappedNativeTokenId: ERC20TokenContractId.WMATIC,
  ParaSpaceTeam: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Treasury: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  ParaSpaceAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  EmergencyAdmins: ["0x018281853eCC543Aa251732e8FDaa7323247eBeB"],
  RiskAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  GatewayAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Tokens: {
    WETH: "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa",
    WMATIC: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
    UniswapV3: "0xc36442b4a4522e871399cd717abdd847ab11fe88",
  },
  YogaLabs: {},
  Uniswap: {
    V3Factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    V3NFTPositionManager: "0xc36442b4a4522e871399cd717abdd847ab11fe88",
    V3Router: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  },
  Marketplace: {},
  BendDAO: {},
  Stakefish: {},
  Chainlink: {},
  ReservesConfig: {
    DAI: strategyDAI,
    USDC: strategyUSDC,
    USDT: strategyUSDT,
    FRAX: strategyFRAX,
    WETH: strategyWETH,
    WBTC: strategyWBTC,
    stETH: strategySTETH,
    wstETH: strategyWSTETH,
    stMATIC: strategySTMATIC,
    WMATIC: strategyWMATIC,
    CRV: strategyCRV,
    UniswapV3: strategyUniswapV3,
  },
  Mocks: MocksUSDConfig,
  Oracle: PolygonOracleConfig,
};

export const PolygonZkevmGoerliConfig: IParaSpaceConfiguration = {
  // BASIC INFO
  ...CommonConfig,
  ParaSpaceTeam: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Treasury: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  ParaSpaceAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  EmergencyAdmins: ["0x018281853eCC543Aa251732e8FDaa7323247eBeB"],
  RiskAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  GatewayAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Tokens: {},
  YogaLabs: {},
  Uniswap: {},
  Marketplace: {},
  BendDAO: {},
  Stakefish: {},
  Chainlink: {},
  ReservesConfig: {
    DAI: strategyDAI,
    USDC: strategyUSDC,
    USDT: strategyUSDT,
    FRAX: strategyFRAX,
    WETH: strategyWETH,
    WBTC: strategyWBTC,
    stETH: strategySTETH,
    wstETH: strategyWSTETH,
    WMATIC: strategyWMATIC,
    stMATIC: strategySTMATIC,
    CRV: strategyCRV,
    UniswapV3: strategyUniswapV3,
  },
  Mocks: MocksUSDConfig,
  Oracle: PolygonOracleConfig,
};

export const ArbitrumGoerliConfig: IParaSpaceConfiguration = {
  // BASIC INFO
  ...CommonConfig,
  ParaSpaceTeam: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Treasury: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  ParaSpaceAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  EmergencyAdmins: ["0x018281853eCC543Aa251732e8FDaa7323247eBeB"],
  RiskAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  GatewayAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Tokens: {
    WETH: "0xe39ab88f8a4777030a534146a9ca3b52bd5d43a3",
    UniswapV3: "0x622e4726a167799826d1e1d150b076a7725f5d81",
  },
  YogaLabs: {},
  Uniswap: {
    V3Factory: "0x4893376342d5d7b3e31d4184c08b265e5ab2a3f6",
    V3NFTPositionManager: "0x622e4726a167799826d1e1d150b076a7725f5d81",
    V3Router: "0x4648a43B2C14Da09FdF82B161150d3F634f40491",
  },
  Marketplace: {},
  BendDAO: {},
  Stakefish: {},
  Chainlink: {
    WETH: "0x62CAe0FA2da220f43a51F86Db2EDb36DcA9A5A08",
    WBTC: "0x6550bc2301936011c1334555e62A87705A81C12C",
    DAI: "0x103b53E977DA6E4Fa92f76369c8b7e20E7fb7fe1",
    USDC: "0x1692Bdd32F31b831caAc1b0c9fAF68613682813b",
    USDT: "0x0a023a3423D9b27A0BE48c768CCF2dD7877fEf5E",
  },
  ReservesConfig: {
    DAI: strategyDAI,
    USDC: strategyUSDC,
    USDT: strategyUSDT,
    FRAX: strategyFRAX,
    WETH: strategyWETH,
    WBTC: strategyWBTC,
    stETH: strategySTETH,
    wstETH: strategyWSTETH,
    GMX: strategyGMX,
    ARB: strategyARB,
    BAL: strategyBAL,
    LINK: strategyLINK,
    AAVE: strategyAAVE,
    UNI: strategyUNI,
    RDNT: strategyRDNT,
    UniswapV3: strategyUniswapV3,
  },
  Mocks: MocksUSDConfig,
  Oracle: ArbitrumOracleConfig,
};

export const ZkSyncGoerliConfig: IParaSpaceConfiguration = {
  // BASIC INFO
  ...CommonConfig,
  ParaSpaceTeam: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Treasury: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  ParaSpaceAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  EmergencyAdmins: ["0x018281853eCC543Aa251732e8FDaa7323247eBeB"],
  RiskAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  GatewayAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Tokens: {},
  YogaLabs: {},
  Uniswap: {},
  Marketplace: {},
  BendDAO: {},
  Stakefish: {},
  Chainlink: {},
  ReservesConfig: {
    DAI: strategyDAI,
    USDC: strategyUSDC,
    USDT: strategyUSDT,
    FRAX: strategyFRAX,
    WETH: strategyWETH,
    WBTC: strategyWBTC,
  },
  Mocks: MocksUSDConfig,
  Oracle: ZkSyncOracleConfig,
};

export const LineaGoerliConfig: IParaSpaceConfiguration = {
  // BASIC INFO
  ...CommonConfig,
  ParaSpaceTeam: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Treasury: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  ParaSpaceAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  EmergencyAdmins: ["0x018281853eCC543Aa251732e8FDaa7323247eBeB"],
  RiskAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  GatewayAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Tokens: {},
  YogaLabs: {},
  Uniswap: {},
  Marketplace: {},
  BendDAO: {},
  Stakefish: {},
  Chainlink: {},
  ReservesConfig: {
    DAI: strategyDAI,
    USDC: strategyUSDC,
    USDT: strategyUSDT,
    FRAX: strategyFRAX,
    WETH: strategyWETH,
    WBTC: strategyWBTC,
  },
  Mocks: MocksUSDConfig,
  Oracle: LineaOracleConfig,
};

export const ArbitrumConfig: IParaSpaceConfiguration = {
  // BASIC INFO
  ...CommonConfig,
  ParaSpaceAdmin: "0x1aD5db7e9fcdc6052A8362633E7CEaf80f623741",
  EmergencyAdmins: [
    "0x17816E9A858b161c3E37016D139cf618056CaCD4",
    "0x69FAD68De47D5666Ad668C7D682dDb8FD6322949",
    "0x2f2d07d60ea7330DD2314f4413CCbB2dC25276EF",
    "0x001e2bcC5c1BfC3131d33Ba074B12c2F1237FB04",
    "0x4AC3fD073786a971e1B8dE5a526959c9B3B2B407",
  ],
  RiskAdmin: "0x1aD5db7e9fcdc6052A8362633E7CEaf80f623741",
  GatewayAdmin: "0x1aD5db7e9fcdc6052A8362633E7CEaf80f623741",
  ParaSpaceTeam: "0x1aD5db7e9fcdc6052A8362633E7CEaf80f623741",
  Treasury: "0x1aD5db7e9fcdc6052A8362633E7CEaf80f623741",
  Tokens: {
    WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    wstETH: "0x5979d7b546e38e414f7e9822514be443a4800529",
    USDC: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    FRAX: "0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F",
    WBTC: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
    ARB: "0x912ce59144191c1204e64559fe8253a0e49e6548",
    GMX: "0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a",
    BAL: "0x040d1edc9569d4bab2d15287dc5a4f10f56a56b8",
    AAVE: "0xba5ddd1f9d7f570dc94a51479a000e3bce967196",
    LINK: "0xf97f4df75117a78c1a5a0dbb814af92458539fb4",
    UNI: "0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0",
    RDNT: "0x3082cc23568ea640225c2467653db90e9250aaa0",
    UniswapV3: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  },
  YogaLabs: {},
  Uniswap: {
    V3Factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    V3Router: "0x4c60051384bd2d3c01bfc845cf5f4b44bcbe9de5",
    V3NFTPositionManager: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  },
  Marketplace: {
    Seaport: "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC",
  },
  BendDAO: {},
  Stakefish: {},
  Chainlink: {
    WETH: "0x639fe6ab55c921f74e7fac1ee960c0b6293ba612",
    wstETH: "0x230E0321Cf38F09e247e50Afc7801EA2351fe56F",
    DAI: "0xc5c8e77b397e531b8ec06bfb0048328b30e9ecfb",
    USDC: "0x50834f3163758fcc1df9973b6e91f0f0f0434ad3",
    USDT: "0x3f3f5df88dc9f13eac63df89ec16ef6e7e25dde7",
    FRAX: "0x0809e3d38d1b4214958faf06d8b1b1a2b73f2ab8",
    WBTC: "0xd0c7101eacbb49f3decccc166d238410d6d46d57",
    ARB: "0xb2a824043730fe05f3da2efafa1cbbe83fa548d6",
    GMX: "0xdb98056fecfff59d032ab628337a4887110df3db",
    LINK: "0x86e53cf1b870786351da77a57575e79cb55812cb",
    UNI: "0x9c917083fdb403ab5adbec26ee294f6ecada2720",
    AAVE: "0xad1d5344aade45f43e596773bcc4c423eabdd034",
    BAL: "0xbe5ea816870d11239c543f84b71439511d70b94f",
    RDNT: "0x20d0fcab0ecfd078b036b6caf1fac69a6453b352",
  },
  ReservesConfig: {
    DAI: strategyDAI,
    USDC: strategyUSDC,
    USDT: strategyUSDT,
    FRAX: strategyFRAX,
    WETH: strategyWETH,
    wstETH: strategyWSTETH,
    WBTC: strategyWBTC,
    BAL: strategyBAL,
    LINK: strategyLINK,
    AAVE: strategyAAVE,
    UNI: strategyUNI,
    RDNT: strategyRDNT,
    GMX: strategyGMX,
    ARB: strategyARB,
    UniswapV3: strategyUniswapV3,
  },
  Mocks: undefined,
  Oracle: ArbitrumOracleConfig,
  Governance: {
    Multisend: MULTI_SEND || "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D",
    Multisig: MULTI_SIG || "0x1aD5db7e9fcdc6052A8362633E7CEaf80f623741",
  },
};

export const ZkSyncConfig: IParaSpaceConfiguration = {
  // BASIC INFO
  ...CommonConfig,
  ParaSpaceAdmin: "0x3BeD3C25415e4D980954Dc5FDe2e11D7fb22E582",
  EmergencyAdmins: [
    "0x17816E9A858b161c3E37016D139cf618056CaCD4",
    "0x69FAD68De47D5666Ad668C7D682dDb8FD6322949",
    "0x2f2d07d60ea7330DD2314f4413CCbB2dC25276EF",
    "0x001e2bcC5c1BfC3131d33Ba074B12c2F1237FB04",
    "0x4AC3fD073786a971e1B8dE5a526959c9B3B2B407",
  ],
  RiskAdmin: "0x3BeD3C25415e4D980954Dc5FDe2e11D7fb22E582",
  GatewayAdmin: "0x3BeD3C25415e4D980954Dc5FDe2e11D7fb22E582",
  ParaSpaceTeam: "0x3BeD3C25415e4D980954Dc5FDe2e11D7fb22E582",
  Treasury: "0x909e36B512Ed45250fdff513523119d825647695",
  Tokens: {
    WETH: "0x5bF39BdE21B95d77fb18F27bBCb07F3648720A2e",
    USDC: "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4",
    WBTC: "0xBBeB516fb02a01611cBBE0453Fe3c580D7281011",
  },
  YogaLabs: {},
  Uniswap: {},
  Marketplace: {},
  BendDAO: {},
  Stakefish: {},
  Chainlink: {
    WETH: "0x279dBcc7417DC8a73F9154fb640E2467209C8C34",
    USDC: "0x9Dc7257a0a21Ec3EAf0CbFB02fb01A2825a1e14e",
    WBTC: "0x1474A19D97A9e84A201d481c2F995513d3380412",
  },
  ReservesConfig: {
    USDC: strategyUSDC,
    WETH: strategyWETH,
    WBTC: strategyWBTC,
  },
  Mocks: undefined,
  Oracle: ZkSyncOracleConfig,
};

export const LineaConfig: IParaSpaceConfiguration = {
  // BASIC INFO
  ...CommonConfig,
  ParaSpaceTeam: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Treasury: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  ParaSpaceAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  EmergencyAdmins: ["0x018281853eCC543Aa251732e8FDaa7323247eBeB"],
  RiskAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  GatewayAdmin: "0x018281853eCC543Aa251732e8FDaa7323247eBeB",
  Tokens: {},
  YogaLabs: {},
  Uniswap: {},
  Marketplace: {},
  BendDAO: {},
  Stakefish: {},
  Chainlink: {},
  ReservesConfig: {
    DAI: strategyDAI,
    USDC: strategyUSDC,
    USDT: strategyUSDT,
    FRAX: strategyFRAX,
    WETH: strategyWETH,
    WBTC: strategyWBTC,
    stETH: strategySTETH,
    wstETH: strategyWSTETH,
  },
  Mocks: MocksUSDConfig,
  Oracle: LineaOracleConfig,
};

export const MainnetConfig: IParaSpaceConfiguration = {
  // BASIC INFO
  ...CommonConfig,
  ParaSpaceAdmin: "0xe965198731CDdB2f06e91DD0CDff74b71e4b3714",
  EmergencyAdmins: [
    "0x17816E9A858b161c3E37016D139cf618056CaCD4",
    "0x69FAD68De47D5666Ad668C7D682dDb8FD6322949",
    "0x2f2d07d60ea7330DD2314f4413CCbB2dC25276EF",
    "0x001e2bcC5c1BfC3131d33Ba074B12c2F1237FB04",
    "0x4AC3fD073786a971e1B8dE5a526959c9B3B2B407",
  ],
  RiskAdmin: "0xe965198731CDdB2f06e91DD0CDff74b71e4b3714",
  GatewayAdmin: "0xe965198731CDdB2f06e91DD0CDff74b71e4b3714",
  ParaSpaceTeam: "0xe965198731CDdB2f06e91DD0CDff74b71e4b3714",
  Treasury: "0xe965198731CDdB2f06e91DD0CDff74b71e4b3714",
  Tokens: {
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    stETH: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    wstETH: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
    astETH: "0x1982b2f5814301d4e9a8b0201555376e62f82428",
    awstETH: "0x0B925eD163218f6662a35e0f0371Ac234f9E9371",
    bendETH: "0xeD1840223484483C0cb050E6fC344d1eBF0778a9",
    cbETH: "0xbe9895146f7af43049ca1c1ae358b0541ea49704",
    rETH: "0xae78736cd615f374d3085123a210448e74fc6393",
    aWETH: "0x030bA81f1c18d280636F32af80b9AAd02Cf0854e",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    FRAX: "0x853d955acef822db058eb8505911ed77f175b99e",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    APE: "0x4d224452801ACEd8B2F0aebE155379bb5D594381",
    BLUR: "0x5283D291DBCF85356A21bA090E6db59121208b44",
    BAYC: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    MAYC: "0x60E4d786628Fea6478F785A6d7e704777c86a7c6",
    BAKC: "0xba30E5F9Bb24caa003E9f2f0497Ad287FDF95623",
    PUNKS: "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",
    WPUNKS: "0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6",
    DOODLE: "0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e",
    MOONBIRD: "0x23581767a106ae21c074b2276d25e5c3e136a68b",
    MEEBITS: "0x7bd29408f11d2bfc23c34f18275bbf23bb716bc7",
    AZUKI: "0xed5af388653567af2f388e6224dc7c4b3241c544",
    OTHR: "0x34d85c9cdeb23fa97cb08333b511ac86e1c4e258",
    CLONEX: "0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b",
    sAPE: "0x0000000000000000000000000000000000000001",
    UniswapV3: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    cETH: "0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5",
    SEWER: "0x764AeebcF425d56800eF2c84F2578689415a2DAa",
    PPG: "0xbd3531da5cf5857e7cfaa92426877b022e612cf8",
    SFVLDR: "0xffff2d93c83d4c613ed68ca887f057651135e089",
    HVMTL: "0x4b15a9c28034dC83db40CD810001427d3BD7163D",
    BEANZ: "0x306b1ea3ecdf94ab739f1910bbda052ed4a9f949",
    DEGODS: "0x8821bee2ba0df28761afff119d66390d594cd280",
    EXP: "0x790b2cf29ed4f310bf7641f013c65d4560d28371",
    VSL: "0x5b1085136a811e55b2bb2ca1ea456ba82126a376",
    KODA: "0xe012baf811cf9c05c408e879c399960d1f305903",
    BLOCKS: "0x059EDD72Cd353dF5106D2B9cC5ab83a52287aC3a",
  },
  YogaLabs: {
    ApeCoinStaking: "0x5954aB967Bc958940b7EB73ee84797Dc8a2AFbb9",
  },
  Uniswap: {
    V2Factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    V2Router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    V3Factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    V3Router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    V3NFTPositionManager: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  },
  Marketplace: {
    Seaport: "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC",
  },
  BendDAO: {
    LendingPool: "0x70b97a0da65c15dfb0ffa02aee6fa36e507c2762",
    LendingPoolLoan: "0x5f6ac80CdB9E87f3Cfa6a90E5140B9a16A361d5C",
  },
  Stakefish: {
    StakefishManager: "0xffff2d93c83d4c613ed68ca887f057651135e089",
  },
  Chainlink: {
    WETH: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    rETH: "0xFCbf6B66dED63D6a8231dB091c16a3481d2E8890",
    aWETH: "0x549945De284a8cc102D49cE28683ee9E87edE3E3",
    stETH: "0x86392dC19c0b719886221c78AB11eb8Cf5c52812",
    astETH: "0x86392dC19c0b719886221c78AB11eb8Cf5c52812",
    wstETH: "0x1d05d899c3AC6CfA35D50c063325ccA39727c7c8",
    awstETH: "0x1d05d899c3AC6CfA35D50c063325ccA39727c7c8",
    cbETH: "0xf017fcb346a1885194689ba23eff2fe6fa5c483b",
    DAI: "0x773616E4d11A78F511299002da57A0a94577F1f4",
    USDC: "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4",
    USDT: "0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46",
    FRAX: "0x14d04fff8d21bd62987a5ce9ce543d2f1edf5d3e",
    WBTC: "0xdeb288F737066589598e9214E782fa5A8eD689e8",
    APE: "0xc7de7f4d4C9c991fF62a07D18b3E31e349833A18",
    sAPE: "0xc7de7f4d4C9c991fF62a07D18b3E31e349833A18",
    cAPE: "0xc7de7f4d4C9c991fF62a07D18b3E31e349833A18",
    yAPE: "0xc7de7f4d4C9c991fF62a07D18b3E31e349833A18",
    BLUR: "0x32A880E831814CfD55dC556645Ef06816fE9bE02",
    AZUKI: "0xA8B9A447C73191744D5B79BcE864F343455E1150",
    BAYC: "0x352f2Bc3039429fC2fe62004a1575aE74001CfcE",
    BAKC: "0x393aecF5EAABB009989D629CB33933A3aE201903",
    CLONEX: "0x021264d59DAbD26E7506Ee7278407891Bb8CDCCc",
    WPUNKS: "0x01B6710B01cF3dd8Ae64243097d91aFb03728Fdd",
    DOODLE: "0x027828052840a43Cc2D0187BcfA6e3D6AcE60336",
    MAYC: "0x1823C89715Fe3fB96A24d11c917aCA918894A090",
    MOONBIRD: "0x9cd36E0E8D3C27d630D00406ACFC3463154951Af",
    UniswapV3: "0xAf7508f0ccFffFd0BE5D3EC6304CF6258a852de5",
    SFVLDR: "0x2d21Da8e041E82253e3cbE2012D4d59d46F3c1f2",
    SEWER: "0x6D09f55aae5489D664203Fb8aD72A8d520A87470",
  },
  ReservesConfig: {
    DAI: strategyDAI,
    USDC: strategyUSDC,
    USDT: strategyUSDT,
    FRAX: strategyFRAX,
    WETH: strategyWETH,
    aWETH: strategyAWETH,
    // bendETH: strategyBENDETH,
    stETH: strategySTETH,
    wstETH: strategyWSTETH,
    cbETH: strategyCBETH,
    rETH: strategyRETH,
    // cETH: strategyCETH,
    // astETH: strategyASTETH,
    // awstETH: strategyAWSTETH,
    APE: strategyAPE,
    WBTC: strategyWBTC,
    BLUR: strategyBLUR,
    DOODLE: strategyDoodles,
    BAYC: strategyBAYC,
    MAYC: strategyMAYC,
    WPUNKS: strategyWPunks,
    MOONBIRD: strategyMoonbird,
    MEEBITS: strategyMeebits,
    AZUKI: strategyAzuki,
    OTHR: strategyOthr,
    CLONEX: strategyClonex,
    sAPE: strategySAPE,
    cAPE: strategyCAPE,
    UniswapV3: strategyUniswapV3,
    BAKC: strategyBAKC,
    SEWER: strategySEWER,
    PPG: strategyPudgyPenguins,
    SFVLDR: strategyStakefishValidator,
    HVMTL: strategyHVMTL,
    BEANZ: strategyBEANZ,
    DEGODS: strategyDEGODS,
    EXP: strategyEXP,
    VSL: strategyVSL,
    KODA: strategyKODA,
    BLOCKS: strategyBLOCKS,
  },
  Mocks: undefined,
  Oracle: MainnetOracleConfig,
  HotWallet: "0xC3AA9bc72Bd623168860a1e5c6a4530d3D80456c",
  DelegationRegistry: "0x00000000000076A84feF008CDAbe6409d2FE638B",
  Governance: {
    Multisend: MULTI_SEND || "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D",
    Multisig: MULTI_SIG || "0xe965198731CDdB2f06e91DD0CDff74b71e4b3714",
  },
  ParaSpaceV1: {
    PoolV1: "0x638a98BBB92a7582d07C52ff407D49664DC8b3Ee",
    ProtocolDataProviderV1: "0xbc88150EbEFDa53fb61F4C59E98d0dE5EBbB8CD3",
    CApeV1: "0xC5c9fB6223A989208Df27dCEE33fC59ff5c26fFF",
    TimeLockV1: "0x59B72FdB45B3182c8502cC297167FE4f821f332d",
    P2PPairStakingV1: "0xf090Eb4c2B63e7B26E8Bb09e6Fc0cC3A7586263B",
  },
};

export const ParaSpaceConfigs: Partial<
  Record<eEthereumNetwork, IParaSpaceConfiguration>
> = {
  [eEthereumNetwork.hardhat]: HardhatConfig,
  [eEthereumNetwork.anvil]: HardhatConfig,
  [eEthereumNetwork.localhost]: HardhatConfig,
  [eEthereumNetwork.moonbeam]: MoonbeamConfig,
  [eEthereumNetwork.moonbase]: MoonbaseConfig,
  [eEthereumNetwork.goerli]: GoerliConfig,
  [eEthereumNetwork.mainnet]: MainnetConfig,
  [eEthereumNetwork.arbitrumGoerli]: ArbitrumGoerliConfig,
  [eEthereumNetwork.arbitrum]: ArbitrumConfig,
  [eEthereumNetwork.polygon]: PolygonConfig,
  [eEthereumNetwork.polygonMumbai]: PolygonMumbaiConfig,
  [eEthereumNetwork.polygonZkevm]: PolygonZkevmConfig,
  [eEthereumNetwork.polygonZkevmGoerli]: PolygonZkevmGoerliConfig,
  [eEthereumNetwork.zksync]: ZkSyncConfig,
  [eEthereumNetwork.zksyncGoerli]: ZkSyncGoerliConfig,
  [eEthereumNetwork.linea]: LineaConfig,
  [eEthereumNetwork.lineaGoerli]: LineaGoerliConfig,
};
