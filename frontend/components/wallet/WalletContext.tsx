import React from 'react';

interface WalletContextType {
  account: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isLoadingAccount: boolean;
}

const defaultImplementation: WalletContextType = {
  account: null,
  isLoadingAccount: true,
  connect: async () => {
    // Default connect implementation 
  },
  disconnect: () => {
    // Default disconnect implementation
  },
};

export const WalletContext = React.createContext<WalletContextType>(defaultImplementation);
