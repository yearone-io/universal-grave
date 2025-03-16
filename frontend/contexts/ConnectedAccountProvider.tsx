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
import { BrowserProvider, JsonRpcProvider, verifyMessage } from 'ethers';
import { getImageFromIPFS } from '@/utils/ipfs';
import { NetworkConfig, supportedNetworks } from '@/constants/supportedNetworks';
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import { getGraveVault } from '@/utils/universalProfile';
import { usePathname } from 'next/navigation';
import { getProvider } from '@/utils/provider';
import { getNetwork } from '@/utils/utils';
import { ERC725 as ERC725ContractType, ERC725__factory } from '@/types';
import { ERC725YDataKeys, LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { customDecodeAddresses, generateExecutiveScreenersKey, generateMappingKey, generateScreenerConfigKey } from '@/utils/configDataKeyValueStore';
import { getMissingPermissions, isUAPURDSet } from '@/utils/urdUtils';
import { DEFAULT_UP_CONTROLLER_PERMISSIONS, UAP_CONTROLLER_PERMISSIONS } from '@/app/constants';

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

interface IUAPConfig {
  hasCorrectPermissions: boolean;
  isUAPSetup: boolean;
  graveVaultAddress: string;
  uapLsp7TypeConfig: string[];
  uapLsp8TypeConfig: string[];
  uapExecutiveConfig: string;
  executiveScreenersLsp7: string[];
  executiveScreenersLsp8: string[];
}

interface IUniversalProfile {
  chainId: number | undefined;
  address: string;
  mainUPController: string;
  profile: Profile | null;
  issuedAssets: string[];
  protocolConfig: IUAPConfig | null;
  profileNetworkConfig: NetworkConfig;
}

interface ProfileContextType {
  appNetworkConfig: NetworkConfig;
  globalProvider: JsonRpcProvider | BrowserProvider;
  universalProfile: IUniversalProfile | null;
  error: string | null;
  isConnected: boolean;
  connectAndSign: () => Promise<boolean>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  addGraveVault: (graveVault: string) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ConnectedAccountProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [universalProfileDetails, setUniversalProfileDetails] = useState<IUniversalProfile | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [URDLsp7, setURDLsp7] = useState<string | null>(null);
  const [URDLsp8, setURDLsp8] = useState<string | null>(null);
  const providerRef = useRef<BrowserProvider | null>(null);
  const connectingRef = useRef(false);
  // fetch and store current network config
  const pathname = usePathname();
  const appChainId = pathname.includes(supportedNetworks['4201'].chainSlug)
    ? 4201
    : supportedNetworks['42'].chainSlug || pathname === '/'
      ? 42
      : 4201;
  if (!appChainId) {
    throw new Error('Network not supported');
  }
  const currentNetwork = getNetwork(appChainId);
  const defaultProvider = new JsonRpcProvider(currentNetwork?.rpcUrl, {
    name: currentNetwork?.name,
    chainId: appChainId,
  }) as (JsonRpcProvider | BrowserProvider);
  const [globalProvider, setGlobalProvider] = useState<JsonRpcProvider | BrowserProvider>(
    defaultProvider
  );

  const connectAndSign = async (): Promise<boolean> => {
    if (connectingRef.current) {
      return false;
    }
    try {
      connectingRef.current = true;
      if (!window.lukso) {
        throw new Error(
          'No wallet provider detected. Please install the UP Browser Extension.'
        );
      }
      const provider = new BrowserProvider(window.lukso);
      providerRef.current = provider;
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];
      const currentChainId = Number(await provider.send('eth_chainId', []));

      const siweMessage = new SiweMessage({
        domain: window.location.host,
        uri: window.location.origin,
        address: address,
        statement:
          'Welcome to the Universal GRAVE! Tired of being spammed by unwanted LSP7 and LSP8 assets. Send theem to the GRAVE! Before you use our service, please make sure you have read and understood our terms of service and conditions and privacy policy. By signing in, you confirm that you have read and agree to these documents and will use the platform in accordance with their provisions. Thank you for using Universal GRAVE, and we hope we solve all your spam problems once and for all.',
        version: '1',
        chainId: currentChainId,
        resources: [
          `${window.location.origin}/terms`,
          `${window.location.origin}/terms#disclaimer`,
          `${window.location.origin}/terms#privacy`,
        ],
      }).prepareMessage();

      const signature = await provider.send('personal_sign', [
        siweMessage,
        address,
      ]);
      const mainUPController = verifyMessage(siweMessage, signature);
      const universalProfile = await fetchProfileData(
        address,
        currentChainId,
        true,
        mainUPController
      );
      localStorage.setItem(
        'universalProfileDetails',
        JSON.stringify(universalProfile)
      );
      setChainId(currentChainId);
      setIsConnected(true);
      setUniversalProfileDetails(universalProfile as IUniversalProfile);
      setError(null);
      connectingRef.current = false;
      return true;
    } catch (error: any) {
      setIsConnected(false);
      setUniversalProfileDetails(null);
      setError(error.message);
      providerRef.current = null;
      connectingRef.current = false;
      throw error;
    }
  };

  const disconnect = () => {
    setUniversalProfileDetails(null);
    setIsConnected(false);
    setChainId(null);
    setError(null);
    localStorage.removeItem('universalProfileDetails');
    providerRef.current = null;
  };

  const fetchProfileData = async (
    address: string,
    currentChainId: number,
    forceFetch: boolean = false,
    mainUPController?: string,
  ): Promise<IUniversalProfile>  => {
    const walletToFetch = address || universalProfileDetails?.address;
    if (
      !walletToFetch ||
      !currentChainId ||
      !providerRef.current ||
      (!isConnected && !forceFetch)
    ) {
      throw new Error('Invalid parameters');
    }

    const chainIdNum = Number(currentChainId);
    const networkConfig = supportedNetworks[chainIdNum];
    if (!networkConfig) {
      throw new Error('Invalid parameters');
    }
    try {
      setError(null);
      const erc725js = new ERC725(
        lsp3ProfileSchema as ERC725JSONSchema[],
        walletToFetch,
        currentNetwork.rpcUrl,
        { ipfsGateway: currentNetwork.ipfsGateway }
      );
      const [profileMetaData, lsp12IssuedAssets] = await erc725js.fetchData(['LSP3Profile', 'LSP12IssuedAssets[]']);
      // LSP3Profile, LSP12IssuedAssets[], mainUPControlller perms, URD value on main, lsp7, lsp8, UAP config, GRAVE configs
      const universalProfileContract: ERC725ContractType = ERC725__factory.connect(
        walletToFetch,
        providerRef.current
      );
      const keys = [
        ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate,
        ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix + LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40),
        ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix + LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40),
        generateMappingKey('UAPTypeConfig', LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification),
        generateMappingKey('UAPTypeConfig', LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification),
        generateMappingKey('UAPExecutiveConfig', networkConfig.graveAssistant.address),
        generateScreenerConfigKey(LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification, networkConfig.graveAssistant.address, networkConfig.screenerAddress),
        generateScreenerConfigKey(LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification, networkConfig.graveAssistant.address, networkConfig.screenerAddress),
        ...(mainUPController ? [ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] + mainUPController?.slice(2)] : []),
      ];
      console.log('ConnectedAccountProvider: Fetching protocol config values', keys);
      const assistantsProtocolConfigValues = await universalProfileContract.getDataBatch(keys);

      let profile: Profile | null = null;
      let newIssuedAssets: string[] = [];

      if (
        profileMetaData.value &&
        typeof profileMetaData.value === 'object' &&
        'LSP3Profile' in profileMetaData.value
      ) {
        const lsp3Profile = profileMetaData.value.LSP3Profile as Profile;
        // Safely handle profileImage, assuming it might be undefined or empty
        const profileImage = lsp3Profile.profileImage || [];
        profile = {
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
            profile.mainImage = mainImage;
          } catch (ipfsError) {
            console.error(
              'ConnectedAccountProvider: Failed to fetch mainImage from IPFS:',
              ipfsError
            );
            profile.mainImage = undefined; // Fallback to undefined if IPFS fetch fails
          }
        } else {
          console.log('ConnectedAccountProvider: No valid profile image URL found', {
            profileImage,
          });
        }
      } else {
        console.log('ConnectedAccountProvider: No profile data found');
      }

      if (lsp12IssuedAssets.value && Array.isArray(lsp12IssuedAssets.value)) {
        newIssuedAssets = lsp12IssuedAssets.value as string[];
      }

      return {
        chainId: chainIdNum,
        address: walletToFetch,
        mainUPController: mainUPController || '',
        profile,
        issuedAssets: newIssuedAssets,
        protocolConfig: {
          hasCorrectPermissions: mainUPController ? getMissingPermissions(erc725js.decodePermissions(assistantsProtocolConfigValues[8]), {
            ...DEFAULT_UP_CONTROLLER_PERMISSIONS,
            ...UAP_CONTROLLER_PERMISSIONS,
          }).length === 0 : false,
          isUAPSetup: isUAPURDSet(networkConfig.assistantsProtocolAddress, assistantsProtocolConfigValues[1], assistantsProtocolConfigValues[2], assistantsProtocolConfigValues[3]),
          graveVaultAddress: "", // to do extract from screener config
          uapLsp7TypeConfig: customDecodeAddresses(assistantsProtocolConfigValues[3]),
          uapLsp8TypeConfig: customDecodeAddresses(assistantsProtocolConfigValues[4]),
          uapExecutiveConfig: assistantsProtocolConfigValues[5],
          executiveScreenersLsp7: [""], //assistantsProtocolConfigValues[6],
          executiveScreenersLsp8: [""] //assistantsProtocolConfigValues[7],
        },
        profileNetworkConfig: networkConfig,
      };
    } catch (error) {
      console.error('ConnectedAccountProvider: Cannot fetch profile data:', error);
      setError('Failed to fetch profile data');
      throw error;
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
      console.log('ConnectedAccountProvider: Switched network', { newChainId });
      await connectAndSign(); // Re-fetch profile data after switching
    } catch (error: any) {
      console.error('ConnectedAccountProvider: Switch network error', error);
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
      const storedUniversalProfile = localStorage.getItem('universalProfileDetails');
      if (storedUniversalProfile && !isConnected) {
        const parsedUniversalProfile: IUniversalProfile =
          JSON.parse(storedUniversalProfile);
        try {
          const provider = new BrowserProvider(window.lukso);
          providerRef.current = provider;
          const accounts = await provider.send('eth_accounts', []);
          if (
            accounts.length > 0 &&
            accounts.includes(parsedUniversalProfile.address)
          ) {
            setUniversalProfileDetails(parsedUniversalProfile);
            setIsConnected(true);
            const currentChainId = Number(
              await provider.send('eth_chainId', [])
            );
            setChainId(currentChainId);
            console.log('ConnectedAccountProvider: Restored session', {
              ...parsedUniversalProfile,
              chainId: currentChainId,
            });
          } else {
            console.log(
              'ConnectedAccountProvider: Session not restored, no active account'
            );
            localStorage.removeItem('universalProfileDetails');
          }
        } catch (error) {
          console.error('ConnectedAccountProvider: Session restore error', error);
          localStorage.removeItem('universalProfileDetails');
          providerRef.current = null;
        }
      }
    };

    restoreSession();

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('ConnectedAccountProvider: Accounts changed', {
        accounts,
        currentUpWallet: universalProfileDetails?.address,
      });
      if (accounts.length === 0) {
        disconnect();
      } else if (
        !universalProfileDetails ||
        accounts[0] !== universalProfileDetails.address
      ) {
        setUniversalProfileDetails(null);
        connectAndSign();
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = Number(chainIdHex);
      setChainId(newChainId);
      console.log('ConnectedAccountProvider: Chain changed', { newChainId });
      connectAndSign();
    };

    window.lukso.on('accountsChanged', handleAccountsChanged);
    window.lukso.on('chainChanged', handleChainChanged);

    return () => {
      window.lukso.removeListener('accountsChanged', handleAccountsChanged);
      window.lukso.removeListener('chainChanged', handleChainChanged);
    };
  }, [isConnected, universalProfileDetails?.address]);

  useEffect(() => {
    if (currentNetwork) {
      const initProvider = getProvider(currentNetwork);
      setGlobalProvider(initProvider);
    }
  }, [currentNetwork, universalProfileDetails]);

  useEffect(() => {
    const provider = providerRef.current
    /*
    if (typeof window !== 'undefined' && window.lukso && isConnected && chainId && universalProfileDetails?.address) {
        getGraveVault(
          provider,
          universalProfileDetails?.address,
          supportedNetworks[chainId!].graveAssistant.address
        ).then(graveVault => {
          if (graveVault) {
            setGraveVault(graveVault);
          }
        });
      }
        */
    }, [universalProfileDetails]);

  function addGraveVault(graveVault: string) {
    setUniversalProfileDetails((prevProfileDetails) => {
      if (!prevProfileDetails) return null;
      return {
        ...prevProfileDetails!,
        graveVaultAddress: graveVault,
      }
    });
  }

  const contextValue = useMemo(
    () => ({
      globalProvider,
      appNetworkConfig: currentNetwork,
      universalProfile: universalProfileDetails,
      error,
      isConnected,
      URDLsp7,
      URDLsp8,
      setUniversalProfileDetails,
      connectAndSign,
      disconnect,
      switchNetwork,
      setURDLsp7,
      setURDLsp8,
      addGraveVault
    }),
    [universalProfileDetails, error, isConnected, chainId]
  );

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useConnectedAccount = () => {
  const context = useContext(ProfileContext);
  if (!context)
    throw new Error('useConnectedAccount must be used within a ConnectedAccountProvider');
  return context;
};
