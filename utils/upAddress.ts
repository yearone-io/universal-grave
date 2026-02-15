import { BrowserProvider, Contract, JsonRpcProvider, getAddress, isAddress } from 'ethers';
import { ERC725JSONSchema } from '@erc725/erc725.js';
import { ERC725YDataKeys } from '@lukso/lsp-smart-contracts';
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json';
import { getDataSafe, getErc725Read } from '@/utils/erc725Client';

type ReadProvider = BrowserProvider | JsonRpcProvider;

const ERC725Y_ABI = ['function getData(bytes32 dataKey) view returns (bytes)'];
const KEY_MANAGER_ABI = ['function target() view returns (address)'];
const ZERO_KEY = `0x${'0'.repeat(64)}`;

const hasCode = async (provider: ReadProvider, address: string) => {
  try {
    const code = await provider.getCode(address);
    return code !== '0x';
  } catch {
    return false;
  }
};

export const canReadAsUniversalProfile = async (
  provider: ReadProvider,
  address: string
) => {
  if (!isAddress(address)) return false;
  const checksum = getAddress(address);
  if (!(await hasCode(provider, checksum))) return false;
  try {
    const upLike = new Contract(checksum, ERC725Y_ABI, provider);
    await upLike.getData(ZERO_KEY);
    return true;
  } catch {
    return false;
  }
};

export const hasControllerPermissionsOnUP = async (
  provider: ReadProvider,
  upAddress: string,
  controllerAddress: string
) => {
  const result = await checkControllerPermissionsOnUP(
    provider,
    upAddress,
    controllerAddress
  );
  return result.hasPermissions;
};

export const checkControllerPermissionsOnUP = async (
  provider: ReadProvider,
  upAddress: string,
  controllerAddress: string
) => {
  if (!isAddress(upAddress) || !isAddress(controllerAddress)) {
    return { hasPermissions: false, checked: true as const };
  }
  const up = getAddress(upAddress);
  const controller = getAddress(controllerAddress);

  try {
    const upContract = new Contract(up, ERC725Y_ABI, provider);
    const permissionsKey =
      ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] +
      controller.slice(2).toLowerCase();
    const permissions = await upContract.getData(permissionsKey);
    if (!permissions || permissions === '0x') {
      return { hasPermissions: false, checked: true as const };
    }
    return { hasPermissions: BigInt(permissions) !== 0n, checked: true as const };
  } catch {
    return { hasPermissions: false, checked: false as const };
  }
};

export const resolveMainControllerForUP = async (
  provider: ReadProvider,
  upAddress: string,
  recoveredController: string,
  connectedAddress?: string | null
) => {
  if (
    isAddress(recoveredController) &&
    (await hasControllerPermissionsOnUP(provider, upAddress, recoveredController))
  ) {
    return getAddress(recoveredController);
  }

  if (
    connectedAddress &&
    isAddress(connectedAddress) &&
    (await hasControllerPermissionsOnUP(provider, upAddress, connectedAddress))
  ) {
    return getAddress(connectedAddress);
  }

  const discoveredController = await resolveAnyControllerForUP(
    provider,
    upAddress
  );
  if (discoveredController) {
    return discoveredController;
  }

  return isAddress(recoveredController)
    ? getAddress(recoveredController)
    : recoveredController;
};

export const resolveAnyControllerForUP = async (
  provider: ReadProvider,
  upAddress: string
) => {
  if (!isAddress(upAddress)) return null;

  try {
    const erc725 = getErc725Read(
      LSP6Schema as ERC725JSONSchema[],
      getAddress(upAddress),
      { provider }
    );
    const controllersData = await getDataSafe(erc725, 'AddressPermissions[]');
    const controllers = (controllersData?.value as string[] | undefined) || [];

    for (const controller of controllers) {
      if (!isAddress(controller)) continue;
      if (await hasControllerPermissionsOnUP(provider, upAddress, controller)) {
        return getAddress(controller);
      }
    }
  } catch {
    // best-effort fallback only
  }

  return null;
};

export const resolveUniversalProfileAddress = async (
  provider: ReadProvider,
  connectedAddress: string
): Promise<{
  upAddress: string;
  source: 'up' | 'key_manager' | 'unknown';
}> => {
  if (!isAddress(connectedAddress)) {
    throw new Error('Invalid connected address');
  }

  const checksumAddress = getAddress(connectedAddress);

  if (await canReadAsUniversalProfile(provider, checksumAddress)) {
    return { upAddress: checksumAddress, source: 'up' };
  }

  if (await hasCode(provider, checksumAddress)) {
    try {
      const keyManager = new Contract(checksumAddress, KEY_MANAGER_ABI, provider);
      const target = await (keyManager as any).target();
      if (isAddress(target)) {
        const targetAddress = getAddress(target);
        if (await canReadAsUniversalProfile(provider, targetAddress)) {
          return { upAddress: targetAddress, source: 'key_manager' };
        }
      }
    } catch {
      // Address is not a Key Manager, continue with unknown.
    }
  }

  return { upAddress: checksumAddress, source: 'unknown' };
};

export const getKeyManagerTarget = async (
  provider: ReadProvider,
  address: string
) => {
  if (!isAddress(address)) return null;
  const checksumAddress = getAddress(address);
  if (!(await hasCode(provider, checksumAddress))) return null;
  try {
    const keyManager = new Contract(checksumAddress, KEY_MANAGER_ABI, provider);
    const target = await (keyManager as any).target();
    if (!isAddress(target)) return null;
    return getAddress(target);
  } catch {
    return null;
  }
};
