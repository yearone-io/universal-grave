import hre, { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { LSPFactory } from '@lukso/lsp-factory.js';
import { abi as UP_ABI } from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';


// load env vars
dotenv.config();

// Update those values in the .env file
const { EOA_PRIVATE_KEY, CONTROLLER_PUBLIC_KEY} = process.env;

async function main() {
    const lspFactory = new LSPFactory('https://rpc.testnet.lukso.network/', {
        deployKey: EOA_PRIVATE_KEY,
        chainId: 4201, // LUKSO Testnet
    });
    // setup provider
    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.lukso.network');
    // setup signer (the browser extension controller)
    const signer = new ethers.Wallet(EOA_PRIVATE_KEY as string, provider);

    // STEP 1: Deploy UP using EOA
    console.log('⏳ STEP 1: Deploying Universal Profile using EOA');
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