import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";

import "@typechain/hardhat";

import "@solarity/hardhat-gobind";
import "@solarity/hardhat-migrate";

import "hardhat-contract-sizer";
import "hardhat-gas-reporter";

import "solidity-coverage";

import "tsconfig-paths/register";

import { HardhatUserConfig } from "hardhat/config";

import * as dotenv from "dotenv";
dotenv.config();

function privateKey() {
  return process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [];
}

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      initialDate: "1970-01-01T00:00:00Z",
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      gasMultiplier: 1.2,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: privateKey(),
      gasMultiplier: 1.2,
      timeout: 60000,
    },
    chapel: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: privateKey(),
      gasMultiplier: 1.2,
      timeout: 60000,
    },
    bsc_mainnet: {
      url: "https://bsc-dataseed.binance.org/",
      accounts: privateKey(),
      gasMultiplier: 1.2,
    },
    eth_mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: privateKey(),
      gasMultiplier: 1.2,
    },
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  etherscan: {
    apiKey: {
      mainnet: `${process.env.ETHERSCAN_KEY}`,
      sepolia: `${process.env.ETHERSCAN_KEY}`,
      bsc: `${process.env.BSCSCAN_KEY}`,
      bscTestnet: `${process.env.BSCSCAN_KEY}`,
    },
  },
  migrate: {
    pathToMigrations: "./deploy/",
  },
  mocha: {
    timeout: 1000000,
  },
  contractSizer: {
    alphaSort: false,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: false,
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 50,
    enabled: false,
    coinmarketcap: `${process.env.COINMARKETCAP_KEY}`,
  },
  typechain: {
    outDir: "generated-types",
    target: "ethers-v6",
    alwaysGenerateOverloads: true,
    discriminateTypes: true,
  },
};

export default config;
