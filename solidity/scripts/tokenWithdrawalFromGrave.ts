import hre, { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { LSPFactory } from '@lukso/lsp-factory.js';
import { abi as UP_ABI } from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';
import LSP7Mintable from '@lukso/lsp-smart-contracts/artifacts/LSP7Mintable.json';
import { OPERATION_TYPES } from '@lukso/lsp-smart-contracts';


// load env vars
dotenv.config();

// Update those values in the .env file
const { EOA_PRIVATE_KEY, CONTROLLER_PUBLIC_KEY, RECEIVER_UP_ADDR } = process.env;

async function main() {
    const lspFactory = new LSPFactory('https://rpc.testnet.lukso.network/', {
        deployKey: EOA_PRIVATE_KEY,
        chainId: 4201, // LUKSO Testnet
    });
    // setup provider
    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.lukso.network');
    // setup signer (the browser extension controller)
    const signer = new ethers.Wallet(EOA_PRIVATE_KEY as string, provider);

    // Deploy UP using EOA
    console.log('⏳ Deploying Universal Profile using EOA');
    const deployedContracts = await lspFactory.UniversalProfile.deploy({
        controllerAddresses: [CONTROLLER_PUBLIC_KEY as string],
        lsp3Profile: {
            name: 'EOA Generated Universal Profile',
            description: 'Grave',
            tags: ['Public Profile'],
            links: [
                {
                    title: 'My Website',
                    url: 'https://my-website.com/',
                },
            ],
        },
    });

    const UPAddress = deployedContracts.LSP0ERC725Account.address;
    const UP = new ethers.Contract(UPAddress as string, UP_ABI, provider);
    console.log('✅ My Universal Profile address: ', await UP.getAddress());

    // Deploy Grave Vault
    console.log('⏳ Deploying GRAVE Vault');
    let vaultFactory = new ethers.ContractFactory(
        LSP9Vault.abi,
        LSP9Vault.bytecode,
    );
    const graveVaultTx = await vaultFactory.connect(signer).deploy(UPAddress);
    const graveVaultAddress = graveVaultTx.target as string;
    console.log('✅ Grave Vault deployed', graveVaultAddress);

    // Deploy Token, Send to Vault, then withdraw to UP
    const graveAddress = '0x0';
    console.log('⏳ Deploying Token');

    // create an instance of the token contract
    const lsp7Factory = new ethers.ContractFactory(
        LSP7Mintable.abi,
        LSP7Mintable.bytecode,
    );

    const tokenDeployTx = await lsp7Factory.connect(signer).deploy(
      'Grave Token', // token name
      'GRV',          // token symbol
      signer.address,   // new owner, who will mint later
      false,           // isNonDivisible = TRUE, means NOT divisible, decimals = 0)
    );

    // mint 100 tokens to the vault address
    const LSP7TokenContract = new ethers.Contract(tokenDeployTx.target as string, LSP7Mintable.abi, provider);
    const mintTx = await LSP7TokenContract.connect(signer).mint(graveVaultAddress, 69);
    console.log('✅ Token minted to vault', mintTx.hash);

    // transfer from grave vault to elsewhere
    console.log('⏳ Transferring token from vault to UP');
    const graveContract = new ethers.Contract(graveAddress, LSP9Vault.abi, provider);

    const tokenTransferInteraction = {
        to: tokenDeployTx.target, // Address of the graveForwarder contract
        data: new ethers.Contract(
            tokenDeployTx.target as string,
            LSP7Mintable.abi,
            provider // signer to encode tx
        ).interface.encodeFunctionData("transfer", [graveVaultAddress, RECEIVER_UP_ADDR, 69, 0, ""]) // Encoding the setGrave function call
    };

    const transferTx = await graveContract.connect(signer).execute(
        OPERATION_TYPES.CALL, // Assuming CALL is the correct operation type for executing a transaction
        tokenTransferInteraction.to,
        0, // Value sent with the transaction, set to 0 if not sending any ether
        tokenTransferInteraction.data
    );
    console.log('✅ Token transferred from vault to UP', transferTx.hash);
}


main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });