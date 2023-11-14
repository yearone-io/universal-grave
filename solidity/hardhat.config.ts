require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config()

module.exports = {
    solidity: {
        version: "0.8.17",
        settings: {
            optimizer: {
                enabled: true
            }
        }
    },
    allowUnlimitedContractSize: true,
    networks: {
        hardhat: {
            accounts: {
                mnemonic: process.env.DEV_MNEMONIC
            }
        },
        luksoTestnet: {
            url: "https://rpc.testnet.lukso.network",
            chainId: 4201,
            accounts: process.env.PRIVATE_KEY ? [`${process.env.PRIVATE_KEY}`] : [] // your private key here
        },
        ETH_MAINNET: {
            accounts: process.env.PRIVATE_KEY ? [`${process.env.PRIVATE_KEY}`] : [],
            url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
        },
        ETH_GOERLI: {
            accounts: process.env.PRIVATE_KEY ? [`${process.env.PRIVATE_KEY}`] : [],
            url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
        }
    },
    etherscan: {
        apiKey: `${process.env.ETHERSCAN_API_KEY}`,
        customChains: [
            {
                network: "luksoTestnet",
                chainId: 4201,
                urls: {
                    apiURL: "https://api.explorer.execution.testnet.lukso.network/api",
                    browserURL: "https://explorer.execution.testnet.lukso.network"
                }
            }
        ]
    },
    paths: {
        artifacts: '../frontend/artifacts'
    }
}