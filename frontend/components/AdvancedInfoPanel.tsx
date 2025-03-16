import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { formatAddress } from '@/utils/tokenUtils';
import { useConnectedAccount } from '@/contexts/ConnectedAccountProvider';

const AdvancedInfoPanel = () => {
  const { URDLsp7, URDLsp8, appNetworkConfig: networkConfig, graveVault } = useConnectedAccount();
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
          href={`${networkConfig.explorer}/address/${URDLsp7}`}
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
          href={`${networkConfig.explorer}/address/${URDLsp8}`}
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
            href={`${networkConfig.explorer}/address/${graveVault}`}
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
