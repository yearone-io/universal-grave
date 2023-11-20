import { expect } from "chai";
import { ethers } from "hardhat";
import {MyAccount, SimpleUniversalReceiverDelegate} from "../typechain-types";

describe("SimpleUniversalReceiverDelegate", function () {
    let simpleUniversalReceiverDelegate: SimpleUniversalReceiverDelegate;
    let myAccount: MyAccount;

    beforeEach(async function () {
        const [user] = (await ethers.getSigners());

        const MyAccount = await ethers.getContractFactory("MyAccount");
        myAccount = await MyAccount.deploy(user.address);
        await myAccount.deployed();

        const SimpleUniversalReceiverDelegate = await ethers.getContractFactory("SimpleUniversalReceiverDelegate");
        simpleUniversalReceiverDelegate = await SimpleUniversalReceiverDelegate.deploy();
        await simpleUniversalReceiverDelegate.deployed();
    });

    it("should be deployed", async function () {
        expect(simpleUniversalReceiverDelegate.address).to.be.not.null;
    });
});
