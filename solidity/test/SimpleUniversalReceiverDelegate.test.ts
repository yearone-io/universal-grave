import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("SimpleUniversalReceiverDelegate", function () {
    let simpleUniversalReceiverDelegate: Contract;

    beforeEach(async function () {
        const SimpleUniversalReceiverDelegate = await ethers.getContractFactory("SimpleUniversalReceiverDelegate");
        simpleUniversalReceiverDelegate = await SimpleUniversalReceiverDelegate.deploy();
        await simpleUniversalReceiverDelegate.deployed();
    });

    it("should be deployed", async function () {
        expect(simpleUniversalReceiverDelegate.address).to.be.not.null;
    });
});
