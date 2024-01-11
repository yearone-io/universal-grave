import hre, { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { LSPFactory } from '@lukso/lsp-factory.js';

const { UP_ADDR, EOA_PRIVATE_KEY } = process.env;

const lspFactory = new LSPFactory('https://rpc.testnet.lukso.network/', {
    deployKey: EOA_PRIVATE_KEY,
    chainId: 4201, // LUKSO Testnet
});

async function createMintableLSP7FromFactory() {
    const deployedContracts = await lspFactory.LSP7DigitalAsset.deploy({
        isNFT: true,
        controllerAddress: UP_ADDR as string,
        name: 'YR1',
        symbol: 'YR1',
    }, {
        LSP7DigitalAsset: {
            version: '0.14.0',
            deployProxy: false
        }
    });

    const lsp7Address = deployedContracts.LSP7DigitalAsset.address;
    console.log('LSP7 Address: ', lsp7Address);

    // Now we can add this UP address to our .env file

    return deployedContracts;
}
createMintableLSP7FromFactory();
