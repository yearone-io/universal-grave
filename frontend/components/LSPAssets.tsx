'use client';
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Box, Flex, Image, Text, useToast } from '@chakra-ui/react';
import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js';
import LSP3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import LSP8IdentifiableDigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP8IdentifiableDigitalAsset.json';
import {
  getLSPAssetBasicInfo,
  getTokenImageURL,
  parseDataURI,
  TokenData,
} from '@/utils/tokenUtils';
import LSP7Panel from '@/components/LSP7Panel';
import LSP8Panel from '@/components/LSP8Panel';
import { constants } from '@/app/constants';
import UnrecognisedPanel from '@/components/UnrecognisedPanel';
import { getLuksoProvider, getProvider } from '@/utils/provider';
import { INTERFACE_IDS, LSP4_TOKEN_TYPES } from '@lukso/lsp-smart-contracts';

export default function LSPAssets({
  graveVault,
}: {
  graveVault: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [lsp7Assets, setLsp7Assets] = useState<TokenData[]>([]);
  const [lsp8Assets, setLsp8Assets] = useState<TokenData[]>([]);
  const [unrecognisedAssets, setUnrecognisedAssets] = useState<TokenData[]>([]);

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
      getLuksoProvider(),
      {
        ipfsGateway: constants.IPFS,
      }
    );

    try {
      const receivedAssetsResults = await erc725js.fetchData(
        'LSP5ReceivedAssets[]'
      );
      const lsp7Results: TokenData[] = [];
      const lsp8Results: TokenData[] = [];
      const unrecognisedAssetResults: TokenData[] = [];
      for (const assetAddress of receivedAssetsResults.value as string[]) {
        const asset = await getLSPAssetBasicInfo(assetAddress, graveVault);
        if (!asset) continue;
        if (asset.tokenType === LSP4_TOKEN_TYPES.NFT) {
          debugger;
          asset.image = getTokenImageURL(asset?.metadata?.LSP4Metadata);
        }
        if (asset.interface === INTERFACE_IDS.LSP7DigitalAsset) {
          debugger;
          lsp7Results.push(asset);
        } else if (
          asset.interface === INTERFACE_IDS.LSP8IdentifiableDigitalAsset
        ) {
          const contract = new ethers.Contract(
            asset.address as string,
            LSP8IdentifiableDigitalAsset.abi,
            getProvider()
          );
          const tokenIds = await contract.tokenIdsOf(graveVault);
          tokenIds.forEach(async (tokenId: string) => {
            // need to fetch token specific data here
            if (asset.tokenType === LSP4_TOKEN_TYPES.COLLECTION) {
              const tokenMetadata = await contract.getDataForTokenId(
                tokenId,
                ERC725.encodeKeyName('LSP4Metadata')
              );
              const decodedMetadata = ERC725.decodeData(
                [{ value: tokenMetadata, keyName: 'LSP4Metadata' }],
                [
                  {
                    name: 'LSP4Metadata',
                    key: '0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e',
                    keyType: 'Singleton',
                    valueType: 'bytes',
                    valueContent: 'VerifiableURI',
                  },
                ]
              );
              if (decodedMetadata[0]?.value?.url) {
                debugger;
                const parsedMetadata = parseDataURI(
                  decodedMetadata[0].value.url
                );
                const image = parsedMetadata
                  ? getTokenImageURL(parsedMetadata.LSP4Metadata)
                  : await contract.getDataForTokenId(
                      tokenId,
                      '0xef285b02a4f711ad84793f73cc8ed6fea8af7013ece8132dacb7b33f6bce93da'
                    );
                asset.image = image;
              }
            }
            lsp8Results.push({
              ...asset,
              tokenId: tokenId.toString(),
            });
          });
        } else {
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
                    tokenData={asset}
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
                    tokenData={asset}
                    vaultAddress={graveVault!}
                    onReviveSuccess={fetchAssets}
                  />
                </Box>
              ))
            : emptyAssets()}
        </Box>
        {unrecognisedAssets.length > 0 && (
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

            {unrecognisedAssets.map((asset, index) => (
              <Box key={'unrecognised-' + index}>
                <UnrecognisedPanel
                  tokenName={asset.name!}
                  tokenAddress={asset.address!}
                  tokenMetadata={asset.metadata!}
                  vaultAddress={graveVault!}
                  tokenAmount={''}
                />
              </Box>
            ))}
          </Box>
        )}
      </Flex>
    </Box>
  );
}
