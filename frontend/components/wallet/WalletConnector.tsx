declare global {
  interface Window {
    lukso: any;
  }
}
import React, { useContext } from 'react';
import { WalletContext } from './WalletContext';
import { Box, Button, Flex, Image } from '@chakra-ui/react';

/**
 * The WalletConnector component allows users to connect or disconnect their LUKSO wallets.
 * It utilizes the WalletContext for state management and to access the necessary actions.
 */
const WalletConnector: React.FC = () => {
  const walletContext = useContext(WalletContext);

  // If the context is not available, throw an error. This component must be used within a WalletProvider.
  if (!walletContext) {
    throw new Error('WalletConnector must be used within a WalletProvider.');
  }
  const { account, connect, disconnect, isLoadingAccount } = walletContext;

  const displayTruncatedAddress = (address: string) => {
    return `${address.substring(0, 5)}...${address.substring(
      address.length - 4
    )}`;
  };

  const displayConnectButton = () => {
    if (isLoadingAccount) {
      return <button disabled>Loading...</button>;
    } else if (!account) {
      return (
        <Button onClick={connect} border={'1px solid var(--chakra-colors-dark-purple-500)'}>
          <Flex alignItems="center" justifyContent="space-between">
            <Image src="images/LYX-logo.svg" alt="Sign In" />
            <Box
              ml="10px"
              fontSize="14px"
              lineHeight="14px"
              fontFamily="Bungee"
              fontWeight="400"
              color={"dark.purple.500"}
            >
              Sign In
            </Box>
          </Flex>
        </Button>
      );
    } else {
      return (
        <Button color={"dark.purple.500"} border={'1px solid var(--chakra-colors-dark-purple-500)'} onClick={disconnect}>{displayTruncatedAddress(account)}</Button>
      );
    }
  };

  return <div>{displayConnectButton()}</div>;
};

export default WalletConnector;
