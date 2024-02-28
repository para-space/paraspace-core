import {utils} from "ethers";
import {IAuctionStrategyParams} from "../helpers/types";

export const auctionStrategyBAYC: IAuctionStrategyParams = {
  name: "auctionStrategyBAYC",
  maxPriceMultiplier: utils.parseUnits("2.5", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.01102276665", 18).toString(),
  stepExp: utils.parseUnits("0.02022592736", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyWPunks: IAuctionStrategyParams = {
  name: "auctionStrategyWPunks",
  maxPriceMultiplier: utils.parseUnits("5", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.01149268155", 18).toString(),
  stepExp: utils.parseUnits("0.04100348452", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyMAYC: IAuctionStrategyParams = {
  name: "auctionStrategyMAYC",
  maxPriceMultiplier: utils.parseUnits("2", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.01830333903", 18).toString(),
  stepExp: utils.parseUnits("0.02337453645", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyDoodles: IAuctionStrategyParams = {
  name: "auctionStrategyDoodles",
  maxPriceMultiplier: utils.parseUnits("3.5", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.7", 18).toString(),
  stepLinear: utils.parseUnits("0.02106053073", 18).toString(),
  stepExp: utils.parseUnits("0.04508812849", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyOthr: IAuctionStrategyParams = {
  name: "auctionStrategyOthr",
  maxPriceMultiplier: utils.parseUnits("3", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.9", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.06875", 18).toString(),
  stepExp: utils.parseUnits("0.0285474001559822", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyCloneX: IAuctionStrategyParams = {
  name: "auctionStrategyCloneX",
  maxPriceMultiplier: utils.parseUnits("3", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.5", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.02584044038", 18).toString(),
  stepExp: utils.parseUnits("0.02558746914", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyMoonbird: IAuctionStrategyParams = {
  name: "auctionStrategyMoonbird",
  maxPriceMultiplier: utils.parseUnits("2", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.1", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.01136311018", 18).toString(),
  stepExp: utils.parseUnits("0.02264429236", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyMeebits: IAuctionStrategyParams = {
  name: "auctionStrategyMeebits",
  maxPriceMultiplier: utils.parseUnits("5", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.0114491225", 18).toString(),
  stepExp: utils.parseUnits("0.04084807493", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyAzuki: IAuctionStrategyParams = {
  name: "auctionStrategyAzuki",
  maxPriceMultiplier: utils.parseUnits("3", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.7", 18).toString(),
  stepLinear: utils.parseUnits("0.02957356117", 18).toString(),
  stepExp: utils.parseUnits("0.05419596001", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyUniswapV3: IAuctionStrategyParams = {
  name: "auctionStrategyUniswapV3",
  maxPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.003102276665", 18).toString(),
  stepExp: utils.parseUnits("0.2022592736", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyBAKC: IAuctionStrategyParams = {
  name: "auctionStrategyBAKC",
  maxPriceMultiplier: utils.parseUnits("2", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.01102276665", 18).toString(),
  stepExp: utils.parseUnits("0.02022592736", 18).toString(),
  tickLength: "900",
};

export const auctionStrategySEWER: IAuctionStrategyParams = {
  name: "auctionStrategySEWER",
  maxPriceMultiplier: utils.parseUnits("2.5", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.01102276665", 18).toString(),
  stepExp: utils.parseUnits("0.02022592736", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyPudgyPenguins: IAuctionStrategyParams = {
  name: "auctionStrategyPudgyPenguins",
  maxPriceMultiplier: utils.parseUnits("2.6", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.025", 18).toString(),
  stepExp: utils.parseUnits("0.0483", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyStakefishValidator: IAuctionStrategyParams = {
  name: "auctionStrategyStakefishValidator",
  maxPriceMultiplier: utils.parseUnits("1", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.95", 18).toString(),
  stepLinear: utils.parseUnits("0.00000364583", 18).toString(),
  stepExp: utils.parseUnits("0.0483", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyHVMTL: IAuctionStrategyParams = {
  name: "auctionStrategyHVMTL",
  maxPriceMultiplier: utils.parseUnits("3", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.06875", 18).toString(),
  stepExp: utils.parseUnits("0.0285474001559822", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyBEANZ: IAuctionStrategyParams = {
  name: "auctionStrategyBEANZ",
  maxPriceMultiplier: utils.parseUnits("2.6", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.1", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.7", 18).toString(),
  stepLinear: utils.parseUnits("0.025", 18).toString(),
  stepExp: utils.parseUnits("0.0537625790764445", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyDEGODS: IAuctionStrategyParams = {
  name: "auctionStrategyDEGODS",
  maxPriceMultiplier: utils.parseUnits("3", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.06875", 18).toString(),
  stepExp: utils.parseUnits("0.0285474001559822", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyEXP: IAuctionStrategyParams = {
  name: "auctionStrategyEXP",
  maxPriceMultiplier: utils.parseUnits("3", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.06875", 18).toString(),
  stepExp: utils.parseUnits("0.0285474001559822", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyVSL: IAuctionStrategyParams = {
  name: "auctionStrategyVSL",
  maxPriceMultiplier: utils.parseUnits("3", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.06875", 18).toString(),
  stepExp: utils.parseUnits("0.0285474001559822", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyKODA: IAuctionStrategyParams = {
  name: "auctionStrategyKODA",
  maxPriceMultiplier: utils.parseUnits("3", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.06875", 18).toString(),
  stepExp: utils.parseUnits("0.0285474001559822", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyBLOCKS: IAuctionStrategyParams = {
  name: "auctionStrategyBLOCKS",
  maxPriceMultiplier: utils.parseUnits("10", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.1", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.00625", 18).toString(),
  stepExp: utils.parseUnits("0.0459848940247859", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyExp: IAuctionStrategyParams = {
  name: "auctionStrategyExp",
  maxPriceMultiplier: utils.parseUnits("3", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.5", 18).toString(),
  stepLinear: utils.parseUnits("0.057", 18).toString(),
  stepExp: utils.parseUnits("0.08", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyEXRP: IAuctionStrategyParams = {
  name: "auctionStrategyEXRP",
  maxPriceMultiplier: utils.parseUnits("3", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.06875", 18).toString(),
  stepExp: utils.parseUnits("0.0285474001559822", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyPandora: IAuctionStrategyParams = {
  name: "auctionStrategyPandora",
  maxPriceMultiplier: utils.parseUnits("3", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1.2", 18).toString(),
  minPriceMultiplier: utils.parseUnits("0.8", 18).toString(),
  stepLinear: utils.parseUnits("0.06875", 18).toString(),
  stepExp: utils.parseUnits("0.0285474001559822", 18).toString(),
  tickLength: "900",
};

export const auctionStrategyLinear: IAuctionStrategyParams = {
  name: "auctionStrategyLinear",
  maxPriceMultiplier: utils.parseUnits("3", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1", 18).toString(), // NOT USED
  minPriceMultiplier: utils.parseUnits("0.5", 18).toString(),
  stepLinear: utils.parseUnits("0.05", 18).toString(),
  stepExp: utils.parseUnits("0.1", 18).toString(), // NOT USED
  tickLength: "60", // mainly used for tests so shouldn't be too much to avoid influencing accruing interests
};

export const auctionStrategyZero: IAuctionStrategyParams = {
  name: "auctionStrategyZero",
  maxPriceMultiplier: utils.parseUnits("3", 18).toString(),
  minExpPriceMultiplier: utils.parseUnits("1", 18).toString(), // NOT USED
  minPriceMultiplier: utils.parseUnits("0.5", 18).toString(),
  stepLinear: utils.parseUnits("0.05", 18).toString(),
  stepExp: utils.parseUnits("0.1", 18).toString(), // NOT USED
  tickLength: "60", // mainly used for tests so shouldn't be too much to avoid influencing accruing interests
};
