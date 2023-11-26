import React from 'react';

interface WalletContextType {
  account: string | null;
  graveVault: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  addGraveVault: (graveVault: string) => void;
  isLoadingAccount: boolean;
}

const defaultImplementation: WalletContextType = {
  account: null,
  graveVault: null,
  isLoadingAccount: true,
  connect: async () => {
    // Default connect implementation
  },
  disconnect: () => {
    // Default disconnect implementation
  },
  addGraveVault: () => {
    // Default addGraveVault implementation
  },
};

export const WalletContext = React.createContext<WalletContextType>(
  defaultImplementation
);
