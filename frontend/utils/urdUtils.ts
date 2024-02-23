import { ethers } from 'ethers';
import { getNetworkConfig } from '@/constants/networks';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json';
import { getProvider } from '@/utils/provider';
import {
  DEFAULT_UP_CONTROLLER_PERMISSIONS,
  DEFAULT_UP_URD_PERMISSIONS,
  GRAVE_CONTROLLER_PERMISSIONS,
} from '@/app/constants';
import { ERC725YDataKeys, LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { getChecksumAddress } from './tokenUtils';

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
  upAddress: string
): Promise<IUPForwarderData> => {
  const provider = getProvider();
  const urdData: IUPForwarderData = {
    lsp7Urd: null,
    lsp8Urd: null,
    oldUrdVersion: null,
  };
  try {
    const UP = new ethers.Contract(
      upAddress as string,
      UniversalProfile.abi,
      provider
    );
    const UPData = await UP.connect(provider.getSigner()).getDataBatch([
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
  account: string,
  mainUPController: string
) => {
  const provider = getProvider();
  const signer = provider.getSigner();
  // check if we need to update permissions
  const missingPermissions = await doesControllerHaveMissingPermissions(
    mainUPController,
    account
  );
  if (!missingPermissions.length) {
    return;
  }
  const UP = new ethers.Contract(account, UniversalProfile.abi, provider);

  const erc725 = new ERC725(
    LSP6Schema as ERC725JSONSchema[],
    account,
    provider
  );

  const newPermissions = erc725.encodePermissions({
    ...DEFAULT_UP_CONTROLLER_PERMISSIONS,
    ...GRAVE_CONTROLLER_PERMISSIONS,
  });
  const permissionsData = erc725.encodeData([
    {
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: mainUPController,
      value: newPermissions,
    },
  ]);

  const setDataBatchTx = await UP.connect(signer).setDataBatch(
    permissionsData.keys,
    permissionsData.values
  );
  return await setDataBatchTx.wait();
};

export const toggleForwarderAsLSPDelegate = async (
  upAccount: string,
  forwarderAddress: string,
  isDelegate: boolean
) => {
  const provider = getProvider();
  const signer = provider.getSigner();
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
  const UP = new ethers.Contract(upAccount, UniversalProfile.abi, provider);
  const upPermissions = new ERC725(
    LSP6Schema as ERC725JSONSchema[],
    upAccount,
    provider
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
  const setDataBatchTx = await UP.connect(signer).setDataBatch(
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
    getProvider()
  );
  const addressPermission = await erc725.getData({
    keyName: 'AddressPermissions:Permissions:<address>',
    dynamicKeyParts: address,
  });

  return erc725.decodePermissions(addressPermission.value as string);
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
    ...GRAVE_CONTROLLER_PERMISSIONS,
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
