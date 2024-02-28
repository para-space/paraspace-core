import path from "path";
import {HardhatUserConfig} from "hardhat/types";
import dotenv from "dotenv";
import {
  MAINNET_CHAINID,
  MOCHA_JOBS,
  HARDFORK,
  DEFAULT_BLOCK_GAS_LIMIT,
  ETHERSCAN_KEY,
  REPORT_GAS,
  TENDERLY_PROJECT,
  TENDERLY_USERNAME,
  DEPLOYER,
  VERBOSE,
  COMPILER_VERSION,
  COMPILER_OPTIMIZER_RUNS,
  ZK_LIBRARIES,
  ETHERSCAN_APIS,
  BROWSER_URLS,
  GOERLI_ETHERSCAN_KEY,
  ARBITRUM_ETHERSCAN_KEY,
  ARBITRUM_GOERLI_ETHERSCAN_KEY,
  POLYGON_ETHERSCAN_KEY,
  POLYGON_MUMBAI_ETHERSCAN_KEY,
  POLYGON_ZKEVM_ETHERSCAN_KEY,
  POLYGON_ZKEVM_GOERLI_ETHERSCAN_KEY,
  MOONBASE_ETHERSCAN_KEY,
  LINEA_ETHERSCAN_KEY,
  LINEA_GOERLI_ETHERSCAN_KEY,
  SEPOLIA_ETHERSCAN_KEY,
  ARBITRUM_SEPOLIA_ETHERSCAN_KEY,
  PARALLEL_DEV_ETHERSCAN_KEY,
  NEON_ETHERSCAN_KEY,
  PARALLEL_ETHERSCAN_KEY,
} from "./helpers/hardhat-constants";
import {accounts} from "./wallets";
import {
  buildForkConfig,
  CHAINS_ID,
  NETWORKS_RPC_URL,
} from "./helper-hardhat-config";
import fs from "fs";

dotenv.config();

import "solidity-docgen";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
import "@tenderly/hardhat-tenderly";
import "solidity-coverage";
import "hardhat-contract-sizer";
import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-verify";
import {eEthereumNetwork} from "./helpers/types";

require(`${path.join(__dirname, "tasks/misc")}/set-bre.ts`);

["deployments", "upgrade", "dev"].forEach((folder) => {
  const tasksPath = path.join(__dirname, "tasks", folder);
  fs.readdirSync(tasksPath)
    .filter((pth) => pth.includes(".ts"))
    .forEach((task) => {
      require(`${tasksPath}/${task}`);
    });
});

const hardhatConfig: HardhatUserConfig = {
  zksolc: {
    version: "latest",
    settings: {
      libraries: ZK_LIBRARIES,
    },
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
    disambiguatePaths: false,
    except: ["Mock*"],
    strict: true,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  docgen: {
    outputDir: "docs",
    pages: "items",
    exclude: ["dependencies", "deployments", "mocks", "test"],
  },
  gasReporter: {
    enabled: REPORT_GAS,
  },
  solidity: {
    // Docs for the compiler https://docs.soliditylang.org/en/v0.8.7/using-the-compiler.html
    compilers: [
      {
        version: COMPILER_VERSION.split("+")[0],
        settings: {
          optimizer: {
            enabled: true,
            runs: COMPILER_OPTIMIZER_RUNS,
          },
          evmVersion: "london",
        },
      },
    ],
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
  mocha: {
    parallel: !isNaN(MOCHA_JOBS) && MOCHA_JOBS > 1,
    jobs: MOCHA_JOBS,
    timeout: 200000,
  },
  tenderly: {
    project: TENDERLY_PROJECT,
    username: TENDERLY_USERNAME,
    forkNetwork: `${MAINNET_CHAINID}`, //Network id of the network we want to fork
  },
  networks: {
    anvil: {
      chainId: CHAINS_ID[eEthereumNetwork.anvil],
      url: NETWORKS_RPC_URL[eEthereumNetwork.anvil],
      accounts: [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
        "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
        "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
        "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
        "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
        "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
        "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
        "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
        "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6",
      ],
      gasPrice: 1000000000,
      gas: 30000000,
      allowUnlimitedContractSize: true,
    },
    localhost: {
      url: NETWORKS_RPC_URL[eEthereumNetwork.hardhat],
      chainId: CHAINS_ID[eEthereumNetwork.hardhat],
      accounts: DEPLOYER,
      gasPrice: "auto",
      gas: "auto",
      allowUnlimitedContractSize: true,
      timeout: 9000000,
    },
    hardhat: {
      hardfork: HARDFORK,
      blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
      gas: DEFAULT_BLOCK_GAS_LIMIT,
      gasPrice: "auto",
      chainId: CHAINS_ID[eEthereumNetwork.hardhat],
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      accounts,
      loggingEnabled: VERBOSE,
      forking: buildForkConfig(),
      allowUnlimitedContractSize: true,
    },
    parallel: {
      url: NETWORKS_RPC_URL[eEthereumNetwork.parallel],
      chainId: CHAINS_ID[eEthereumNetwork.parallel],
      accounts: DEPLOYER,
    },
    moonbeam: {
      chainId: CHAINS_ID[eEthereumNetwork.moonbeam],
      url: NETWORKS_RPC_URL[eEthereumNetwork.moonbeam],
      accounts: DEPLOYER,
    },
    moonbase: {
      chainId: CHAINS_ID[eEthereumNetwork.moonbase],
      url: NETWORKS_RPC_URL[eEthereumNetwork.moonbase],
      accounts: DEPLOYER,
    },
    goerli: {
      chainId: CHAINS_ID[eEthereumNetwork.goerli],
      url: NETWORKS_RPC_URL[eEthereumNetwork.goerli],
      accounts: DEPLOYER,
    },
    sepolia: {
      chainId: CHAINS_ID[eEthereumNetwork.sepolia],
      url: NETWORKS_RPC_URL[eEthereumNetwork.sepolia],
      accounts: DEPLOYER,
    },
    arbitrum: {
      chainId: CHAINS_ID[eEthereumNetwork.arbitrum],
      url: NETWORKS_RPC_URL[eEthereumNetwork.arbitrum],
      accounts: DEPLOYER,
    },
    arbitrumGoerli: {
      chainId: CHAINS_ID[eEthereumNetwork.arbitrumGoerli],
      url: NETWORKS_RPC_URL[eEthereumNetwork.arbitrumGoerli],
      accounts: DEPLOYER,
    },
    arbitrumSepolia: {
      chainId: CHAINS_ID[eEthereumNetwork.arbitrumSepolia],
      url: NETWORKS_RPC_URL[eEthereumNetwork.arbitrumSepolia],
      accounts: DEPLOYER,
    },
    parallelDev: {
      chainId: CHAINS_ID[eEthereumNetwork.parallelDev],
      url: NETWORKS_RPC_URL[eEthereumNetwork.parallelDev],
      accounts: DEPLOYER,
    },
    polygon: {
      chainId: CHAINS_ID[eEthereumNetwork.polygon],
      url: NETWORKS_RPC_URL[eEthereumNetwork.polygon],
      accounts: DEPLOYER,
    },
    polygonMumbai: {
      chainId: CHAINS_ID[eEthereumNetwork.polygonMumbai],
      url: NETWORKS_RPC_URL[eEthereumNetwork.polygonMumbai],
      accounts: DEPLOYER,
    },
    polygonZkevm: {
      chainId: CHAINS_ID[eEthereumNetwork.polygonZkevm],
      url: NETWORKS_RPC_URL[eEthereumNetwork.polygonZkevm],
      accounts: DEPLOYER,
    },
    polygonZkevmGoerli: {
      chainId: CHAINS_ID[eEthereumNetwork.polygonZkevmGoerli],
      url: NETWORKS_RPC_URL[eEthereumNetwork.polygonZkevmGoerli],
      accounts: DEPLOYER,
    },
    zksync: {
      chainId: CHAINS_ID[eEthereumNetwork.zksync],
      url: NETWORKS_RPC_URL[eEthereumNetwork.zksync],
      accounts: DEPLOYER,
      ethNetwork: NETWORKS_RPC_URL[eEthereumNetwork.mainnet],
      zksync: true,
      verifyURL: ETHERSCAN_APIS[eEthereumNetwork.zksync],
    },
    zksyncGoerli: {
      chainId: CHAINS_ID[eEthereumNetwork.zksyncGoerli],
      url: NETWORKS_RPC_URL[eEthereumNetwork.zksyncGoerli],
      accounts: DEPLOYER,
      ethNetwork: NETWORKS_RPC_URL[eEthereumNetwork.goerli],
      zksync: true,
      verifyURL: ETHERSCAN_APIS[eEthereumNetwork.zksyncGoerli],
    },
    linea: {
      chainId: CHAINS_ID[eEthereumNetwork.linea],
      url: NETWORKS_RPC_URL[eEthereumNetwork.linea],
      accounts: DEPLOYER,
    },
    lineaGoerli: {
      chainId: CHAINS_ID[eEthereumNetwork.lineaGoerli],
      url: NETWORKS_RPC_URL[eEthereumNetwork.lineaGoerli],
      accounts: DEPLOYER,
    },
    neon: {
      chainId: CHAINS_ID[eEthereumNetwork.neon],
      url: NETWORKS_RPC_URL[eEthereumNetwork.neon],
      accounts: DEPLOYER,
    },
    mainnet: {
      chainId: CHAINS_ID[eEthereumNetwork.mainnet],
      url: NETWORKS_RPC_URL[eEthereumNetwork.mainnet],
      accounts: DEPLOYER,
    },
    manta: {
      chainId: CHAINS_ID[eEthereumNetwork.manta],
      url: NETWORKS_RPC_URL[eEthereumNetwork.manta],
      accounts: DEPLOYER,
    },
    mantaTest: {
      chainId: CHAINS_ID[eEthereumNetwork.mantaTest],
      url: NETWORKS_RPC_URL[eEthereumNetwork.mantaTest],
      accounts: DEPLOYER,
    },
  },
  etherscan: {
    apiKey: {
      localhost: ETHERSCAN_KEY,
      mainnet: ETHERSCAN_KEY,
      goerli: GOERLI_ETHERSCAN_KEY,
      sepolia: SEPOLIA_ETHERSCAN_KEY,
      arbitrum: ARBITRUM_ETHERSCAN_KEY,
      arbitrumGoerli: ARBITRUM_GOERLI_ETHERSCAN_KEY,
      arbitrumSepolia: ARBITRUM_SEPOLIA_ETHERSCAN_KEY,
      parallelDev: PARALLEL_DEV_ETHERSCAN_KEY,
      polygon: POLYGON_ETHERSCAN_KEY,
      polygonMumbai: POLYGON_MUMBAI_ETHERSCAN_KEY,
      polygonZkevm: POLYGON_ZKEVM_ETHERSCAN_KEY,
      polygonZkevmGoerli: POLYGON_ZKEVM_GOERLI_ETHERSCAN_KEY,
      moonbeam: MOONBASE_ETHERSCAN_KEY,
      moonbase: MOONBASE_ETHERSCAN_KEY,
      linea: LINEA_ETHERSCAN_KEY,
      lineaGoerli: LINEA_GOERLI_ETHERSCAN_KEY,
      neon: NEON_ETHERSCAN_KEY,
      parallel: PARALLEL_ETHERSCAN_KEY,
    },
    customChains: [
      eEthereumNetwork.localhost,
      eEthereumNetwork.goerli,
      eEthereumNetwork.sepolia,
      eEthereumNetwork.arbitrum,
      eEthereumNetwork.arbitrumGoerli,
      eEthereumNetwork.arbitrumSepolia,
      eEthereumNetwork.parallelDev,
      eEthereumNetwork.polygon,
      eEthereumNetwork.polygonZkevm,
      eEthereumNetwork.polygonMumbai,
      eEthereumNetwork.polygonZkevmGoerli,
      eEthereumNetwork.zksync,
      eEthereumNetwork.zksyncGoerli,
      eEthereumNetwork.moonbeam,
      eEthereumNetwork.moonbase,
      eEthereumNetwork.linea,
      eEthereumNetwork.lineaGoerli,
      eEthereumNetwork.neon,
      eEthereumNetwork.parallel,
    ].map((network) => ({
      network,
      chainId: CHAINS_ID[network]!,
      urls: {
        apiURL: ETHERSCAN_APIS[network],
        browserURL: BROWSER_URLS[network],
      },
    })),
  },
};

export default hardhatConfig;
