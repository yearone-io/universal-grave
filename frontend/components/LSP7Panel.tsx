import { useContext, useState } from 'react';
import {
  Avatar,
  Box,
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
import LSP7DigitalAsset from '@lukso/lsp-smart-contracts/artifacts/LSP7DigitalAsset.json';
import LSP1GraveForwarder from '@/abis/LSP1GraveForwarder.json';
import { formatAddress, getEnoughDecimals, getTokenIconURL, TokenData } from '@/utils/tokenUtils';
import { WalletContext } from '@/components/wallet/WalletContext';
import { LSP4_TOKEN_TYPES } from '@lukso/lsp-smart-contracts';

interface LSP7PanelProps {
  readonly tokenData: TokenData;
  readonly vaultAddress: string;
  readonly vaultOwner: string;
  onReviveSuccess: () => void;
}

const LSP7Panel: React.FC<LSP7PanelProps> = ({
  tokenData,
  vaultAddress,
  vaultOwner,
  onReviveSuccess,
}) => {
  const readableTokenAmount = tokenData?.balance !== undefined && tokenData?.decimals !== undefined
    ? parseFloat(ethers.utils.formatUnits(tokenData?.balance, tokenData?.decimals)).toFixed(
      tokenData.tokenType === LSP4_TOKEN_TYPES.TOKEN ? Number(tokenData?.decimals) : 0
      )
    : '0';

  const roundedTokenAmount =  parseFloat(readableTokenAmount).toFixed(
    getEnoughDecimals(Number(readableTokenAmount))
  );
    
  // Assuming rawTokenAmount is a BigNumber representing the amount in base units
  const rawTokenAmount = tokenData?.balance
  
  const reviveText =
    tokenData.tokenType === LSP4_TOKEN_TYPES.NFT
      ? 'Revive NFT'
      : 'Revive Tokens';
  const walletContext = useContext(WalletContext);
  const {
    account: connectedUPAddress,
    networkConfig,
    provider,
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

  const tokenAddressDisplay = formatAddress(tokenData?.address);
  const toast = useToast();

  const transferTokenToUP = async (tokenAddress: string) => {
    
    if (isProcessing) {
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
        LSP7DigitalAsset.abi,
        signer
      );
      const lsp7 = tokenContract.connect(signer);
      let balanceInBaseUnits = '0'
      if (tokenData && tokenData.decimals !== undefined && rawTokenAmount) {
        balanceInBaseUnits = ethers.utils.formatUnits(rawTokenAmount, tokenData?.decimals);
        console.log('Formatted balance in base unit', balanceInBaseUnits)
      } else {
        console.error("Token decimals are undefined");
      }

      const lsp7Tx = lsp7.interface.encodeFunctionData('transfer', [
        vaultAddress,
        await signer.getAddress(),
        rawTokenAmount,
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

  const getTokenIcon = () => {
    const iconURL = getTokenIconURL(tokenData?.metadata?.LSP4Metadata);
    return !iconURL ? (
      <Box padding={1} fontWeight={'bold'}>
        LSP7
      </Box>
    ) : (
      <Avatar height={16} minW={16} name={tokenData?.name} src={iconURL} />
    );
  };

  return (
    <Flex
      bg={panelBgColor}
      borderRadius="lg"
      px={4}
      py={4}
      align="flex-start"
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
        {getTokenIcon()}
      </Flex>

      <Flex w={'100%'} flexDirection={'column'} padding={2} gap={2}>
        <Flex flexDirection={'row'} justifyContent={'space-between'}>
          <Text color={fontColor} fontFamily={'Bungee'}>
            {tokenData?.name}
          </Text>
          <Text color={fontColor} fontFamily={'Bungee'} px={3}>
            {roundedTokenAmount}
          </Text>
        </Flex>
        {tokenData?.image && (
          <Flex justifyContent={'center'}>
            <Image
              src={tokenData?.image}
              alt={tokenData?.name}
              width="400px"
              border={'1px solid ' + containerBorderColor}
            />
          </Flex>
        )}
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
                window.open(
                  `${networkConfig.explorerURL}/address/${tokenData?.address}`,
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
              onClick={() => transferTokenToUP(tokenData?.address)}
            >
              {isProcessing ? 'Reviving...' : reviveText}
            </Button>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default LSP7Panel;
