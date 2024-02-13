import React, { useContext } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { WalletContext } from '@/components/wallet/WalletContext';

const AdvanceInfoPanel = () => {
  const walletContext = useContext(WalletContext);
  const { URDLsp7, URDLsp8, networkConfig } = walletContext;

  return (
    <Box>
      <Text>LSP7 Universal Receiver Delegate</Text>
      <a
        href={`${networkConfig.explorerURL}/address/${URDLsp7}`}
        style={{ textDecoration: 'underline' }}
        target="_blank"
      >
        {URDLsp7}
      </a>
      <Text>LSP8 Universal Receiver Delegate</Text>
      <a
        href={`${networkConfig.explorerURL}/address/${URDLsp8}`}
        style={{ textDecoration: 'underline' }}
        target="_blank"
      >
        {URDLsp8}
      </a>
    </Box>
  );
};

export default AdvanceInfoPanel;
