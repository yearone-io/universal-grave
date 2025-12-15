import {
  Contract,
  JsonRpcProvider,
  BrowserProvider,
  keccak256,
  toUtf8Bytes,
  concat,
  zeroPadValue,
  toBeHex,
} from 'ethers';
import { Network, getNetworkConfig } from '@/constants/supportedNetworks';
import { universalProfileAbi } from '@lukso/lsp-smart-contracts/abi';
import { ERC725YDataKeys, LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json';
import { getLuksoProvider } from '@/utils/provider';
import {
  DEFAULT_UP_CONTROLLER_PERMISSIONS,
  DEFAULT_UP_URD_PERMISSIONS,
  UAP_CONTROLLER_PERMISSIONS,
} from '@/app/constants';
import { getChecksumAddress } from './tokenUtils';
import { LSP1GraveForwarder__factory } from '@/contracts';

export const hasOlderGraveDelegate = (
  URDLsp7: string | null,
  URDLsp8: string | null
): string | null => {
  const networkConfig = getNetworkConfig(
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK!
  );
  return (
    networkConfig.previousGraveForwarders.find(
      forwarder => forwarder.toLowerCase() === URDLsp7?.toLowerCase()
    ) ||
    networkConfig.previousGraveForwarders.find(
      forwarder => forwarder.toLowerCase() === URDLsp8?.toLowerCase()
    ) ||
    null
  );
};
/**
 * Function to get the UP data and set the URD for LSP7 and LSP8.
 */
export interface IUPForwarderData {
  lsp7Urd: string | null;
  lsp8Urd: string | null;
  oldUrdVersion: string | null;
}

export const getUpAddressUrds = async (
  provider: JsonRpcProvider | BrowserProvider,
  upAddress: string
): Promise<IUPForwarderData> => {
  const urdData: IUPForwarderData = {
    lsp7Urd: null,
    lsp8Urd: null,
    oldUrdVersion: null,
  };
  try {
    const UP = new Contract(upAddress as string, universalProfileAbi, provider);
    const UPData = await UP.getDataBatch([
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
        LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40),
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
        LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40),
    ]);
    if (UPData) {
      urdData.lsp7Urd = getChecksumAddress(UPData[0]);
      urdData.lsp8Urd = getChecksumAddress(UPData[1]);
      urdData.oldUrdVersion = hasOlderGraveDelegate(
        urdData.lsp7Urd,
        urdData.lsp8Urd
      );
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
  return urdData;
};

/**
 * Function to update the permissions of the Browser Extension controller.
 */
export const updateBECPermissions = async (
  provider: JsonRpcProvider | BrowserProvider,
  account: string,
  mainUPController: string
) => {
  const signer = await provider.getSigner();
  // check if we need to update permissions
  const missingPermissions = await doesControllerHaveMissingPermissions(
    mainUPController,
    account
  );
  if (!missingPermissions.length) {
    return;
  }
  const UP = new Contract(account, universalProfileAbi, provider);

  const erc725 = new ERC725(
    LSP6Schema as ERC725JSONSchema[],
    account,
    getLuksoProvider()
  );

  const newPermissions = erc725.encodePermissions({
    ...DEFAULT_UP_CONTROLLER_PERMISSIONS,
    ...UAP_CONTROLLER_PERMISSIONS,
  });
  const permissionsData = erc725.encodeData([
    {
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: mainUPController,
      value: newPermissions,
    },
  ]);

  const setDataBatchTx = await (UP.connect(signer) as any).setDataBatch(
    permissionsData.keys,
    permissionsData.values
  );
  return await setDataBatchTx.wait();
};

export const toggleForwarderAsLSPDelegate = async (
  provider: JsonRpcProvider | BrowserProvider,
  upAccount: string,
  forwarderAddress: string,
  isDelegate: boolean
) => {
  const signer = await provider.getSigner();
  // 1. Prepare keys and values for setting the Forwarder as the delegate for LSP7 and LSP8
  const LSP7URDdataKey =
    ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
    LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40);
  const LSP8URDdataKey =
    ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
    LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40);
  const lspDelegateKeys = [LSP7URDdataKey, LSP8URDdataKey];
  const lspDelegateValues = isDelegate
    ? [forwarderAddress, forwarderAddress]
    : ['0x', '0x'];

  // 2. Prepare keys and values for granting the forwarder the necessary permissions on the UP
  const UP = new Contract(upAccount, universalProfileAbi, provider);
  const upPermissions = new ERC725(
    LSP6Schema as ERC725JSONSchema[],
    upAccount,
    getLuksoProvider()
  );
  const checkSumForwarderAddress = getChecksumAddress(
    forwarderAddress
  ) as string;
  const currentPermissionsData = await upPermissions.getData();
  const currentControllers = currentPermissionsData[0].value as string[];
  let newControllers = [] as string[];
  const forwarderPermissions = isDelegate
    ? upPermissions.encodePermissions({
        SUPER_CALL: true,
        ...DEFAULT_UP_URD_PERMISSIONS,
      })
    : '0x';

  // Remove all instance of the forwarder address from the list of UP controllers
  // and then add it to the end of the list, use checksum address to avoid issues with casing sensitivity
  newControllers = currentControllers.filter((controller: any) => {
    return getChecksumAddress(controller) !== checkSumForwarderAddress;
  });
  isDelegate && newControllers.push(checkSumForwarderAddress);

  const forwarderPermissionsData = upPermissions.encodeData([
    // the permission of the beneficiary address
    {
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: forwarderAddress,
      value: forwarderPermissions,
    },
    // the new list controllers addresses (= addresses with permissions set on the UP)
    // + or -  1 in the `AddressPermissions[]` array length
    {
      keyName: 'AddressPermissions[]',
      value: newControllers,
    },
  ]);

  // 3. Set the data on the UP
  const setDataBatchTx = await (UP.connect(signer) as any).setDataBatch(
    [...lspDelegateKeys, ...forwarderPermissionsData.keys],
    [...lspDelegateValues, ...forwarderPermissionsData.values]
  );
  return await setDataBatchTx.wait();
};

export const getAddressPermissionsOnTarget = async (
  address: string,
  targetEntity: string
) => {
  const erc725 = new ERC725(
    LSP6Schema as ERC725JSONSchema[],
    targetEntity,
    getLuksoProvider()
  );
  const addressPermission = await erc725.getData({
    keyName: 'AddressPermissions:Permissions:<address>',
    dynamicKeyParts: address,
  });

  return erc725.decodePermissions(addressPermission.value as `0x${string}`);
};

export const getMissingPermissions = (
  currentPermissions: { [key: string]: boolean },
  requiredPermissions: { [key: string]: boolean }
) => {
  const missingPermissions = [];
  for (const permission in requiredPermissions) {
    // check if the permission exists in the required permissions and if it is different from the current permissions
    if (requiredPermissions[permission] !== currentPermissions[permission]) {
      missingPermissions.push(permission);
    }
  }
  return missingPermissions;
};

export const doesControllerHaveMissingPermissions = async (
  address: string,
  targetEntity: string
) => {
  // check if we need to update permissions
  const currentPermissions = await getAddressPermissionsOnTarget(
    address,
    targetEntity
  );
  const missingPermissions = getMissingPermissions(currentPermissions, {
    ...DEFAULT_UP_CONTROLLER_PERMISSIONS,
    ...UAP_CONTROLLER_PERMISSIONS,
  });
  return missingPermissions;
};

export const urdsMatchLatestForwarder = (
  URDLsp7: string | null,
  URDLsp8: string | null,
  universalGraveForwarder: string
) => {
  // Note: check sum case address to avoid issues with case sensitivity
  if (!URDLsp7 || !URDLsp8 || !universalGraveForwarder) {
    return false;
  }
  return (
    getChecksumAddress(URDLsp7) ===
      getChecksumAddress(universalGraveForwarder) &&
    getChecksumAddress(URDLsp8) === getChecksumAddress(universalGraveForwarder)
  );
};

/**
 * Function to set the vault address in the forwarder contract.
 */
export const setGraveInForwarder = async (
  provider: JsonRpcProvider | BrowserProvider,
  vaultAddress: string,
  forwarderAddress: string
) => {
  // Set the vault address as the redirecting address for the LSP7 and LSP8 tokens
  // Note: remember to update ABIs if the delegate contracts change
  const signer = await provider.getSigner();
  const graveForwarder = LSP1GraveForwarder__factory.connect(
    forwarderAddress,
    signer
  );
  // first check if the grave address is already set
  const currentGrave = await graveForwarder.getGrave();
  if (currentGrave.toLocaleLowerCase() === vaultAddress.toLocaleLowerCase()) {
    return;
  }
  return await graveForwarder.setGrave(vaultAddress);
};
