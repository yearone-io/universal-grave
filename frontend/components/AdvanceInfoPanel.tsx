import React, { useContext } from 'react';
import { Box, Image, Text } from '@chakra-ui/react';
import { WalletContext } from '@/components/wallet/WalletContext';

const AdvanceInfoPanel = () => {
  const walletContext = useContext(WalletContext);
  const { URDLsp7, URDLsp8, networkConfig } = walletContext;
  const logoPath = '/images/logo-full.png';

  return (
    <Box display="flex">
      <Box width='70%'>
        <Text
          fontSize="20px"
          fontWeight="bold"
          fontFamily="Bungee"
          color="dark.purple.400"
        >
          Your UP current configuration
        </Text>
        <Box mt="20px">
          <Text>
            <strong>LSP7</strong> Universal Receiver Delegate
          </Text>
          <a
            href={`${networkConfig.explorerURL}/address/${URDLsp7}`}
            style={{ textDecoration: 'underline' }}
            target="_blank"
          >
            {URDLsp7}
          </a>
        </Box>
        <Box mt="20px">
          <Text>
            <strong>LSP8</strong> Universal Receiver Delegate
          </Text>
          <a
            href={`${networkConfig.explorerURL}/address/${URDLsp8}`}
            style={{ textDecoration: 'underline' }}
            target="_blank"
          >
            {URDLsp8}
          </a>
        </Box>
      </Box>
      <Box width="30%">
        <Image
          src={logoPath}
          alt="Universal-Grave-logo"
          height={'410px'}
          width="266px"
          padding="25px"
        />
      </Box>
    </Box>
  );
};

export default AdvanceInfoPanel;
