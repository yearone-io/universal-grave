import {useContext, useEffect, useState} from "react";
import {WalletContext} from "@/components/wallet/WalletContext";
import {useToast} from "@chakra-ui/react";
import ERC725, {ERC725JSONSchema} from "@erc725/erc725.js";
import {ethers} from "ethers";
import UniversalProfile from "@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json";
import {ERC725YDataKeys} from "@lukso/lsp-smart-contracts";
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';

export default function VaultAssets({vaultAddress}: {vaultAddress: string}) {
    const [loading, setLoading] = useState(false);
    const walletContext = useContext(WalletContext);
    const [vaultAssets, setVaultAssets] = useState([]);
    const toast = useToast();

    // Checking if the walletContext is available
    if (!walletContext) {
        throw new Error('WalletConnector must be used within a WalletProvider.');
    }
    const { account } = walletContext;

    useEffect(() => {
        // Request account access on component mount
        if (window.lukso && account) {
            const fetchVault = async () => {
                const provider =  new ethers.providers.Web3Provider(window.lukso);
                const signer = provider.getSigner();

                const UP = new ethers.Contract(
                    account as string,
                    UniversalProfile.abi,
                    provider
                );
                const hexNumber = ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 16);


                //read assets from vault
                const UPData = await UP.connect(signer).getDataBatch([
                    ERC725YDataKeys.LSP5["LSP5ReceivedAssets[]"].index + hexNumber.slice(2)
                ]);
                console.log("foobar", UPData);

                const VAULT = new ethers.Contract(
                    "0x61a4C102f9731E43EA9D06B0Fe0c02b4777aA016" as string,
                    UniversalProfile.abi,
                    provider
                );

                const UPData1 = await VAULT.connect(signer).getDataBatch([
                    ERC725YDataKeys.LSP5["LSP5ReceivedAssets[]"].index + hexNumber.slice(2)
                ]);
                console.log("foobar1", UPData1);

                const UPD = new ethers.Contract(
                    "0x61a4C102f9731E43EA9D06B0Fe0c02b4777aA016" as string,
                    UniversalProfile.abi,
                    provider
                );

                const UPDData2 = await UPD.connect(signer).getDataBatch([
                    ERC725YDataKeys.LSP5["LSP5ReceivedAssets[]"].index + hexNumber.slice(2)
                ]);
                console.log("foobar2", UPDData2);

                const erc725js = new ERC725(lsp3ProfileSchema as ERC725JSONSchema[], "0x61a4C102f9731E43EA9D06B0Fe0c02b4777aA016", 'https://rpc.testnet.lukso.gateway.fm',
                    {
                        ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
                    },
                );

                const receivedAssetsDataKey = await erc725js.fetchData('LSP5ReceivedAssets[]');

                console.log(receivedAssetsDataKey)

            }

            fetchVault();
        }
    }, [account]);
    return (
        <div>
            <h1>VaultAssets</h1>
        </div>
    )
}
