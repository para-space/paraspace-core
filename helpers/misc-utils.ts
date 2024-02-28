import {isZeroAddress} from "ethereumjs-util";
import {BigNumber, ContractTransaction, Wallet, utils} from "ethers";
import {isAddress} from "ethers/lib/utils";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import low from "lowdb";
import {getAdapter} from "./db-adapter";
import {eEthereumNetwork, IParaSpaceConfiguration} from "../helpers/types";
import {ParaSpaceConfigs} from "../market-config";
import {
  ARBITRUM_GOERLI_CHAINID,
  ARBITRUM_ONE_CHAINID,
  DB_PATH,
  FORK,
  FORK_CHAINID,
  GOERLI_CHAINID,
  HARDHAT_CHAINID,
  MAINNET_CHAINID,
  MOONBEAM_CHAINID,
  POLYGON_MUMBAI_CHAINID,
  POLYGON_CHAINID,
  POLYGON_ZKEVM_CHAINID,
  POLYGON_ZKEVM_GOERLI_CHAINID,
  ZKSYNC_CHAINID,
  ZKSYNC_GOERLI_CHAINID,
  ETHERSCAN_NETWORKS,
  ETHERSCAN_VERIFICATION_CONTRACTS,
  ETHERSCAN_KEY,
  MOONBASE_CHAINID,
  LINEA_CHAINID,
  LINEA_GOERLI_CHAINID,
  MANTA_TEST_CHAINID,
  MANTA_CHAINID,
  SEPOLIA_CHAINID,
  ARBITRUM_SEPOLIA_CHAINID,
  PARALLEL_DEV_CHAINID,
  NEON_CHAINID,
  PARALLEL_CHAINID,
} from "./hardhat-constants";
import {ConstructorArgs, eContractid, tEthereumAddress} from "./types";
import dotenv from "dotenv";
import minimatch from "minimatch";

dotenv.config();

export const getDb = () => low(getAdapter(DB_PATH));

export let DRE: HardhatRuntimeEnvironment;

export const setDRE = (_DRE: HardhatRuntimeEnvironment) => {
  DRE = _DRE;
};

export const getParaSpaceConfig = (): IParaSpaceConfiguration => {
  return ParaSpaceConfigs[FORK || DRE.network.name];
};

export const isLocalTestnet = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return [HARDHAT_CHAINID].includes(DRE.network.config.chainId!);
};

export const isPublicTestnet = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (
    [
      GOERLI_CHAINID,
      SEPOLIA_CHAINID,
      ARBITRUM_GOERLI_CHAINID,
      ARBITRUM_SEPOLIA_CHAINID,
      PARALLEL_DEV_CHAINID,
      ZKSYNC_GOERLI_CHAINID,
      POLYGON_ZKEVM_GOERLI_CHAINID,
      POLYGON_MUMBAI_CHAINID,
      MOONBASE_CHAINID,
      LINEA_GOERLI_CHAINID,
      MANTA_TEST_CHAINID,
    ].includes(DRE.network.config.chainId!) ||
    [
      eEthereumNetwork.goerli,
      eEthereumNetwork.sepolia,
      eEthereumNetwork.arbitrumGoerli,
      eEthereumNetwork.arbitrumSepolia,
      eEthereumNetwork.parallelDev,
      eEthereumNetwork.zksyncGoerli,
      eEthereumNetwork.polygonZkevmGoerli,
      eEthereumNetwork.polygonMumbai,
      eEthereumNetwork.moonbase,
      eEthereumNetwork.lineaGoerli,
    ].includes(FORK as eEthereumNetwork)
  );
};

export const isFork = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return [FORK_CHAINID].includes(DRE.network.config.chainId!);
};

export const isMoonbeam = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (
    [MOONBEAM_CHAINID].includes(DRE.network.config.chainId!) ||
    [eEthereumNetwork.moonbeam].includes(FORK as eEthereumNetwork)
  );
};

export const isArbitrum = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (
    [ARBITRUM_ONE_CHAINID].includes(DRE.network.config.chainId!) ||
    [eEthereumNetwork.arbitrum].includes(FORK as eEthereumNetwork)
  );
};

export const isEthereum = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (
    [MAINNET_CHAINID].includes(DRE.network.config.chainId!) ||
    [eEthereumNetwork.mainnet].includes(FORK as eEthereumNetwork)
  );
};

export const isPolygon = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (
    [POLYGON_CHAINID].includes(DRE.network.config.chainId!) ||
    [eEthereumNetwork.polygon].includes(FORK as eEthereumNetwork)
  );
};

export const isPolygonZkEVM = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (
    [POLYGON_ZKEVM_CHAINID].includes(DRE.network.config.chainId!) ||
    [eEthereumNetwork.polygonZkevm].includes(FORK as eEthereumNetwork)
  );
};

export const isZkSync = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (
    [ZKSYNC_CHAINID].includes(DRE.network.config.chainId!) ||
    [eEthereumNetwork.zksync].includes(FORK as eEthereumNetwork)
  );
};

export const isLinea = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (
    [LINEA_CHAINID].includes(DRE.network.config.chainId!) ||
    [eEthereumNetwork.linea].includes(FORK as eEthereumNetwork)
  );
};

export const isNeon = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (
    [NEON_CHAINID].includes(DRE.network.config.chainId!) ||
    [eEthereumNetwork.neon].includes(FORK as eEthereumNetwork)
  );
};

export const isParallel = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (
    [PARALLEL_CHAINID].includes(DRE.network.config.chainId!) ||
    [eEthereumNetwork.parallel].includes(FORK as eEthereumNetwork)
  );
};

export const isManta = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (
    [MANTA_CHAINID].includes(DRE.network.config.chainId!) ||
    [eEthereumNetwork.manta].includes(FORK as eEthereumNetwork)
  );
};

export const isMainnet = (): boolean =>
  isEthereum() ||
  isMoonbeam() ||
  isArbitrum() ||
  isZkSync() ||
  isPolygon() ||
  isPolygonZkEVM() ||
  isNeon() ||
  isParallel() ||
  isManta() ||
  isLinea();

export const safeTransactionServiceUrl = (): string => {
  return isMoonbeam()
    ? "https://transaction.multisig.moonbeam.network"
    : `https://safe-transaction-${FORK || DRE.network.name}.safe.global`;
};

export const shouldVerifyContract = (contractId: string): boolean => {
  if (!ETHERSCAN_NETWORKS.includes(DRE.network.name)) {
    return false;
  }

  if (
    ETHERSCAN_VERIFICATION_CONTRACTS?.every((p) => !minimatch(contractId, p))
  ) {
    return false;
  }

  if (!ETHERSCAN_KEY) {
    throw Error("Missing ETHERSCAN_KEY.");
  }

  return true;
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const createRandomAddress = () => Wallet.createRandom().address;

export const setAutomineEvm = async (activate: boolean) => {
  await DRE.network.provider.send("evm_setAutomine", [activate]);
};

export const evmSnapshot = async () =>
  await DRE.ethers.provider.send("evm_snapshot", []);

export const evmRevert = async (id: string) =>
  DRE.ethers.provider.send("evm_revert", [id]);

export const timeLatest = async () => {
  const block = await DRE.ethers.provider.getBlock("latest");
  return BigNumber.from(block.timestamp);
};

export const advanceBlock = async (timestamp: number) =>
  await DRE.ethers.provider.send("evm_mine", [timestamp]);

export const increaseTime = async (secondsToIncrease: number) => {
  await DRE.ethers.provider.send("evm_increaseTime", [secondsToIncrease]);
  await DRE.ethers.provider.send("evm_mine", []);
};

export const setBlocktime = async (time: number) => {
  await DRE.ethers.provider.send("evm_setNextBlockTimestamp", [time]);
};

// Workaround for time travel tests bug: https://github.com/Tonyhaenn/hh-time-travel/blob/0161d993065a0b7585ec5a043af2eb4b654498b8/test/test.js#L12
export const advanceTimeAndBlock = async function (forwardTime: number) {
  const currentBlockNumber = await DRE.ethers.provider.getBlockNumber();
  const currentBlock = await DRE.ethers.provider.getBlock(currentBlockNumber);

  if (currentBlock === null) {
    /* Workaround for https://github.com/nomiclabs/hardhat/issues/1183
     */
    await DRE.ethers.provider.send("evm_increaseTime", [forwardTime]);
    await DRE.ethers.provider.send("evm_mine", []);
    //Set the next blocktime back to 15 seconds
    await DRE.ethers.provider.send("evm_increaseTime", [15]);
    return;
  }
  const currentTime = currentBlock.timestamp;
  const futureTime = currentTime + forwardTime;
  await DRE.ethers.provider.send("evm_setNextBlockTimestamp", [futureTime]);
  await DRE.ethers.provider.send("evm_mine", []);
};

export const setAutomine = async (activate: boolean) => {
  await DRE.network.provider.send("evm_setAutomine", [activate]);
  if (activate) await DRE.network.provider.send("evm_mine", []);
};

export const mine = async () => {
  await DRE.network.provider.send("evm_mine", []);
};

export const waitForTx = async (tx: ContractTransaction) => await tx.wait(1);

export const chunk = <T>(arr: Array<T>, chunkSize: number): Array<Array<T>> => {
  return arr.reduce(
    // eslint-disable-next-line
    (prevVal: any, currVal: any, currIndx: number, array: Array<T>) =>
      !(currIndx % chunkSize)
        ? prevVal.concat([array.slice(currIndx, currIndx + chunkSize)])
        : prevVal,
    []
  );
};

export interface DbEntry {
  [network: string]: {
    deployer: string;
    address: string;
    constructorArgs: ConstructorArgs;
    verified: boolean;
  };
}

export const printContracts = () => {
  const network = DRE.network.name;
  const db = getDb();
  const ignores = [eContractid.MintableERC20, eContractid.MintableERC721];
  console.log("Contracts deployed at", network);
  console.log("---------------------------------");

  const entries = Object.entries<DbEntry>(db.getState()).filter(
    ([key, value]) => {
      return !ignores.includes(key as eContractid) && !!value[network];
    }
  );

  const contractsPrint = entries.map(
    ([key, value]: [string, DbEntry]) => `${key}: ${value[network].address}`
  );

  console.log("N# Contracts:", entries.length);
  console.log(contractsPrint.join("\n"));
};

export const notFalsyOrZeroAddress = (
  address: tEthereumAddress | null | undefined
): boolean => {
  if (!address) {
    return false;
  }
  return isAddress(address) && !isZeroAddress(address);
};

export const calcOpHash = function (op, entryPoint, chainId) {
  const packed = utils.defaultAbiCoder.encode(
    [
      "address",
      "uint256",
      "bytes32",
      "bytes32",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "bytes32",
    ],
    [
      op.sender,
      op.nonce,
      utils.keccak256(op.initCode),
      utils.keccak256(op.callData),
      op.callGasLimit,
      op.verificationGasLimit,
      op.preVerificationGas,
      op.maxFeePerGas,
      op.maxPriorityFeePerGas,
      utils.keccak256(op.paymasterAndData),
    ]
  );

  const enc = utils.defaultAbiCoder.encode(
    ["bytes32", "address", "uint256"],
    [utils.keccak256(packed), entryPoint, chainId]
  );

  return utils.keccak256(enc);
};
