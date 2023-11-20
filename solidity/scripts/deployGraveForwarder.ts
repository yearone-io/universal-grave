import hre, { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { abi as UP_ABI } from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { ERC725YDataKeys, LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { OPERATION_TYPES, PERMISSIONS } from '@lukso/lsp-smart-contracts';


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
    console.log('⏳ Deploying the custom URD');
    const CustomURDBytecode = hre.artifacts.readArtifactSync(
        'contracts/LSP1GraveForwarder.sol:LSP1GraveForwader',
      ).bytecode;
    const fullBytecode = CustomURDBytecode;// + params;
    // get the address of the contract that will be created
    const UP = new ethers.Contract(UP_ADDR as string, UP_ABI, provider);
    const CustomURDAddress = await UP.connect(signer).execute.staticCall(
        OPERATION_TYPES.CREATE,
        ethers.ZeroAddress,
        0,
        fullBytecode,
    );
    // deploy LSP1URDForwarder as the UP (signed by the browser extension controller)
    const tx1 = await UP.connect(signer).execute(OPERATION_TYPES.CREATE, ethers.ZeroAddress, 0, fullBytecode);
    await tx1.wait();
    console.log('✅ Custom URD successfully deployed at address: ', CustomURDAddress);
    console.log(`npx hardhat verify --network luksoTestnet ${CustomURDAddress}`);
    
    // ADDING URD TO UP LSP7 RECIPIENT NOTIFICATION
    console.log('⏳ Registering custom URD on the UP');
    const URDdataKeyLSP7 =
        ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
        LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40);
    const URDdataKeyLSP8 =
        ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
        LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40);
    const dataKeys = [
        URDdataKeyLSP7,
        URDdataKeyLSP8,
        ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + CustomURDAddress.slice(2),
      ];
    
    // Calculate the correct permission (SUPER_CALL + REENTRANCY)
    const permInt = parseInt(PERMISSIONS.SUPER_CALL, 16) ^ parseInt(PERMISSIONS.REENTRANCY, 16);
    const permHex = '0x' + permInt.toString(16).padStart(64, '0');

    const dataValues = [
        CustomURDAddress,
        CustomURDAddress,
        permHex
    ];

    console.log('keys: ', dataKeys);
    console.log('values: ', dataValues);

    // execute the tx
    const setDataBatchTx = await UP.connect(signer).setDataBatch(dataKeys, dataValues);
    await setDataBatchTx.wait();
    console.log('✅ Custom URD has been correctly registered on the UP');
}


main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });