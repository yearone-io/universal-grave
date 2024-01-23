import {getInterfaceID} from "./solidity";
import LSP1GraveForwarderABI from "../abis/LSP1GraveForwarder.json"
import {BigNumber, ethers} from "ethers";

test("returns correct interface id", () => {
    const forwarderInterface = new ethers.utils.Interface(LSP1GraveForwarderABI.abi);
    expect(getInterfaceID(forwarderInterface)).toStrictEqual(BigNumber.from("0x2232aa53"));
});
