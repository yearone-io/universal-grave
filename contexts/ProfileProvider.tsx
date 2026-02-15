'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from 'react';
import { SiweMessage } from 'siwe';
import { BrowserProvider, hexlify, toUtf8Bytes, verifyMessage } from 'ethers';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useWalletClient,
} from 'wagmi';
import { useChainModal, useConnectModal } from '@rainbow-me/rainbowkit';
import { getImageFromIPFS } from '@/utils/ipfs';
import { supportedNetworks } from '@/constants/supportedNetworks';
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import { ERC725JSONSchema } from '@erc725/erc725.js';
import {
  fetchDataSafe,
  getErc725Read,
  getReadProvider,
} from '@/utils/erc725Client';
import { setWalletClient } from '@/utils/walletClient';
import { useParams } from 'next/navigation';
import { getNetworkByName } from '@/constants/supportedNetworks';
import {
  canReadAsUniversalProfile,
  resolveMainControllerForUP,
  resolveUniversalProfileAddress,
} from '@/utils/upAddress';

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
  connectedWalletAddress?: string;
  upWallet: string;
  profile: Profile | null;
  issuedAssets: string[];
}

interface ProfileDebugState {
  connectorId: string | null;
  connectorName: string | null;
  walletConnectConnectorId: string | null;
  walletConnectConnectorName: string | null;
  isWalletConnected: boolean;
  address: string | null;
  walletChainId: number | null;
  walletClientPresent: boolean;
  walletClientChainId: number | null;
  pendingSignature: boolean;
  signingMessage: boolean;
  hasLuksoProvider: boolean;
  isMobileDevice: boolean;
  lastWalletConnectUri: string | null;
  lastWalletConnectUriUpdatedAt: number | null;
  lastUpAppWakeAt: number | null;
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
  hasActiveSignature: boolean;
  isSigningIn: boolean;
  chainId: number | null;
  expectedChainId: number | null;
  isNetworkMismatch: boolean;
  connectAndSign: () => Promise<boolean>;
  disconnect: (options?: { preserveChainId?: boolean }) => void;
  switchNetwork: (chainId: number) => Promise<void>;
  debugState: ProfileDebugState;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const hasLuksoProvider = () =>
  typeof window !== 'undefined' && !!(window as any).lukso;
const isMobileDevice = () =>
  typeof navigator !== 'undefined' &&
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const isLuksoConnector = (
  connectorLike?: { id?: string; name?: string } | null
) => {
  if (!connectorLike) return false;
  return (
    connectorLike.id === 'lukso' ||
    connectorLike.name?.toLowerCase().includes('universal profile') === true
  );
};

const isWalletConnectConnector = (
  connectorLike?: { id?: string; name?: string } | null
) => {
  if (!connectorLike?.id) return false;
  return connectorLike.id.toLowerCase().includes('walletconnect');
};

const UNIVERSAL_PROFILES_NATIVE_BASE =
  'io.universaleverything.universalprofiles://';
const UP_WALLETCONNECT_URI_STORAGE_KEY = 'up:lastWalletConnectUri';
const UNIVERSAL_PROFILES_NATIVE_HOME_LINK = UNIVERSAL_PROFILES_NATIVE_BASE;

const buildUniversalProfilesNativeLink = (wcUri?: string | null) => {
  if (typeof wcUri === 'string' && wcUri.startsWith('wc:')) {
    // LUKSO mobile deep links expect the WalletConnect URI in /wallet-connect/.
    return wcUri.replace(
      /^wc:/,
      `${UNIVERSAL_PROFILES_NATIVE_BASE}wallet-connect/`
    );
  }
  return UNIVERSAL_PROFILES_NATIVE_HOME_LINK;
};

const wait = (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

const isTransientProviderLoadError = (error: any) => {
  const message = error?.message?.toLowerCase?.() || '';
  return (
    message.includes('load failed') ||
    message.includes('failed to fetch') ||
    message.includes('network changed') ||
    error?.code === 'NETWORK_ERROR'
  );
};

const normalizeSignInErrorMessage = (error: any) => {
  const message = error?.message || '';
  if (!message) return 'Failed to connect';
  const normalized = message.toLowerCase();
  if (
    normalized.includes('load failed') ||
    normalized.includes('failed to fetch')
  ) {
    return 'Connection to Universal Profiles app failed. Open the app and complete sign-in, then try again.';
  }
  return message;
};

const isUserRejectedRequestError = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === 4001 ||
    message.includes('user rejected') ||
    message.includes('user denied') ||
    message.includes('request rejected')
  );
};

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const networkName = (params?.networkName as string | undefined) || null;

  const {
    address,
    chainId: walletChainId,
    isConnected: isWalletConnected,
    connector,
  } = useAccount();
  const { data: walletClient } = useWalletClient();
  const walletClientChainId = walletClient?.chain?.id ?? null;
  const walletClientPresent = !!walletClient;
  const { connectAsync, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { openChainModal } = useChainModal();

  const [issuedAssets, setIssuedAssets] = useState<string[]>([]);
  const [profileDetailsData, setProfileDetailsData] =
    useState<IProfileDetailsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasActiveSignature, setHasActiveSignature] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [pendingSignature, setPendingSignature] = useState(false);
  const [signingMessage, setSigningMessage] = useState(false);
  const [lastWalletConnectUriUpdatedAt, setLastWalletConnectUriUpdatedAt] =
    useState<number | null>(null);
  const [lastUpAppWakeAt, setLastUpAppWakeAt] = useState<number | null>(null);

  const providerRef = useRef<BrowserProvider | null>(null);
  const walletClientRef = useRef(walletClient ?? null);
  const signingRef = useRef(false);
  const connectFlowLockRef = useRef(false);
  const preserveChainIdRef = useRef(false);
  const prevChainIdRef = useRef<number | null>(null);
  const sessionRestoreInProgressRef = useRef(false);
  const lastSignedAddressRef = useRef<string | null>(null);
  const lastUpAppWakeAtRef = useRef(0);
  const lastWalletConnectUriRef = useRef<string | null>(null);
  const wakeUpTimeoutRef = useRef<number | null>(null);
  const walletConnectUriListenerRef = useRef<{
    provider: any;
    handler: (uri: unknown) => void;
  } | null>(null);
  const luksoConnector = useMemo(
    () => connectors.find(connectorItem => isLuksoConnector(connectorItem)),
    [connectors]
  );
  const walletConnectConnector = useMemo(() => {
    if (isWalletConnectConnector(connector)) {
      return connector;
    }
    return connectors.find(connectorItem =>
      isWalletConnectConnector(connectorItem)
    );
  }, [connector, connectors]);

  const expectedChainId = useMemo(() => {
    if (networkName) {
      const networkInfo = getNetworkByName(networkName);
      return networkInfo?.chainId ?? null;
    }
    return null;
  }, [networkName]);

  const isNetworkMismatch =
    !!expectedChainId && !!chainId && expectedChainId !== chainId;

  useEffect(() => {
    walletClientRef.current = walletClient ?? null;
    const result = setWalletClient(walletClient ?? null);
    providerRef.current = result?.provider ?? null;
  }, [walletClient]);

  useEffect(() => {
    const inferredChainId = walletChainId ?? walletClientChainId ?? null;
    if (inferredChainId) {
      setChainId(inferredChainId);
    } else if (!isWalletConnected && !preserveChainIdRef.current) {
      setChainId(null);
    }
    preserveChainIdRef.current = false;
  }, [walletChainId, walletClientChainId, isWalletConnected]);

  const safeWagmiDisconnect = useCallback(() => {
    try {
      wagmiDisconnect();
    } catch (disconnectError) {
      console.warn(
        'ProfileProvider: wagmi disconnect failed, continuing with local state reset',
        disconnectError
      );
    }
  }, [wagmiDisconnect]);

  const detachWalletConnectUriListener = useCallback(() => {
    const subscription = walletConnectUriListenerRef.current;
    if (!subscription) return;

    subscription.provider?.off?.('display_uri', subscription.handler);
    subscription.provider?.removeListener?.('display_uri', subscription.handler);
    walletConnectUriListenerRef.current = null;
  }, []);

  const clearProfileState = useCallback(
    (options?: { preserveChainId?: boolean }) => {
      setProfileDetailsData(null);
      setIsConnected(false);
      setHasActiveSignature(false);
      if (!options?.preserveChainId) {
        setChainId(null);
      }
      setIssuedAssets([]);
      setPendingSignature(false);
      setSigningMessage(false);
      setError(null);
      localStorage.removeItem('profileDetailsData');
      localStorage.removeItem('profileData');
      localStorage.removeItem(UP_WALLETCONNECT_URI_STORAGE_KEY);
      providerRef.current = null;
      lastSignedAddressRef.current = null;
      lastWalletConnectUriRef.current = null;
      if (wakeUpTimeoutRef.current !== null) {
        if (typeof window !== 'undefined') {
          window.clearTimeout(wakeUpTimeoutRef.current);
        }
        wakeUpTimeoutRef.current = null;
      }
      detachWalletConnectUriListener();
      setLastWalletConnectUriUpdatedAt(null);
      setLastUpAppWakeAt(null);
      connectFlowLockRef.current = false;
    },
    [detachWalletConnectUriListener]
  );

  const persistWalletConnectUri = useCallback((uri: unknown) => {
    if (typeof uri !== 'string' || !uri.startsWith('wc:')) return;
    lastWalletConnectUriRef.current = uri;
    setLastWalletConnectUriUpdatedAt(Date.now());
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(UP_WALLETCONNECT_URI_STORAGE_KEY, uri);
    } catch {
      // Ignore storage failures (e.g. private mode restrictions).
    }
  }, []);

  const wakeUniversalProfilesAppForUri = useCallback((uri: unknown) => {
    if (typeof uri !== 'string' || !uri.startsWith('wc:')) return;
    lastWalletConnectUriRef.current = uri;
    if (typeof window === 'undefined') return;
    const now = Date.now();
    if (now - lastUpAppWakeAtRef.current < 1200) return;
    lastUpAppWakeAtRef.current = now;
    setLastUpAppWakeAt(now);
    window.location.href = buildUniversalProfilesNativeLink(uri);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(UP_WALLETCONNECT_URI_STORAGE_KEY);
      if (stored && stored.startsWith('wc:')) {
        lastWalletConnectUriRef.current = stored;
      }
    } catch {
      // Ignore storage access failures.
    }
  }, []);

  useEffect(() => {
    if (!walletConnectConnector) {
      detachWalletConnectUriListener();
      return;
    }
    const connectorLike = walletConnectConnector as typeof walletConnectConnector & {
      getProvider?: () => Promise<any>;
    };
    if (typeof connectorLike?.getProvider !== 'function') {
      detachWalletConnectUriListener();
      return;
    }

    let cancelled = false;

    const subscribeWalletConnectUri = async () => {
      try {
        const wcProvider: any = await connectorLike.getProvider?.();
        if (cancelled || !wcProvider) return;

        persistWalletConnectUri(wcProvider?.connector?.uri);

        const handleDisplayUri = (uri: unknown) => {
          persistWalletConnectUri(uri);
          if (isMobileDevice()) {
            wakeUniversalProfilesAppForUri(uri);
          }
        };

        detachWalletConnectUriListener();
        wcProvider.on?.('display_uri', handleDisplayUri);
        walletConnectUriListenerRef.current = {
          provider: wcProvider,
          handler: handleDisplayUri,
        };
      } catch (error) {
        console.debug(
          'ProfileProvider: Unable to subscribe to WalletConnect URI updates',
          error
        );
      }
    };

    subscribeWalletConnectUri();

    return () => {
      cancelled = true;
      detachWalletConnectUriListener();
    };
  }, [
    detachWalletConnectUriListener,
    persistWalletConnectUri,
    wakeUniversalProfilesAppForUri,
    walletConnectConnector,
  ]);

  const wakeUniversalProfilesApp = useCallback(
    (options?: { useWalletConnectUri?: boolean }) => {
      if (typeof window === 'undefined') return;
      const now = Date.now();
      if (now - lastUpAppWakeAtRef.current < 1200) return;
      lastUpAppWakeAtRef.current = now;
      setLastUpAppWakeAt(now);

      const deepLink = options?.useWalletConnectUri
        ? buildUniversalProfilesNativeLink(lastWalletConnectUriRef.current)
        : UNIVERSAL_PROFILES_NATIVE_HOME_LINK;
      // Explicitly foreground UP app for WalletConnect actions on mobile.
      window.location.href = deepLink;
    },
    []
  );

  const wakeUniversalProfilesAppForWalletConnectUri = useCallback(() => {
    if (typeof window === 'undefined') return;
    const walletConnectUri = lastWalletConnectUriRef.current;
    if (!walletConnectUri) return;
    wakeUniversalProfilesApp({ useWalletConnectUri: true });
  }, [wakeUniversalProfilesApp]);

  const syncWalletConnectUriFromProvider = useCallback(async () => {
    if (!walletConnectConnector) return;
    const connectorLike = walletConnectConnector as typeof walletConnectConnector & {
      getProvider?: () => Promise<any>;
    };
    if (typeof connectorLike?.getProvider !== 'function') return;
    try {
      const wcProvider: any = await connectorLike.getProvider?.();
      persistWalletConnectUri(wcProvider?.connector?.uri);
    } catch (error) {
      console.debug(
        'ProfileProvider: Unable to read WalletConnect URI from provider',
        error
      );
    }
  }, [persistWalletConnectUri, walletConnectConnector]);

  useEffect(() => {
    return () => {
      if (wakeUpTimeoutRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(wakeUpTimeoutRef.current);
        wakeUpTimeoutRef.current = null;
      }
      detachWalletConnectUriListener();
    };
  }, [detachWalletConnectUriListener]);

  const fetchProfileData = useCallback(
    async (upWallet: string, currentChainId: number) => {
      if (!upWallet || !currentChainId || !providerRef.current) {
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
        upWallet,
        {
          chainId: chainIdNum,
          erc725Options: { ipfsGateway: currentNetwork.ipfsGateway },
        }
      );

      try {
        setError(null);
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
          }
        }

        if (lsp12IssuedAssets?.value && Array.isArray(lsp12IssuedAssets.value)) {
          newIssuedAssets = lsp12IssuedAssets.value as string[];
        }

        return { profile: newProfile, issuedAssets: newIssuedAssets };
      } catch (fetchError) {
        console.error('ProfileProvider: Cannot fetch profile data:', fetchError);
        setError('Failed to fetch profile data');
        return { profile: null, issuedAssets: [] };
      }
    },
    []
  );

  const signIn = useCallback(async () => {
    if (signingRef.current) return false;
    const activeWalletClient = walletClientRef.current;
    const activeChainId =
      chainId ?? activeWalletClient?.chain?.id ?? walletChainId ?? null;
    if (!activeWalletClient || !address || !activeChainId) {
      throw new Error('Wallet not ready');
    }
    if (!isMobileDevice() && !isLuksoConnector(connector)) {
      throw new Error(
        'Universal Profile Extension connector is required on desktop.'
      );
    }
    if (expectedChainId && expectedChainId !== activeChainId) {
      throw new Error('Wrong network');
    }
    if (!providerRef.current) {
      const result = setWalletClient(activeWalletClient);
      providerRef.current = result?.provider ?? null;
    }
    if (!providerRef.current) {
      throw new Error('Wallet provider not ready');
    }

    try {
      signingRef.current = true;
      setSigningMessage(true);
      setError(null);

      let resolvedAddress = await resolveUniversalProfileAddress(
        providerRef.current,
        address
      ).catch(() => ({
        upAddress: address,
        source: 'unknown' as const,
      }));
      if (resolvedAddress.source === 'unknown') {
        const network = supportedNetworks[activeChainId];
        if (network) {
          resolvedAddress = await resolveUniversalProfileAddress(
            getReadProvider(activeChainId, network.rpcUrl),
            address
          );
        }
      }
      if (resolvedAddress.source === 'unknown') {
        throw new Error(
          'Connected address is not a Universal Profile account. Connect with UP Extension (desktop) or Universal Profiles app (mobile).'
        );
      }
      const resolvedUpAddress = resolvedAddress.upAddress;

      const siweMessage = new SiweMessage({
        domain: window.location.host,
        uri: window.location.origin,
        address: resolvedUpAddress,
        statement:
          'Signing this message will enable GRAVE to read your UP wallet to protect your Universal Profile from spam.',
        version: '1',
        chainId: activeChainId,
        resources: [`${window.location.origin}/terms`],
      }).prepareMessage();

      const shouldWakeExternalWalletApp =
        isMobileDevice() &&
        (!hasLuksoProvider() || isWalletConnectConnector(connector));

      const signViaPersonalSign = async () => {
        if (!providerRef.current) {
          throw new Error('Wallet provider not ready');
        }
        const signerAccount = activeWalletClient.account.address;
        const siweHex = hexlify(toUtf8Bytes(siweMessage));
        const personalSignParamVariants: Array<[string, string]> = [
          [siweHex, signerAccount],
          [signerAccount, siweHex],
          [siweMessage, signerAccount],
          [signerAccount, siweMessage],
        ];

        let lastPersonalSignError: unknown = null;
        for (const params of personalSignParamVariants) {
          try {
            return (await activeWalletClient.request({
              method: 'personal_sign',
              params: params as any,
            })) as string;
          } catch (walletClientRequestError) {
            lastPersonalSignError = walletClientRequestError;
          }
          try {
            return (await providerRef.current.send(
              'personal_sign',
              params
            )) as string;
          } catch (providerSendError) {
            lastPersonalSignError = providerSendError;
          }
        }
        throw lastPersonalSignError || new Error('Failed to sign message');
      };

      const signViaWalletClient = () =>
        activeWalletClient.signMessage({
          account: activeWalletClient.account,
          message: siweMessage,
        });

      const wakeExternalWalletApp = async () => {
        if (!shouldWakeExternalWalletApp) return;
        await syncWalletConnectUriFromProvider();
        if (wakeUpTimeoutRef.current !== null) {
          window.clearTimeout(wakeUpTimeoutRef.current);
        }
        wakeUpTimeoutRef.current = window.setTimeout(() => {
          wakeUpTimeoutRef.current = null;
          // For message signing, foreground the UP app without replaying the
          // pairing URI route to avoid creating extra WalletConnect sessions.
          wakeUniversalProfilesApp({ useWalletConnectUri: false });
        }, 120);
      };

      let signature: string | null = null;
      let lastSignError: unknown = null;

      try {
        const signMessagePromise = signViaWalletClient();
        await wakeExternalWalletApp();
        signature = await signMessagePromise;
      } catch (signError) {
        lastSignError = signError;
        if (isUserRejectedRequestError(signError)) {
          throw signError;
        }

        if (isTransientProviderLoadError(signError)) {
          await wait(700);
          try {
            const retryPromise = signViaWalletClient();
            await wakeExternalWalletApp();
            signature = await retryPromise;
            lastSignError = null;
          } catch (retrySignError) {
            lastSignError = retrySignError;
            if (isUserRejectedRequestError(retrySignError)) {
              throw retrySignError;
            }
          }
        }
      }

      if (!signature) {
        if (lastSignError && !isTransientProviderLoadError(lastSignError)) {
          console.debug(
            'ProfileProvider: signMessage failed, falling back to personal_sign',
            lastSignError
          );
        }
        signature = await signViaPersonalSign();
      }

      const recoveredController = verifyMessage(siweMessage, signature);
      let mainUPController: string;
      try {
        mainUPController = await resolveMainControllerForUP(
          providerRef.current,
          resolvedUpAddress,
          recoveredController,
          address
        );
      } catch (controllerError) {
        const network = supportedNetworks[activeChainId];
        if (!network || !isTransientProviderLoadError(controllerError)) {
          throw controllerError;
        }
        mainUPController = await resolveMainControllerForUP(
          getReadProvider(activeChainId, network.rpcUrl),
          resolvedUpAddress,
          recoveredController,
          address
        );
      }
      const { profile, issuedAssets: fetchedIssuedAssets } =
        await fetchProfileData(resolvedUpAddress, activeChainId);

      const newProfileData: IProfileDetailsData = {
        mainUPController,
        connectedWalletAddress: address,
        upWallet: resolvedUpAddress,
        profile,
        issuedAssets: fetchedIssuedAssets,
      };
      localStorage.setItem('profileDetailsData', JSON.stringify(newProfileData));
      lastSignedAddressRef.current = address.toLowerCase();
      setChainId(activeChainId);
      setIsConnected(true);
      setHasActiveSignature(true);
      setIssuedAssets(fetchedIssuedAssets || []);
      setProfileDetailsData(newProfileData);
      return true;
    } catch (signError: any) {
      console.error('ProfileProvider: Error', signError);
      const normalizedMessage = normalizeSignInErrorMessage(signError);
      setIsConnected(false);
      setProfileDetailsData(null);
      setIssuedAssets([]);
      setHasActiveSignature(false);
      setError(normalizedMessage);
      throw new Error(normalizedMessage);
    } finally {
      signingRef.current = false;
      setSigningMessage(false);
    }
  }, [
    address,
    chainId,
    connector,
    expectedChainId,
    fetchProfileData,
    wakeUniversalProfilesApp,
    syncWalletConnectUriFromProvider,
    walletChainId,
  ]);

  const connectWithMobileWallet = useCallback(
    async (targetChainId?: number) => {
      if (walletConnectConnector) {
        setPendingSignature(true);
        if (openConnectModal && !targetChainId) {
          // Prefer RainbowKit modal flow on mobile; this is more stable for
          // account selection and avoids creating duplicate sessions.
          openConnectModal();
          return;
        }
        await connectAsync({
          connector: walletConnectConnector,
          ...(targetChainId ? { chainId: targetChainId } : {}),
        });
        await syncWalletConnectUriFromProvider();
        wakeUniversalProfilesAppForWalletConnectUri();
        return;
      }

      if (openConnectModal) {
        setPendingSignature(true);
        openConnectModal();
        return;
      }

      throw new Error('Universal Profiles mobile connector unavailable.');
    },
    [
      connectAsync,
      openConnectModal,
      syncWalletConnectUriFromProvider,
      walletConnectConnector,
      wakeUniversalProfilesAppForWalletConnectUri,
    ]
  );

  const switchNetwork = useCallback(
    async (newChainId: number) => {
      try {
        setError(null);
        if (pendingSignature || signingRef.current || signingMessage) {
          return;
        }
        const onMobile = isMobileDevice();
        const onDesktop = !onMobile;
        if (onDesktop) {
          if (!luksoConnector) {
            throw new Error('Universal Profile connector unavailable.');
          }
          if (!isWalletConnected || !isLuksoConnector(connector)) {
            if (isWalletConnected) {
              safeWagmiDisconnect();
            }
            try {
              await connectAsync({ connector: luksoConnector, chainId: newChainId });
            } catch (connectError: any) {
              const connectErrorMessage = String(
                connectError?.message || ''
              ).toLowerCase();
              if (
                !hasLuksoProvider() ||
                connectErrorMessage.includes('provider') ||
                connectErrorMessage.includes('connector')
              ) {
                throw new Error(
                  'Universal Profile Extension is not available. Unlock/enable it in your browser and try again.'
                );
              }
              throw connectError;
            }
            setPendingSignature(true);
            return;
          }
        } else if (!isWalletConnected) {
          await connectWithMobileWallet(newChainId);
          return;
        }
        await switchChainAsync({ chainId: newChainId });
        setPendingSignature(true);
      } catch (switchError) {
        setPendingSignature(false);
        if (openChainModal) {
          openChainModal();
          return;
        }
        throw switchError;
      }
    },
    [
      connectAsync,
      connector,
      connectWithMobileWallet,
      isWalletConnected,
      luksoConnector,
      openChainModal,
      safeWagmiDisconnect,
      pendingSignature,
      signingMessage,
      switchChainAsync,
    ]
  );

  const connectAndSign = useCallback(async (): Promise<boolean> => {
    setError(null);
    if (
      connectFlowLockRef.current ||
      pendingSignature ||
      signingRef.current ||
      signingMessage
    ) {
      return false;
    }
    connectFlowLockRef.current = true;

    try {
      const onMobile = isMobileDevice();
      const onDesktop = !onMobile;
      if (onDesktop) {
        if (!luksoConnector) {
          throw new Error('Universal Profile connector unavailable.');
        }
        if (!isWalletConnected || !isLuksoConnector(connector)) {
          if (isWalletConnected) {
            safeWagmiDisconnect();
          }
          try {
            await connectAsync({ connector: luksoConnector });
          } catch (connectError: any) {
            const connectErrorMessage = String(
              connectError?.message || ''
            ).toLowerCase();
            if (
              !hasLuksoProvider() ||
              connectErrorMessage.includes('provider') ||
              connectErrorMessage.includes('connector')
            ) {
              throw new Error(
                'Universal Profile Extension is not available. Unlock/enable it in your browser and try again.'
              );
            }
            throw connectError;
          }
          setPendingSignature(true);
          return false;
        }
      } else if (!isWalletConnected) {
        if (onMobile) {
          try {
            await connectWithMobileWallet(expectedChainId ?? undefined);
            return false;
          } catch (connectError) {
            setPendingSignature(false);
            throw connectError;
          }
        }
        throw new Error(
          'Universal Profile Extension (desktop) or Universal Profiles app (mobile) required.'
        );
      }

      const activeChainId =
        chainId ?? walletClientChainId ?? walletChainId ?? null;
      if (expectedChainId && activeChainId && expectedChainId !== activeChainId) {
        await switchNetwork(expectedChainId);
        return false;
      }

      setPendingSignature(true);
      return false;
    } finally {
      connectFlowLockRef.current = false;
    }
  }, [
    connector,
    connectWithMobileWallet,
    luksoConnector,
    isWalletConnected,
    expectedChainId,
    chainId,
    walletClientChainId,
    walletChainId,
    pendingSignature,
    signingMessage,
    safeWagmiDisconnect,
    switchNetwork,
  ]);

  const disconnect = useCallback(
    (options?: { preserveChainId?: boolean }) => {
      if (options?.preserveChainId) {
        preserveChainIdRef.current = true;
        clearProfileState(options);
        return;
      }
      clearProfileState(options);
      safeWagmiDisconnect();
    },
    [clearProfileState, safeWagmiDisconnect]
  );

  useEffect(() => {
    if (
      isWalletConnected &&
      !isMobileDevice() &&
      connector?.id &&
      !isLuksoConnector(connector)
    ) {
      safeWagmiDisconnect();
      setError(
        'Disconnected non-UP wallet. Sign in again with Universal Profile Extension.'
      );
    }
  }, [connector, isWalletConnected, safeWagmiDisconnect]);

  useEffect(() => {
    if (!pendingSignature) return;
    if (isWalletConnected || signingRef.current || signingMessage) return;
    if (typeof window === 'undefined') return;

    // Avoid indefinite loading when connect modal is dismissed/cancelled on mobile.
    const timeoutId = window.setTimeout(() => {
      if (!signingRef.current) {
        setPendingSignature(false);
      }
    }, 30_000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isWalletConnected, pendingSignature, signingMessage]);

  useEffect(() => {
    if (!pendingSignature) return;
    if (!isWalletConnected) return;
    if (signingRef.current || signingMessage) return;
    if (typeof window === 'undefined') return;

    const activeChainId =
      chainId ?? walletClientChainId ?? walletChainId ?? null;
    const missingWalletState = !walletClientPresent || !address || !activeChainId;
    if (!missingWalletState) return;

    // Avoid hanging spinner when wallet reports connected but client/account
    // payload never arrives (common on interrupted mobile app handoffs).
    const timeoutId = window.setTimeout(() => {
      if (!signingRef.current) {
        setPendingSignature(false);
        setError(
          'Wallet session did not finish loading. Reopen Universal Profiles app and try Sign In again.'
        );
      }
    }, 12_000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    address,
    chainId,
    isWalletConnected,
    pendingSignature,
    signingMessage,
    walletClientPresent,
    walletClientChainId,
    walletChainId,
  ]);

  useEffect(() => {
    if (!pendingSignature) return;
    const activeChainId =
      chainId ?? walletClientChainId ?? walletChainId ?? null;
    if (!isWalletConnected || !walletClientPresent || !address || !activeChainId) return;
    if (signingRef.current) return;
    if (expectedChainId && expectedChainId !== activeChainId) return;
    if (!isMobileDevice() && !isLuksoConnector(connector)) {
      return;
    }

    signIn()
      .catch(() => {
        // error handled in signIn
      })
      .finally(() => {
        setPendingSignature(false);
      });
  }, [
    pendingSignature,
    isWalletConnected,
    walletClientPresent,
    walletClientChainId,
    address,
    chainId,
    connector,
    expectedChainId,
    signIn,
    walletChainId,
  ]);

  useEffect(() => {
    if (!isWalletConnected || !address) {
      if (isConnected) {
        clearProfileState();
      }
      sessionRestoreInProgressRef.current = false;
      return;
    }

    const storedProfileDetails = localStorage.getItem('profileDetailsData');
    if (!storedProfileDetails || isConnected) return;
    // Prevent concurrent session restore attempts
    if (sessionRestoreInProgressRef.current || signingRef.current || pendingSignature) return;

    let cancelled = false;
    sessionRestoreInProgressRef.current = true;
    const restoreSession = async () => {
      try {
        const parsedProfileDetails: IProfileDetailsData =
          JSON.parse(storedProfileDetails);
        const currentAddress = address.toLowerCase();
        const storedUPAddress =
          parsedProfileDetails?.upWallet?.toLowerCase() || null;
        const storedConnectedAddress =
          parsedProfileDetails?.connectedWalletAddress?.toLowerCase() || null;

        let shouldRestore =
          storedConnectedAddress === currentAddress ||
          storedUPAddress === currentAddress;
        let connectedWalletAddress =
          parsedProfileDetails.connectedWalletAddress || null;
        let restoredUPAddress = parsedProfileDetails.upWallet;

        const resolveProvider =
          providerRef.current ||
          (chainId && supportedNetworks[chainId]
            ? getReadProvider(chainId, supportedNetworks[chainId].rpcUrl)
            : null);

        if (resolveProvider) {
          const storedLooksLikeUP = storedUPAddress
            ? await canReadAsUniversalProfile(resolveProvider, storedUPAddress)
            : false;

          if (!storedLooksLikeUP) {
            const resolved = await resolveUniversalProfileAddress(
              resolveProvider,
              address
            );
            if (resolved.source !== 'unknown') {
              restoredUPAddress = resolved.upAddress;
              shouldRestore = true;
              connectedWalletAddress = address;
            } else {
              shouldRestore = false;
            }
          } else if (!shouldRestore) {
            const resolved = await resolveUniversalProfileAddress(
              resolveProvider,
              address
            );
            if (resolved.upAddress.toLowerCase() === storedUPAddress) {
              shouldRestore = true;
              connectedWalletAddress = address;
            }
          }
        }

        if (!shouldRestore) {
          localStorage.removeItem('profileDetailsData');
          return;
        }

        if (expectedChainId) {
          if (!chainId) {
            return;
          }
          if (chainId !== expectedChainId) {
            localStorage.removeItem('profileDetailsData');
            return;
          }
        }

        if (cancelled) return;

        const restoredProfileDetails: IProfileDetailsData = {
          ...parsedProfileDetails,
          upWallet: restoredUPAddress,
          connectedWalletAddress: connectedWalletAddress || address,
        };
        if (
          restoredProfileDetails.connectedWalletAddress !==
          parsedProfileDetails.connectedWalletAddress
        ) {
          localStorage.setItem(
            'profileDetailsData',
            JSON.stringify(restoredProfileDetails)
          );
        }

        lastSignedAddressRef.current = address.toLowerCase();
        setProfileDetailsData(restoredProfileDetails);
        setIsConnected(true);
        setIssuedAssets(restoredProfileDetails.issuedAssets || []);
        setHasActiveSignature(!!restoredProfileDetails.mainUPController);
      } catch (restoreError) {
        console.error('ProfileProvider: Session restore error', restoreError);
        localStorage.removeItem('profileDetailsData');
      } finally {
        sessionRestoreInProgressRef.current = false;
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
      sessionRestoreInProgressRef.current = false;
    };
  }, [
    address,
    chainId,
    clearProfileState,
    expectedChainId,
    isConnected,
    isWalletConnected,
    pendingSignature,
  ]);

  useEffect(() => {
    if (!isWalletConnected || !address) return;
    // Don't trigger re-sign while a sign-in is already in progress
    if (signingRef.current || pendingSignature) return;

    const currentAddress = address.toLowerCase();

    // If we just signed with this address, don't trigger another sign-in
    // This prevents race conditions where profileDetailsData hasn't updated yet
    if (lastSignedAddressRef.current === currentAddress) return;

    const matchesConnectedWalletAddress =
      profileDetailsData?.connectedWalletAddress?.toLowerCase() ===
      currentAddress;
    const matchesUPWallet =
      profileDetailsData?.upWallet?.toLowerCase() === currentAddress;

    if (
      profileDetailsData?.upWallet &&
      !matchesConnectedWalletAddress &&
      !matchesUPWallet
    ) {
      clearProfileState({ preserveChainId: true });
      setHasActiveSignature(false);
      setPendingSignature(true);
    }
  }, [
    address,
    clearProfileState,
    isWalletConnected,
    pendingSignature,
    profileDetailsData?.connectedWalletAddress,
    profileDetailsData?.upWallet,
  ]);

  useEffect(() => {
    if (!expectedChainId || !chainId) return;
    if (expectedChainId !== chainId) {
      if (isConnected) {
        disconnect({ preserveChainId: true });
      }
      setError(
        `Wrong network. Please switch to ${
          supportedNetworks[expectedChainId]?.displayName || expectedChainId
        }.`
      );
      return;
    }
    setError(null);
  }, [expectedChainId, chainId, isConnected, disconnect]);

  useEffect(() => {
    if (!chainId) return;
    if (prevChainIdRef.current && chainId !== prevChainIdRef.current) {
      // Don't trigger re-sign while one is already in progress
      if (signingRef.current || pendingSignature) {
        prevChainIdRef.current = chainId;
        return;
      }
      if (isConnected && (!expectedChainId || expectedChainId === chainId)) {
        // Clear last signed address since chain changed
        lastSignedAddressRef.current = null;
        setHasActiveSignature(false);
        setPendingSignature(true);
      }
    }
    prevChainIdRef.current = chainId;
  }, [chainId, expectedChainId, isConnected, pendingSignature]);

  const debugState = useMemo<ProfileDebugState>(
    () => ({
      connectorId: connector?.id || null,
      connectorName: connector?.name || null,
      walletConnectConnectorId: walletConnectConnector?.id || null,
      walletConnectConnectorName: walletConnectConnector?.name || null,
      isWalletConnected,
      address: address || null,
      walletChainId: walletChainId ?? null,
      walletClientPresent,
      walletClientChainId,
      pendingSignature,
      signingMessage,
      hasLuksoProvider: hasLuksoProvider(),
      isMobileDevice: isMobileDevice(),
      lastWalletConnectUri: lastWalletConnectUriRef.current,
      lastWalletConnectUriUpdatedAt,
      lastUpAppWakeAt,
    }),
    [
      address,
      connector?.id,
      connector?.name,
      isWalletConnected,
      lastUpAppWakeAt,
      lastWalletConnectUriUpdatedAt,
      pendingSignature,
      signingMessage,
      walletChainId,
      walletClientPresent,
      walletClientChainId,
      walletConnectConnector?.id,
      walletConnectConnector?.name,
    ]
  );

  const contextValue = useMemo(
    () => ({
      issuedAssets,
      setIssuedAssets,
      profileDetailsData,
      setProfileDetailsData,
      error,
      isConnected,
      hasActiveSignature,
      isSigningIn: pendingSignature || signingMessage,
      chainId,
      expectedChainId,
      isNetworkMismatch,
      connectAndSign,
      disconnect,
      switchNetwork,
      debugState,
    }),
    [
      issuedAssets,
      profileDetailsData,
      error,
      isConnected,
      hasActiveSignature,
      pendingSignature,
      signingMessage,
      chainId,
      expectedChainId,
      isNetworkMismatch,
      connectAndSign,
      disconnect,
      switchNetwork,
      debugState,
    ]
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
