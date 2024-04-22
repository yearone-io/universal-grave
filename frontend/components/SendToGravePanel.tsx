import React, { useContext } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { WalletContext } from '@/components/wallet/WalletContext';
import { formatAddress } from '@/utils/tokenUtils';

const SendToGravePanel = () => {
  const walletContext = useContext(WalletContext);
  const { URDLsp7, networkConfig } = walletContext;

  return (
    <>
      <Text
        fontSize="20px"
        fontWeight="bold"
        fontFamily="Bungee"
        color="dark.purple.400"
      >
       Send Tokens to the Grave
      </Text>
      <Box mt="20px">
        <Text>
          <strong>bla</strong> bla
        </Text>
        <a
          href={`${networkConfig.explorerURL}/address/${URDLsp7}`}
          style={{ textDecoration: 'underline' }}
          target="_blank"
        >
          {formatAddress(URDLsp7)}
        </a>
      </Box>

    </>
  );
};

export default SendToGravePanel;
