import {
  Avatar,
  Box,
  Flex,
  IconButton,
  Text,
} from '@chakra-ui/react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { constants } from '@/app/constants';
import { formatAddress } from '@/utils/tokenUtils';
import { useContext } from 'react';



interface LSPPanelProps {
  tokenName: string;
  tokenAmount: string;
  tokenAddress: string;
  vaultAddress: string;
  tokenMetadata: Record<string, any>; //LSP4Metadata
}

const UnrecognisedPanel: React.FC<LSPPanelProps> = ({
  tokenName,
  tokenAmount,
  tokenAddress,
  tokenMetadata,
}) => {
  const { networkConfig } = walletContext;

  const containerBorderColor = 'var(--chakra-colors-dark-purple-500)';
  const panelBgColor = 'dark.purple.200';

  const interestsBgColor = 'dark.white';

  const fontColor = 'dark.purple.500';

  const tokenAddressDisplay = formatAddress(tokenAddress);

  const getTokenIconUrl = () => {
    let tokenIcon = (
      <Box padding={1} fontWeight={'bold'}>
        ?
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
                window.open(
                  `${networkConfig.explorerURL}/address/${tokenAddress}`,
                  '_blank'
                )
              }
            />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default UnrecognisedPanel;
