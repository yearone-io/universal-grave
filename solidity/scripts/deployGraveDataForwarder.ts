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
        'contracts/GraveDataForwarder.sol:GraveDataForwarder',
      ).bytecode;

    const contractAddress = await UP.connect(signer).execute.staticCall(
        OPERATION_TYPES.CREATE,
        ethers.ZeroAddress,
        0,
        fullBytecode,
    );
      
    const contractDeployment = await UP.connect(signer).execute(OPERATION_TYPES.CREATE, ethers.ZeroAddress, 0, fullBytecode);
    await contractDeployment.wait();

    try {
        await hre.run("verify:verify", {
            address: contractAddress,
            network: "luksoTestnet",
            constructorArguments: [],
        });
        console.log("Contract verified");
    } catch (error) {
        console.log(error)
        console.error("Contract verification might have failed");
        console.log(`to verify run: npx hardhat verify --network luksoTestnet ${contractAddress}`);
    }
    console.log('✅ LSP9 Vault Factory successfully deployed at address: ', contractAddress);
}


main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });