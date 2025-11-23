import { BrowserProvider, Contract } from 'ethers';
import { ERC725YDataKeys } from '@lukso/lsp-smart-contracts';
import { universalProfileAbi } from '@lukso/lsp-smart-contracts/abi';
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json';
import {
  DEFAULT_UP_CONTROLLER_PERMISSIONS,
  UAP_CONTROLLER_PERMISSIONS,
  DEFAULT_UP_URD_PERMISSIONS,
} from '@/app/constants';

/**
 * Subscribe a Universal Profile to the UAP protocol
 * This sets the UAP URD as the LSP1 Universal Receiver Delegate
 * and grants necessary permissions
 * @param provider - Browser provider with signer
 * @param upAddress - Universal Profile address
 * @param protocolAddress - UAP protocol contract address
 * @param defaultURDAddress - Default URD address (fallback if UAP is removed)
 */
export async function subscribeToUAP(
  provider: BrowserProvider,
  upAddress: string,
  protocolAddress: string,
  defaultURDAddress: string
): Promise<void> {
  try {
    const signer = await provider.getSigner();

    // Set up URD delegates following UP Assistants pattern
    const URDdataKey = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate;
    // Using LSP7Tokens_RecipientNotification (not SenderNotification) to match UP Assistants
    const LSP7URDdataKey =
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
      '0x20804611b3e2ea21c480dc465142210acf4a2485947541770ec1fb87dee4a55c'.slice(
        2,
        42
      ); // LSP7 RecipientNotification type ID
    const LSP8URDdataKey =
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
      '0x0b084a55ebf70fd3c06fd755269dac2212c4d3f0f4d09079780bfa50c1b2984d'.slice(
        2,
        42
      ); // LSP8 type ID

    const delegateKeys = [URDdataKey, LSP7URDdataKey, LSP8URDdataKey];
    const delegateValues = [protocolAddress, '0x', '0x'];

    const upContract = new Contract(upAddress, universalProfileAbi, provider);
    const upPermissions = new ERC725(
      LSP6Schema as ERC725JSONSchema[],
      upAddress,
      window.lukso
    );

    // Get checksum address
    const checksumUapURD = protocolAddress;

    const currentPermissionsData = await upPermissions.getData(
      'AddressPermissions[]'
    );
    let currentControllers = (currentPermissionsData.value as string[]) || [];

    // Filter out UAP protocol if it exists, then add it
    let updatedControllers = currentControllers.filter((controller: string) => {
      return controller.toLowerCase() !== checksumUapURD.toLowerCase();
    });
    updatedControllers.push(checksumUapURD);

    // Set UAP permissions
    const uapURDPermissions = upPermissions.encodePermissions({
      SUPER_CALL: true,
      SUPER_TRANSFERVALUE: true,
      ...DEFAULT_UP_URD_PERMISSIONS,
    });

    const permissionsData = upPermissions.encodeData([
      {
        keyName: 'AddressPermissions:Permissions:<address>',
        dynamicKeyParts: checksumUapURD,
        value: uapURDPermissions,
      },
      {
        keyName: 'AddressPermissions[]',
        value: updatedControllers,
      },
    ]);

    const allKeys = [...delegateKeys, ...permissionsData.keys];
    const allValues = [...delegateValues, ...permissionsData.values];

    const tx = await (upContract as any)
      .connect(signer)
      .setDataBatch(allKeys, allValues);
    await tx.wait();

    console.log('Successfully subscribed to UAP protocol');
  } catch (error) {
    console.error('Error subscribing to UAP:', error);
    throw error;
  }
}

/**
 * Unsubscribe a Universal Profile from the UAP protocol
 * This removes the UAP URD and sets it back to the default URD
 * @param provider - Browser provider with signer
 * @param upAddress - Universal Profile address
 * @param protocolAddress - UAP protocol contract address
 * @param defaultURDAddress - Default URD address to restore
 */
export async function unsubscribeFromUAP(
  provider: BrowserProvider,
  upAddress: string,
  protocolAddress: string,
  defaultURDAddress: string
): Promise<void> {
  try {
    const signer = await provider.getSigner();
    const upContract = new Contract(upAddress, universalProfileAbi, signer);

    // Create ERC725 instance with window.lukso for reading and encoding data
    // ERC725.js expects the raw provider, not a BrowserProvider wrapper
    const erc725 = new ERC725(
      LSP6Schema as ERC725JSONSchema[],
      upAddress,
      window.lukso
    );

    // Get current controllers
    const controllersData = await erc725.getData('AddressPermissions[]');

    const currentControllers = (controllersData.value as string[]) || [];

    // Remove UAP from controllers list
    const newControllers = currentControllers.filter(
      addr => addr.toLowerCase() !== protocolAddress.toLowerCase()
    );

    // Prepare keys and values
    const keys: string[] = [
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate, // Restore default URD
      ...erc725.encodeData([
        {
          keyName: 'AddressPermissions:Permissions:<address>',
          dynamicKeyParts: protocolAddress,
          value: '0x', // Remove permissions
        },
        {
          keyName: 'AddressPermissions[]',
          value: newControllers, // Remove from controllers list
        },
      ]).keys,
    ];

    const values: string[] = [
      defaultURDAddress, // Restore default URD
      ...erc725.encodeData([
        {
          keyName: 'AddressPermissions:Permissions:<address>',
          dynamicKeyParts: protocolAddress,
          value: '0x',
        },
        {
          keyName: 'AddressPermissions[]',
          value: newControllers,
        },
      ]).values,
    ];

    // Execute setDataBatch
    const tx = await (upContract as any).setDataBatch(keys, values);
    await tx.wait();

    console.log('Successfully unsubscribed from UAP protocol');
  } catch (error) {
    console.error('Error unsubscribing from UAP:', error);
    throw error;
  }
}

/**
 * Check if controller has necessary permissions to manage UAP
 * @param provider - Provider
 * @param upAddress - Universal Profile address
 * @param controllerAddress - Controller address to check
 * @returns true if controller has ADDUNIVERSALRECEIVERDELEGATE and CHANGEUNIVERSALRECEIVERDELEGATE permissions
 */
export async function hasUAPManagementPermissions(
  provider: BrowserProvider,
  upAddress: string,
  controllerAddress: string
): Promise<boolean> {
  try {
    // Create ERC725 instance with provider for reading data
    const erc725 = new ERC725(
      LSP6Schema as ERC725JSONSchema[],
      upAddress,
      provider
    );

    const permissionsData = await erc725.getData({
      keyName: 'AddressPermissions:Permissions:<address>',
      dynamicKeyParts: controllerAddress,
    });

    if (!permissionsData.value) {
      return false;
    }

    const permissions = erc725.decodePermissions(
      permissionsData.value as `0x${string}`
    );

    return !!(
      permissions.ADDUNIVERSALRECEIVERDELEGATE &&
      permissions.CHANGEUNIVERSALRECEIVERDELEGATE
    );
  } catch (error) {
    console.error('Error checking UAP management permissions:', error);
    return false;
  }
}
