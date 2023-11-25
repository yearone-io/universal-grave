import { ethers } from "hardhat";

import {BasicNFTCollection, BasicNFTCollection__factory} from "../typechain-types";
import * as dotenv from 'dotenv';

// load env vars
dotenv.config();

// Update those values in the .env file
const { EOA_PRIVATE_KEY, CONTROLLER_PUBLIC_KEY } = process.env;

const LSP8TokenMetadataBaseURI =
  '0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843';

async function deployAndSetLSP8MetadataBaseURI() {
    // setup provider
    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.lukso.network');
    // setup signer (the browser extension controller)
    const signer = new ethers.Wallet(EOA_PRIVATE_KEY as string, provider);

    const boredApesCollection: BasicNFTCollection = await new BasicNFTCollection__factory(
        signer,
      ).deploy('BoredApeYachtClub', 'BAYC', "0x7Da03Ca1ddFF992dCf3782EE437Eb16213C22c04");
    console.log("boredApesCollection", boredApesCollection);
    console.log(LSP8TokenMetadataBaseURI, ethers.concat(
        // `0x6f357c6a` represents the hash function identifier,
        // the first 4 bytes of keccak256('keccak256(utf8)')
        // to be used to ensure that the metadata of the NFT is set in stone and cannot be changed 
        // (for verifiability purpose)
        ["0x6f357c6a", ethers.toUtf8Bytes('https://hiozjdbnltsamlbfrfjj.supabase.co/storage/v1/object/public/files/0xbed26b19dc365857c16103195cee05c7e983ef19/0000d35d00cfe9c3b59187bf54e9f4ff81ab271197ac834f886ecee30062e464')]
    ))
    const settingMeta = await boredApesCollection.setData(
        LSP8TokenMetadataBaseURI,
        ethers.concat(
            // `0x6f357c6a` represents the hash function identifier,
            // the first 4 bytes of keccak256('keccak256(utf8)')
            // to be used to ensure that the metadata of the NFT is set in stone and cannot be changed 
            // (for verifiability purpose)
            ["0x6f357c6a", ethers.toUtf8Bytes('https://hiozjdbnltsamlbfrfjj.supabase.co/storage/v1/object/public/files/0xbed26b19dc365857c16103195cee05c7e983ef19/0000d35d00cfe9c3b59187bf54e9f4ff81ab271197ac834f886ecee30062e464')]
        )
      );
    console.log("settingMeta", settingMeta);
}

deployAndSetLSP8MetadataBaseURI().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });