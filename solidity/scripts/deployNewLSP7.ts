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
    console.log('deployedDigitalAsset', deployedDigitalAsset);
    console.log('✅ Digital Asset deployed. Address:', deployedDigitalAsset.LSP7DigitalAsset.address);

    /*
    try {
        await hre.run("verify:verify", {
            address: deployedDigitalAsset.LSP7DigitalAsset.address,
            network: "luksoTestnet",
            constructorArguments: [tokenName, tokenTicker, tokenOwner, tokenNondivisible],
            // If your contract uses libraries or you have other specific settings, include them here
        });
        console.log("Contract verified");
    } catch (error) {
        console.error("Contract verification failed:", error);
    }
    */
    //await lspFactory.LSP8IdentifiableDigitalAsset.deploy(digitalAssetProperties [, options]);


    /*
    // Deploy Token, Send to Vault, then withdraw to UP
    console.log('⏳ Deploying Token');
    // create an instance of the token contract
    const lsp7Factory = new ethers.ContractFactory(
        LSP7Mintable.abi,
        LSP7Mintable.bytecode,
    );

    const tokenDeployTx = await lsp7Factory.connect(signer).deploy(
      tokenName, // token name
      tokenTicker,          // token symbol
      tokenOwner,   // new owner, who will mint later
      tokenNondivisible,           // isNonDivisible = TRUE, means NOT divisible, decimals = 0)
    );

    await tokenDeployTx.waitForDeployment();
    
    try {
        await hre.run("verify:verify", {
            address: tokenDeployTx.target,
            network: "luksoTestnet",
            constructorArguments: [tokenName, tokenTicker, tokenOwner, tokenNondivisible],
            // If your contract uses libraries or you have other specific settings, include them here
        });
        console.log("Contract verified");
    } catch (error) {
        console.error("Contract verification failed:", error);
    }
    const tokenAddress = tokenDeployTx.target as string;
    console.log('✅ Token deployed. Address:', tokenAddress);
    console.log(`npx hardhat verify --network luksoTestnet ${tokenAddress} "FRESH TEST" GRV_FT ${signer.address}`);
    const LSP7TokenContract = new ethers.Contract(tokenAddress, LSP7Mintable.abi, provider);
    const mintTx = await LSP7TokenContract.connect(signer).mint(signer.address, 69, 1, "0x", { gasLimit: 400_000 });
    console.log('✅ Token minted to vault through UP Grave Vault Forwader. Tx:', mintTx.hash);
    */
}


main().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
});