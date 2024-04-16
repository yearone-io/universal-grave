'use client';
import React from 'react';
import { getNetworkConfig, Network } from '@/constants/networks';
import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers';
import { ethers } from 'ethers';

interface WalletContextType {
  networkConfig: Network;
  provider: JsonRpcProvider | Web3Provider;
  account: string | null;
  graveVault: string | undefined;
  mainUPController: string | undefined;
  URDLsp7: string | null;
  URDLsp8: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  disconnectIfNetworkChanged: () => void;
  setURDLsp7: (urd: string | null) => void;
  setURDLsp8: (urd: string | null) => void;
  addGraveVault: (graveVault: string) => void;
  isLoadingAccount: boolean;
  connectedChainId: number | undefined;
}

const networkConfig = getNetworkConfig(
  process.env.NEXT_PUBLIC_DEFAULT_NETWORK!
);

export const DEFAULT_PROVIDER = new ethers.providers.JsonRpcProvider(
  networkConfig.rpcUrl,
  {
    name: networkConfig.name,
    chainId: networkConfig.chainId,
  }
);

const defaultImplementation: WalletContextType = {
  networkConfig: networkConfig,
  provider: DEFAULT_PROVIDER,
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
  disconnectIfNetworkChanged: () => {
    // Default disconnect implementation
  },
  setURDLsp7: () => {},
  setURDLsp8: () => {},
  addGraveVault: () => {
    // Default addGraveVault implementation
  },
  connectedChainId: undefined,
};

export const WalletContext = React.createContext<WalletContextType>(
  defaultImplementation
);
