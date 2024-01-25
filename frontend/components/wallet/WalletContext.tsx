import React from 'react';
import {getNetworkConfig} from "@/constants/networks";

interface WalletContextType {
  networkConfig: any;
  account: string | null;
  graveVault: string | undefined;
  mainUPController: string | undefined;
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
  networkConfig: getNetworkConfig(process.env.NEXT_PUBLIC_DEFAULT_NETWORK!),
  account: null,
  graveVault: undefined,
  mainUPController: undefined,
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
