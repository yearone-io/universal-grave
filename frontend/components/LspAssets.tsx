import {useContext, useEffect, useState} from 'react';
import {WalletContext} from '@/components/wallet/WalletContext';
import ERC725, {ERC725JSONSchema} from '@erc725/erc725.js';
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import {detectLSP, LSPType, TokenInfo} from '@/utils/tokenUtils';
import {constants} from '@/app/constants';
import LSP7Panel from "@/components/LSP7Panel";

export default function LspAssets() {
  const [loading, setLoading] = useState(true);
  const walletContext = useContext(WalletContext);
  const [lsp7Assets, setLsp7VaultAsset] = useState<TokenInfo[]>([]);
  const [lps8Assets, setLsp8VaultAssets] = useState<string[]>([]);
  const { graveVault } = walletContext;

  // Checking if the walletContext is available
  if (!walletContext) {
    throw new Error('WalletConnector must be used within a WalletProvider.');
  }

  const { account } = walletContext;

  useEffect(() => {
    if (
      window.lukso &&
      account &&
      graveVault &&
      graveVault != constants.ZERO_ADDRESS &&
      lsp7Assets.length === 0
    ) {
      const erc725js = new ERC725(
        lsp3ProfileSchema as ERC725JSONSchema[],
        graveVault,
        window.lukso,
        {
          ipfsGateway: constants.IPFS,
        }
      );
      erc725js
        .fetchData('LSP5ReceivedAssets[]')
        .then(receivedAssetsDataKey => {
          return (receivedAssetsDataKey.value as string[]).forEach(
            assetAddress => {
              return detectLSP(
                assetAddress,
                graveVault,
                LSPType.LSP7DigitalAsset
              ).then(tokenInfo => {
                if (tokenInfo) {
                  setLsp7VaultAsset([...lsp7Assets, tokenInfo]);
                }
              });
            }
          );
        })
        .then(() => {
          setLoading(false);
        });
    }
  }, [account, graveVault, lsp7Assets]);

  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <h1>LSP7 Assets</h1>
        {lsp7Assets.map((asset, index) => (
              <LSP7Panel tokenName={asset.name!} tokenAmount={asset.balance!.toString()} tokenAddress={asset.address!} vaultAddress={graveVault!} />
        ))}
    </div>
  );
}
