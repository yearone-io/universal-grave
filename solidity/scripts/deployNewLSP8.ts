import hre, {ethers} from 'hardhat';
import * as dotenv from 'dotenv';
import LSP8Mintable from '@lukso/lsp-smart-contracts/artifacts/LSP8Mintable.json';
import {LSP8Mintable__factory, LSP8Mintable as LSP8MintableType} from "../typechain-types";


// load env vars
dotenv.config();

// Update those values in the .env file
const { UP_ADDR, EOA_PRIVATE_KEY, CONTROLLER_PUBLIC_KEY } = process.env;

async function main() {
    const tokenName = "Token Name LSP8";
    const tokenTicker = "TNLSP8";
    const tokenOwner = CONTROLLER_PUBLIC_KEY;
    const tokenTypeId = 0;
    // setup provider
    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.lukso.network');
    // setup signer (the browser extension controller)
    const signer = new ethers.Wallet(EOA_PRIVATE_KEY as string, provider);
    // Deploy Token, Send to Vault, then withdraw to UP
    console.log('⏳ Deploying Token');
    // create an instance of the token contract
    const lsp8Factory = new ethers.ContractFactory(
        LSP8Mintable.abi,
        LSP8Mintable.bytecode,
    );

    const tokenDeployTx = await lsp8Factory.connect(signer).deploy(
      tokenName, // token name
      tokenTicker,          // token symbol
      tokenOwner!,   // new owner, who will mint later
      tokenTypeId,           // isNonDivisible = TRUE, means NOT divisible, decimals = 0)
    );

    await tokenDeployTx.waitForDeployment();
    
    try {
        await hre.run("verify:verify", {
            address: tokenDeployTx.target,
            network: "luksoTestnet",
            constructorArguments: [tokenName, tokenTicker, tokenOwner, tokenTypeId],
            // If your contract uses libraries or you have other specific settings, include them here
        });
        console.log("Contract verified");
    } catch (error) {
        console.error("Contract verification failed:", error);
    }
    const tokenAddress = tokenDeployTx.target as string;
    console.log('✅ Token deployed. Address:', tokenAddress);
    const LSP8TokenContract = new ethers.Contract(tokenAddress, LSP8Mintable.abi, provider);
    const dataKey = "0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e";
    const dataValue = "0x6f357c6af141c28c529f44e5ac1aa63530ada217aae14edb56fc82f69f43407719d8e216697066733a2f2f6261666b72656965627972786f3337616a77696d7566363270347a796a3265766a626534666369377232746e6f63643664346f6b62776968626d61"
    //const dataValue = "0x6f357c6a0feb2861343e8c2b010c0ea817bd56edc24e8be73c4c8e1ec59b47ad6d6930ed697066733a2f2f516d65436764394b47325276554a7a32617a46413551324e547031395770394151704661435a7a7a6b4357785954";
    //const dataValue = "0x6f357c6aa646d6355e6b38fb4e5d90a2612bcba76c6d70fd134cefb0f5e42a71b585c492697066733a2f2f516d52586d65414450657566525a756d6e37326347724d34785939714c7065697157537a367432746b546735655a";
    //const dataValue = "0x6f357c6af26b079dcfa66a6ccdf25383dbd9d89bd22e4b5da8da753b3014ea7fdfa90ee4697066733a2f2f516d623442394c71416951504c694c46524b33684273533845386d3764484569546f41486b6856336d713563427a"
    let baseContract = LSP8TokenContract.connect(signer);
    const setDataTx = await baseContract.setData(dataKey,dataValue,{gasLimit: 400_000});
    console.log('✅ Data set. Tx:', setDataTx.hash);
    const mintTx = await baseContract.mint("0xfcd2E43FaE0E6D8d3c1e18d51acaf8f6EC8997c4", "0x0000000000000000000000000000000000000000000000000000000000000001", true, "0x", { gasLimit: 400_000 });
    console.log('✅ Token minted to vault through UP Grave Vault Forwader. Tx:', mintTx.hash);
}


main().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
});