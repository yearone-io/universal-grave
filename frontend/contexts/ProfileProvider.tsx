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
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import { getGraveVaultFor } from '@/utils/universalProfile';

interface Profile {
  name: string;
  description: string;
  tags: string[];
  links: Link[];
  profileImage: Image[] | undefined; // Allow undefined to handle missing data
  backgroundImage: Image[] | undefined; // Allow undefined to handle missing data
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
  profileDetailsData: IProfileDetailsData | null;
  error: string | null;
  isConnected: boolean;
  chainId: number | null;
  URDLsp7: string | null;
  URDLsp8: string | null;
  graveVault: string | undefined;
  connectAndSign: () => Promise<boolean>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  setIssuedAssets: React.Dispatch<React.SetStateAction<string[]>>;
  setProfileDetailsData: React.Dispatch<
    React.SetStateAction<IProfileDetailsData | null>
  >;
  setURDLsp7: (urd: string | null) => void;
  setURDLsp8: (urd: string | null) => void;
  addGraveVault: (graveVault: string) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [issuedAssets, setIssuedAssets] = useState<string[]>([]);
  const [profileDetailsData, setProfileDetailsData] =
    useState<IProfileDetailsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [graveVault, setGraveVault] = useState<string>();
  const [URDLsp7, setURDLsp7] = useState<string | null>(null);
  const [URDLsp8, setURDLsp8] = useState<string | null>(null);
  const providerRef = useRef<BrowserProvider | null>(null);
  const connectingRef = useRef(false);

  const connectAndSign = async (): Promise<boolean> => {
    if (connectingRef.current) {
      console.log('ProfileProvider: Already connecting, skipping');
      return false;
    }

    try {
      connectingRef.current = true;
      if (!window.lukso) {
        throw new Error(
          'No wallet provider detected. Please install the UP Browser Extension.'
        );
      }

      console.log('ProfileProvider: Attempting connection');
      const provider = new BrowserProvider(window.lukso);
      providerRef.current = provider;
      const accounts = await provider.send('eth_requestAccounts', []);
      const upWallet = accounts[0];
      const currentChainId = Number(await provider.send('eth_chainId', []));

      const siweMessage = new SiweMessage({
        domain: window.location.host,
        uri: window.location.origin,
        address: upWallet,
        statement:
          'Signing this message will enable the Universal Assistants Catalog to read your UP Browser Extension to manage Assistant configurations.',
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

  const disconnect = () => {
    setProfileDetailsData(null);
    setIsConnected(false);
    setChainId(null);
    setIssuedAssets([]);
    setError(null);
    setGraveVault(undefined);
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

    const erc725js = new ERC725(
      lsp3ProfileSchema as ERC725JSONSchema[],
      walletToFetch,
      currentNetwork.rpcUrl,
      { ipfsGateway: currentNetwork.ipfsGateway }
    );

    try {
      setError(null);
      console.log('ProfileProvider: Fetching profile for', {
        walletToFetch,
        currentChainId,
      });
      const profileMetaData = await erc725js.fetchData('LSP3Profile');
      const lsp12IssuedAssets = await erc725js.fetchData('LSP12IssuedAssets[]');
      let newProfile: Profile | null = null;
      let newIssuedAssets: string[] = [];

      if (
        profileMetaData.value &&
        typeof profileMetaData.value === 'object' &&
        'LSP3Profile' in profileMetaData.value
      ) {
        const lsp3Profile = profileMetaData.value.LSP3Profile as Profile;
        // Safely handle profileImage, assuming it might be undefined or empty
        const profileImage = lsp3Profile.profileImage || [];
        newProfile = {
          name: lsp3Profile.name || '',
          description: lsp3Profile.description || '',
          tags: lsp3Profile.tags || [],
          links: lsp3Profile.links || [],
          profileImage: profileImage, // Could be empty or undefined, handled later
          backgroundImage: lsp3Profile.backgroundImage || [],
          mainImage: undefined, // Will be updated if profileImage exists
        };

        // Fetch mainImage from IPFS if profileImage exists and has a valid URL
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
            newProfile.mainImage = undefined; // Fallback to undefined if IPFS fetch fails
          }
        } else {
          console.log('ProfileProvider: No valid profile image URL found', {
            profileImage,
          });
        }
      } else {
        console.log('ProfileProvider: No profile data found');
      }

      if (lsp12IssuedAssets.value && Array.isArray(lsp12IssuedAssets.value)) {
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
      if (!window.lukso) throw new Error('No wallet provider detected');
      const provider = providerRef.current || new BrowserProvider(window.lukso);
      providerRef.current = provider;
      await provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${newChainId.toString(16)}` },
      ]);
      setChainId(newChainId);
      console.log('ProfileProvider: Switched network', { newChainId });
      await connectAndSign(); // Re-fetch profile data after switching
    } catch (error: any) {
      console.error('ProfileProvider: Switch network error', error);
      if (
        error.code === 4902 &&
        providerRef.current &&
        supportedNetworks[newChainId]
      ) {
        await providerRef.current.send('wallet_addEthereumChain', [
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
        setChainId(newChainId);
        await connectAndSign();
      } else {
        setError(error.message);
      }
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
          const provider = new BrowserProvider(window.lukso);
          providerRef.current = provider;
          const accounts = await provider.send('eth_accounts', []);
          if (
            accounts.length > 0 &&
            accounts.includes(parsedProfileDetails.upWallet)
          ) {
            setProfileDetailsData(parsedProfileDetails);
            setIsConnected(true);
            const currentChainId = Number(
              await provider.send('eth_chainId', [])
            );
            setChainId(currentChainId);
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
      connectAndSign();
    };

    window.lukso.on('accountsChanged', handleAccountsChanged);
    window.lukso.on('chainChanged', handleChainChanged);

    return () => {
      window.lukso.removeListener('accountsChanged', handleAccountsChanged);
      window.lukso.removeListener('chainChanged', handleChainChanged);
    };
  }, [isConnected, profileDetailsData?.upWallet]);

  useEffect(() => {
    const provider = providerRef.current
    if (typeof window !== 'undefined' && window.lukso && isConnected && chainId && profileDetailsData?.upWallet) {
        getGraveVaultFor(
          provider,
          profileDetailsData?.upWallet,
          supportedNetworks[chainId!].graveAssistant.address
        ).then(graveVault => {
          if (graveVault) {
            setGraveVault(graveVault);
          }
        });
      }
    }, [profileDetailsData]);

  const contextValue = useMemo(
    () => ({
      issuedAssets,
      setIssuedAssets,
      profileDetailsData,
      setProfileDetailsData,
      error,
      isConnected,
      chainId,
      connectAndSign,
      disconnect,
      switchNetwork,
      URDLsp7,
      setURDLsp7,
      URDLsp8,
      setURDLsp8,
      addGraveVault: setGraveVault,
      graveVault
    }),
    [issuedAssets, profileDetailsData, error, isConnected, chainId]
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
