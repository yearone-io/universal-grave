import SignInButton from '@/components/SignInButton';

declare global {
  interface Window {
    lukso: any;
    ethereum: any;
  }
}
import React, { useContext } from 'react';
import { WalletContext } from './WalletContext';
import { Button } from '@chakra-ui/react';
import { formatAddress } from '@/utils/tokenUtils';

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
  const { account, disconnect, isLoadingAccount } = walletContext;

  const displayConnectButton = () => {
    if (isLoadingAccount) {
      return <button disabled>Loading...</button>;
    } else if (!account) {
      return <SignInButton />;
    } else {
      return (
        <Button
          color={'dark.purple.500'}
          border={'1px solid var(--chakra-colors-dark-purple-500)'}
          onClick={disconnect}
        >
          {formatAddress(account)}
        </Button>
      );
    }
  };

  return <div>{displayConnectButton()}</div>;
};

export default WalletConnector;
