'use client';
import React, { useEffect, useState, useContext } from 'react';
import { Box, Flex, Image, Text, useToast } from '@chakra-ui/react';
import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js';
import LSP3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import {
  getLSPAssetBasicInfo,
  getTokenImageURL,
  processLSP8Asset,
  GRAVE_ASSET_TYPES,
  TokenData,
} from '@/utils/tokenUtils';
import LSP7Panel from '@/components/LSP7Panel';
import LSP8Panel from '@/components/LSP8Panel';
import { constants } from '@/app/constants';
import { getLuksoProvider } from '@/utils/provider';
import { WalletContext } from '@/components/wallet/WalletContext';
import { LSP4_TOKEN_TYPES } from '@lukso/lsp-smart-contracts';
import UnrecognisedPanel from '@/components/UnrecognisedPanel';

export default function LSPAssets({
  graveVault,
  graveOwner,
}: {
  graveVault: string | null;
  graveOwner: string;
}) {
  const walletContext = useContext(WalletContext);
  const { provider } = walletContext;
  const [loading, setLoading] = useState(true);
  const [lsp7Assets, setLsp7Assets] = useState<TokenData[]>([]);
  const [lsp8Assets, setLsp8Assets] = useState<TokenData[]>([]);
  const [unrecognisedAssets, setUnrecognisedAssets] = useState<TokenData[]>([]);
  const [unrecognisedLsp7Assets, setUnrecognisedLsp7Assets] = useState<
    TokenData[]
  >([]);
  const [unrecognisedLsp8Assets, setUnrecognisedLsp8Assets] = useState<
    TokenData[]
  >([]);

  const toast = useToast();

  /**
   * On revive success, remove the revived asset from the list without fetching the assets again
   */
  const onReviveLSP7Success = (assetAddress: string) => {
    const lsp7AssetsCopy = lsp7Assets.filter(
      asset => asset.address !== assetAddress
    );
    setLsp7Assets(lsp7AssetsCopy);
  };

  const onReviveLSP8Success = (assetAddress: string, tokenId: string) => {
    const lsp8AssetsCopy = lsp8Assets.filter(
      asset => !(asset.address === assetAddress && asset.tokenId === tokenId)
    );
    setLsp8Assets(lsp8AssetsCopy);
  };

  const onReviveUnrecognizedLSP7Success = (assetAddress: string) => {
    const lsp7AssetsCopy = unrecognisedLsp7Assets.filter(
      asset => asset.address !== assetAddress
    );
    setUnrecognisedLsp7Assets(lsp7AssetsCopy);
  };

  const onReviveUnrecognizedLSP8Success = (
    assetAddress: string,
    tokenId: string
  ) => {
    const lsp8AssetsCopy = unrecognisedLsp8Assets.filter(
      asset => !(asset.address === assetAddress && asset.tokenId === tokenId)
    );
    setUnrecognisedLsp8Assets(lsp8AssetsCopy);
  };

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
      const unrecognisedLsp7Results: TokenData[] = [];
      const unrecognisedLsp8Results: TokenData[] = [];
      const unrecognisedAssetResults: TokenData[] = [];
      for (const assetAddress of receivedAssetsResults.value as string[]) {
        // every 4 assets, wait for 1 second
        if (
          (receivedAssetsResults!.value! as string[]).indexOf(assetAddress) %
            4 ===
          0
        ) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        const asset = await getLSPAssetBasicInfo(
          provider,
          assetAddress,
          graveVault
        );
        if (!asset) continue;
        if (asset.tokenType === LSP4_TOKEN_TYPES.NFT) {
          asset.image = getTokenImageURL(asset?.metadata?.LSP4Metadata);
        }
        if (asset.interface === GRAVE_ASSET_TYPES.LSP7DigitalAsset) {
          lsp7Results.push(asset);
        } else if (
          asset.interface === GRAVE_ASSET_TYPES.UnrecognisedLSP7DigitalAsset
        ) {
          unrecognisedLsp7Results.push(asset);
        } else if (
          asset.interface === GRAVE_ASSET_TYPES.LSP8IdentifiableDigitalAsset
        ) {
          const lsp8Tokens = await processLSP8Asset(
            provider,
            asset,
            graveVault
          );
          lsp8Results.push(...lsp8Tokens);
        } else if (
          asset.interface ===
          GRAVE_ASSET_TYPES.UnrecognisedLSP8IdentifiableDigitalAsset
        ) {
          const lsp8Tokens = await processLSP8Asset(
            provider,
            asset,
            graveVault
          );
          unrecognisedLsp8Results.push(...lsp8Tokens);
        } else {
          unrecognisedAssetResults.push(asset);
        }
      }
      setLsp7Assets(lsp7Results);
      setLsp8Assets(lsp8Results);
      setUnrecognisedAssets(unrecognisedAssetResults);
      setUnrecognisedLsp7Assets(unrecognisedLsp7Results);
      setUnrecognisedLsp8Assets(unrecognisedLsp8Results);
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
                    vaultOwner={graveOwner}
                    onReviveSuccess={onReviveLSP7Success}
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
                    vaultOwner={graveOwner}
                    onReviveSuccess={onReviveLSP8Success}
                  />
                </Box>
              ))
            : emptyAssets()}
        </Box>
        {unrecognisedLsp7Assets.length > 0 && (
          <Box minWidth={'500px'}>
            <Text
              color="white"
              fontWeight={400}
              fontSize="16px"
              fontFamily="Bungee"
              mb="20px"
            >
              Unrecognized LSP7 Assets
            </Text>
            {unrecognisedLsp7Assets.map((asset, index) => (
              <Box key={'unrecognised-lsp7-' + index}>
                <LSP7Panel
                  vaultOwner={graveOwner}
                  tokenData={asset}
                  vaultAddress={graveVault!}
                  onReviveSuccess={onReviveUnrecognizedLSP7Success}
                />
              </Box>
            ))}
          </Box>
        )}
        {unrecognisedLsp8Assets.length > 0 && (
          <Box minWidth={'500px'}>
            <Text
              color="white"
              fontWeight={400}
              fontSize="16px"
              fontFamily="Bungee"
              mb="20px"
            >
              Unrecognized LSP8 Assets
            </Text>
            {unrecognisedLsp8Assets.map((asset, index) => (
              <Box key={'unrecognised-lsp8-' + index}>
                <LSP8Panel
                  vaultOwner={graveOwner}
                  tokenData={asset}
                  vaultAddress={graveVault!}
                  onReviveSuccess={onReviveUnrecognizedLSP8Success}
                />
              </Box>
            ))}
          </Box>
        )}
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
