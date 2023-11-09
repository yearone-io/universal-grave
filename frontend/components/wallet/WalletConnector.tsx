
declare global {
  interface Window {
    lukso: any;
  }
}
import React, { useContext } from 'react';
import { WalletContext } from './WalletContext';

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
    return `${address.substring(0, 5)}...${address.substring(address.length - 4)}`;
  }

  const displayConnectButton = () => {
    if (isLoadingAccount) {
      return <button disabled>Loading...</button>;
    } else if (!account) {
      return <button onClick={connect}>Connect Wallet</button>;
    } else {
      return <button onClick={disconnect}>{displayTruncatedAddress(account)}</button>;
    }
  }

  return (
    <div>
      {displayConnectButton()}
    </div>
  );
};

export default WalletConnector;