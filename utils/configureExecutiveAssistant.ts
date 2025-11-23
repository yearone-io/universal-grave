/**
 * Configuration utility for executive assistants following UP Assistants pattern
 * This is adapted from uap-frontend's configureExecutiveAssistantWithUnifiedSystem
 */

import { AbiCoder } from 'ethers';
import ERC725 from '@erc725/erc725.js';

/**
 * Encode a tuple key-value pair following ERC725 format
 * This is the EXACT implementation from @erc725/erc725.js used by UP Assistants
 * It simply concatenates the hex-encoded values (NOT ABI encoding)
 */
function encodeTupleKeyValue(
  valueContent: string, // e.g. "(Address,Bytes)"
  valueType: string,    // e.g. "(address,bytes)"
  decodedValues: any[]
): string {
  const valueTypeParts = valueType
    .substring(1, valueType.length - 1)
    .split(',');
  const valueContentParts = valueContent
    .substring(1, valueContent.length - 1)
    .split(',');

  if (valueTypeParts.length !== decodedValues.length) {
    throw new Error(
      `Can not encode tuple key value: ${decodedValues}. Expected array of length: ${valueTypeParts.length}`
    );
  }

  // Create a temporary ERC725 instance for encoding individual values
  const erc725 = new ERC725([]);

  const returnValue = `0x${valueContentParts
    .map((valueContentPart, i) => {
      const encodedKeyValue = erc725.encodeValueType(
        valueTypeParts[i],
        decodedValues[i]
      );
      if (!encodedKeyValue) {
        return '';
      }
      return encodedKeyValue.slice(2); // Remove 0x prefix
    })
    .join('')}`;

  return returnValue;
}

/**
 * Configure an executive assistant with screeners for a specific transaction type
 * Following the exact pattern from UP Assistants frontend
 */
