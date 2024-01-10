import { useCallback, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Box, Flex, Image, Text, useToast } from '@chakra-ui/react';
import { WalletContext } from '@/components/wallet/WalletContext';
import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js';
import LSP3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import LSP8IdentifiableDigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP8IdentifiableDigitalAsset.json';
import { detectLSP, LSPType, TokenInfo } from '@/utils/tokenUtils';
import LSP7Panel from '@/components/LSP7Panel';
import LSP8Panel from '@/components/LSP8Panel';
import { constants } from '@/app/constants';
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import lsp4Schema from '@erc725/erc725.js/schemas/LSP4DigitalAsset.json';
import lsp8Schema from '@erc725/erc725.js/schemas/LSP8IdentifiableDigitalAsset.json';
import lsp9Schema from '@erc725/erc725.js/schemas/LSP9Vault.json';

export default function LSPAssets() {
  const walletContext = useContext(WalletContext);
  const [loading, setLoading] = useState(true);
  const [lsp7Assets, setLsp7Assets] = useState<TokenInfo[]>([]);
  const [lsp8Assets, setLsp8Assets] = useState<TokenInfo[]>([]);
  const toast = useToast();

  if (!walletContext) {
    throw new Error('WalletConnector must be used within a WalletProvider.');
  }

  // ERC725 detection
  const nftData = new ERC725(
    [
      {
        "name": "LSP8TokenIdType",
        "key": "0x715f248956de7ce65e94d9d836bfead479f7e70d69b718d47bfe7b00e05b4fe4",
        "keyType": "Singleton",
        "valueType": "uint256",
        "valueContent": "Number"
      },
      {
        "name": "LSP8TokenMetadataBaseURI",
        "key": "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843",
        "keyType": "Singleton",
        "valueType": "string",
        "valueContent": "URL"
      },
      {
        "name": "LSP8ReferenceContract",
        "key": "0x708e7b881795f2e6b6c2752108c177ec89248458de3bf69d0d43480b3e5034e6",
        "keyType": "Singleton",
        "valueType": "address",
        "valueContent": "Address"
      }
    ] as ERC725JSONSchema[],
    "0xeB8a27dBA6a1b66614DB886A9651e9373E4579D5",
    window.lukso,
    {
      ipfsGateway: constants.IPFS,
    }
  );
  nftData.fetchData([
    "LSP8TokenMetadataBaseURI",
    "LSP8TokenIdType",
    "LSP8ReferenceContract"
  ]).then((res) => {
    console.log("LSP8 data", res)
  }).catch((err) => {console.log(err  as {message: string })});

  const { account, graveVault } = walletContext;

  /**
   * Fetch assets from the grave vault.
   * This function is called when the page loads and when an asset is revived
   */
  const fetchAssets = useCallback(async () => {
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
  }, [graveVault, toast]);

  /**
   * Fetch assets on account change when the page loads, if the criteria is met
   */
  useEffect(() => {
    if (account && graveVault) {
      fetchAssets();
    }
  }, [account, graveVault, fetchAssets]);

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

  console.log("LSP8 assets", lsp8Assets);

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
