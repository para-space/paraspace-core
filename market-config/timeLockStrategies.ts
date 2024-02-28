import {parseUnits} from "ethers/lib/utils";
import {ITimeLockStrategyParams} from "../helpers/types";

export const timeLockStrategyUSDC: ITimeLockStrategyParams = {
  name: "timeLockStrategyUSDC",
  minThreshold: parseUnits("105000", 6).toString(),
  midThreshold: parseUnits("400000", 6).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("1875000", 6).toString(),
  period: "86400",
};

export const timeLockStrategyaUSDC: ITimeLockStrategyParams = {
  name: "timeLockStrategyaUSDC",
  minThreshold: parseUnits("105000", 6).toString(),
  midThreshold: parseUnits("400000", 6).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("1875000", 6).toString(),
  period: "86400",
};

export const timeLockStrategyUSDT: ITimeLockStrategyParams = {
  name: "timeLockStrategyUSDT",
  minThreshold: parseUnits("105000", 6).toString(),
  midThreshold: parseUnits("200500", 6).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("400000", 6).toString(),
  period: "86400",
};

export const timeLockStrategyDAI: ITimeLockStrategyParams = {
  name: "timeLockStrategyDAI",
  minThreshold: parseUnits("40000", 18).toString(),
  midThreshold: parseUnits("100000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("17500", 18).toString(),
  period: "86400",
};

export const timeLockStrategyFRAX: ITimeLockStrategyParams = {
  name: "timeLockStrategyFRAX",
  minThreshold: parseUnits("30000", 18).toString(),
  midThreshold: parseUnits("50000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("15000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyWETH: ITimeLockStrategyParams = {
  name: "timeLockStrategyWETH",
  minThreshold: parseUnits("51.5", 18).toString(),
  midThreshold: parseUnits("155", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("1900", 18).toString(),
  period: "86400",
};

export const timeLockStrategyTIA: ITimeLockStrategyParams = {
  name: "timeLockStrategyWETH",
  minThreshold: parseUnits("2000", 6).toString(),
  midThreshold: parseUnits("10000", 6).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("50000", 6).toString(),
  period: "86400",
};

export const timeLockStrategyMANTA: ITimeLockStrategyParams = {
  name: "timeLockStrategyWETH",
  minThreshold: parseUnits("10000", 18).toString(),
  midThreshold: parseUnits("100000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("500000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyuBAYC: ITimeLockStrategyParams = {
  name: "timeLockStrategyuBAYC",
  minThreshold: parseUnits("1800000", 18).toString(),
  midThreshold: parseUnits("5400000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("64800000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyuPPG: ITimeLockStrategyParams = {
  name: "timeLockStrategyuPPG",
  minThreshold: parseUnits("10000000", 18).toString(),
  midThreshold: parseUnits("30000000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("360000000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyCBETH: ITimeLockStrategyParams = {
  name: "timeLockStrategyCBETH",
  minThreshold: parseUnits("51.5", 18).toString(),
  midThreshold: parseUnits("155", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("1900", 18).toString(),
  period: "86400",
};

export const timeLockStrategyRETH: ITimeLockStrategyParams = {
  name: "timeLockStrategyRETH",
  minThreshold: parseUnits("51.5", 18).toString(),
  midThreshold: parseUnits("155", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("1900", 18).toString(),
  period: "86400",
};

export const timeLockStrategySTETH: ITimeLockStrategyParams = {
  name: "timeLockStrategySTETH",
  minThreshold: parseUnits("51.5", 18).toString(),
  midThreshold: parseUnits("155", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("1900", 18).toString(),
  period: "86400",
};

export const timeLockStrategyASTETH: ITimeLockStrategyParams = {
  name: "timeLockStrategyASTETH",
  minThreshold: parseUnits("51.5", 18).toString(),
  midThreshold: parseUnits("155", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("1900", 18).toString(),
  period: "86400",
};

export const timeLockStrategyWSTETH: ITimeLockStrategyParams = {
  name: "timeLockStrategyWSTETH",
  minThreshold: parseUnits("51.5", 18).toString(),
  midThreshold: parseUnits("155", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("1900", 18).toString(),
  period: "86400",
};

export const timeLockStrategyBENDETH: ITimeLockStrategyParams = {
  name: "timeLockStrategyBENDETH",
  minThreshold: parseUnits("51.5", 18).toString(),
  midThreshold: parseUnits("155", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("1900", 18).toString(),
  period: "86400",
};

export const timeLockStrategyAWSTETH: ITimeLockStrategyParams = {
  name: "timeLockStrategyAWSTETH",
  minThreshold: parseUnits("51.5", 18).toString(),
  midThreshold: parseUnits("155", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("1900", 18).toString(),
  period: "86400",
};

export const timeLockStrategyAWETH: ITimeLockStrategyParams = {
  name: "timeLockStrategyAWETH",
  minThreshold: parseUnits("51.5", 18).toString(),
  midThreshold: parseUnits("155", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("1900", 18).toString(),
  period: "86400",
};

export const timeLockStrategyCETH: ITimeLockStrategyParams = {
  name: "timeLockStrategyCETH",
  minThreshold: parseUnits("51.5", 18).toString(),
  midThreshold: parseUnits("155", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("1900", 18).toString(),
  period: "86400",
};

export const timeLockStrategyPUNK: ITimeLockStrategyParams = {
  name: "timeLockStrategyPUNK",
  minThreshold: parseUnits("1000", 18).toString(),
  midThreshold: parseUnits("5000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("50000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyWBTC: ITimeLockStrategyParams = {
  name: "timeLockStrategyWBTC",
  minThreshold: parseUnits("2.5", 8).toString(),
  midThreshold: parseUnits("2.8", 8).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("3", 8).toString(),
  period: "86400",
};

export const timeLockStrategyAPE: ITimeLockStrategyParams = {
  name: "timeLockStrategyAPE",
  minThreshold: parseUnits("10975", 18).toString(),
  midThreshold: parseUnits("20100", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("30000", 18).toString(),
  period: "86400",
};

export const timeLockStrategySAPE: ITimeLockStrategyParams = {
  name: "timeLockStrategySAPE",
  minThreshold: parseUnits("10975", 18).toString(),
  midThreshold: parseUnits("53000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("1000000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyCAPE: ITimeLockStrategyParams = {
  name: "timeLockStrategyCAPE",
  minThreshold: parseUnits("10975", 18).toString(),
  midThreshold: parseUnits("53000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("1000000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyYAPE: ITimeLockStrategyParams = {
  name: "timeLockStrategyYAPE",
  minThreshold: parseUnits("10975", 18).toString(),
  midThreshold: parseUnits("53000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("1000000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyXCDOT: ITimeLockStrategyParams = {
  name: "timeLockStrategyXCDOT",
  minThreshold: parseUnits("1000", 10).toString(),
  midThreshold: parseUnits("5000", 10).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("50000", 10).toString(),
  period: "86400",
};

export const timeLockStrategySTDOT: ITimeLockStrategyParams = {
  name: "timeLockStrategySTDOT",
  minThreshold: parseUnits("1000", 10).toString(),
  midThreshold: parseUnits("5000", 10).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("50000", 10).toString(),
  period: "86400",
};

export const timeLockStrategyXCUSDT: ITimeLockStrategyParams = {
  name: "timeLockStrategyXCUSDT",
  minThreshold: parseUnits("105000", 6).toString(),
  midThreshold: parseUnits("200500", 6).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("400000", 6).toString(),
  period: "86400",
};

export const timeLockStrategyUSDCWH: ITimeLockStrategyParams = {
  name: "timeLockStrategyUSDCWH",
  minThreshold: parseUnits("105000", 6).toString(),
  midThreshold: parseUnits("400000", 6).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("1875000", 6).toString(),
  period: "86400",
};

export const timeLockStrategyWETHWH: ITimeLockStrategyParams = {
  name: "timeLockStrategyWETHWH",
  minThreshold: parseUnits("51.5", 18).toString(),
  midThreshold: parseUnits("155", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("1900", 18).toString(),
  period: "86400",
};

export const timeLockStrategyWBTCWH: ITimeLockStrategyParams = {
  name: "timeLockStrategyWBTCWH",
  minThreshold: parseUnits("2.5", 8).toString(),
  midThreshold: parseUnits("2.8", 8).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("3", 8).toString(),
  period: "86400",
};

export const timeLockStrategyWGLMR: ITimeLockStrategyParams = {
  name: "timeLockStrategyWGLMR",
  minThreshold: parseUnits("1000", 18).toString(),
  midThreshold: parseUnits("5000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("50000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyBLUR: ITimeLockStrategyParams = {
  name: "timeLockStrategyBLUR",
  minThreshold: parseUnits("71500", 18).toString(),
  midThreshold: parseUnits("118750", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("200000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyGMX: ITimeLockStrategyParams = {
  name: "timeLockStrategyGMX",
  minThreshold: parseUnits("1000", 18).toString(),
  midThreshold: parseUnits("2000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("3000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyARB: ITimeLockStrategyParams = {
  name: "timeLockStrategyARB",
  minThreshold: parseUnits("10000", 18).toString(),
  midThreshold: parseUnits("20000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("30000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyBAL: ITimeLockStrategyParams = {
  name: "timeLockStrategyBAL",
  minThreshold: parseUnits("10000", 18).toString(),
  midThreshold: parseUnits("20000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("30000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyRDNT: ITimeLockStrategyParams = {
  name: "timeLockStrategyRDNT",
  minThreshold: parseUnits("80000", 18).toString(),
  midThreshold: parseUnits("120000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("240000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyLINK: ITimeLockStrategyParams = {
  name: "timeLockStrategyLINK",
  minThreshold: parseUnits("10000", 18).toString(),
  midThreshold: parseUnits("20000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("30000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyAAVE: ITimeLockStrategyParams = {
  name: "timeLockStrategyAAVE",
  minThreshold: parseUnits("1000", 18).toString(),
  midThreshold: parseUnits("2000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("3000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyUNI: ITimeLockStrategyParams = {
  name: "timeLockStrategyUNI",
  minThreshold: parseUnits("10000", 18).toString(),
  midThreshold: parseUnits("20000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("30000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyMATIC: ITimeLockStrategyParams = {
  name: "timeLockStrategyMATIC",
  minThreshold: parseUnits("80000", 18).toString(),
  midThreshold: parseUnits("120000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("240000", 18).toString(),
  period: "86400",
};

export const timeLockStrategySTMATIC: ITimeLockStrategyParams = {
  name: "timeLockStrategySTMATIC",
  minThreshold: parseUnits("80000", 18).toString(),
  midThreshold: parseUnits("120000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("240000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyCRV: ITimeLockStrategyParams = {
  name: "timeLockStrategyCRV",
  minThreshold: parseUnits("80000", 18).toString(),
  midThreshold: parseUnits("120000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("240000", 18).toString(),
  period: "86400",
};

export const timeLockStrategyWMATIC: ITimeLockStrategyParams = {
  name: "timeLockStrategyWMATIC",
  minThreshold: parseUnits("80000", 18).toString(),
  midThreshold: parseUnits("120000", 18).toString(),
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: parseUnits("240000", 18).toString(),
  period: "86400",
};

////////////////////////////////////////////////////////////////////////////////
// ERC721
////////////////////////////////////////////////////////////////////////////////

export const timeLockStrategyBAYC: ITimeLockStrategyParams = {
  name: "timeLockStrategyBAYC",
  minThreshold: "2",
  midThreshold: "4",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "100",
  period: "86400",
};

export const timeLockStrategyMAYC: ITimeLockStrategyParams = {
  name: "timeLockStrategyMAYC",
  minThreshold: "2",
  midThreshold: "6",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "200",
  period: "86400",
};

export const timeLockStrategyBAKC: ITimeLockStrategyParams = {
  name: "timeLockStrategyBAKC",
  minThreshold: "4",
  midThreshold: "12",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "57",
  period: "86400",
};

export const timeLockStrategyDoodles: ITimeLockStrategyParams = {
  name: "timeLockStrategyDoodles",
  minThreshold: "5",
  midThreshold: "20",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "2",
  period: "86400",
};

export const timeLockStrategyOTHR: ITimeLockStrategyParams = {
  name: "timeLockStrategyOTHR",
  minThreshold: "10",
  midThreshold: "30",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "230",
  period: "86400",
};

export const timeLockStrategyCloneX: ITimeLockStrategyParams = {
  name: "timeLockStrategyCloneX",
  minThreshold: "5",
  midThreshold: "20",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "8",
  period: "86400",
};

export const timeLockStrategyMoonbird: ITimeLockStrategyParams = {
  name: "timeLockStrategyMoonbird",
  minThreshold: "5",
  midThreshold: "20",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "3",
  period: "86400",
};

export const timeLockStrategyMeebits: ITimeLockStrategyParams = {
  name: "timeLockStrategyMeebits",
  minThreshold: "5",
  midThreshold: "20",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "13",
  period: "86400",
};

export const timeLockStrategyAzuki: ITimeLockStrategyParams = {
  name: "timeLockStrategyAzuki",
  minThreshold: "2",
  midThreshold: "6",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "9",
  period: "86400",
};

export const timeLockStrategyWPunks: ITimeLockStrategyParams = {
  name: "timeLockStrategyWPunks",
  minThreshold: "2",
  midThreshold: "4",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "2",
  period: "86400",
};

export const timeLockStrategyUniswapV3: ITimeLockStrategyParams = {
  name: "timeLockStrategyUniswapV3",
  minThreshold: "5",
  midThreshold: "10",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "50",
  period: "86400",
};

export const timeLockStrategySEWER: ITimeLockStrategyParams = {
  name: "timeLockStrategySEWER",
  minThreshold: "5",
  midThreshold: "20",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "2",
  period: "86400",
};

export const timeLockStrategyPenguins: ITimeLockStrategyParams = {
  name: "timeLockStrategyPenguins",
  minThreshold: "4",
  midThreshold: "12",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "2",
  period: "86400",
};

export const timeLockStrategyStakefishValidator: ITimeLockStrategyParams = {
  name: "timeLockStrategyStakefishValidator",
  minThreshold: "4",
  midThreshold: "12",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "2",
  period: "86400",
};

export const timeLockStrategyHVMTL: ITimeLockStrategyParams = {
  name: "timeLockStrategyHVMTL",
  minThreshold: "10",
  midThreshold: "30",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "100",
  period: "86400",
};

export const timeLockStrategyBEANZ: ITimeLockStrategyParams = {
  name: "timeLockStrategyBEANZ",
  minThreshold: "5",
  midThreshold: "20",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "40",
  period: "86400",
};

export const timeLockStrategyDEGODS: ITimeLockStrategyParams = {
  name: "timeLockStrategyDEGODS",
  minThreshold: "4",
  midThreshold: "12",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "10",
  period: "86400",
};

export const timeLockStrategyEXP: ITimeLockStrategyParams = {
  name: "timeLockStrategyEXP",
  minThreshold: "10",
  midThreshold: "30",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "100",
  period: "86400",
};

export const timeLockStrategyVSL: ITimeLockStrategyParams = {
  name: "timeLockStrategyVSL",
  minThreshold: "20",
  midThreshold: "50",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "100",
  period: "86400",
};

export const timeLockStrategyKODA: ITimeLockStrategyParams = {
  name: "timeLockStrategyKODA",
  minThreshold: "4",
  midThreshold: "12",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "10",
  period: "86400",
};

export const timeLockStrategyBLOCKS: ITimeLockStrategyParams = {
  name: "timeLockStrategyBLOCKS",
  minThreshold: "4",
  midThreshold: "12",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "10",
  period: "86400",
};

export const timeLockStrategyEXRP: ITimeLockStrategyParams = {
  name: "timeLockStrategyEXRP",
  minThreshold: "20",
  midThreshold: "50",
  minWaitTime: "12",
  midWaitTime: "7200",
  maxWaitTime: "21600",
  poolPeriodWaitTime: "600",
  poolPeriodLimit: "100",
  period: "86400",
};
