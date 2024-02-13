import hre, { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { abi as UP_ABI } from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { OPERATION_TYPES } from '@lukso/lsp-smart-contracts';
import config from '../hardhat.config';

// load env vars
dotenv.config();

// Update those values in the .env file
const { UP_ADDR, EOA_PRIVATE_KEY, NETWORK } = process.env;
const network = NETWORK as string || 'luksoTestnet';

async function main() {
    // setup provider
    const provider = new ethers.JsonRpcProvider(config.networks[network].url);
    // setup signer (the browser extension controller)
    const signer = new ethers.Wallet(EOA_PRIVATE_KEY as string, provider);

    // DEPLOYING GRAVE FORWARDER URD
    console.log('⏳ Deploying the LSP1 Grave Forwarder URD');
    const CustomURDBytecode = hre.artifacts.readArtifactSync(
        'contracts/LSP1GraveForwarder.sol:LSP1GraveForwarder',
      ).bytecode;
    const fullBytecode = CustomURDBytecode;// + params;
    // get the address of the contract that will be created
    const UP = new ethers.Contract(UP_ADDR as string, UP_ABI, provider);
    const graveForwarderAddress = await UP.connect(signer).execute.staticCall(
        OPERATION_TYPES.CREATE,
        ethers.ZeroAddress,
        0,
        fullBytecode,
    );
    // deploy LSP1URDForwarder as the UP (signed by the browser extension controller)
    const forwarderDeploymentTx = await UP.connect(signer).execute(OPERATION_TYPES.CREATE, ethers.ZeroAddress, 0, fullBytecode);
    await forwarderDeploymentTx.wait();
    try {
        await hre.run("verify:verify", {
            address: graveForwarderAddress,
            network,
            constructorArguments: [],
        });
        console.log("Contract verified");
    } catch (error) {
        console.error("Contract verification might have failed");
        console.error(error);
        console.error("run: npx hardhat verify --network luksoTestnet " + graveForwarderAddress + "");
    }
    console.log('✅ LSP1 Grave Forwarder URD successfully deployed at address: ', graveForwarderAddress);
}


main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });