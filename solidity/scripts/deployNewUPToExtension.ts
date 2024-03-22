import hre, { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { abi as UP_ABI } from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { LSPFactory } from '@lukso/lsp-factory.js';
import config from '../hardhat.config';
import { getNetworkAccountsConfig } from '../constants/network';

// load env vars
dotenv.config();

// Update those values in the .env file
const { NETWORK } = process.env;
const { EOA_PUBLIC_KEY, EOA_PRIVATE_KEY } = getNetworkAccountsConfig(NETWORK as string);

/**
 * To import a new profile into your extension:
 * 1) Deploy a Universal Profile for a given EOA (using this script)
 * 2) Initiate the import of this profile into an UP! Browser Extension using the extnsion making
 *   the up_import call: https://docs.lukso.tech/standards/rpc-api#up_import
 * 3) Approve the import for the extension using the UP that's just been deployed
 *   by giving the controller that's been generated by extension the initial set of permissions
 * 4) Send the extension controller some LYX tokens because it can't rely on transaction relayer
 *   to pay for the gas
 */
// To be filled out after the UP is deployed
let myUPAddress = "";
// To be generated after the UP is deployed by steps below
// Generated by Import Profile section of: https://up-test-dapp.lukso.tech/
// Also see up_import call: https://docs.lukso.tech/standards/rpc-api#up_import
const upExtensionController = ""; 
'0x00000000000000000000000000000000000000000000000000000000007f3f06'
const upExtensionControllerPerms = "0x00000000000000000000000000000000000000000000000000000000000003ff";

const lspFactory = new LSPFactory(config.networks[NETWORK].url, {
    deployKey: EOA_PRIVATE_KEY,
    chainId: config.networks[NETWORK].chainId, // LUKSO Testnet
});

async function createUniversalProfile() {
    // setup provider
    const provider = new ethers.JsonRpcProvider(config.networks[NETWORK].url);
    // setup signer (the UP controller)
    const signer = new ethers.Wallet(EOA_PRIVATE_KEY as string, provider);
    if (!myUPAddress) {
        const deployedContracts = await lspFactory.UniversalProfile.deploy({
            controllerAddresses: [EOA_PUBLIC_KEY as string],
            lsp3Profile: {
                name: 'My Universal Profile',
                description: 'My Cool Universal Profile',
                tags: ['Public Profile'],
                links: [
                    {
                        title: 'My Website',
                        url: 'https://my-website.com/',
                    },
                ],
            },
        });

        myUPAddress = deployedContracts.LSP0ERC725Account.address;
    }
    console.log('my Universal Profile address: ', myUPAddress);

    const UP = new ethers.Contract(myUPAddress, UP_ABI, provider);
    const setDataTx = await UP.connect(signer).setData(
        `0x4b80742de2bf82acb3630000${upExtensionController.slice(2)}`,
        upExtensionControllerPerms
      );
    await setDataTx.wait();

}
createUniversalProfile();