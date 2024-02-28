import {HardhatNetworkForkingUserConfig} from "hardhat/types";
import {eEthereumNetwork, iParamsPerNetwork} from "./helpers/types";
import dotenv from "dotenv";
import {
  ALCHEMY_KEY,
  ARBITRUM_GOERLI_CHAINID,
  ARBITRUM_ONE_CHAINID,
  FORK,
  FORK_BLOCK_NUMBER,
  FORK_CHAINID,
  GOERLI_CHAINID,
  SEPOLIA_CHAINID,
  HARDHAT_CHAINID,
  INFURA_KEY,
  L1_RPC_URL,
  L2_RPC_URL,
  LINEA_CHAINID,
  LINEA_GOERLI_CHAINID,
  MAINNET_CHAINID,
  MANTA_CHAINID,
  MANTA_TEST_CHAINID,
  MOONBASE_CHAINID,
  MOONBEAM_CHAINID,
  PARALLEL_CHAINID,
  POLYGON_CHAINID,
  POLYGON_MUMBAI_CHAINID,
  POLYGON_ZKEVM_CHAINID,
  POLYGON_ZKEVM_GOERLI_CHAINID,
  RPC_URL,
  TENDERLY_FORK_ID,
  ZKSYNC_CHAINID,
  ZKSYNC_GOERLI_CHAINID,
  ARBITRUM_SEPOLIA_CHAINID,
  PARALLEL_DEV_CHAINID,
  NEON_CHAINID,
} from "./helpers/hardhat-constants";

dotenv.config();

// const GWEI = 1000 * 1000 * 1000;

export const buildForkConfig = ():
  | HardhatNetworkForkingUserConfig
  | undefined => {
  let forkMode: HardhatNetworkForkingUserConfig | undefined;
  if (FORK) {
    forkMode = {
      url: NETWORKS_RPC_URL[FORK],
    };
    if (FORK_BLOCK_NUMBER || BLOCK_TO_FORK[FORK]) {
      forkMode.blockNumber = FORK_BLOCK_NUMBER || BLOCK_TO_FORK[FORK];
    }
  }
  return forkMode;
};

export const NETWORKS_RPC_URL: iParamsPerNetwork<string> = {
  [eEthereumNetwork.goerli]:
    L1_RPC_URL ||
    RPC_URL ||
    (ALCHEMY_KEY
      ? `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_KEY}`
      : `https://goerli.infura.io/v3/${INFURA_KEY}`),
  [eEthereumNetwork.sepolia]:
    L1_RPC_URL ||
    RPC_URL ||
    (ALCHEMY_KEY
      ? `https://eth-sepolia.alchemyapi.io/v2/${ALCHEMY_KEY}`
      : `https://sepolia.infura.io/v3/${INFURA_KEY}`),
  [eEthereumNetwork.mainnet]:
    L1_RPC_URL ||
    RPC_URL ||
    (ALCHEMY_KEY
      ? `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`
      : `https://mainnet.infura.io/v3/${INFURA_KEY}`),
  [eEthereumNetwork.hardhat]: RPC_URL || "http://localhost:8545",
  [eEthereumNetwork.anvil]: RPC_URL || "http://localhost:8545",
  [eEthereumNetwork.ganache]: RPC_URL || "http://localhost:8545",
  [eEthereumNetwork.tenderlyMain]:
    RPC_URL || `https://rpc.tenderly.co/fork/${TENDERLY_FORK_ID}`,
  [eEthereumNetwork.parallel]: RPC_URL || "https://rpc.parallel.fi",
  [eEthereumNetwork.moonbeam]: "https://rpc.api.moonbeam.network",
  [eEthereumNetwork.moonbase]: "https://rpc.testnet.moonbeam.network",
  [eEthereumNetwork.arbitrum]:
    L2_RPC_URL ||
    RPC_URL ||
    `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  [eEthereumNetwork.arbitrumGoerli]:
    L2_RPC_URL ||
    RPC_URL ||
    `https://arb-goerli.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  [eEthereumNetwork.arbitrumSepolia]:
    L2_RPC_URL ||
    RPC_URL ||
    `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  [eEthereumNetwork.parallelDev]:
    L2_RPC_URL ||
    RPC_URL ||
    `https://rpc-surprised-harlequin-bonobo-fvcy2k9oqh.t.conduit.xyz`,
  [eEthereumNetwork.polygon]:
    RPC_URL || `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  [eEthereumNetwork.polygonMumbai]:
    RPC_URL || `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  [eEthereumNetwork.polygonZkevm]:
    L2_RPC_URL ||
    RPC_URL ||
    `https://polygonzkevm-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  [eEthereumNetwork.polygonZkevmGoerli]:
    L2_RPC_URL ||
    RPC_URL ||
    `https://polygonzkevm-testnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  [eEthereumNetwork.zksync]:
    L2_RPC_URL || RPC_URL || `https://mainnet.era.zksync.io`,
  [eEthereumNetwork.zksyncGoerli]:
    L2_RPC_URL || RPC_URL || `https://testnet.era.zksync.dev`,
  [eEthereumNetwork.linea]:
    L2_RPC_URL ||
    RPC_URL ||
    (INFURA_KEY
      ? `https://linea-mainnet.infura.io/v3/${INFURA_KEY}`
      : "https://rpc.linea.build"),
  [eEthereumNetwork.lineaGoerli]:
    L2_RPC_URL ||
    RPC_URL ||
    (INFURA_KEY
      ? `https://linea-goerli.infura.io/v3/${INFURA_KEY}`
      : `https://rpc.goerli.linea.build`),
  [eEthereumNetwork.manta]: "https://pacific-rpc.manta.network/http",
  [eEthereumNetwork.mantaTest]:
    "https://pacific-rpc.testnet.manta.network/http",
  [eEthereumNetwork.neon]:
    RPC_URL || `https://neon-proxy-mainnet.solana.p2p.org`,
};

