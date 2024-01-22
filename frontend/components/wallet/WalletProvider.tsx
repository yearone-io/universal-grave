import React, { ReactNode, useEffect, useState } from 'react';
import { WalletContext } from './WalletContext';
import Web3 from 'web3';
import { useToast } from '@chakra-ui/react';
import { constants } from '@/app/constants';
import { getGraveVaultFor } from '@/utils/universalProfile';

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
  const [graveVault, setGraveVault] = useState<string>(constants.ZERO_ADDRESS);
  const [isLoadingAccount, setIsLoadingAccount] = useState<boolean>(true);
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
      getGraveVaultFor(account).then(graveVault => {
        if(graveVault) {
          setGraveVault(graveVault);
        }
      });
    }
  }, [account]);

  /**
   * Connects to the wallet and sets the account address in state and localStorage.
   */
  const connect = async () => {
    if (typeof window !== 'undefined' && window.lukso) {
      // Initialize a new Web3 instance using the LUKSO provider.
      const web3 = new Web3(window.lukso);

      try {
        // Reset the graveVault address when connecting
        setGraveVault(constants.ZERO_ADDRESS);
        // Request accounts from the wallet.
        const accounts = await web3.eth.requestAccounts();
        console.log('Connected with', accounts[0]);
        // Update state and localStorage with the first account address.
        setAccount(accounts[0]);
        localStorage.setItem('connectedAccount', accounts[0]);
      } catch (error: any) {
        // Log any connection errors.
        const message =
          error && error.error && error.error.message
            ? error.error.message
            : 'An unknown error occurred';
        console.log(`Connection error: ${message}`);
        toast({
          title: `Connection error: ${message}`,
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

  /**
   * Disconnects the wallet, removes the account address from state and localStorage.
   */
  const disconnect = () => {
    // Clear the account address from state.
    setAccount(null);
    // reset the graveVault address
    setGraveVault(constants.ZERO_ADDRESS);
    // Remove the stored account from localStorage.
    localStorage.removeItem('connectedAccount');
    // If additional logic is needed for disconnecting, it should be added here.
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
        connect,
        disconnect,
        isLoadingAccount,
        addGraveVault,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
