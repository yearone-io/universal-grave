import { ethers } from 'ethers';
import { getNetworkConfig } from '@/constants/networks';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json';
import { getLuksoProvider } from '@/utils/provider';
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
  if (!URDLsp7 || !URDLsp8) return null;
  const urd7 = getChecksumAddress(URDLsp7)!;
  const urd8 = getChecksumAddress(URDLsp8)!;
  let urd7Index = networkConfig.previousGraveForwarders.findIndex(item => item.toLowerCase() === urd7.toLowerCase());
  let urd8Index = networkConfig.previousGraveForwarders.findIndex(item => item.toLowerCase() === urd8.toLowerCase());
  if (urd7Index > -1 && urd8Index > -1 && urd7 === urd8) {
    return networkConfig.previousGraveForwarders[urd7Index];
  }
  return null;
};

/**
 * Function to get the UP data and set the URD for LSP7 and LSP8.
 */
export interface IUPForwarderData {
  readonly URDLsp7: string | null;
  readonly URDLsp8: string | null;
  readonly oldForwarderAddress: string | null;
}

/**
 * Function to update the permissions of the Browser Extension controller.
 */
export const updateBECPermissions = async (
  account: string,
  mainUPController: string,
  provider: ethers.providers.JsonRpcProvider,
  signer: ethers.providers.JsonRpcSigner
) => {
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
    getLuksoProvider()
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

/**
 * Function to reset the delegates for LSP7 and LSP8 to the zero address. Used when leaving the Grave.
 */
export const resetLSPDelegates = async (
  provider: ethers.providers.JsonRpcProvider,
  signer: ethers.providers.JsonRpcSigner,
  forwarderAddress: string
) => {
  const account = await signer.getAddress();
  // Interacting with the Universal Profile contract
  const UP = new ethers.Contract(
    account as string,
    UniversalProfile.abi,
    provider
  );

  const erc725 = new ERC725(
    LSP6Schema as ERC725JSONSchema[],
    account,
    getLuksoProvider()
  );

  // LSP7 data key to set the forwarder as the delegate
  const LSP7URDdataKey =
    ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
    LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40);

  // LSP8 data key to set the forwarder as the delegate
  const LSP8URDdataKey =
    ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
    LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40);

  let dataKeys = [LSP7URDdataKey, LSP8URDdataKey];

  let dataValues = ['0x', '0x'];

  const permissionsResult = await erc725.getData();
  const allControllers = permissionsResult[0].value as string[];
  // remove permissions if leaving the Grave and reducing the number of controllers
  const permissions = '0x';
  // Remove the forwarder from the list of controllers.
  // Note: check sum case address to avoid issues with case sensitivity
  const formattedControllers = allControllers.filter((controller: any) => {
    return (
      getChecksumAddress(controller) !== getChecksumAddress(forwarderAddress)
    );
  });

  const data = erc725.encodeData([
    // the permission of the beneficiary address
    {
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: forwarderAddress,
      value: permissions,
    },
    // the new list controllers addresses (= addresses with permissions set on the UP)
    // + or -  1 in the `AddressPermissions[]` array length
    {
      keyName: 'AddressPermissions[]',
      value: formattedControllers,
    },
  ]);
  dataKeys = [...dataKeys, ...data.keys];
  dataValues = [...dataValues, ...data.values];

  // execute the tx
  const setDataBatchTx = await UP.connect(signer).setDataBatch(
    dataKeys,
    dataValues
  );
  return await setDataBatchTx.wait();
};

export const setForwarderAsLSPDelegate = async (
  account: string,
  forwarder: string,
  signer: ethers.providers.JsonRpcSigner,
  provider: ethers.providers.JsonRpcProvider
) => {
  // Interacting with the Universal Profile contract
  const UP = new ethers.Contract(account, UniversalProfile.abi, provider);

  const erc725 = new ERC725(
    LSP6Schema as ERC725JSONSchema[],
    account,
    getLuksoProvider()
  );
  // 0. Prepare keys for setting the Forwarder as the delegate for LSP7 and LSP8
  const LSP7URDdataKey =
    ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
    LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2).slice(0, 40);
  const LSP8URDdataKey =
    ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
    LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2).slice(0, 40);

  let dataKeys = [LSP7URDdataKey, LSP8URDdataKey];

  let dataValues = [forwarder, forwarder];

  const permissionsResult = await erc725.getData();
  const allControllers = permissionsResult[0].value as string[];
  let formattedControllers = [] as string[];
  const permissions = erc725.encodePermissions({
    SUPER_CALL: true,
    ...DEFAULT_UP_URD_PERMISSIONS,
  });

  // 2 - remove the forwarder from the list of controllers for sanity check
  // Note: check sum case address to avoid issues with case sensitivity
  formattedControllers = allControllers.filter((controller: any) => {
    return getChecksumAddress(controller) !== getChecksumAddress(forwarder);
  });

  // 3- add the forwarder to the list of controllers
  formattedControllers = [...formattedControllers, forwarder];

  const data = erc725.encodeData([
    // the permission of the beneficiary address
    {
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: forwarder,
      value: permissions,
    },
    // the new list controllers addresses (= addresses with permissions set on the UP)
    // + or -  1 in the `AddressPermissions[]` array length
    {
      keyName: 'AddressPermissions[]',
      value: formattedControllers,
    },
  ]);
  dataKeys = [...dataKeys, ...data.keys];
  dataValues = [...dataValues, ...data.values];

  // 4.execute the tx
  const setDataBatchTx = await UP.connect(signer).setDataBatch(
    dataKeys,
    dataValues
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
