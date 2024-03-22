import hre, { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { LSPFactory } from '@lukso/lsp-factory.js';
import { abi as UP_ABI } from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';
import config from '../hardhat.config';
import { getNetworkAccountsConfig } from '../constants/network';

// load env vars
dotenv.config();

// Update those values in the .env file
const { NETWORK } = process.env;
const { EOA_PRIVATE_KEY, EOA_PUBLIC_KEY } = getNetworkAccountsConfig(NETWORK as string);

async function main() {
    const lspFactory = new LSPFactory(config.networks[NETWORK].url, {
        deployKey: EOA_PRIVATE_KEY,
        chainId: config.networks[NETWORK].chainId, // LUKSO Testnet
    });
    // setup provider
    const provider = new ethers.JsonRpcProvider(config.networks[NETWORK].url);
    // setup signer (the browser extension controller)
    const signer = new ethers.Wallet(EOA_PRIVATE_KEY as string, provider);

    // Deploy UP using EOA
    console.log('⏳ Deploying Universal Profile using EOA');
    const deployedContracts = await lspFactory.UniversalProfile.deploy({
        controllerAddresses: [EOA_PUBLIC_KEY as string],
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
}


main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });