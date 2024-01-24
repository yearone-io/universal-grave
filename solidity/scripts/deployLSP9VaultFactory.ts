import hre, { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { abi as UP_ABI } from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { OPERATION_TYPES } from '@lukso/lsp-smart-contracts';

// load env vars
dotenv.config();

// Update those values in the .env file
const { UP_ADDR, EOA_PRIVATE_KEY } = process.env;

async function main() {
    // setup provider
    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.lukso.network');
    // setup signer (the browser extension controller)
    const signer = new ethers.Wallet(EOA_PRIVATE_KEY as string, provider);

    // DEPLOYING LS9 VAULT FACTORY
    console.log('⏳ Deploying the LSP9 Vault Factory');
    const UP = new ethers.Contract(UP_ADDR as string, UP_ABI, provider);

    const fullBytecode = hre.artifacts.readArtifactSync(
        'contracts/LSP9VaultFactory.sol:LSP9VaultFactory',
      ).bytecode;

    const factoryAddress = await UP.connect(signer).execute.staticCall(
        OPERATION_TYPES.CREATE,
        ethers.ZeroAddress,
        0,
        fullBytecode,
    );
      
    // deploy LSP1URDForwarder as the UP (signed by the browser extension controller)
    const factoryDeployment = await UP.connect(signer).execute(OPERATION_TYPES.CREATE, ethers.ZeroAddress, 0, fullBytecode);
    await factoryDeployment.wait();

    try {
        await hre.run("verify:verify", {
            address: factoryAddress,
            network: "luksoTestnet",
            constructorArguments: [],
        });
        console.log("Contract verified");
    } catch (error) {
        console.log(error)
        console.error("Contract verification might have failed");
        console.log(`to verify run: npx hardhat verify --network luksoTestnet ${factoryAddress}`);
    }
    console.log('✅ LSP9 Vault Factory successfully deployed at address: ', factoryAddress);
}


main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

// // Import ethers from Hardhat package
// const { ethers } = require("hardhat");

// async function main() {
//     // Fetching the contract factory
//     const LSP9VaultFactory = await ethers.getContractFactory("LSP9VaultFactory");

//     // Deploying the contract
//     const lsp9VaultFactory = await LSP9VaultFactory.deployTransaction; // Include constructor args if needed
//     console.log(lsp9VaultFactory)

//     // console.log("LSP9VaultFactory deployed to:", lsp9VaultFactory.address);
// }

// main()
//     .then(() => process.exit(0))
//     .catch(error => {
//         console.error(error);
//         process.exit(1);
//     });


