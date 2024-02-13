import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-verify";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from 'dotenv';

// load env vars
dotenv.config();

const config: HardhatUserConfig = {
    solidity: "0.8.17",
    // public LUKSO Testnet
    networks: {
      luksoTestnet: {
        url: "https://lukso-testnet.rpc.thirdweb.com",
        chainId: 4201,
        accounts: [process.env.EOA_PRIVATE_KEY as string] // your private key here
      },
      luksoMain: {
        url: "https://lukso.rpc.thirdweb.com",
        chainId: 42,
        accounts: [process.env.EOA_PRIVATE_KEY as string] // your private key here
      },
    },
    sourcify: {
      enabled: false,
    },
    etherscan: {
      // no API is required to verify contracts
      // via the Blockscout instance of LUKSO Testnet
      apiKey: "no-api-key-needed",
      customChains: [
        {
          network: "luksoTestnet",
          chainId: 4201,
          urls: {
            apiURL: "https://api.explorer.execution.testnet.lukso.network/api",
            browserURL: "https://explorer.execution.testnet.lukso.network",
          },
        },
        {
          network: "luksoMain",
          chainId: 42,
          urls: {
            apiURL: "https://api.explorer.execution.mainnet.lukso.network/api",
            browserURL: "https://explorer.execution.mainnet.lukso.network",
          },
        },
      ],
    },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    external: "./node_modules/[npm-package]/contracts"
  },
  };
  
  export default config;