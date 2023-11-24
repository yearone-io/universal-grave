import {useContext, useEffect, useState} from "react";
import {WalletContext} from "@/components/wallet/WalletContext";
import ERC725, {ERC725JSONSchema} from "@erc725/erc725.js";
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import {detectLSP, LSPType, TokenInfo} from "@/utils/tokenUtils";

export default function LspAssets({address}: { address: string | null }) {
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
        if (window.lukso && account && address && lsp7Assets.length === 0) {
            const erc725js = new ERC725(lsp3ProfileSchema as ERC725JSONSchema[], address, 'https://rpc.testnet.lukso.gateway.fm',
                {
                    ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
                },
            );
            let fetchedLsp7Assets: TokenInfo[] = [];
            erc725js.fetchData('LSP5ReceivedAssets[]')
                .then(receivedAssetsDataKey => {
                    (receivedAssetsDataKey.value as string[]).map(async assetAddress => {
                        const tokenInfo = await detectLSP(assetAddress, address, LSPType.LSP7DigitalAsset);
                        if (tokenInfo) {
                            fetchedLsp7Assets.push(tokenInfo);
                        }
                    });
                    setLoading(false);
                }).then(value => {
                setLsp7VaultAsset(fetchedLsp7Assets)
            });
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
                    <li key={index}>{asset.name} - {asset.address} - {asset.balance}</li>
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
