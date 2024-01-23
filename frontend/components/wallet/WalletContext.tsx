'use client';
import React from 'react';

interface WalletContextType {
  account: string | null;
  graveVault: string | undefined;
  URDLsp7: string | null;
  URDLsp8: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  setURDLsp7: (urd: string | null) => void;
  setURDLsp8: (urd: string | null) => void;
  addGraveVault: (graveVault: string) => void;
  isLoadingAccount: boolean;
}

const defaultImplementation: WalletContextType = {
  account: null,
  graveVault: undefined,
  URDLsp7: null,
  URDLsp8: null,
  isLoadingAccount: true,
  connect: async () => {
    // Default connect implementation
  },
  disconnect: () => {
    // Default disconnect implementation
  },
  setURDLsp7: () => {},
  setURDLsp8: () => {},
  addGraveVault: () => {
    // Default addGraveVault implementation
  },
};

export const WalletContext = React.createContext<WalletContextType>(
  defaultImplementation
);
