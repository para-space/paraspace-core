import {BigNumber, constants} from "ethers";
import {ZERO_ADDRESS} from "../helpers/constants";
import {ERC20TokenContractId, IOracleConfig} from "../helpers/types";

export const MainnetOracleConfig: IOracleConfig = {
  BaseCurrency: ERC20TokenContractId.WETH,
  BaseCurrencyUnit: constants.WeiPerEther,
  BaseCurrencyDecimals: 18,
  ExpirationPeriod: 2400,
  DeviationRate: 300,
  Nodes: [],
};

export const MoonbeamOracleConfig: IOracleConfig = {
  BaseCurrency: ZERO_ADDRESS,
  BaseCurrencyUnit: BigNumber.from("100000000"),
  BaseCurrencyDecimals: 8,
  ExpirationPeriod: 2400,
  DeviationRate: 300,
  Nodes: [],
};

export const ArbitrumOracleConfig: IOracleConfig = {
  BaseCurrency: ZERO_ADDRESS,
  BaseCurrencyUnit: BigNumber.from("100000000"),
  BaseCurrencyDecimals: 8,
  ExpirationPeriod: 2400,
  DeviationRate: 300,
  Nodes: [],
};

export const PolygonOracleConfig: IOracleConfig = {
  BaseCurrency: ZERO_ADDRESS,
  BaseCurrencyUnit: BigNumber.from("100000000"),
  BaseCurrencyDecimals: 8,
  ExpirationPeriod: 2400,
  DeviationRate: 300,
  Nodes: [],
};

export const ZkSyncOracleConfig: IOracleConfig = {
  BaseCurrency: ZERO_ADDRESS,
  BaseCurrencyUnit: BigNumber.from("100000000"),
  BaseCurrencyDecimals: 8,
  ExpirationPeriod: 2400,
  DeviationRate: 300,
  Nodes: [],
};

export const LineaOracleConfig: IOracleConfig = {
  BaseCurrency: ZERO_ADDRESS,
  BaseCurrencyUnit: BigNumber.from("100000000"),
  BaseCurrencyDecimals: 8,
  ExpirationPeriod: 2400,
  DeviationRate: 300,
  Nodes: [],
};

export const MantaOracleConfig: IOracleConfig = {
  BaseCurrency: ZERO_ADDRESS,
  BaseCurrencyUnit: BigNumber.from("100000000"),
  BaseCurrencyDecimals: 8,
  ExpirationPeriod: 2400,
  DeviationRate: 300,
  Nodes: [],
};

////////////////////////////////////////////////////////////////////////////////
// Testnet
////////////////////////////////////////////////////////////////////////////////
export const TestnetOracleConfig: IOracleConfig = {
  BaseCurrency: ERC20TokenContractId.WETH,
  BaseCurrencyUnit: constants.WeiPerEther,
  BaseCurrencyDecimals: 18,
  ExpirationPeriod: 600,
  DeviationRate: 1000,
  Nodes: [],
};
