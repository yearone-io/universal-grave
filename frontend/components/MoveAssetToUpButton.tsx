import {ContractInterface, ethers} from "ethers";
import {lsp1GraveForwader} from "@/abis/lsp1GraveForwader";
import {Button} from "@chakra-ui/react";
import {LSP1GraveForwader} from "@/app/contracts";
import {constants} from '@/app/constants';

export default function MoveAssetToUpButton({asset, to} : {asset:string, to: string}) {
    const provider = new ethers.providers.Web3Provider(window.lukso);
    const signer = provider.getSigner();
    const transferTokenToUP = async (tokenAddress: string) => {
        let contract = new ethers.Contract(
            constants.UNIVERSAL_GRAVE_FORWARDER,
            lsp1GraveForwader as ContractInterface,
            signer
        ) as LSP1GraveForwader;

        await contract.addTokenToAllowlist(tokenAddress, {gasLimit: 400_00});
    }

    return <Button onClick={() => transferTokenToUP(asset)}>Move to UP</Button>
}