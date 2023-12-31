import {
  Box,
  Button,
  Flex,
  IconButton,
  Text,
  useColorModeValue,
  useToast,
  Avatar,
} from '@chakra-ui/react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { ContractInterface, ethers } from 'ethers';
import { constants } from '@/app/constants';
import { lsp1GraveForwader } from '@/abis/lsp1GraveForwader';
import {
  LSP1GraveForwader,
  LSP7Mintable__factory,
  LSP9Vault__factory,
} from '@/contracts';
import { useState } from 'react';

interface LSP7PanelProps {
  tokenName: string;
  tokenAmount: string;
  tokenAddress: string;
  vaultAddress: string;
  tokenMetadata: Record<string, any>; //LSP4Metadata
  onReviveSuccess: () => void;
}

const LSP7Panel: React.FC<LSP7PanelProps> = ({
  tokenName,
  tokenAmount,
  tokenAddress,
  tokenMetadata,
  vaultAddress,
  onReviveSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const explorerURL =
    'https://explorer.execution.testnet.lukso.network/address/';
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
  // Helper function to format the blockchain address
  const formatAddress = (address: string) => {
    return `${address.slice(0, 5)}...${address.slice(-4)}`;
  };

  const tokenAddressDisplay = formatAddress(tokenAddress);
  const toast = useToast();

  const transferTokenToUP = async (tokenAddress: string) => {
    if (isProcessing) {
      return;
    }
    setIsProcessing(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.lukso);
      const signer = provider.getSigner();

      const lsp1GraveForwaderContract = new ethers.Contract(
        constants.UNIVERSAL_GRAVE_FORWARDER,
        lsp1GraveForwader as ContractInterface,
        signer
      ) as LSP1GraveForwader;

      const upAddress = await signer.getAddress();
      if (
        !(await lsp1GraveForwaderContract.tokenAllowlist(
          upAddress,
          tokenAddress
        ))
      ) {
        await lsp1GraveForwaderContract.addTokenToAllowlist(tokenAddress, {
          gasLimit: 400_00,
        });
      }

      const lsp7 = LSP7Mintable__factory.connect(tokenAddress, provider);
      const lsp7Tx = lsp7.interface.encodeFunctionData('transfer', [
        vaultAddress,
        await signer.getAddress(),
        tokenAmount,
        false,
        '0x',
      ]);

      const lsp9 = LSP9Vault__factory.connect(vaultAddress, provider);
      await lsp9
        .connect(signer)
        .execute(0, tokenAddress, 0, lsp7Tx, { gasLimit: 400_00 });

      setIsProcessing(false);
      onReviveSuccess();
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

  const getTokenIconUrl = () => {
    let tokenIcon = (
      <Box padding={1} fontWeight={'bold'}>
        LSP7
      </Box>
    );
    if (tokenMetadata?.LSP4Metadata?.icon?.[0]?.url.startsWith('ipfs://')) {
      const iconURL = `${
        constants.IPFS_GATEWAY
      }${tokenMetadata?.LSP4Metadata?.icon?.[0]?.url.slice(7)}`;
      tokenIcon = (
        <Avatar height={16} minW={16} name={tokenName} src={iconURL} />
      );
    }
    return tokenIcon;
  };

  return (
    <Flex
      bg={panelBgColor}
      borderRadius="lg"
      px={4}
      py={4}
      align="center"
      justify="space-between"
      boxShadow="md"
      minWidth={'lg'}
      mb={2}
    >
      <Flex
        bg={interestsBgColor}
        borderRadius="full"
        color={fontColor}
        border={`1px solid ${containerBorderColor}`}
        fontSize="md"
        height={16}
        minW={16}
        justifyContent={'center'}
        alignItems={'center'}
        boxSizing={'content-box'}
      >
        {getTokenIconUrl()}
      </Flex>

      <Flex w={'100%'} flexDirection={'column'} padding={2} gap={2}>
        <Flex flexDirection={'row'} justifyContent={'space-between'}>
          <Text color={fontColor} fontFamily={'Bungee'}>
            {tokenName}
          </Text>
          <Text color={fontColor} fontFamily={'Bungee'} px={3}>
            {tokenAmount}
          </Text>
        </Flex>
        <Flex
          flexDirection={'row'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Flex align="center">
            <Text fontSize="sm" pr={2} color={fontColor}>
              Address:
            </Text>
            <Text fontSize="sm" fontWeight="bold" pr={1} color={fontColor}>
              {tokenAddressDisplay}
            </Text>
            <IconButton
              aria-label="View on blockchain explorer"
              icon={<FaExternalLinkAlt color={fontColor} />}
              color={fontColor}
              size="sm"
              variant="ghost"
              onClick={() =>
                window.open(`${explorerURL}${tokenAddress}`, '_blank')
              }
            />
          </Flex>
          <Button
            px={3}
            color={createButtonColor}
            bg={createButtonBg}
            _hover={{ bg: createButtonBg }}
            border={createButtonBorder}
            size={'xs'}
            onClick={() => transferTokenToUP(tokenAddress)}
          >
            {isProcessing ? 'Reviving...' : `Revive Tokens`}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default LSP7Panel;
