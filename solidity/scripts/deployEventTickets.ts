import { ethers } from "hardhat";
import {
    EventTicketsNFT,
    EventTicketsNFT__factory
} from "../typechain-types";
import * as dotenv from 'dotenv';

// load env vars
dotenv.config();

// Update those values in the .env file
const { EOA_PRIVATE_KEY, CONTROLLER_PUBLIC_KEY } = process.env;

async function deployAndCreateTickets() {
    // setup provider
    const provider = new ethers.JsonRpcProvider('https://rpc.testnet.lukso.network');
    // setup signer (the browser extension controller)
    const signer = new ethers.Wallet(EOA_PRIVATE_KEY as string, provider);

    const luksoMeetupTickets: EventTicketsNFT = await new EventTicketsNFT__factory(
        signer
    ).deploy(
        "LUKSO Meetup #2",
        "MUP2",
        "0x7Da03Ca1ddFF992dCf3782EE437Eb16213C22c04",
    )

    console.log(luksoMeetupTickets);

    // create 100 entry tickets.
    // Give them to the deployer initially, who will distribute them afterwards.
    const tx = await luksoMeetupTickets.mint(
        "0x7Da03Ca1ddFF992dCf3782EE437Eb16213C22c04", // recipient
        69, // amount
        true, // force sending to an EOA
        "0x" // data
    , {gasLimit: 400_000});
    console.log(tx);
    console.log(`npx hardhat verify --network luksoTestnet`);
}

deployAndCreateTickets().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });