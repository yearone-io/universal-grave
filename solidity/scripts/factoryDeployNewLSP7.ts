import hre, { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { LSPFactory } from '@lukso/lsp-factory.js';

// load env vars
dotenv.config();

// Update those values in the .env file
const { UP_ADDR, EOA_PRIVATE_KEY, CONTROLLER_PUBLIC_KEY } = process.env;

async function main() {
    // setup provider
    const providerUrl = 'https://rpc.testnet.lukso.network';
    // setup signer (the browser extension controller)
    const lspFactory = new LSPFactory(providerUrl, {
        deployKey: EOA_PRIVATE_KEY, // Private key of the account which will deploy smart contracts
        chainId: 4201,
    });
    console.log('⏳ Deploying Token');
    const tokenName = 'Ghoulie the Friendly Ghost';
    const tokenTicker = 'GFG';
    const tokenNondivisible = 0;
    const deployedDigitalAsset = await lspFactory.LSP7DigitalAsset.deploy({
        isNFT: Boolean(tokenNondivisible),
        controllerAddress: CONTROLLER_PUBLIC_KEY as string,
        name: tokenName,
        symbol: tokenTicker,
    });
    console.log('✅ Digital Asset deployed. Address:', deployedDigitalAsset.LSP7DigitalAsset.address);
}


main().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
});