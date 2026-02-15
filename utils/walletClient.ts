import {
  BrowserProvider,
  Contract,
  ContractTransactionResponse,
  JsonRpcSigner,
  getAddress,
  isAddress,
  toBeHex,
} from 'ethers';
import type { Account, Chain, Client, Transport } from 'viem';
import {
  checkControllerPermissionsOnUP,
  resolveAnyControllerForUP,
} from '@/utils/upAddress';

type WalletClient = Client<Transport, Chain, Account>;
type MinimalTxResponse = {
  hash: string;
  wait: (
    confirmations?: number,
    timeout?: number
  ) => ReturnType<BrowserProvider['waitForTransaction']>;
};

let cachedProvider: BrowserProvider | null = null;
let cachedSigner: JsonRpcSigner | null = null;
let cachedAddress: string | null = null;
let cachedChainId: number | null = null;
let cachedTransportFingerprint: string | null = null;
let cachedClientUid: string | null = null;

const clientToProvider = (client: WalletClient) => {
  const network = {
    chainId: client.chain?.id,
    name: client.chain?.name || 'LUKSO',
  };
  return new BrowserProvider(client.transport, network);
};

const getClientUid = (client: WalletClient) => {
  const uid = (client as any)?.uid;
  return typeof uid === 'string' && uid.length > 0 ? uid : null;
};

const getTransportFingerprint = (transport: WalletClient['transport']) => {
  const transportLike = transport as any;
  const type =
    typeof transportLike?.type === 'string' ? transportLike.type : '';
  const key = typeof transportLike?.key === 'string' ? transportLike.key : '';
  const name =
    typeof transportLike?.name === 'string' ? transportLike.name : '';
  const url =
    typeof transportLike?.url === 'string'
      ? transportLike.url
      : typeof transportLike?.value?.url === 'string'
        ? transportLike.value.url
        : '';

  const fingerprint = [type, key, name, url].filter(Boolean).join('|');
  return fingerprint || '__unknown_transport__';
};

const uniqueAddresses = (addresses: Array<string | null | undefined>) => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const address of addresses) {
    if (!address || !isAddress(address)) continue;
    const checksum = getAddress(address);
    const key = checksum.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(checksum);
  }
  return result;
};

const readStoredProfileDetails = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('profileDetailsData');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      mainUPController: parsed?.mainUPController as string | undefined,
      connectedWalletAddress: parsed?.connectedWalletAddress as string | undefined,
    };
  } catch {
    return null;
  }
};

const getProviderAccounts = async (provider: BrowserProvider) => {
  try {
    const accounts = await provider.send('eth_accounts', []);
    if (!Array.isArray(accounts)) return [];
    return accounts.filter(isAddress).map(account => getAddress(account));
  } catch {
    return [];
  }
};

const isMobileDevice = () =>
  typeof navigator !== 'undefined' &&
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

const isEstimateRelatedFailure = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  const action = String(error?.action || '').toLowerCase();
  return (
    action === 'estimategas' ||
    message.includes('estimategas') ||
    message.includes('execution reverted') ||
    message.includes('unknown custom error') ||
    message.includes('missing revert data') ||
    error?.code === 'CALL_EXCEPTION'
  );
};

const isFromAddressSelectionError = (error: any) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('from address') ||
    message.includes('unknown account') ||
    message.includes('account not found') ||
    message.includes('invalid parameters') ||
    (message.includes('sender') && message.includes('not found'))
  );
};

const sendViaWalletRequest = async (
  signer: JsonRpcSigner,
  txRequest: {
    to: string;
    data: string;
    value?: bigint | number | string;
    gas?: bigint | number | string;
  },
  fromOverride?: string
): Promise<MinimalTxResponse> => {
  const provider = getWalletProvider();
  const from = fromOverride ? getAddress(fromOverride) : await signer.getAddress();
  const request: Record<string, string> = {
    from,
    to: txRequest.to,
    data: txRequest.data,
  };

  if (txRequest.value !== undefined) {
    request.value =
      typeof txRequest.value === 'string' && txRequest.value.startsWith('0x')
        ? txRequest.value
        : toBeHex(txRequest.value as bigint | number);
  }

  if (txRequest.gas !== undefined) {
    request.gas =
      typeof txRequest.gas === 'string' && txRequest.gas.startsWith('0x')
        ? txRequest.gas
        : toBeHex(txRequest.gas as bigint | number);
  }

  const hash = await provider.send('eth_sendTransaction', [request]);

  return {
    hash,
    wait: (confirmations = 1, timeout) =>
      provider.waitForTransaction(hash, confirmations, timeout),
  };
};

