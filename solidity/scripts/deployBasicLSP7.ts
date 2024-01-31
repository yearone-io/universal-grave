import { ethers } from "hardhat";
import * as dotenv from 'dotenv';
// need to 'npx hardhat compile' before
import BasicLSP7 from "../artifacts/contracts/BasicLSP7.sol/BasicLSP7.json";
import { LSP4_TOKEN_TYPES } from "@lukso/lsp-smart-contracts";
import {BasicLSP7 as BasicLSP7Type} from "../typechain-types";

// load env vars
dotenv.config();
// Update those values in the .env file
const { EOA_PRIVATE_KEY, CONTROLLER_PUBLIC_KEY } = process.env;

async function deployAndSetLSP8MetadataBaseURI() {
    const tokenName = 'LSP7 Token Name';
    const tokenTicker = 'LSP7 TKN';
    const tokenOwner = CONTROLLER_PUBLIC_KEY;
    const tokenNondivisible = false;
    // setup provider
    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.lukso.network');
    // setup signer (the browser extension controller)
    const signer = new ethers.Wallet(EOA_PRIVATE_KEY as string, provider);
    // Deploy Token
    console.log('⏳ Deploying LSP7 Token');
    const Lsp7Factory = new ethers.ContractFactory(
        BasicLSP7.abi,
        BasicLSP7.bytecode,
    );

    const deploymentArguments = [tokenName, tokenTicker, tokenOwner, LSP4_TOKEN_TYPES.TOKEN, tokenNondivisible];

    const tokenDeployTx = await Lsp7Factory.connect(signer).deploy(...deploymentArguments);
    await tokenDeployTx.waitForDeployment();

    try {
        await hre.run("verify:verify", {
            address: tokenDeployTx.target,
            network: "luksoTestnet",
            constructorArguments: deploymentArguments,
            contract: "contracts/BasicLSP7.sol:BasicLSP7"
        });
        console.log("Contract verified");
    } catch (error) {
        console.error("Contract verification failed:", error);
    }
    const tokenAddress = tokenDeployTx.target as string;
    console.log('✅ Token deployed. Address:', tokenAddress);
    
    const LSP7TokenContract = new ethers.Contract(tokenAddress, BasicLSP7.abi, provider);
    const dataKey = "0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e";
    const dataValue = "0x6f357c6af141c28c529f44e5ac1aa63530ada217aae14edb56fc82f69f43407719d8e216697066733a2f2f6261666b72656965627972786f3337616a77696d7566363270347a796a3265766a626534666369377232746e6f63643664346f6b62776968626d61"
    //const dataValue = "0x6f357c6a0feb2861343e8c2b010c0ea817bd56edc24e8be73c4c8e1ec59b47ad6d6930ed697066733a2f2f516d65436764394b47325276554a7a32617a46413551324e547031395770394151704661435a7a7a6b4357785954";
    //const dataValue = "0x6f357c6aa646d6355e6b38fb4e5d90a2612bcba76c6d70fd134cefb0f5e42a71b585c492697066733a2f2f516d52586d65414450657566525a756d6e37326347724d34785939714c7065697157537a367432746b546735655a";
    //const dataValue = "0x6f357c6af26b079dcfa66a6ccdf25383dbd9d89bd22e4b5da8da753b3014ea7fdfa90ee4697066733a2f2f516d623442394c71416951504c694c46524b33684273533845386d3764484569546f41486b6856336d713563427a"
    let lsp7Mintable = LSP7TokenContract.connect(signer) as BasicLSP7Type;
    const setDataTx = await lsp7Mintable.setData(dataKey,dataValue,{gasLimit: 400_000});
    console.log('✅ Data set. Tx:', setDataTx.hash);
    const mintTx = await lsp7Mintable.mint(signer.address, 69, true, "0x", { gasLimit: 400_000 });
    console.log('✅ Token minted to vault through UP Grave Vault Forwarder. Tx:', mintTx.hash);
}

deployAndSetLSP8MetadataBaseURI().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });