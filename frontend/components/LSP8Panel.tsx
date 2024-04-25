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
import { formatAddress, TokenData } from '@/utils/tokenUtils';
import { WalletContext } from '@/components/wallet/WalletContext';
import { LSP1GraveForwarder__factory } from '@/contracts';

interface LSP8PanelProps {
  readonly tokenData: TokenData;
  readonly vaultAddress: string;
  readonly vaultOwner: string;
  onReviveSuccess: (assetAddress: string, tokenId: string) => void;
  isRevivingAll: boolean;
}

const LSP8Panel: React.FC<LSP8PanelProps> = ({
  tokenData,
  vaultAddress,
  vaultOwner,
  onReviveSuccess,
  isRevivingAll,
}) => {
  const walletContext = useContext(WalletContext);
  const {
    account: connectedUPAddress,
    networkConfig,
    provider,
    disconnectIfNetworkChanged,
  } = walletContext;
  const [inProcessingText, setInProcessingText] = useState<string>();
  const containerBorderColor = useColorModeValue(
    'var(--chakra-colors-light-black)',
    'var(--chakra-colors-dark-purple-500)'
  );

  const createButtonBg = useColorModeValue('light.green.brand', 'dark.white');
  const createButtonColor = useColorModeValue(
    'light.black',
    'var(--chakra-colors-dark-purple-500)'
  );
  const createButtonBorder = useColorModeValue(
    '1px solid black',
    '1px solid var(--chakra-colors-dark-purple-500)'
  );

  const fontColor = useColorModeValue('light.black', 'dark.purple.500');

  const tokenAddressDisplay = formatAddress(tokenData.tokenId!);
  const toast = useToast();

  const transferTokenToUP = async (tokenAddress: string) => {
    if (
      inProcessingText !== undefined ||
      (await disconnectIfNetworkChanged())
    ) {
      return;
    }

    setInProcessingText('Marking safe...');
    try {
      const signer = provider.getSigner();

      const LSP1GraveForwarderContract = LSP1GraveForwarder__factory.connect(
        networkConfig.universalGraveForwarder,
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
      setInProcessingText('Reviving...');

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

      setInProcessingText('Marking unsafe...');
      await LSP1GraveForwarderContract.removeTokenFromAllowlist(tokenAddress, {
        gasLimit: 400_00,
      });

      onReviveSuccess(tokenAddress, tokenData.tokenId as string);

      toast({
        title: `It's alive! 😇 ⚡`,
        status: 'success',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: `Error: ${error.message}`,
        status: 'error',
        position: 'bottom-left',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setInProcessingText(undefined);
    }
  };

  return (
    <Flex
      w={['s']}
      border={'1px solid ' + containerBorderColor}
      flexDirection={'column'}
      gap={2}
      borderBottomRadius={'md'}
    >
      {tokenData?.image && (
        <Flex justifyContent={'center'}>
          <Image
            src={tokenData?.image}
            alt={tokenData?.name}
            border={'1px solid ' + containerBorderColor}
            minW={'250px'}
          />
        </Flex>
      )}
      <Flex
        flexDirection={'row'}
        justifyContent={'space-between'}
        alignItems={'center'}
        padding={2}
      >
        <Flex align="center">
          <Text fontSize="sm" fontWeight="bold" color={fontColor}>
            {`Id: ${tokenAddressDisplay}`}
          </Text>
          <IconButton
            aria-label="View on universal page"
            icon={<FaExternalLinkAlt color={fontColor} />}
            color={fontColor}
            size="sm"
            px={0}
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
        {vaultOwner === connectedUPAddress && (
          <Button
            px={3}
            color={createButtonColor}
            bg={createButtonBg}
            _hover={{ bg: createButtonBg }}
            border={createButtonBorder}
            size={'xs'}
            loadingText={inProcessingText}
            isLoading={inProcessingText !== undefined || isRevivingAll}
            onClick={() => transferTokenToUP(tokenData.address)}
          >
            Revive
          </Button>
        )}
      </Flex>
    </Flex>
  );
};

export default LSP8Panel;
