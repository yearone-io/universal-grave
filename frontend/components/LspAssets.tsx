import {useContext, useEffect, useState} from "react";
import {WalletContext} from "@/components/wallet/WalletContext";
import ERC725, {ERC725JSONSchema} from "@erc725/erc725.js";
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import {detectLSP, LSPType, TokenInfo} from "@/utils/tokenUtils";
import {constants} from '@/app/constants';
import MoveAssetToUpButton from "@/components/MoveAssetToUpButton";
import {ethers} from "ethers";

export default function LspAssets() {
    const [loading, setLoading] = useState(true);
    const walletContext = useContext(WalletContext);
    const [lsp7Assets, setLsp7VaultAsset] = useState<TokenInfo[]>([]);
    const [lps8Assets, setLsp8VaultAssets] = useState<string[]>([]);
    const {graveVault: address} = walletContext;
    const provider = new ethers.providers.Web3Provider(window.lukso);
    const signer = provider.getSigner();

    // Checking if the walletContext is available
    if (!walletContext) {
        throw new Error('WalletConnector must be used within a WalletProvider.');
    }

    const {account} = walletContext;

    useEffect(() => {
        if (window.lukso && account && address && lsp7Assets.length === 0) {
            const erc725js = new ERC725(lsp3ProfileSchema as ERC725JSONSchema[], address, window.lukso,
                {
                    ipfsGateway: constants.IPFS,
                },
            );
            erc725js.fetchData('LSP5ReceivedAssets[]')
                .then(receivedAssetsDataKey => {
                    return (receivedAssetsDataKey.value as string[]).forEach(assetAddress => {
                        return detectLSP(assetAddress, address, LSPType.LSP7DigitalAsset)
                            .then(tokenInfo => {
                                if (tokenInfo) {
                                    setLsp7VaultAsset([...lsp7Assets, tokenInfo]);
                                }
                            })

                    });
                }).then(() => {
                setLoading(false);
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
                {lsp7Assets.map(async (asset, index) => (
                    (
                        <>
                            <li key={index}>{asset.name} - {asset.address} - {asset.balance}</li>
                            <MoveAssetToUpButton asset={asset.address!} to={(await signer.getAddress())}/>
                        </>
                    )
                ))}
            </ul>
Ø
            <h1>LSP8 Assets</h1>
            <ul>
                {lps8Assets.map((asset, index) => (
                    <li key={index}>{asset}</li>
                ))}
            </ul>
        </div>
    )
}
