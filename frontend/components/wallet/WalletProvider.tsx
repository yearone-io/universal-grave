import React, { ReactNode, useEffect, useState } from 'react';
import { SiweMessage } from 'siwe';
import { WalletContext } from './WalletContext';
import Web3 from 'web3';
import { useToast } from '@chakra-ui/react';
import { getGraveVaultFor } from '@/utils/universalProfile';
import { getNetworkConfig } from '@/constants/networks';

// Extends the window object to include `lukso`, which will be used to interact with LUKSO blockchain.
declare global {
  interface Window {
    lukso: any;
  }
}

// Defines the shape of props expected by the WalletProvider component.
interface Props {
  children: ReactNode;
}

/**
 * WalletProvider is a React component that provides wallet state and functionality
 * to its children via React Context API.
 *
 * @param {Props} props - The props for the component.
 * @returns {JSX.Element} - A provider component that passes down wallet context.
 */
export const WalletProvider: React.FC<Props> = ({ children }) => {
  // State to hold the connected account's address.
  const [account, setAccount] = useState<string | null>(null);
  const [mainUPController, setMainUPController] = useState<string>();
  const [graveVault, setGraveVault] = useState<string>();
  const [URDLsp7, setURDLsp7] = useState<string | null>(null);
  const [URDLsp8, setURDLsp8] = useState<string | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState<boolean>(true);
  const [connectedChainId, setConnectedChainId] = useState<
    number | undefined
  >();
  const networkConfig = getNetworkConfig(
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK!
  );
  const toast = useToast();

  // Effect hook to check for an existing connected account in localStorage when the component mounts.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.lukso) {
      // Retrieve the account from localStorage if it exists.
      const storedAccount = localStorage.getItem('connectedAccount');
      if (storedAccount) {
        setAccount(storedAccount);
      }
      setIsLoadingAccount(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.lukso && account) {
      getGraveVaultFor(account, networkConfig.universalGraveForwarder).then(
        graveVault => {
          if (graveVault) {
            setGraveVault(graveVault);
          }
        }
      );
    }
  }, [account]);

  /**
   * Disconnects the wallet, removes the account address from state and localStorage.
   */
  const disconnect = () => {
    // Clear the account address from state.
    setAccount(null);
    // reset the graveVault address
    setGraveVault(undefined);
    // Remove the stored account from localStorage.
    localStorage.removeItem('connectedAccount');
    // If additional logic is needed for disconnecting, it should be added here.
  };

  /**
   * Connects to the wallet and sets the account address in state and localStorage.
   */
  const connect = async () => {
    if (typeof window !== 'undefined' && window.lukso) {
      // Initialize a new Web3 instance using the LUKSO provider.
      const web3 = new Web3(window.lukso);
      setConnectedChainId(Number(await web3.eth.getChainId()));
      let accounts: string[] = [];
      try {
        // Reset the graveVault address when connecting
        setGraveVault(undefined);
        // Request accounts from the wallet.
        accounts = await web3.eth.requestAccounts();
        if (!accounts.length) {
          throw new Error('No user accounts found');
        }
        console.log('Connected with', accounts[0]);
        // Update state and localStorage with the first account address.
        setAccount(accounts[0]);
        // To enable the Sign-In With Ethereum (SIWE) screen, you need to prepare a message with a specific format
        const siweMessage = new SiweMessage({
          domain: window.location.host, // Domain requesting the signing
          address: accounts[0], // Address performing the signing
          statement: 'By logging in you agree to the terms and conditions.', // a human-readable assertion user signs
          uri: window.location.origin, // URI from the resource that is the subject of the signing
          version: '1', // Current version of the SIWE Message
          chainId: getNetworkConfig(process.env.NEXT_PUBLIC_DEFAULT_NETWORK!)
            .chainId, // Chain ID to which the session is bound, 4201 is LUKSO Testnet
          resources: [`${window.location.host}/terms`], // Information the user wishes to have resolved as part of authentication by the relying party
        }).prepareMessage();
        const hashedMessage = web3.eth.accounts.hashMessage(siweMessage);

        // Request the user to sign the login message with his Universal Profile
        // The UP Browser Extension will sign the message with the controller key used by the extension (a smart contract can't sign)
        const signature = await web3.eth.sign(hashedMessage, accounts[0]);
        const signerAddress = web3.eth.accounts.recover(
          hashedMessage,
          signature as string
        );
        setMainUPController(signerAddress);
        console.log('The Main Controller address is:', signerAddress);
        localStorage.setItem('connectedAccount', accounts[0]);
      } catch (error: any) {
        // Log any connection errors.
        if (accounts.length) {
          disconnect();
        }
        const message =
          error && error.error && error.error.message
            ? error.error.message
            : 'An unknown error occurred';
        const toastMessage = `Connection error: ${message}`;
        console.error(toastMessage);
        toast({
          title: toastMessage,
          status: 'error',
          position: 'bottom-left',
          duration: 9000,
          isClosable: true,
        });
      }
    } else {
      // Inform the user if the LUKSO wallet extension is not installed.
      const message =
        'Please install the LUKSO Universal Profile Extension to use this app.';
      console.log(message);
      toast({
        title: `${message}`,
        status: 'info',
        duration: 9000,
        position: 'bottom-left',
        isClosable: true,
      });
    }
  };

  // Function to add the graveVault address to the state.
  // Mainly used when creating a new vault
  const addGraveVault = (graveVault: string) => {
    setGraveVault(graveVault);
  };

  // Render the context provider, passing down the account state and control functions to children.
  return (
    <WalletContext.Provider
      value={{
        account,
        graveVault,
        mainUPController,
        URDLsp8,
        URDLsp7,
        connect,
        disconnect,
        isLoadingAccount,
        setURDLsp7,
        setURDLsp8,
        addGraveVault,
        networkConfig,
        connectedChainId,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
