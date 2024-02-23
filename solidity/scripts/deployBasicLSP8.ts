import { ethers } from "hardhat";
import * as dotenv from 'dotenv';
// need to 'npx hardhat compile' before
import BasicLSP8 from "../artifacts/contracts/BasicLSP8.sol/BasicLSP8.json";
import { LSP4_TOKEN_TYPES, LSP8_TOKEN_ID_FORMAT } from "@lukso/lsp-smart-contracts";

// load env vars
dotenv.config();
// Update those values in the .env file
const { EOA_PRIVATE_KEY, UP_ADDR } = process.env;
const LSP8TokenMetadataBaseURIKey = "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843";
const LSP4MetadataKey = "0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e";

async function deployAndSetLSP8MetadataBaseURI() {
    const tokenName = 'Year One Wolves';
    const tokenTicker = 'YOW';
    const tokenOwner = UP_ADDR;
    // setup provider
    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.lukso.network');
    // setup signer (the browser extension controller)
    const signer = new ethers.Wallet(EOA_PRIVATE_KEY as string, provider);

    // Deploy Token, Send to Vault, then withdraw to UP
    console.log('⏳ Deploying LSP8 Token');

    const Lsp8Factory = new ethers.ContractFactory(
        BasicLSP8.abi,
        BasicLSP8.bytecode,
    );

    const deploymentArguments = [tokenName, tokenTicker, tokenOwner, LSP4_TOKEN_TYPES.COLLECTION, LSP8_TOKEN_ID_FORMAT.NUMBER];

    const tokenDeployTx = await Lsp8Factory.connect(signer).deploy(...deploymentArguments);
    await tokenDeployTx.waitForDeployment();

    try {
        await hre.run("verify:verify", {
            address: tokenDeployTx.target,
            network: "luksoTestnet",
            constructorArguments: deploymentArguments,
            contract: "contracts/BasicLSP8.sol:BasicLSP8"
        });
        console.log("Contract verified");
    } catch (error) {
        console.error("Contract verification failed:", error);
    }
    const tokenAddress = tokenDeployTx.target as string;
    console.log('✅ LSP8 Token deployed. Address:', tokenAddress);
    const LSP8TokenContract = new ethers.Contract(tokenAddress,  BasicLSP8.abi, provider);
    let lsp8Mintable = LSP8TokenContract.connect(signer);
    const nftBaseURI = "0x6f357c6a697066733a2f2f6261667962656966353266793266737966786374356b796234657433776e7136333234617a6f7879366b6b7873366d6536666233666575666b34342f";
    const nftMetadata = "0x6f357c6af141c28c529f44e5ac1aa63530ada217aae14edb56fc82f69f43407719d8e216697066733a2f2f6261666b72656965627972786f3337616a77696d7566363270347a796a3265766a626534666369377232746e6f63643664346f6b62776968626d61";
    
    const setDataTx =await lsp8Mintable.setDataBatch(
      [LSP8TokenMetadataBaseURIKey, LSP4MetadataKey],
      [nftBaseURI, nftMetadata],
      {gasLimit: 400_000}
    );
    console.log('✅ Base URI data set. Tx:', setDataTx.hash);

    // const mintTx = await lsp8Mintable.mint(signer.address, "0x0000000000000000000000000000000000000000000000000000000000000001", true, "0x", { gasLimit: 400_000 });
    // console.log('✅ Token minted to vault through UP Grave Vault Forwarder. Tx:', mintTx.hash);
}

deployAndSetLSP8MetadataBaseURI().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });