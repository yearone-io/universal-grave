import hre, { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { abi as UP_ABI } from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { ERC725YDataKeys, LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { OPERATION_TYPES, PERMISSIONS } from '@lukso/lsp-smart-contracts';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';
import LSP7Mintable from '@lukso/lsp-smart-contracts/artifacts/LSP7Mintable.json';


// load env vars
dotenv.config();

// Update those values in the .env file
const { UP_ADDR, EOA_PRIVATE_KEY } = process.env;

async function main() {
    // setup provider
    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.lukso.network');
    // setup signer (the browser extension controller)
    const signer = new ethers.Wallet(EOA_PRIVATE_KEY as string, provider);
    // Deploy Token, Send to Vault, then withdraw to UP
    console.log('⏳ Deploying Token');
    // create an instance of the token contract
    const lsp7Factory = new ethers.ContractFactory(
        LSP7Mintable.abi,
        LSP7Mintable.bytecode,
    );

    const tokenDeployTx = await lsp7Factory.connect(signer).deploy(
      'FRESH TEST', // token name
      'GRV_FT',          // token symbol
      signer.address,   // new owner, who will mint later
      false,           // isNonDivisible = TRUE, means NOT divisible, decimals = 0)
    );

    const tokenAddress = tokenDeployTx.target as string;
    console.log('✅ Token deployed. Address:', tokenAddress);
    console.log(`npx hardhat verify --network luksoTestnet ${tokenAddress} "FRESH TEST" GRV_FT ${signer.address}`);
    const LSP7TokenContract = new ethers.Contract(tokenAddress, LSP7Mintable.abi, provider);
    const mintTx = await LSP7TokenContract.connect(signer).mint(signer.address, 69, 0, "0x", { gasLimit: 400_000 });
    console.log('✅ Token minted to vault through UP Grave Vault Forwader. Tx:', mintTx.hash);
}


main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });