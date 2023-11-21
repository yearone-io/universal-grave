import hre, { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { abi as UP_ABI } from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { ERC725YDataKeys, LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { OPERATION_TYPES, PERMISSIONS } from '@lukso/lsp-smart-contracts';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';


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
    
    // ADDING URD TO UP LSP7 RECIPIENT NOTIFICATION
    console.log('⏳ Registering LSP1 Grave Forwarder on the UP');
    const URDdataKeyLSP7 =
        ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
        LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40);
    const URDdataKeyLSP8 =
        ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
        LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40);
    const dataKeys = [
        URDdataKeyLSP7,
        URDdataKeyLSP8,
        ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + graveForwaderAddress.slice(2),
      ];
    
    // Calculate the correct permission (SUPER_CALL + REENTRANCY)
    const permInt = parseInt(PERMISSIONS.SUPER_CALL, 16) ^ parseInt(PERMISSIONS.REENTRANCY, 16);
    const permHex = '0x' + permInt.toString(16).padStart(64, '0');

    const dataValues = [
        graveForwaderAddress,
        graveForwaderAddress,
        permHex
    ];

    console.log('keys: ', dataKeys);
    console.log('values: ', dataValues);

    // execute the tx
    const setDataBatchTx = await UP.connect(signer).setDataBatch(dataKeys, dataValues);
    await setDataBatchTx.wait();
    console.log('✅ Custom URD has been correctly registered on the UP');

    // Deploy Grave Vault
    console.log('⏳ Deploying GRAVE Vault');
    let vaultFactory = new ethers.ContractFactory(
        LSP9Vault.abi,
        LSP9Vault.bytecode,
    );
    const graveVaultTx = await vaultFactory.connect(signer).deploy(UP_ADDR);
    const graveVaultAddress = graveVaultTx.target as string;
    console.log('✅ Grave Vault deployed', graveVaultAddress);

    // Setup Grave on Forwarder
    console.log('⏳ Set GRAVE Vault on Forwarder');
    const GraveForwarderAbi = hre.artifacts.readArtifactSync(
        'contracts/LSP1GraveForwarder.sol:LSP1GraveForwader',
      ).abi
    // First, create a transaction object representing the interaction with the graveForwarder
    const graveForwarderInteraction = {
        to: graveForwaderAddress, // Address of the graveForwarder contract
        data: new ethers.Contract(
            graveForwaderAddress,
            GraveForwarderAbi,
            provider // signer to encode tx
        ).interface.encodeFunctionData("setGrave", [graveVaultAddress]) // Encoding the setGrave function call
    };
    // Now, execute this transaction through the UP, effectively having the signer act on behalf of the UP
    const setVaultTx = await UP.connect(signer).execute(
        OPERATION_TYPES.CALL, // Assuming CALL is the correct operation type for executing a transaction
        graveForwarderInteraction.to,
        0, // Value sent with the transaction, set to 0 if not sending any ether
        graveForwarderInteraction.data
    );

    console.log('✅ Grave Vault on LSP1 Grave Forwarder attached to UP Profile', graveVaultAddress);
}


main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });