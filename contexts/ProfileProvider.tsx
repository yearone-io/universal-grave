'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { SiweMessage } from 'siwe';
import { BrowserProvider, verifyMessage } from 'ethers';
import { getImageFromIPFS } from '@/utils/ipfs';
import { supportedNetworks } from '@/constants/supportedNetworks';
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import { ERC725JSONSchema } from '@erc725/erc725.js';
import { fetchDataSafe, getErc725Read } from '@/utils/erc725Client';
import { getWalletProvider } from '@/utils/walletClient';
import { useParams } from 'next/navigation';
import { getNetworkByName, getNetworkConfig } from '@/constants/supportedNetworks';

interface Profile {
  name: string;
  description: string;
  tags: string[];
  links: Link[];
  profileImage: Image[] | undefined;
  backgroundImage: Image[] | undefined;
  mainImage: string | undefined;
}

interface Link {
  title: string;
  url: string;
}

interface Image {
  width: number;
  height: number;
  hashFunction: string;
  hash: string;
  url: string;
}

interface IProfileDetailsData {
  mainUPController: string;
  upWallet: string;
  profile: Profile | null;
  issuedAssets: string[];
}

interface ProfileContextType {
  issuedAssets: string[];
  setIssuedAssets: React.Dispatch<React.SetStateAction<string[]>>;
  profileDetailsData: IProfileDetailsData | null;
  setProfileDetailsData: React.Dispatch<
    React.SetStateAction<IProfileDetailsData | null>
  >;
  error: string | null;
  isConnected: boolean;
  chainId: number | null;
  expectedChainId: number | null;
  isNetworkMismatch: boolean;
  connectAndSign: () => Promise<boolean>;
  disconnect: (options?: { preserveChainId?: boolean }) => void;
  switchNetwork: (chainId: number) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const networkName = (params?.networkName as string | undefined) || null;
  const [issuedAssets, setIssuedAssets] = useState<string[]>([]);
  const [profileDetailsData, setProfileDetailsData] =
    useState<IProfileDetailsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const providerRef = useRef<BrowserProvider | null>(null);
  const connectingRef = useRef(false);

  const expectedChainId = useMemo(() => {
    if (networkName) {
      const networkInfo = getNetworkByName(networkName);
      return networkInfo?.chainId ?? null;
    }
    // No network route param: stay neutral
    return null;
  }, [networkName]);

  const isNetworkMismatch =
    !!expectedChainId && !!chainId && expectedChainId !== chainId;

  const requestNetworkSwitch = async (newChainId: number) => {
    if (!window.lukso) throw new Error('No wallet provider detected');
    const provider = providerRef.current || getWalletProvider();
    providerRef.current = provider;
    try {
      await provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${newChainId.toString(16)}` },
      ]);
    } catch (error: any) {
      if (error.code === 4902 && supportedNetworks[newChainId]) {
        await provider.send('wallet_addEthereumChain', [
          {
            chainId: `0x${newChainId.toString(16)}`,
            chainName: supportedNetworks[newChainId].displayName,
            rpcUrls: [supportedNetworks[newChainId].rpcUrl],
            nativeCurrency: {
              name: supportedNetworks[newChainId].token,
              symbol: supportedNetworks[newChainId].token,
              decimals: 18,
            },
            blockExplorerUrls: [supportedNetworks[newChainId].explorer],
          },
        ]);
      } else {
        throw error;
      }
    }
    const updatedChainId = Number(await provider.send('eth_chainId', []));
    setChainId(updatedChainId);
  };

  const connectAndSign = async (): Promise<boolean> => {
    if (connectingRef.current) {
      console.log('ProfileProvider: Already connecting, skipping');
      return false;
    }

    try {
      connectingRef.current = true;
      setError(null);
      if (!window.lukso) {
        throw new Error(
          'No wallet provider detected. Please install the UP Browser Extension.'
        );
      }

      console.log('ProfileProvider: Attempting connection');
      const provider = getWalletProvider();
      providerRef.current = provider;
      if (expectedChainId) {
        const currentChainId = Number(await provider.send('eth_chainId', []));
        if (currentChainId !== expectedChainId) {
          await requestNetworkSwitch(expectedChainId);
        }
      }
      const accounts = await provider.send('eth_requestAccounts', []);
      const upWallet = accounts[0];
      const currentChainId = Number(await provider.send('eth_chainId', []));

      const siweMessage = new SiweMessage({
        domain: window.location.host,
        uri: window.location.origin,
        address: upWallet,
        statement:
          'Signing this message will enable GRAVE to read your UP Browser Extension to protect your Universal Profile from spam.',
        version: '1',
        chainId: currentChainId,
        resources: [`${window.location.origin}/terms`],
      }).prepareMessage();

      const signature = await provider.send('personal_sign', [
        siweMessage,
        upWallet,
      ]);
      const mainUPController = verifyMessage(siweMessage, signature);
      const { profile, issuedAssets } = await fetchProfileData(
        upWallet,
        currentChainId,
        true
      );
      const newProfileData: IProfileDetailsData = {
        mainUPController,
        upWallet,
        profile,
        issuedAssets,
      };
      localStorage.setItem(
        'profileDetailsData',
        JSON.stringify(newProfileData)
      );
      setChainId(currentChainId);
      setIsConnected(true);
      setProfileDetailsData(newProfileData);
      connectingRef.current = false;
      return true;
    } catch (error: any) {
      console.error('ProfileProvider: Error', error);
      setIsConnected(false);
      setProfileDetailsData(null);
      setIssuedAssets([]);
      setError(error.message);
      providerRef.current = null;
      connectingRef.current = false;
      throw error;
    }
  };

  const disconnect = (options?: { preserveChainId?: boolean }) => {
    setProfileDetailsData(null);
    setIsConnected(false);
    if (!options?.preserveChainId) {
      setChainId(null);
    }
    setIssuedAssets([]);
    setError(null);
    localStorage.removeItem('profileDetailsData');
    localStorage.removeItem('profileData');
    providerRef.current = null;
    console.log('ProfileProvider: Disconnected');
  };

  const fetchProfileData = async (
    upWallet?: string,
    currentChainId?: number,
    forceFetch: boolean = false
  ) => {
    const walletToFetch = upWallet || profileDetailsData?.upWallet;
    if (
      !walletToFetch ||
      !currentChainId ||
      !providerRef.current ||
      (!isConnected && !forceFetch)
    ) {
      console.log('ProfileProvider: Skipping fetchProfileData, missing data', {
        walletToFetch,
        currentChainId,
        isConnected,
      });
      return { profile: null, issuedAssets: [] };
    }

    const chainIdNum = Number(currentChainId);
    const currentNetwork = supportedNetworks[chainIdNum];
    if (!currentNetwork || currentNetwork.hasUPSupport === false) {
      setError('Network not supported');
      return { profile: null, issuedAssets: [] };
    }

    const erc725js = getErc725Read(
      lsp3ProfileSchema as ERC725JSONSchema[],
      walletToFetch,
      {
        chainId: chainIdNum,
        erc725Options: { ipfsGateway: currentNetwork.ipfsGateway },
      }
    );

    try {
      setError(null);
      console.log('ProfileProvider: Fetching profile for', {
        walletToFetch,
        currentChainId,
      });
      const profileMetaData = await fetchDataSafe(erc725js, 'LSP3Profile');
      const lsp12IssuedAssets = await fetchDataSafe(
        erc725js,
        'LSP12IssuedAssets[]'
      );
      let newProfile: Profile | null = null;
      let newIssuedAssets: string[] = [];

      if (
        profileMetaData?.value &&
        typeof profileMetaData.value === 'object' &&
        'LSP3Profile' in profileMetaData.value
      ) {
        const lsp3Profile = profileMetaData.value.LSP3Profile as Profile;
        const profileImage = lsp3Profile.profileImage || [];
        newProfile = {
          name: lsp3Profile.name || '',
          description: lsp3Profile.description || '',
          tags: lsp3Profile.tags || [],
          links: lsp3Profile.links || [],
          profileImage: profileImage,
          backgroundImage: lsp3Profile.backgroundImage || [],
          mainImage: undefined,
        };

        if (profileImage.length > 0 && profileImage[0]?.url) {
          try {
            const mainImage = await getImageFromIPFS(
              profileImage[0].url,
              chainIdNum
            );
            newProfile.mainImage = mainImage;
          } catch (ipfsError) {
            console.error(
              'ProfileProvider: Failed to fetch mainImage from IPFS:',
              ipfsError
            );
            newProfile.mainImage = undefined;
          }
        } else {
          console.log('ProfileProvider: No valid profile image URL found', {
            profileImage,
          });
        }
      } else {
        console.log('ProfileProvider: No profile data found');
      }

      if (
        lsp12IssuedAssets?.value &&
        Array.isArray(lsp12IssuedAssets.value)
      ) {
        newIssuedAssets = lsp12IssuedAssets.value as string[];
      }

      return { profile: newProfile, issuedAssets: newIssuedAssets };
    } catch (error) {
      console.error('ProfileProvider: Cannot fetch profile data:', error);
      setError('Failed to fetch profile data');
      return { profile: null, issuedAssets: [] };
    }
  };

  const switchNetwork = async (newChainId: number) => {
    try {
      await requestNetworkSwitch(newChainId);
      console.log('ProfileProvider: Switched network', { newChainId });
      await connectAndSign();
    } catch (error: any) {
      console.error('ProfileProvider: Switch network error', error);
      setError(error.message);
    }
  };

  useEffect(() => {
    if (!window.lukso) return;

    const restoreSession = async () => {
      const storedProfileDetails = localStorage.getItem('profileDetailsData');
      if (storedProfileDetails && !isConnected) {
        const parsedProfileDetails: IProfileDetailsData =
          JSON.parse(storedProfileDetails);
        try {
          const provider = getWalletProvider();
          providerRef.current = provider;
          const accounts = await provider.send('eth_accounts', []);
          const currentChainId = Number(
            await provider.send('eth_chainId', [])
          );
          setChainId(currentChainId);

          if (expectedChainId && currentChainId !== expectedChainId) {
            console.log(
              'ProfileProvider: Session not restored due to network mismatch'
            );
            localStorage.removeItem('profileDetailsData');
            return;
          }
          if (
            accounts.length > 0 &&
            accounts.includes(parsedProfileDetails.upWallet)
          ) {
            setProfileDetailsData(parsedProfileDetails);
            setIsConnected(true);
            console.log('ProfileProvider: Restored session', {
              ...parsedProfileDetails,
              chainId: currentChainId,
            });
          } else {
            console.log(
              'ProfileProvider: Session not restored, no active account'
            );
            localStorage.removeItem('profileDetailsData');
          }
        } catch (error) {
          console.error('ProfileProvider: Session restore error', error);
          localStorage.removeItem('profileDetailsData');
          providerRef.current = null;
        }
      }
    };

    restoreSession();

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('ProfileProvider: Accounts changed', {
        accounts,
        currentUpWallet: profileDetailsData?.upWallet,
      });
      if (accounts.length === 0) {
        disconnect();
      } else if (
        !profileDetailsData ||
        accounts[0] !== profileDetailsData.upWallet
      ) {
        setProfileDetailsData(null);
        setIssuedAssets([]);
        connectAndSign();
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = Number(chainIdHex);
      setChainId(newChainId);
      setIssuedAssets([]);
      console.log('ProfileProvider: Chain changed', { newChainId });
      if (expectedChainId && newChainId !== expectedChainId) {
        disconnect({ preserveChainId: true });
        return;
      }
      if (isConnected) {
        connectAndSign();
      }
    };

    window.lukso.on('accountsChanged', handleAccountsChanged);
    window.lukso.on('chainChanged', handleChainChanged);

    return () => {
      window.lukso.removeListener('accountsChanged', handleAccountsChanged);
      window.lukso.removeListener('chainChanged', handleChainChanged);
    };
  }, [isConnected, profileDetailsData?.upWallet, expectedChainId]);

  useEffect(() => {
    if (!window.lukso) return;
    const provider = getWalletProvider();
    provider
      .send('eth_chainId', [])
      .then((chainIdHex: string) => {
        const currentChainId = Number(chainIdHex);
        setChainId(currentChainId);
      })
      .catch(() => {
        // ignore - wallet may be locked or not available yet
      });
  }, [expectedChainId]);

  useEffect(() => {
    if (!expectedChainId || !chainId) return;
    if (expectedChainId !== chainId) {
      if (isConnected) {
        disconnect({ preserveChainId: true });
      }
      setError(
        `Wrong network. Please switch to ${supportedNetworks[expectedChainId]?.displayName || expectedChainId}.`
      );
    }
  }, [expectedChainId, chainId, isConnected]);

  const contextValue = useMemo(
    () => ({
      issuedAssets,
      setIssuedAssets,
      profileDetailsData,
      setProfileDetailsData,
      error,
      isConnected,
      chainId,
      expectedChainId,
      isNetworkMismatch,
      connectAndSign,
      disconnect,
      switchNetwork,
    }),
    [issuedAssets, profileDetailsData, error, isConnected, chainId, expectedChainId, isNetworkMismatch]
  );

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context)
    throw new Error('useProfile must be used within a ProfileProvider');
  return context;
};