export const sendUPMethodTx = async ({
  signer,
  upAddress,
  upContract,
  method,
  args,
}: {
  signer: JsonRpcSigner;
  upAddress: string;
  upContract: Contract;
  method: string;
  args: any[];
}): Promise<ContractTransactionResponse | MinimalTxResponse> => {
  try {
    return await (upContract.connect(signer) as any)[method](...args);
  } catch (error: any) {
    const signerAddress = await signer.getAddress().catch(() => null);
    const normalizedUpAddress = getAddress(upAddress);
    const shouldRetryViaWalletRequest =
      isMobileDevice() && isEstimateRelatedFailure(error);

    if (!shouldRetryViaWalletRequest) {
      throw error;
    }

    const data = upContract.interface.encodeFunctionData(method, args);
    const fromCandidates = uniqueAddresses([
      normalizedUpAddress,
      signerAddress,
    ]);
    let lastWalletRequestError: unknown = error;

    for (const fromCandidate of fromCandidates) {
      try {
        return await sendViaWalletRequest(
          signer,
          {
            to: normalizedUpAddress,
            data,
          },
          fromCandidate
        );
      } catch (walletRequestError: any) {
        lastWalletRequestError = walletRequestError;
        if (
          !isEstimateRelatedFailure(walletRequestError) &&
          !isFromAddressSelectionError(walletRequestError)
        ) {
          throw walletRequestError;
        }
      }

      try {
        return await sendViaWalletRequest(
          signer,
          {
            to: normalizedUpAddress,
            data,
            gas: 8_000_000n,
          },
          fromCandidate
        );
      } catch (walletRequestErrorWithGas: any) {
        lastWalletRequestError = walletRequestErrorWithGas;
        if (
          !isEstimateRelatedFailure(walletRequestErrorWithGas) &&
          !isFromAddressSelectionError(walletRequestErrorWithGas)
        ) {
          throw walletRequestErrorWithGas;
        }
      }
    }

    throw lastWalletRequestError;
  }
};

export const setWalletClient = (client: WalletClient | null) => {
  if (!client) {
    cachedProvider = null;
    cachedSigner = null;
    cachedAddress = null;
    cachedChainId = null;
    cachedTransportFingerprint = null;
    cachedClientUid = null;
    return null;
  }
  const nextAddress = getAddress(client.account.address);
  const nextChainId = client.chain?.id ?? null;
  const nextClientUid = getClientUid(client);
  const nextTransportFingerprint = getTransportFingerprint(client.transport);
  const sameClientUid =
    !!cachedClientUid &&
    !!nextClientUid &&
    cachedClientUid === nextClientUid;
  const sameTransportFingerprint =
    cachedTransportFingerprint === nextTransportFingerprint;
  const shouldReuseProvider = sameClientUid || sameTransportFingerprint;

  // Reuse BrowserProvider when the underlying transport is unchanged.
  // Recreating this provider repeatedly can accumulate listeners internally.
  if (!cachedProvider || !shouldReuseProvider) {
    cachedProvider = clientToProvider(client);
    cachedSigner = null;
  } else {
    const addressChanged =
      !cachedAddress ||
      cachedAddress.toLowerCase() !== nextAddress.toLowerCase();
    const chainChanged = cachedChainId !== nextChainId;
    if (addressChanged || chainChanged) {
      cachedSigner = null;
    }
  }

  cachedTransportFingerprint = nextTransportFingerprint;
  cachedClientUid = nextClientUid;
  cachedAddress = nextAddress;
  cachedChainId = nextChainId;
  return { provider: cachedProvider };
};

export const hasWalletProvider = () => {
  if (cachedProvider) return true;
  if (typeof window !== 'undefined' && (window as any).lukso) return true;
  return false;
};

export const getWalletProvider = () => {
  if (cachedProvider) return cachedProvider;
  if (typeof window !== 'undefined' && (window as any).lukso) {
    cachedProvider = new BrowserProvider((window as any).lukso);
    return cachedProvider;
  }
  throw new Error('Wallet provider not available');
};

export const getWalletSigner = async () => {
  const provider = getWalletProvider();
  if (cachedSigner) {
    try {
      const [providerAccounts, signerAddress] = await Promise.all([
        getProviderAccounts(provider),
        cachedSigner.getAddress(),
      ]);
      const signerLower = signerAddress.toLowerCase();
      const accountLowers = providerAccounts.map(account =>
        account.toLowerCase()
      );
      if (
        accountLowers.length === 0 ||
        accountLowers.includes(signerLower)
      ) {
        return cachedSigner;
      }
    } catch {
      // Re-resolve signer below if account introspection fails.
    }
    cachedSigner = null;
  }
  const signer = (await provider.getSigner()) as JsonRpcSigner;
  cachedSigner = signer;
  return signer;
};

export const getWalletSignerForUP = async (
  upAddress: string,
  options?: { requirePermissions?: boolean }
) => {
  if (!isAddress(upAddress)) {
    throw new Error('Invalid Universal Profile address');
  }

  const normalizedUpAddress = getAddress(upAddress);
  const provider = getWalletProvider();
  const defaultSigner = await getWalletSigner();
  const defaultSignerAddress = await defaultSigner.getAddress();
  const normalizedUpLower = normalizedUpAddress.toLowerCase();
  const isDefaultSignerUniversalProfile =
    defaultSignerAddress.toLowerCase() === normalizedUpLower;
  const storedProfileDetails = readStoredProfileDetails();
  const providerAccounts = await getProviderAccounts(provider);
  const connectedAddresses = uniqueAddresses([
    defaultSignerAddress,
    cachedAddress,
    ...providerAccounts,
  ]);
  const connectedSigners = new Set(
    connectedAddresses.map(address => address.toLowerCase())
  );

  // For LSP0 writes the safest signer is the UP smart account itself.
  // If the account is connected, force-select it even when default signer differs.
  if (connectedSigners.has(normalizedUpLower)) {
    if (isDefaultSignerUniversalProfile) {
      return defaultSigner;
    }
    return new JsonRpcSigner(provider, normalizedUpAddress);
  }

  const discoveredController = await resolveAnyControllerForUP(
    provider,
    normalizedUpAddress
  );

  const candidates = uniqueAddresses([
    discoveredController,
    storedProfileDetails?.mainUPController,
    defaultSignerAddress,
    cachedAddress,
    storedProfileDetails?.connectedWalletAddress,
    ...providerAccounts,
  ]).filter(candidate => candidate.toLowerCase() !== normalizedUpLower);

  // If the UP account itself is not connected, fall back to permissioned
  // controller candidates as a best effort.
  let hasUnknownPermissionChecks = false;
  let hasPermissionedButDisconnectedCandidate = false;
  for (const candidate of candidates) {
    const permissionCheck = await checkControllerPermissionsOnUP(
      provider,
      normalizedUpAddress,
      candidate
    );
    if (!permissionCheck.checked) {
      hasUnknownPermissionChecks = true;
      continue;
    }
    if (!permissionCheck.hasPermissions) continue;
    if (!connectedSigners.has(candidate.toLowerCase())) {
      hasPermissionedButDisconnectedCandidate = true;
      continue;
    }

    if (candidate.toLowerCase() === defaultSignerAddress.toLowerCase()) {
      return defaultSigner;
    }

    return new JsonRpcSigner(provider, candidate);
  }

  if (options?.requirePermissions) {
    if (hasUnknownPermissionChecks) {
      return defaultSigner;
    }
    if (hasPermissionedButDisconnectedCandidate) {
      throw new Error(
        `A controller with LSP6 permissions exists for ${normalizedUpAddress}, but it is not currently connected. Reconnect in Universal Profiles app and select the same profile/controller, then try again.`
      );
    }
    throw new Error(
      `No connected Universal Profile signer was found for ${normalizedUpAddress}. Reconnect in Universal Profiles app, select this profile, and try again.`
    );
  }

  return defaultSigner;
};

export const assertWalletNetwork = async (expectedChainId: number) => {
  if (cachedChainId !== null) {
    if (cachedChainId !== expectedChainId) {
      throw new Error(
        `Wrong network. Please switch to chain ${expectedChainId} (current: ${cachedChainId}).`
      );
    }
    return;
  }
  const provider = getWalletProvider();
  const network = await provider.getNetwork();
  const currentChainId = Number(network.chainId);
  if (currentChainId !== expectedChainId) {
    throw new Error(
      `Wrong network. Please switch to chain ${expectedChainId} (current: ${currentChainId}).`
    );
  }
};

export const getWalletAddress = async () => {
  if (cachedAddress) return cachedAddress;
  const signer = await getWalletSigner();
  cachedAddress = await signer.getAddress();
  return cachedAddress;
};

export const getCachedWalletChainId = () => cachedChainId;
