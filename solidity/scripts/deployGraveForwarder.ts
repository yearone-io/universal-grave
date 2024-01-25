import hre, { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { abi as UP_ABI } from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { ERC725YDataKeys, OPERATION_TYPES } from '@lukso/lsp-smart-contracts';
import LSP1GraveForwader from "../artifacts/contracts/LSP1GraveForwarder.sol/LSP1GraveForwader.json";

// load env vars
dotenv.config();

// Update those values in the .env file
const { UP_ADDR, EOA_PRIVATE_KEY } = process.env;

async function main() {
    // setup provider
    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.lukso.network');
    // setup signer (the browser extension controller)
    const signer = new ethers.Wallet(EOA_PRIVATE_KEY as string, provider);

    // DEPLOYING GRAVE FORWARDER URD
    console.log('⏳ Deploying the LSP1 Grave Forwarder URD');
    const CustomURDBytecode = hre.artifacts.readArtifactSync(
        'contracts/LSP1GraveForwarder.sol:LSP1GraveForwader',
      ).bytecode;
    const fullBytecode = CustomURDBytecode;// + params;
    // get the address of the contract that will be created
    const UP = new ethers.Contract(UP_ADDR as string, UP_ABI, provider);
    // const graveForwaderAddress = await UP.connect(signer).execute.staticCall(
    //     OPERATION_TYPES.CREATE,
    //     ethers.ZeroAddress,
    //     0,
    //     fullBytecode,
    // );
    // // deploy LSP1URDForwarder as the UP (signed by the browser extension controller)
    // const forwarderDeploymentTx = await UP.connect(signer).execute(OPERATION_TYPES.CREATE, ethers.ZeroAddress, 0, fullBytecode);
    // await forwarderDeploymentTx.wait();

    const graveForwarder = new ethers.ContractFactory(
        LSP1GraveForwader.abi,
        LSP1GraveForwader.bytecode,
    );

    const deploymentArguments = [];//'0xd7c7d9ef72e5b595d02129aabdd4219814cc9c6b'];

    const deployTx = await graveForwarder.connect(signer).deploy(...deploymentArguments);
    await deployTx.waitForDeployment();


    try {
        await hre.run("verify:verify", {
            address: deployTx.target,
            network: "luksoTestnet",
            constructorArguments: deploymentArguments,
        });
        console.log("Contract verified");
    } catch (error) {
        console.error("Contract verification might have failed");
    }
    console.log('✅ LSP1 Grave Forwarder URD successfully deployed at address: ',  deployTx.target);
}


main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });