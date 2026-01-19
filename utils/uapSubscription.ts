import { BrowserProvider, Contract, AbiCoder } from 'ethers';
import { ERC725YDataKeys, LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { universalProfileAbi } from '@lukso/lsp-smart-contracts/abi';
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json';
import uapSchema from '@/schemas/UAP.json';
import {
  DEFAULT_UP_CONTROLLER_PERMISSIONS,
  UAP_CONTROLLER_PERMISSIONS,
  DEFAULT_UP_URD_PERMISSIONS,
} from '@/app/constants';

// Hardcoded key from UAP.json schema - ERC725.js encodeKeyName may not work correctly
const SUPPORTED_STANDARDS_UAP_KEY =
  '0xeafec4d89fa9619884b6000003309e5fff483f30b60c116ca9764e6e9b370a0b';
const SUPPORTED_STANDARDS_UAP_VALUE = '0x03309e5f';

// Transaction type IDs for LSP7 and LSP8 recipient notifications
const LSP7_TRANSACTION_TYPE = LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification;
const LSP8_TRANSACTION_TYPE = LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification;

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
      LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification.slice(2, 42); // LSP7 RecipientNotification type ID
    const LSP8URDdataKey =
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
      LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification.slice(2, 42); // LSP8 type ID

    const delegateKeys = [URDdataKey, LSP7URDdataKey, LSP8URDdataKey];
    const delegateValues = [protocolAddress, '0x', '0x'];

    const upContract = new Contract(upAddress, universalProfileAbi, provider);
    const upPermissions = new ERC725(
      LSP6Schema as ERC725JSONSchema[],
      upAddress,
      window.lukso
    );

    // Add SupportedStandards:UAP for protocol detection
    const erc725UAP = new ERC725(
      uapSchema as ERC725JSONSchema[],
      upAddress,
      window.lukso
    );
    const supportedStandardsKey = erc725UAP.encodeKeyName(
      'SupportedStandards:UAP',
      []
    );
    const supportedStandardsValue = erc725UAP.encodeValueType(
      'bytes4',
      '0x03309e5f'
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

    const allKeys = [
      ...delegateKeys,
      supportedStandardsKey,
      ...permissionsData.keys,
    ];
    const allValues = [
      ...delegateValues,
      supportedStandardsValue,
      ...permissionsData.values,
    ];

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
      SUPPORTED_STANDARDS_UAP_KEY, // Clear UAP supported standard
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
      '0x', // Clear SupportedStandards:UAP
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

/**
 * Encode a tuple key-value pair following ERC725 format
 * This matches the UP Assistants implementation for proper compatibility
 */
function encodeTupleKeyValue(
  valueType: string,
  decodedValues: any[],
  erc725: ERC725
): string {
  const valueTypeParts = valueType
    .substring(1, valueType.length - 1)
    .split(',');

  if (valueTypeParts.length !== decodedValues.length) {
    throw new Error(
      `Can not encode tuple key value: ${decodedValues}. Expected array of length: ${valueTypeParts.length}`
    );
  }

  const returnValue = `0x${valueTypeParts
    .map((valueTypePart, i) => {
      const encodedKeyValue = erc725.encodeValueType(
        valueTypePart,
        decodedValues[i]
      );
      if (!encodedKeyValue) {
        return '';
      }
      return encodedKeyValue.slice(2);
    })
    .join('')}`;

  return returnValue;
}

/**
 * Subscribe to UAP protocol AND configure GRAVE Forwarder Assistant in a single transaction.
 * This is the unified function that combines UAP subscription + assistant config + screener config.
 *
 * @param provider - Browser provider with signer
 * @param upAddress - Universal Profile address
 * @param protocolAddress - UAP protocol contract address
 * @param vaultAddress - Vault address for the forwarder assistant
 * @param networkConfig - Network configuration with contract addresses
 */
export async function subscribeAndConfigureGrave(
  provider: BrowserProvider,
  upAddress: string,
  protocolAddress: string,
  vaultAddress: string,
  networkConfig: {
    forwarderAssistantAddress: string;
    addressListScreenerAddress: string;
    creatorListScreenerAddress: string;
  }
): Promise<void> {
  console.log("running: subscribeAndConfigureGrave")
  try {
    const signer = await provider.getSigner();
    const upContract = new Contract(upAddress, universalProfileAbi, signer);
    const abiCoder = new AbiCoder();

    const erc725LSP6 = new ERC725(
      LSP6Schema as ERC725JSONSchema[],
      upAddress,
      window.lukso
    );
    const erc725UAP = new ERC725(
      uapSchema as ERC725JSONSchema[],
      upAddress,
      window.lukso
    );

    const keys: string[] = [];
    const values: string[] = [];

    // =============================================================
    // SECTION 1: UAP Protocol Subscription Keys
    // =============================================================

    // 1. Set LSP1UniversalReceiverDelegate to UAP protocol
    keys.push(ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate);
    values.push(protocolAddress);

    // 2-3. Clear type-specific URDs (LSP7 and LSP8)
    const LSP7URDdataKey =
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
      LSP7_TRANSACTION_TYPE.slice(2, 42);
    const LSP8URDdataKey =
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegatePrefix +
      LSP8_TRANSACTION_TYPE.slice(2, 42);

    keys.push(LSP7URDdataKey);
    values.push('0x');
    keys.push(LSP8URDdataKey);
    values.push('0x');

    // 4. Set SupportedStandards:UAP using hardcoded key
    keys.push(SUPPORTED_STANDARDS_UAP_KEY);
    values.push(SUPPORTED_STANDARDS_UAP_VALUE);

    // =============================================================
    // SECTION 2: AddressPermissions (efficient - only write new entry)
    // =============================================================

    // Get current controllers list to check if protocol already exists
    const currentPermissionsData = await erc725LSP6.getData('AddressPermissions[]');
    const currentControllers = (currentPermissionsData.value as string[]) || [];

    // Check if protocol already exists in the array
    const protocolAlreadyExists = currentControllers.some(
      (controller: string) =>
        controller.toLowerCase() === protocolAddress.toLowerCase()
    );

    // Set UAP permissions (always update permissions even if already in array)
    const uapPermissions = erc725LSP6.encodePermissions({
      SUPER_CALL: true,
      SUPER_TRANSFERVALUE: true,
      ...DEFAULT_UP_URD_PERMISSIONS,
    });

    // Permissions key: AddressPermissions:Permissions:<address>
    const permissionsKey =
      ERC725YDataKeys.LSP6['AddressPermissions:Permissions'] +
      protocolAddress.slice(2).toLowerCase();
    keys.push(permissionsKey);
    values.push(uapPermissions);

    // Only add to array if not already present
    if (!protocolAlreadyExists) {
      const currentLength = currentControllers.length;
      const newLength = currentLength + 1;

      // Length key: AddressPermissions[].length
      const lengthKey = ERC725YDataKeys.LSP6['AddressPermissions[]'].length;
      keys.push(lengthKey);
      values.push(erc725LSP6.encodeValueType('uint128', BigInt(newLength)));

      // New entry at index: AddressPermissions[index]
      const indexKey =
        ERC725YDataKeys.LSP6['AddressPermissions[]'].index +
        currentLength.toString(16).padStart(32, '0');
      keys.push(indexKey);
      values.push(protocolAddress);

      console.log(
        `[UAP Subscribe] Adding protocol at index ${currentLength} (new length: ${newLength})`
      );
    } else {
      console.log(
        '[UAP Subscribe] Protocol already in AddressPermissions[], only updating permissions'
      );
    }

    // =============================================================
    // SECTION 3: UAP Type Config (merge with existing executives)
    // =============================================================

    // Build assistant config data (vault address encoded)
    const assistantConfigData = abiCoder.encode(['address'], [vaultAddress]);

    for (const typeId of [LSP7_TRANSACTION_TYPE, LSP8_TRANSACTION_TYPE]) {
      // Read existing UAPTypeConfig for this type
      const typeConfigKey = erc725UAP.encodeKeyName('UAPTypeConfig:<bytes32>', [
        typeId,
      ]);

      let currentExecutives: string[] = [];
      let executionOrder: number;
      let executivesChanged = false;

      try {
        const currentValue = await upContract.getData(typeConfigKey);
        if (currentValue && currentValue !== '0x') {
          currentExecutives = erc725UAP.decodeValueType(
            'address[]',
            currentValue
          ) as string[];
        }
      } catch (error) {
        console.warn(
          `Could not fetch current executives for ${typeId}:`,
          error
        );
      }

      // Check if forwarder assistant already exists in the array
      const existingIndex = currentExecutives.findIndex(
        addr =>
          addr.toLowerCase() ===
          networkConfig.forwarderAssistantAddress.toLowerCase()
      );

      if (existingIndex >= 0) {
        // Assistant already exists, use its current position
        executionOrder = existingIndex;
        console.log(
          `[UAP Subscribe] Forwarder assistant already at index ${executionOrder} for ${typeId}`
        );
      } else {
        // New assistant, add at the end
        executionOrder = currentExecutives.length;
        currentExecutives.push(networkConfig.forwarderAssistantAddress);
        executivesChanged = true;
        console.log(
          `[UAP Subscribe] Adding forwarder assistant at index ${executionOrder} for ${typeId}`
        );
      }

      // 8-9. Update UAPTypeConfig if executives array changed
      if (executivesChanged) {
        const encodedAssistants = erc725UAP.encodeValueType(
          'address[]',
          currentExecutives
        );
        keys.push(typeConfigKey);
        values.push(encodedAssistants);
      }

      // 10-11. Set UAPExecutiveConfig for the forwarder assistant
      const executiveConfigKey = erc725UAP.encodeKeyName(
        'UAPExecutiveConfig:<bytes32>:<uint256>',
        [typeId, executionOrder.toString()]
      );

      const execData = encodeTupleKeyValue(
        '(address,bytes)',
        [networkConfig.forwarderAssistantAddress, assistantConfigData],
        erc725UAP
      );

      keys.push(executiveConfigKey);
      values.push(execData);

      // =============================================================
      // SECTION 4: Screeners Configuration
      // =============================================================

      // 12-15. Set UAPExecutiveScreeners array (Creator List + Address List)
      const screenersKey = erc725UAP.encodeKeyName(
        'UAPExecutiveScreeners:<bytes32>:<uint256>',
        [typeId, executionOrder.toString()]
      );
      const screeners = [
        networkConfig.creatorListScreenerAddress,
        networkConfig.addressListScreenerAddress,
      ];
      const encodedScreeners = erc725UAP.encodeValueType('address[]', screeners);
      keys.push(screenersKey);
      values.push(encodedScreeners);

      // Set AND logic for screeners (asset only reaches GRAVE if ALL screeners pass)
      const logicKey = erc725UAP.encodeKeyName(
        'UAPExecutiveScreenersANDLogic:<bytes32>:<uint256>',
        [typeId, executionOrder.toString()]
      );
      keys.push(logicKey);
      values.push('0x01'); // AND logic = true

      const executiveBytes = networkConfig.forwarderAssistantAddress
        .toLowerCase()
        .replace('0x', '');

      // Configure Creator List Screener (screener index 0)
      const creatorScreenerOrder = executionOrder * 1000 + 0;
      const creatorScreenerConfigKey = erc725UAP.encodeKeyName(
        'UAPScreenerConfig:<bytes32>:<uint256>',
        [typeId, creatorScreenerOrder.toString()]
      );
      const creatorConfigBytes = abiCoder
        .encode(['bool', 'bool'], [false, false])
        .replace('0x', '');
      const creatorScreenerBytes =
        networkConfig.creatorListScreenerAddress.toLowerCase().replace('0x', '');
      const creatorConfigValue =
        '0x' + executiveBytes + creatorScreenerBytes + creatorConfigBytes;
      keys.push(creatorScreenerConfigKey);
      values.push(creatorConfigValue);

      const creatorListNameKey = erc725UAP.encodeKeyName(
        'UAPAddressListName:<bytes32>:<uint256>',
        [typeId, creatorScreenerOrder.toString()]
      );
      const encodedCreatorListName = erc725UAP.encodeValueType(
        'string',
        'GraveSafeCreators'
      );
      keys.push(creatorListNameKey);
      values.push(encodedCreatorListName);

      // Configure Address List Screener (screener index 1)
      const addressScreenerOrder = executionOrder * 1000 + 1;
      const addressScreenerConfigKey = erc725UAP.encodeKeyName(
        'UAPScreenerConfig:<bytes32>:<uint256>',
        [typeId, addressScreenerOrder.toString()]
      );
      const addressConfigBytes = abiCoder
        .encode(['bool'], [false])
        .replace('0x', '');
      const addressScreenerBytes =
        networkConfig.addressListScreenerAddress.toLowerCase().replace('0x', '');
      const addressConfigValue =
        '0x' + executiveBytes + addressScreenerBytes + addressConfigBytes;
      keys.push(addressScreenerConfigKey);
      values.push(addressConfigValue);

      const addressListNameKey = erc725UAP.encodeKeyName(
        'UAPAddressListName:<bytes32>:<uint256>',
        [typeId, addressScreenerOrder.toString()]
      );
      const encodedAddressListName = erc725UAP.encodeValueType(
        'string',
        'GraveSafeAssets'
      );
      keys.push(addressListNameKey);
      values.push(encodedAddressListName);
    }

    // =============================================================
    // SECTION 5: Initialize empty GraveSafeAssets[] list
    // =============================================================

    // Only write if list doesn't exist yet
    const listLengthKey = erc725UAP.encodeKeyName('GraveSafeAssets[]');
    const existingListLength = await upContract.getData(listLengthKey);

    if (!existingListLength || existingListLength === '0x') {
      // 20. Set GraveSafeAssets[] length to 0 (empty list)
      const listLength = erc725UAP.encodeValueType('uint256', BigInt(0));
      keys.push(listLengthKey);
      values.push(listLength);
      console.log(
        '[UAP Subscribe] No existing GraveSafeAssets list found - initializing empty list'
      );
    } else {
      // Parse existing list length to show count
      const existingCount = Number(
        erc725UAP.decodeValueType('uint256', existingListLength)
      );
      console.log(
        `[UAP Subscribe] Found existing GraveSafeAssets list with ${existingCount} items - preserving and configuring screener to use it`
      );
    }

    // =============================================================
    // SECTION 6: Initialize empty GraveSafeCreators[] list
    // =============================================================

    const creatorListLengthKey = erc725UAP.encodeKeyName('GraveSafeCreators[]');
    const existingCreatorListLength = await upContract.getData(
      creatorListLengthKey
    );

    if (!existingCreatorListLength || existingCreatorListLength === '0x') {
      const listLength = erc725UAP.encodeValueType('uint256', BigInt(0));
      keys.push(creatorListLengthKey);
      values.push(listLength);
      console.log(
        '[UAP Subscribe] No existing GraveSafeCreators list found - initializing empty list'
      );
    } else {
      const existingCount = Number(
        erc725UAP.decodeValueType('uint256', existingCreatorListLength)
      );
      console.log(
        `[UAP Subscribe] Found existing GraveSafeCreators list with ${existingCount} items - preserving and configuring screener to use it`
      );
    }

    // =============================================================
    // Execute single setDataBatch transaction
    // =============================================================

    console.log(`[UAP Subscribe] Writing ${keys.length} keys in single tx`);
    console.log('[UAP Subscribe] Keys:', keys);

    const tx = await upContract.setDataBatch(keys, values);
    await tx.wait();

    console.log(
      '[UAP Subscribe] Successfully subscribed to UAP and configured GRAVE'
    );
  } catch (error) {
    console.error('Error in subscribeAndConfigureGrave:', error);
    throw error;
  }
}
