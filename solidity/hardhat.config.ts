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
        url: "https://rpc.testnet.lukso.network",
        chainId: 4201,
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
      ],
    },
  };
  
  export default config;