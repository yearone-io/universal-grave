import {useContext, useEffect, useState} from "react";
import {WalletContext} from "@/components/wallet/WalletContext";
import ERC725, {ERC725JSONSchema} from "@erc725/erc725.js";
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import {detectLSP, LSPType, TokenInfo} from "@/utils/tokenUtils";

export default function LspAssets({address}: { address?: string }) {
    const [loading, setLoading] = useState(true);
    const walletContext = useContext(WalletContext);
    const [lsp7Assets, setLsp7VaultAsset] = useState<TokenInfo[]>([]);
    const [lps8Assets, setLsp8VaultAssets] = useState<string[]>([]);

    // Checking if the walletContext is available
    if (!walletContext) {
        throw new Error('WalletConnector must be used within a WalletProvider.');
    }

    const {account} = walletContext;

    useEffect(() => {
        if (window.lukso && account && address) {
            const erc725js = new ERC725(lsp3ProfileSchema as ERC725JSONSchema[], address, 'https://rpc.testnet.lukso.gateway.fm',
                {
                    ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
                },
            );
            erc725js.fetchData('LSP5ReceivedAssets[]')
                .then(receivedAssetsDataKey => {
                    console.log(receivedAssetsDataKey.value);
                    let fetchedLsp7Assets: TokenInfo[] = [];
                    (receivedAssetsDataKey.value as string[]).map(async assetAddress => {
                        //get balance of each assetAddress
                        console.log("assetAddress", assetAddress);
                        const value1 = await detectLSP(assetAddress, LSPType.LSP7DigitalAsset, true);
                        console.log("value1", value1);
                        if (value1) {
                            fetchedLsp7Assets.push(value1);
                        }
                    });

                }).then(value => {
                    setLoading(false);
            })
        }
    }, [account, address]);

    if (loading) {
        return <div>Loading...</div>
    }
    return (
        <div>
            <h1>LSP7 Assets</h1>
            <ul>
                {lsp7Assets.map((asset, index) => (
                    <li key={index}>{asset.address} - {asset.balance}</li>
                ))}
            </ul>

            <h1>LSP8 Assets</h1>
            <ul>
                {lps8Assets.map((asset, index) => (
                    <li key={index}>{asset}</li>
                ))}
            </ul>
        </div>
    )
}
