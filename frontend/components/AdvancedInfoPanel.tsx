import React, { useContext } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { WalletContext } from '@/components/wallet/WalletContext';
import { formatAddress } from '@/utils/tokenUtils';

const AdvancedInfoPanel = () => {
  const walletContext = useContext(WalletContext);
  const { URDLsp7, URDLsp8, networkConfig, graveVault } = walletContext;

  return (
    <>
      <Text
        fontSize="20px"
        fontWeight="bold"
        fontFamily="Bungee"
        color="dark.purple.400"
      >
        Your profile's current configuration
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
          {formatAddress(URDLsp7)}
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
          {formatAddress(URDLsp8)}
        </a>
      </Box>
      {graveVault && (
        <Box mt="20px">
          <Text>
            <strong>Vault</strong>
          </Text>
          <a
            href={`${networkConfig.explorerURL}/address/${graveVault}`}
            style={{ textDecoration: 'underline' }}
            target="_blank"
          >
            {formatAddress(graveVault as string)}
          </a>
        </Box>
      )}
    </>
  );
};

export default AdvancedInfoPanel;
