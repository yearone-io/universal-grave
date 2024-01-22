'use client';
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Box, Flex, Image, Text, useToast } from '@chakra-ui/react';
import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js';
import LSP3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import LSP8IdentifiableDigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP8IdentifiableDigitalAsset.json';
import { detectLSP, LSPType, TokenInfo } from '@/utils/tokenUtils';
import LSP7Panel from '@/components/LSP7Panel';
import LSP8Panel from '@/components/LSP8Panel';
import { constants } from '@/app/constants';

export default function LSPAssets({
  graveVault,
}: {
  graveVault: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [lsp7Assets, setLsp7Assets] = useState<TokenInfo[]>([]);
  const [lsp8Assets, setLsp8Assets] = useState<TokenInfo[]>([]);

  const toast = useToast();

  /**
   * Fetch assets from the grave vault.
   * This function is called when the page loads and when an asset is revived
   */
  const fetchAssets = async () => {
    if (!graveVault || graveVault === constants.ZERO_ADDRESS) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const erc725js = new ERC725(
      LSP3ProfileSchema as ERC725JSONSchema[],
      graveVault,
      window.lukso,
      {
        ipfsGateway: constants.IPFS,
      }
    );

    try {
      const receivedAssetsResults = await erc725js.fetchData(
        'LSP5ReceivedAssets[]'
      );
      const lsp7Results: TokenInfo[] = [];
      const lsp8Results: TokenInfo[] = [];
      const detectAssetCalls: Promise<TokenInfo | undefined>[] = [];

      for (const assetAddress of receivedAssetsResults.value as string[]) {
        detectAssetCalls.push(
          detectLSP(assetAddress, graveVault, LSPType.LSP7DigitalAsset)
        );
        detectAssetCalls.push(
          detectLSP(
            assetAddress,
            graveVault,
            LSPType.LSP8IdentifiableDigitalAsset
          )
        );
      }

      const receivedAssetsWithTypes = await Promise.all(detectAssetCalls);
      for (const asset of receivedAssetsWithTypes) {
        if (!asset) continue;

        if (asset.type === LSPType.LSP7DigitalAsset) {
          lsp7Results.push(asset);
        } else if (asset.type === LSPType.LSP8IdentifiableDigitalAsset) {
          const contract = new ethers.Contract(
            asset.address as string,
            LSP8IdentifiableDigitalAsset.abi,
            new ethers.providers.Web3Provider(window.lukso)
          );
          const tokenIds = await contract.tokenIdsOf(graveVault);
          tokenIds.forEach((tokenId: string) => {
            lsp8Results.push({
              ...asset,
              tokenId: tokenId.toString(),
            });
          });
        }
      }

      setLsp7Assets(lsp7Results);
      setLsp8Assets(lsp8Results);
    } catch (error: any) {
      console.error(error);
      toast({
        title: `Error fetching assets. ${error.message}`,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch assets on account change when the page loads, if the criteria is met
   */
  useEffect(() => {
    if (graveVault) {
      fetchAssets();
    }
  }, [graveVault]);

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
        {lsp7Assets.length
          ? lsp7Assets.map((asset, index) => (
              <Box key={'lsp7-' + index}>
                <LSP7Panel
                  tokenName={asset.name!}
                  tokenAmount={asset.balance!.toString()}
                  tokenAddress={asset.address!}
                  tokenMetadata={asset.metadata!}
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
        {lsp8Assets.length
          ? lsp8Assets.map((asset, index) => (
              <Box key={'lsp8-' + index}>
                <LSP8Panel
                  tokenName={asset.name!}
                  tokenId={asset.tokenId!}
                  tokenAddress={asset.address!}
                  tokenMetadata={asset.metadata!}
                  vaultAddress={graveVault!}
                  onReviveSuccess={fetchAssets}
                />
              </Box>
            ))
          : emptyLS7PAssets()}
      </Box>
    </Flex>
  );
}