export default async function configureExecutiveAssistantWithUnifiedSystem(
  erc725UAP: ERC725,
  upContract: any,
  typeId: string,
  assistantAddress: string,
  assistantConfigData: string,
  screenerConfig: {
    enableScreeners: boolean;
    selectedScreeners: string[];
    screenerConfigs: { [screenerId: string]: any };
    useANDLogic: boolean;
  },
  networkId: number,
  supportedNetworks: any
): Promise<{ keys: string[]; values: string[] }> {
  const keys: string[] = [];
  const values: string[] = [];
  const abiCoder = new AbiCoder();

  // STEP 1: Get current executives for this type to determine execution order
  const typeConfigKey = erc725UAP.encodeKeyName('UAPTypeConfig:<bytes32>', [
    typeId,
  ]);
  let currentExecutives: string[] = [];
  let executionOrder: number;

  try {
    const currentValue = await upContract.getData(typeConfigKey);
    if (currentValue && currentValue !== '0x') {
      currentExecutives = erc725UAP.decodeValueType(
        'address[]',
        currentValue
      ) as string[];
    }
  } catch (error) {
    console.warn('Could not fetch current executives:', error);
  }

  // Find existing position or add at end
  const existingIndex = currentExecutives.findIndex(
    addr => addr.toLowerCase() === assistantAddress.toLowerCase()
  );

  if (existingIndex >= 0) {
    // Assistant already exists, use its current position
    executionOrder = existingIndex;
  } else {
    // New assistant, add at the end
    executionOrder = currentExecutives.length;
    currentExecutives.push(assistantAddress);
  }

  // Always update type config to ensure consistency
  // This ensures the UAPTypeConfig is written atomically with the executive config
  const encodedAssistants = erc725UAP.encodeValueType(
    'address[]',
    currentExecutives
  );
  keys.push(typeConfigKey);
  values.push(encodedAssistants);

  // STEP 2: Set Executive Config (assistant address + config data)
  const executiveConfigKey = erc725UAP.encodeKeyName(
    'UAPExecutiveConfig:<bytes32>:<uint256>',
    [typeId, executionOrder.toString()]
  );

  const execData = encodeTupleKeyValue('(Address,Bytes)', '(address,bytes)', [
    assistantAddress,
    assistantConfigData,
  ]);

  keys.push(executiveConfigKey);
  values.push(execData);

  // STEP 3: Configure screeners if enabled
  if (
    screenerConfig.enableScreeners &&
    screenerConfig.selectedScreeners.length > 0
  ) {
    // Extract screener addresses from instance IDs
    const screenerAddresses = screenerConfig.selectedScreeners.map(
      instanceId => {
        // Instance ID format: address_loaded_index or address_index
        return instanceId.split('_')[0];
      }
    );

    // Set screener addresses array
    const screenersKey = erc725UAP.encodeKeyName(
      'UAPExecutiveScreeners:<bytes32>:<uint256>',
      [typeId, executionOrder.toString()]
    );
    const encodedScreeners = erc725UAP.encodeValueType(
      'address[]',
      screenerAddresses
    );
    keys.push(screenersKey);
    values.push(encodedScreeners);

    // Set AND/OR logic
    const logicKey = erc725UAP.encodeKeyName(
      'UAPExecutiveScreenersANDLogic:<bytes32>:<uint256>',
      [typeId, executionOrder.toString()]
    );
    const encodedLogic = screenerConfig.useANDLogic ? '0x01' : '0x00';
    keys.push(logicKey);
    values.push(encodedLogic);

    // Configure each screener
    for (let i = 0; i < screenerConfig.selectedScreeners.length; i++) {
      const instanceId = screenerConfig.selectedScreeners[i];
      const screenerAddress = screenerAddresses[i];
      const config = screenerConfig.screenerConfigs[instanceId] || {};
      const screenerOrder = executionOrder * 1000 + i;

      // Set screener config using manual byte packing
      const screenerConfigKey = erc725UAP.encodeKeyName(
        'UAPScreenerConfig:<bytes32>:<uint256>',
        [typeId, screenerOrder.toString()]
      );

      // Encode screener-specific config data
      let screenerConfigBytes = '0x';

      // Address List Screener
      if (config.addresses !== undefined) {
        // Address List Screener has no inline config (addresses stored in separate list)
        screenerConfigBytes = '0x';
      }
      // Curated List Screener
      else if (config.curatedListAddress !== undefined) {
        // Curated List config: (address curatedList, bool membershipTriggersFailure)
        screenerConfigBytes = abiCoder.encode(
          ['address', 'bool'],
          [config.curatedListAddress, config.membershipTriggersFailure || true]
        );
      }

      // Manual byte packing: executive address + screener address + config data
      const executiveBytes = assistantAddress.toLowerCase().replace('0x', '');
      const screenerBytes = screenerAddress.toLowerCase().replace('0x', '');
      const configBytes = screenerConfigBytes.replace('0x', '');
      const screenerConfigValue =
        '0x' + executiveBytes + screenerBytes + configBytes;

      keys.push(screenerConfigKey);
      values.push(screenerConfigValue);

      // Set address list for Address List Screener
      if (config.addresses !== undefined && config.addresses.length >= 0) {
        // Create unique list name using pattern from uap-frontend
        const listName = `ScreenerList_${typeId.slice(2, 10)}_${screenerOrder}`;

        // Set list name
        const listNameKey = erc725UAP.encodeKeyName(
          'UAPAddressListName:<bytes32>:<uint256>',
          [typeId, screenerOrder.toString()]
        );
        const encodedListName = erc725UAP.encodeValueType('string', listName);
        keys.push(listNameKey);
        values.push(encodedListName);

        // Set address list using LSP5 pattern
        const addresses = config.addresses || [];

        // Set list length
        const listLengthKey = erc725UAP.encodeKeyName(`${listName}[]`);
        const listLength = erc725UAP.encodeValueType(
          'uint256',
          BigInt(addresses.length)
        );
        keys.push(listLengthKey);
        values.push(listLength);

        // Set each address and its mapping
        for (let j = 0; j < addresses.length; j++) {
          const address = addresses[j];

          // Set array item using LSP5 key pattern
          const baseArrayKey = erc725UAP.encodeKeyName(`${listName}[]`);
          const keyPrefix = baseArrayKey.slice(0, 34); // 0x + 32 chars
          const indexBytes16 = j.toString(16).padStart(32, '0');
          const itemKey = keyPrefix + indexBytes16;
          const encodedAddress = erc725UAP.encodeValueType('address', address);
          keys.push(itemKey);
          values.push(encodedAddress);

          // Set mapping for fast lookup
          const mapKey = erc725UAP.encodeKeyName(`${listName}Map:<address>`, [
            address,
          ]);
          const positionHex = j.toString(16).padStart(64, '0');
          const mapValue = '0x00000000' + positionHex; // Generic item type + position
          keys.push(mapKey);
          values.push(mapValue);
        }
      }
    }
  } else {
    // No screeners enabled, clear screener configuration
    const screenersKey = erc725UAP.encodeKeyName(
      'UAPExecutiveScreeners:<bytes32>:<uint256>',
      [typeId, executionOrder.toString()]
    );
    const logicKey = erc725UAP.encodeKeyName(
      'UAPExecutiveScreenersANDLogic:<bytes32>:<uint256>',
      [typeId, executionOrder.toString()]
    );

    keys.push(screenersKey, logicKey);
    values.push('0x', '0x');
  }

  return { keys, values };
}