export const CHAINS_ID: iParamsPerNetwork<number | undefined> = {
  [eEthereumNetwork.mainnet]: MAINNET_CHAINID,
  [eEthereumNetwork.goerli]: GOERLI_CHAINID,
  [eEthereumNetwork.sepolia]: SEPOLIA_CHAINID,
  [eEthereumNetwork.hardhat]: FORK ? FORK_CHAINID : HARDHAT_CHAINID,
  [eEthereumNetwork.anvil]: HARDHAT_CHAINID,
  [eEthereumNetwork.ganache]: undefined,
  [eEthereumNetwork.parallel]: PARALLEL_CHAINID,
  [eEthereumNetwork.tenderlyMain]: undefined,
  [eEthereumNetwork.moonbeam]: MOONBEAM_CHAINID,
  [eEthereumNetwork.moonbase]: MOONBASE_CHAINID,
  [eEthereumNetwork.arbitrum]: ARBITRUM_ONE_CHAINID,
  [eEthereumNetwork.arbitrumGoerli]: ARBITRUM_GOERLI_CHAINID,
  [eEthereumNetwork.arbitrumSepolia]: ARBITRUM_SEPOLIA_CHAINID,
  [eEthereumNetwork.parallelDev]: PARALLEL_DEV_CHAINID,
  [eEthereumNetwork.polygon]: POLYGON_CHAINID,
  [eEthereumNetwork.polygonMumbai]: POLYGON_MUMBAI_CHAINID,
  [eEthereumNetwork.polygonZkevm]: POLYGON_ZKEVM_CHAINID,
  [eEthereumNetwork.polygonZkevmGoerli]: POLYGON_ZKEVM_GOERLI_CHAINID,
  [eEthereumNetwork.zksync]: ZKSYNC_CHAINID,
  [eEthereumNetwork.zksyncGoerli]: ZKSYNC_GOERLI_CHAINID,
  [eEthereumNetwork.linea]: LINEA_CHAINID,
  [eEthereumNetwork.lineaGoerli]: LINEA_GOERLI_CHAINID,
  [eEthereumNetwork.manta]: MANTA_CHAINID,
  [eEthereumNetwork.mantaTest]: MANTA_TEST_CHAINID,
  [eEthereumNetwork.neon]: NEON_CHAINID,
};

export const BLOCK_TO_FORK: iParamsPerNetwork<number | undefined> = {
  [eEthereumNetwork.mainnet]: undefined,
  [eEthereumNetwork.goerli]: undefined,
  [eEthereumNetwork.sepolia]: undefined,
  [eEthereumNetwork.hardhat]: undefined,
  [eEthereumNetwork.anvil]: undefined,
  [eEthereumNetwork.ganache]: undefined,
  [eEthereumNetwork.parallel]: undefined,
  [eEthereumNetwork.tenderlyMain]: undefined,
  [eEthereumNetwork.moonbeam]: undefined,
  [eEthereumNetwork.moonbase]: undefined,
  [eEthereumNetwork.arbitrum]: undefined,
  [eEthereumNetwork.arbitrumGoerli]: undefined,
  [eEthereumNetwork.arbitrumSepolia]: undefined,
  [eEthereumNetwork.parallelDev]: undefined,
  [eEthereumNetwork.polygon]: undefined,
  [eEthereumNetwork.polygonMumbai]: undefined,
  [eEthereumNetwork.polygonZkevm]: undefined,
  [eEthereumNetwork.polygonZkevmGoerli]: undefined,
  [eEthereumNetwork.zksync]: undefined,
  [eEthereumNetwork.zksyncGoerli]: undefined,
  [eEthereumNetwork.linea]: undefined,
  [eEthereumNetwork.lineaGoerli]: undefined,
  [eEthereumNetwork.manta]: undefined,
  [eEthereumNetwork.mantaTest]: undefined,
  [eEthereumNetwork.neon]: undefined,
};
