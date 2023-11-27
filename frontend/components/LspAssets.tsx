'use client';
import { useCallback, useContext, useEffect, useState } from 'react';
import { WalletContext } from '@/components/wallet/WalletContext';
import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js';
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import { detectLSP, LSPType, TokenInfo } from '@/utils/tokenUtils';
import { constants } from '@/app/constants';
import LSP7Panel from '@/components/LSP7Panel';
import { Box, Flex, Image, Text, useToast } from '@chakra-ui/react';

export default function LspAssets() {
  const [loading, setLoading] = useState(true);
  const walletContext = useContext(WalletContext);
  const [lsp7Assets, setLsp7VaultAsset] = useState<TokenInfo[] | null>(null);
  const { graveVault } = walletContext;
  const toast = useToast();
  // Checking if the walletContext is available
  if (!walletContext) {
    throw new Error('WalletConnector must be used within a WalletProvider.');
  }
  const { account } = walletContext;

  /**
   * Fetch assets from the grave vault.
   * This function is called when the page loads and when an asset is revived
   */
  const fetchAssets = useCallback(() => {
    if (graveVault !== constants.ZERO_ADDRESS) {
      setLoading(true);
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
          console.log('assets fetched');
          const result: TokenInfo[] = [];
          for (const assetAddress of receivedAssetsDataKey.value as string[]) {
            await detectLSP(
              assetAddress,
              graveVault as string,
              LSPType.LSP7DigitalAsset
            ).then(tokenInfo => {
              if (tokenInfo) {
                result.push(tokenInfo);
              }
            });
          }
          setLsp7VaultAsset(result);
        })
        .catch(error => {
          console.log(error);
          setLoading(false);
          toast({
            title: `Error fetching assets. ${error.message}`,
            status: 'error',
            position: 'bottom-left',
            duration: 9000,
            isClosable: true,
          });
        })
        .finally(() => {
          setLoading(false);
      });
    }
  }, [graveVault]);

  /**
   * Fetch assets on account change when the page loads, if the criteria is met
   */
  useEffect(() => {
    if (
      window.lukso &&
      account &&
      graveVault &&
      lsp7Assets === null
    ) {
      fetchAssets();
    }
  }, [account, graveVault, lsp7Assets, fetchAssets]);

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
        {lsp7Assets && lsp7Assets.length > 0
          ? lsp7Assets.map((asset, index) => (
              <Box key={'lsp7-' + index}>
                <LSP7Panel
                  tokenName={asset.name!}
                  tokenAmount={asset.balance!.toString()}
                  tokenAddress={asset.address!}
                  vaultAddress={graveVault!}
                  onReviveSuccess={fetchAssets}
                />
              </Box>
            ))
          : emptyLS7PAssets()}
      </Box>
      <Box>
        <Text
          color="white"
          fontWeight={400}
          fontSize="16px"
          fontFamily="Bungee"
          mb="20px"
        >
          LSP8 Assets
        </Text>
        <Text
          color="white"
          fontWeight={400}
          fontSize="16px"
          fontFamily="Bungee"
          mb="20px"
          mt="20px"
          textAlign="center"
        >
          Coming soon!
        </Text>
      </Box>
    </Flex>
  );
}
