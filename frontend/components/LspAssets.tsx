'use client';
import {useCallback, useContext, useEffect, useState} from 'react';
import {ethers} from "ethers";
import {Box, Flex, Image, Text, useToast} from '@chakra-ui/react';
import {WalletContext} from '@/components/wallet/WalletContext';
import ERC725, {ERC725JSONSchema} from '@erc725/erc725.js';
import LSP3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import LSP8IdentifiableDigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP8IdentifiableDigitalAsset.json';
import {detectLSP, LSPType, TokenInfo} from '@/utils/tokenUtils';
import LSP7Panel from '@/components/LSP7Panel';
import LSP8Panel from "@/components/LSP8Panel";
import {constants} from '@/app/constants';

export default function LSPAssets() {
  const [loading, setLoading] = useState(true);
  const walletContext = useContext(WalletContext);
  const [lsp7Assets, setLsp7VaultAsset] = useState<TokenInfo[] | null>(null);
  const [lsp8Assets, setLsp8VaultAsset] = useState<TokenInfo[] | null>(null);
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
        LSP3ProfileSchema as ERC725JSONSchema[],
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
          const lsp7Results: TokenInfo[] = [];
          for (const assetAddress of receivedAssetsDataKey.value as string[]) {
            await detectLSP(
              assetAddress,
              graveVault as string,
              LSPType.LSP7DigitalAsset
            ).then(tokenInfo => {
              if (tokenInfo) {
                if (tokenInfo.type === LSPType.LSP7DigitalAsset) {
                  lsp7Results.push(tokenInfo);
                }
              }
            });
          }
          setLsp7VaultAsset(lsp7Results);
          const lsp8Results: TokenInfo[] = [];

          for (const assetAddress of receivedAssetsDataKey.value as string[]) {
            //call tokenIdsOf function on assetAddress
              const contract = new ethers.Contract(
                  assetAddress,
                  LSP8IdentifiableDigitalAsset.abi,
                  new ethers.providers.Web3Provider(window.lukso)
              );
            await detectLSP(
                assetAddress,
                graveVault as string,
                LSPType.LSP8IdentifiableDigitalAsset
            ).then(tokenInfo => {
                console.log("ff", tokenInfo);
              if (tokenInfo) {
                if (tokenInfo.type === LSPType.LSP8IdentifiableDigitalAsset) {
                    contract.tokenIdsOf(graveVault).then((tokenIds: string[]) => {
                        tokenIds.forEach((tokenId: string) => {
                            lsp8Results.push(
                                {
                                    ...tokenInfo,
                                    tokenId: tokenId.toString()
                                }
                            );
                        });
                    });
                }
              }
            });
          }
          setLsp8VaultAsset(lsp8Results);
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
    if (window.lukso && account && graveVault && lsp7Assets === null) {
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
        {lsp8Assets && lsp8Assets.length > 0
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
