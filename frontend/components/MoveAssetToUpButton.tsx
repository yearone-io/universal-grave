import {ContractInterface, ethers} from "ethers";
import {lsp1GraveForwader} from "@/abis/lsp1GraveForwader";
import {LSP1GraveForwader, LSP7Mintable__factory} from "@/contracts";
import {constants} from '@/app/constants';
import {Button, useToast} from "@chakra-ui/react";

export default function MoveAssetToUpButton({asset, from} : {asset:string, from: string}) {
    const toast = useToast()

    const transferTokenToUP = async (tokenAddress: string) => {
        try {
            const provider = new ethers.providers.Web3Provider(window.lukso);
            const signer = provider.getSigner();

            const lsp1GraveForwaderContract = new ethers.Contract(
                constants.UNIVERSAL_GRAVE_FORWARDER,
                lsp1GraveForwader as ContractInterface,
                signer
            ) as LSP1GraveForwader;

            await lsp1GraveForwaderContract.addTokenToAllowlist(tokenAddress, {gasLimit: 400_00});

            const lsp7 = LSP7Mintable__factory.connect(asset, provider);
            await lsp7.connect(signer).transfer(from, await signer.getAddress(), 1, false, "0x", {gasLimit: 400_00});

        } catch (error: any) {
            console.error(error);
            toast({
                title: `Error fetching UP data. ${error.message}`,
                status: 'error',
                position: 'bottom-left',
                duration: 9000,
                isClosable: true,
            })
        }

    }

    return <Button onClick={() => transferTokenToUP(asset)}>Move to UP</Button>
}