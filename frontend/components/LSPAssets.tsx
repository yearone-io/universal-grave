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
import UnrecognisedPanel from '@/components/UnrecognisedPanel';

export default function LSPAssets({
  graveVault,
}: {
  graveVault: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [lsp7Assets, setLsp7Assets] = useState<TokenInfo[]>([]);
  const [lsp8Assets, setLsp8Assets] = useState<TokenInfo[]>([]);
  const [unrecognisedAssets, setUnrecognisedAssets] = useState<TokenInfo[]>([]);

  const toast = useToast();

  /**
   * Fetch assets from the grave vault.
   * This function is called when the page loads and when an asset is revived
   */
  const fetchAssets = async () => {
    if (!graveVault) {
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
      const unrecognisedAssetResults: TokenInfo[] = [];
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
          console.log('lsp7', asset);
          lsp7Results.push(asset);
        } else if (asset.type === LSPType.LSP8IdentifiableDigitalAsset) {
          console.log('lsp8', asset);
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
        } else {
          console.log('Unrecognised asset: ', asset);
          unrecognisedAssetResults.push(asset);
        }
      }

      setLsp7Assets(lsp7Results);
      setLsp8Assets(lsp8Results);
      setUnrecognisedAssets(unrecognisedAssetResults);
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

  const emptyAssets = () => {
    return (
      <Flex flexDirection={'column'} alignItems={'center'}>
        <Image
          w="250px"
          p="20px"
          src="/images/empty-grave.png"
          alt="empty-grave"
          borderRadius="10px"
        />
        <Text
          color="white"
          fontWeight={400}
          fontSize="12px"
          fontFamily="Bungee"
          mb="20px"
          textAlign="center"
        >
          Empty
        </Text>
      </Flex>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!graveVault) {
    return <></>;
  }

  return (
    <Box>
      <Flex justifyContent="space-between" flexWrap={'wrap'}>
        <Box minWidth={'500px'}>
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
            : emptyAssets()}
        </Box>
        <Box minWidth={'500px'}>
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
            : emptyAssets()}
        </Box>
        <Box minWidth={'500px'}>
          <Text
            color="white"
            fontWeight={400}
            fontSize="16px"
            fontFamily="Bungee"
            mb="20px"
          >
            Unrecognized LSP Assets
          </Text>
          {unrecognisedAssets.length
            ? unrecognisedAssets.map((asset, index) => (
                <Box key={'unrecognised-' + index}>
                  <UnrecognisedPanel
                    tokenName={asset.name!}
                    tokenAddress={asset.address!}
                    tokenMetadata={asset.metadata!}
                    vaultAddress={graveVault!}
                    tokenAmount={''}
                  />
                </Box>
              ))
            : emptyAssets()}
        </Box>
      </Flex>
    </Box>
  );
}
