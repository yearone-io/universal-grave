import { useContext, useState } from 'react';
import {
  Button,
  Flex,
  IconButton,
  Image,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { ethers } from 'ethers';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';
import LSP8IdentifiableDigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP8IdentifiableDigitalAsset.json';
import LSP1GraveForwarder from '@/abis/LSP1GraveForwarder.json';
import { formatAddress, TokenData } from '@/utils/tokenUtils';
import { WalletContext } from '@/components/wallet/WalletContext';

interface LSP8PanelProps {
  readonly tokenData: TokenData;
  readonly vaultAddress: string;
  readonly vaultOwner: string;
  onReviveSuccess: (assetAddress: string, tokenId: string) => void;
}

const LSP8Panel: React.FC<LSP8PanelProps> = ({
  tokenData,
  vaultAddress,
  vaultOwner,
  onReviveSuccess,
}) => {
  const walletContext = useContext(WalletContext);
  const {
    account: connectedUPAddress,
    networkConfig,
    provider,
    disconnectIfNetworkChanged,
  } = walletContext;
  const [isProcessing, setIsProcessing] = useState(false);
  const containerBorderColor = useColorModeValue(
    'var(--chakra-colors-light-black)',
    'var(--chakra-colors-dark-purple-500)'
  );
  const panelBgColor = useColorModeValue('light.white', 'dark.purple.200');

  const createButtonBg = useColorModeValue('light.green.brand', 'dark.white');
  const createButtonColor = useColorModeValue(
    'light.black',
    'var(--chakra-colors-dark-purple-500)'
  );
  const createButtonBorder = useColorModeValue(
    '1px solid black',
    '1px solid var(--chakra-colors-dark-purple-500)'
  );
  const interestsBgColor = useColorModeValue('light.white', 'dark.white');

  const fontColor = useColorModeValue('light.black', 'dark.purple.500');

  const tokenAddressDisplay = formatAddress(tokenData.tokenId!);
  const toast = useToast();

  const transferTokenToUP = async (tokenAddress: string) => {
    if (isProcessing || (await disconnectIfNetworkChanged())) {
      return;
    }

    setIsProcessing(true);
    try {
      const signer = provider.getSigner();

      const LSP1GraveForwarderContract = new ethers.Contract(
        networkConfig.universalGraveForwarder,
        LSP1GraveForwarder.abi,
        signer
      );

      const upAddress = await signer.getAddress();
      if (
        !(await LSP1GraveForwarderContract.tokenAllowlist(
          upAddress,
          tokenAddress
        ))
      ) {
        await LSP1GraveForwarderContract.addTokenToAllowlist(tokenAddress, {
          gasLimit: 400_00,
        });
      }

      const tokenContract = new ethers.Contract(
        tokenAddress,
        LSP8IdentifiableDigitalAsset.abi,
        signer
      );
      const lsp8 = tokenContract.connect(signer);
      const lsp8Tx = lsp8.interface.encodeFunctionData('transfer', [
        vaultAddress,
        await signer.getAddress(),
        tokenData.tokenId,
        false,
        '0x',
      ]);

      const vaultContract = new ethers.Contract(
        vaultAddress,
        LSP9Vault.abi,
        signer
      );
      const lsp9 = vaultContract.connect(signer);
      await lsp9
        .connect(signer)
        .execute(0, tokenAddress, 0, lsp8Tx, { gasLimit: 400_00 });

      setIsProcessing(false);
      onReviveSuccess(tokenAddress, tokenData.tokenId as string);
      toast({
        title: `it's alive! ⚡`,
        status: 'success',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
    } catch (error: any) {
      setIsProcessing(false);
      console.error(error);
      toast({
        title: `Error fetching UP data. ${error.message}`,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
    }
  };

  return (
    <Flex w={['s']} flexDirection={'column'} padding={2} gap={2}>
      {tokenData?.image && (
        <Flex justifyContent={'center'}>
          <Image
            src={tokenData?.image}
            alt={tokenData?.name}
            border={'1px solid ' + containerBorderColor}
          />
        </Flex>
      )}
      <Flex
        flexDirection={'row'}
        justifyContent={'space-between'}
        alignItems={'center'}
      >
        {vaultOwner === connectedUPAddress && (
          <Button
            px={3}
            color={createButtonColor}
            bg={createButtonBg}
            _hover={{ bg: createButtonBg }}
            border={createButtonBorder}
            size={'xs'}
            onClick={() => transferTokenToUP(tokenData.address)}
          >
            {isProcessing ? 'Reviving...' : `Revive`}
          </Button>
        )}
        <Flex align="center">
          <Text fontSize="sm" pr={2} color={fontColor}>
            Id:
          </Text>
          <Text fontSize="sm" fontWeight="bold" pr={1} color={fontColor}>
            {tokenAddressDisplay}
          </Text>
          <IconButton
            aria-label="View on universal page"
            icon={<FaExternalLinkAlt color={fontColor} />}
            color={fontColor}
            size="sm"
            variant="ghost"
            onClick={() =>
              window.open(
                `${
                  networkConfig.marketplaceCollectionsURL
                }/${tokenData?.address}/${tokenData.tokenId!}`,
                '_blank'
              )
            }
          />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default LSP8Panel;
