import { ethers } from "hardhat";
import * as dotenv from 'dotenv';
// need to 'npx hardhat compile' before
import LSP1UniversalReceiverDelegateVault from "../artifacts/contracts/LSP1UniversalReceiverDelegateVault.sol/LSP1UniversalReceiverDelegateVaultGrave.json";
import config from '../hardhat.config';

// load env vars
dotenv.config();
// Update those values in the .env file
const { EOA_PRIVATE_KEY, NETWORK } = process.env;
const network = NETWORK as string || 'luksoTestnet';

async function deployLSP1UniversalReceiverDelegateVault() {
    // setup provider
    const provider = new ethers.JsonRpcProvider(config.networks[network].url);
    // setup signer (the browser extension controller)
    const signer = new ethers.Wallet(EOA_PRIVATE_KEY as string, provider);
    // Deploy Token
    console.log('⏳ Deploying LSP1UniversalReceiverDelegateVault');
    const Lsp1URDVaultFactory = new ethers.ContractFactory(
        LSP1UniversalReceiverDelegateVault.abi,
        LSP1UniversalReceiverDelegateVault.bytecode,
    );

    const vaultURDDeployTx = await Lsp1URDVaultFactory.connect(signer).deploy([]);
    await vaultURDDeployTx.waitForDeployment();

    try {
        await hre.run("verify:verify", {
            address: vaultURDDeployTx.target,
            network: "luksoTestnet",
            constructorArguments: [],
            contract: "contracts/LSP1UniversalReceiverDelegateVault.sol:LSP1UniversalReceiverDelegateVaultGrave"
        });
        console.log("Contract verified");
    } catch (error) {
        console.error("Contract verification failed:", error);
    }
    const vaultURDAddress = vaultURDDeployTx.target as string;
    console.log('✅ LSP1UniversalReceiverDelegateVault deployed. Address:', vaultURDAddress);
}

deployLSP1UniversalReceiverDelegateVault().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });