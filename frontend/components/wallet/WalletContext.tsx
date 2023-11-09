import React from 'react';

interface WalletContextType {
  account: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const defaultImplementation: WalletContextType = {
  account: null,
  connect: async () => {
    // Default connect implementation (could also throw an error)
  },
  disconnect: () => {
    // Default disconnect implementation (could also throw an error)
  },
};

export const WalletContext = React.createContext<WalletContextType>(defaultImplementation);
