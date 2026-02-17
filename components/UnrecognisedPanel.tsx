import { Avatar, Box, Flex, IconButton, Text } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { constants } from '@/app/constants';
import { formatAddress } from '@/utils/tokenUtils';
import { useProfile } from '@/contexts/ProfileProvider';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { getUniversalEverythingUrl } from '@/utils/universalEverything';

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
  const { chainId } = useProfile();
  const networkConfig = chainId ? supportedNetworks[chainId.toString()] : null;

  const containerBorderColor = 'var(--chakra-colors-dark-purple-500)';
  const interestsBgColor = 'dark.white';
  const fontColor = 'whiteAlpha.900';

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
      bg="rgba(255, 255, 255, 0.04)"
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="lg"
      px={4}
      py={4}
      align="center"
      justify="space-between"
      boxShadow="0 12px 30px rgba(0, 0, 0, 0.3)"
      w="100%"
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
            {networkConfig && (
              <IconButton
                aria-label="View on universal.everything"
                icon={<ExternalLinkIcon color={fontColor} />}
                color={fontColor}
                size="sm"
                variant="ghost"
                onClick={() =>
                  window.open(
                    getUniversalEverythingUrl(
                      chainId ?? undefined,
                      'asset',
                      tokenAddress
                    ),
                    '_blank'
                  )
                }
              />
            )}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default UnrecognisedPanel;
