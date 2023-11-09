
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
  const { account, connect, disconnect } = walletContext;


  return (
    <div>
      {account ? (
        <>
          <p>Connected with: {account}</p>
          <button onClick={disconnect}>Disconnect Wallet</button>
        </>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
};

export default WalletConnector;