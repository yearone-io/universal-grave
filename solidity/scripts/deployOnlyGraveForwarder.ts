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

    // DEPLOYING GRAVE FORWARDER URD
    console.log('⏳ Deploying the LSP1 Grave Forwarder URD');
    const CustomURDBytecode = hre.artifacts.readArtifactSync(
        'contracts/LSP1GraveForwarder.sol:LSP1GraveForwader',
      ).bytecode;
    const fullBytecode = CustomURDBytecode;// + params;
    // get the address of the contract that will be created
    const UP = new ethers.Contract(UP_ADDR as string, UP_ABI, provider);
    const setDataTx = await UP.connect(signer).setData(
        "0x4b80742de2bf82acb3630000176EDaead2ef1910B747652C0605C0cF27bca088",
        "0x00000000000000000000000000000000000000000000000000000000000003ff"
      );
    await setDataTx.wait();
    /*
    const graveForwaderAddress = await UP.connect(signer).execute.staticCall(
        OPERATION_TYPES.CREATE,
        ethers.ZeroAddress,
        0,
        fullBytecode,
    );
    // deploy LSP1URDForwarder as the UP (signed by the browser extension controller)
    const tx1 = await UP.connect(signer).execute(OPERATION_TYPES.CREATE, ethers.ZeroAddress, 0, fullBytecode);
    await tx1.wait();
    console.log('✅ LSP1 Grave Forwarder URD successfully deployed at address: ', graveForwaderAddress);
    console.log(`to verify run: npx hardhat verify --network luksoTestnet ${graveForwaderAddress}`);
    */
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });