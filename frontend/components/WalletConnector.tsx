import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

declare global {
  interface Window {
    lukso: any;
  }
}


const WalletConnector: React.FC = () => {
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    // Check if we are in a browser environment and the lukso wallet provider exists
    if (typeof window !== 'undefined' && window.lukso) {
      const storedAccount = localStorage.getItem('connectedAccount');
      if (storedAccount) {
        setAccount(storedAccount);
      }
    }
  }, []);

  const connect = async () => {
    if (typeof window !== 'undefined' && window.lukso) {
      const web3 = new Web3(window.lukso);

      try {
        const accounts = await web3.eth.requestAccounts();
        console.log('Connected with', accounts[0]);
        setAccount(accounts[0]);
        localStorage.setItem('connectedAccount', accounts[0]);
      } catch (error) {
        console.error('Connection error', error);
      }
    } else {
      console.log('Please install the LUKSO Universal Profile Extension to use this app.');
    }
  };

  const disconnect = () => {
    setAccount(null);
    localStorage.removeItem('connectedAccount');
    // Note: If the LUKSO wallet provider has a method for disconnection, call it here.
    // For example: window.lukso.disconnect(); (if this method is available)
    // call any other cleanup methods here
  };

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
