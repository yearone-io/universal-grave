import {useContext, useEffect, useState} from 'react';
import {WalletContext} from '@/components/wallet/WalletContext';
import ERC725, {ERC725JSONSchema} from '@erc725/erc725.js';
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import {detectLSP, LSPType, TokenInfo} from '@/utils/tokenUtils';
import {constants} from '@/app/constants';
import LSP7Panel from "@/components/LSP7Panel";
import {Box, Flex, Image, Text} from "@chakra-ui/react";

export default function LspAssets() {
  const [loading, setLoading] = useState(true);
  const walletContext = useContext(WalletContext);
  const [lsp7Assets, setLsp7VaultAsset] = useState<TokenInfo[]>([]);
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
        .then(async receivedAssetsDataKey => {
            const result: TokenInfo[] = [];
            for (const assetAddress of (receivedAssetsDataKey.value as string[])) {
                await detectLSP(
                    assetAddress,
                    graveVault,
                    LSPType.LSP7DigitalAsset
                ).then(tokenInfo => {
                    if (tokenInfo) {
                        result.push(tokenInfo);
                    }
                });
            }
            setLsp7VaultAsset(result);
        })
        .then(() => {
          setLoading(false);
        });
    }
  }, [account, graveVault, lsp7Assets]);

  const emptyLS7PAssets = () => {
    return (
      <Box>
        <Image
          w="300px"
          src="/images/empty-grave.png"
          alt="empty-grave"
          borderRadius="10px"
        />
        <Text
          color="white"
          fontWeight={400}
          fontSize="16px"
          fontFamily="Bungee"
          mb="20px"
          mt="20px"
          textAlign="center"
        >
          Your Graveyard is empty
        </Text>
      </Box>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <Flex justifyContent="space-between">
      <Box>
        <Text
          color="white"
          fontWeight={400}
          fontSize="16px"
          fontFamily="Bungee"
          mb="20px"
        >
          LSP7 Assets
        </Text>
        {lsp7Assets.length === 0 ? (
          emptyLS7PAssets()
        ) :
            lsp7Assets.map((asset, index) => (
                    <LSP7Panel tokenName={asset.name!} tokenAmount={asset.balance!.toString()} tokenAddress={asset.address!} vaultAddress={graveVault!} />
                ))
        }
      </Box>
    </Flex>
  );
}
