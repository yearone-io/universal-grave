import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { formatAddress } from '@/utils/tokenUtils';
import { useProfile } from '@/contexts/ProfileProvider';
import { useGrave } from '@/contexts/GraveContext';
import { supportedNetworks } from '@/constants/supportedNetworks';

const AdvancedInfoPanel = () => {
  const { chainId } = useProfile();
  const { URDLsp7, URDLsp8, graveVault } = useGrave();
  const networkConfig = chainId ? supportedNetworks[chainId.toString()] : null;

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
      {networkConfig && (
        <>
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
      )}
    </>
  );
};

export default AdvancedInfoPanel;
