import hre, { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { LSPFactory } from '@lukso/lsp-factory.js';
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

    // STEP 1: Deploy UP using EOA
    console.log('⏳ STEP 1: Deploying Universal Profile using EOA');
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
    console.log('✅ My Universal Profile address: ', UPAddress);

    // STEP 2:
    console.log('STEP 2: now import the above UP address into your browser extension using Import Profile functionality in: https://up-test-dapp.lukso.tech/');
    console.log('Now comment out STEP 1 and STEP 2 and uncomment STEP 3 to give UP extension controller full permissions to the UP');
    /*
    // STEP 3: Now set the UP extension controller from the imported up as the address below to give it full permissions
    console.log('⏳ STEP 3: Give UP extension controller full permissions to the UP');
    const UPAddress = ""; // populate with the above value
    const UPExtensionController = ""; // populate with controller fetched from extension from STEP 2
    const UP = new ethers.Contract(UPAddress as string, UP_ABI, provider);
    // give UP extension controller full permissions to this UP
    const setDataExtensionTx = await UP.connect(signer).setData(`0x4b80742de2bf82acb3630000${UPExtensionController?.slice(2)}`, "0x00000000000000000000000000000000000000000000000000000000003fff7f");
    await setDataExtensionTx.wait();
    console.log('✅ My Universal Profile address: ', await UP.getAddress());
    console.log('✅ My Universal Profile extension controller: ', UPExtensionController);
    */
}


main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });