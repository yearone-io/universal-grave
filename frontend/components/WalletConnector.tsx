import React, { useState, useEffect } from 'react';
import Onboard from '@web3-onboard/core';
import luksoModule from '@lukso/web3-onboard-config';
import injectedModule from '@web3-onboard/injected-wallets';

const WalletConnector = () => {
  const [onboard, setOnboard] = useState(null);
  const [connectedWallets, setConnectedWallets] = useState([]);

  useEffect(() => {
    const initializeOnboard = async () => {
      const lukso = luksoModule();

      const injected = injectedModule({
        custom: [lukso],
        sort: (wallets) => {
          const sorted = wallets.reduce((sorted, wallet) => {
            if (wallet.label === 'Universal Profiles') {
              sorted.unshift(wallet);
            } else {
              sorted.push(wallet);
            }
            return sorted;
          }, []);
          return sorted;
        },
        displayUnavailable: ['Universal Profiles'],
      });

      const chains = [
        {
          id: 1,
          token: 'LYX',
          label: 'LUKSO Mainnet',
          rpcUrl: 'https://rpc.lukso.network',
        },
        {
          id: 22, // L14 Testnet chainId is 22
          token: 'LYXt',
          label: 'LUKSO L14 Testnet',
          rpcUrl: 'https://rpc.l14.lukso.network',
        },
      ];

      const appMetadata = {
        name: 'LUKSO Test dApp',
        icon: '<svg></svg>', // Replace with actual SVG icon
        logo: '<svg></svg>', // Replace with actual SVG icon
        description: 'My test dApp using Web3 Onboard',
        recommendedInjectedWallets: [
          {
            name: 'Universal Profiles',
            url: "https://chrome.google.com/webstore/detail/universal-profiles/abpickdkkbnbcoepogfhkhennhfhehfn?hl=en",
        },
        ],
      };

      const connect = {
        iDontHaveAWalletLink: "https://chrome.google.com/webstore/detail/universal-profiles/abpickdkkbnbcoepogfhkhennhfhehfn?hl=en",
        removeWhereIsMyWalletWarning: true,
      };

      const onboardInstance = Onboard({
        wallets: [injected],
        chains,
        appMetadata,
        connect,
      });

      setOnboard(onboardInstance);
    };

    initializeOnboard();
  }, []);

  const connectWallet = async () => {
    const wallets = await onboard.connectWallet();
    setConnectedWallets(wallets);
    console.log(wallets);
  };

  return (
    <div>
      <button onClick={connectWallet}>Connect Wallet</button>
      {connectedWallets.length > 0 && (
        <div>
          <p>Connected Wallets:</p>
          <ul>
            {connectedWallets.map((wallet, index) => (
              <li key={index}>{wallet.label} - {wallet.accounts[0].address}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WalletConnector;
