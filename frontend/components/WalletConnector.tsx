import React, { useState } from 'react';
import Web3 from 'web3';

declare global {
  interface Window {
    lukso: any;
  }
}

const WalletConnector: React.FC = () => {
  const [account, setAccount] = useState<string | null>(null);

  // Check if the Universal Profile Extension  is installed
  if (!window.lukso) {
    return <div>Please install the Universale Profile Extension to use this app.</div>;
  }

  // Create a Web3 instance
  const web3 = new Web3(window.lukso);

  async function connect() {
    try {
      const accounts = await web3.eth.requestAccounts();
      console.log('Connected with', accounts[0]);
      setAccount(accounts[0]); // Update state with the connected account
    } catch (error) {
      console.error('Connection error', error);
    }
  }

  return (
    <div>
      {account ? (
        <p>Connected with: {account}</p>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
};

export default WalletConnector;
