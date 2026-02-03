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
  valueType: string, // e.g. "(address,bytes)"
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
 * Compute the minimal diff for updating an address list
 * Only returns keys/values that actually need to change
 */
async function computeAddressListDiff(
  erc725UAP: ERC725,
  upContract: any,
  listName: string,
  proposedAddresses: string[]
): Promise<{ keys: string[]; values: string[] }> {
  const keys: string[] = [];
  const values: string[] = [];

  // Normalize proposed addresses (lowercase, trimmed)
  const normalizedProposed = proposedAddresses.map(addr =>
    addr.trim().toLowerCase()
  );

  // Read current list from blockchain
  const listLengthKey = erc725UAP.encodeKeyName(`${listName}[]`);
  let currentLength = 0;
  let lengthKeyMissing = false;
  const currentAddresses: string[] = [];

  try {
    const lengthValue = await upContract.getData(listLengthKey);
    if (lengthValue && lengthValue !== '0x') {
      currentLength = parseInt(lengthValue, 16);
    } else {
      lengthKeyMissing = true;
    }

    // Read all current entries
    const baseArrayKey = erc725UAP.encodeKeyName(`${listName}[]`);
    const keyPrefix = baseArrayKey.slice(0, 34); // 0x + 32 chars

    for (let i = 0; i < currentLength; i++) {
      const indexBytes16 = i.toString(16).padStart(32, '0');
      const itemKey = keyPrefix + indexBytes16;
      const addressValue = await upContract.getData(itemKey);
      if (addressValue && addressValue !== '0x') {
        // Decode address (last 40 chars of the value)
        const addr = '0x' + addressValue.slice(-40).toLowerCase();
        currentAddresses.push(addr);
      } else {
        currentAddresses.push('');
      }
    }
  } catch (error) {
    console.warn(`[SmartDiff] Could not read current ${listName}:`, error);
  }

  console.log(`[SmartDiff] Current list (${currentLength}):`, currentAddresses);
  console.log(
    `[SmartDiff] Proposed list (${normalizedProposed.length}):`,
    normalizedProposed
  );

  // Build lookup maps for current and proposed
  const currentPositions = new Map<string, number>();
  currentAddresses.forEach((addr, i) => {
    if (addr) currentPositions.set(addr, i);
  });

  const proposedPositions = new Map<string, number>();
  normalizedProposed.forEach((addr, i) => {
    proposedPositions.set(addr, i);
  });

  // Compute key prefix for array items
  const baseArrayKey = erc725UAP.encodeKeyName(`${listName}[]`);
  const keyPrefix = baseArrayKey.slice(0, 34);

  // 1. Length: write if different OR if missing (even when length is 0)
  if (
    currentLength !== normalizedProposed.length ||
    (lengthKeyMissing && normalizedProposed.length === 0)
  ) {
    keys.push(listLengthKey);
    values.push(
      erc725UAP.encodeValueType('uint256', BigInt(normalizedProposed.length))
    );
    console.log(
      `[SmartDiff] Length changed: ${currentLength} -> ${normalizedProposed.length}`
    );
  }

  // 2. Index entries: check each position
  const maxLength = Math.max(currentLength, normalizedProposed.length);
  for (let i = 0; i < maxLength; i++) {
    const currentAddr = currentAddresses[i]?.toLowerCase() || '';
    const proposedAddr = normalizedProposed[i] || '';
    const indexBytes16 = i.toString(16).padStart(32, '0');
    const itemKey = keyPrefix + indexBytes16;

    if (i < normalizedProposed.length) {
      // Position exists in proposed list
      if (currentAddr !== proposedAddr) {
        keys.push(itemKey);
        values.push(erc725UAP.encodeValueType('address', proposedAddr));
        console.log(
          `[SmartDiff] Index[${i}] changed: ${currentAddr || '(empty)'} -> ${proposedAddr}`
        );
      }
    } else {
      // Position is being removed (list is shrinking)
      if (currentAddr) {
        keys.push(itemKey);
        values.push('0x'); // Clear the entry
        console.log(`[SmartDiff] Index[${i}] cleared (was ${currentAddr})`);
      }
    }
  }

  // 3. Map entries: handle additions, removals, and position changes
  // Find removed addresses
  currentPositions.forEach((oldPos, addr) => {
    if (!proposedPositions.has(addr)) {
      // Address was removed - clear its map entry
      const mapKey = erc725UAP.encodeKeyName(`${listName}Map:<address>`, [
        addr,
      ]);
      keys.push(mapKey);
      values.push('0x');
      console.log(`[SmartDiff] Map removed: ${addr}`);
    }
  });

  // Find added or moved addresses
  proposedPositions.forEach((newPos, addr) => {
    const oldPos = currentPositions.get(addr);
    if (oldPos === undefined) {
      // New address - add map entry
      const mapKey = erc725UAP.encodeKeyName(`${listName}Map:<address>`, [
        addr,
      ]);
      const positionHex = newPos.toString(16).padStart(64, '0');
      const mapValue = '0x00000000' + positionHex;
      keys.push(mapKey);
      values.push(mapValue);
      console.log(`[SmartDiff] Map added: ${addr} at position ${newPos}`);
    } else if (oldPos !== newPos) {
      // Address moved position - update map entry
      const mapKey = erc725UAP.encodeKeyName(`${listName}Map:<address>`, [
        addr,
      ]);
      const positionHex = newPos.toString(16).padStart(64, '0');
      const mapValue = '0x00000000' + positionHex;
      keys.push(mapKey);
      values.push(mapValue);
      console.log(
        `[SmartDiff] Map moved: ${addr} from position ${oldPos} to ${newPos}`
      );
    }
  });

  console.log(`[SmartDiff] Total keys to write: ${keys.length}`);
  return { keys, values };
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
  supportedNetworks: any,
  options?: {
    skipSharedListWrite?: boolean; // Skip writing shared list data (for LSP8 when LSP7 already wrote it)
    skipExecutiveConfig?: boolean; // Skip writing executive config if vault hasn't changed
    skipScreenerArray?: boolean; // Skip writing screener addresses array if selection hasn't changed
    skipScreenerConfigs?: boolean; // Skip writing screener config data if configs haven't changed
    skipAddressListData?: boolean; // Skip writing address list items if list hasn't changed (still write list name)
  }
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

  let executivesChanged = false;
  if (existingIndex >= 0) {
    // Assistant already exists, use its current position
    executionOrder = existingIndex;
  } else {
    // New assistant, add at the end
    executionOrder = currentExecutives.length;
    currentExecutives.push(assistantAddress);
    executivesChanged = true;
  }

  // Only update type config if executives array changed
  if (executivesChanged) {
    const encodedAssistants = erc725UAP.encodeValueType(
      'address[]',
      currentExecutives
    );
    keys.push(typeConfigKey);
    values.push(encodedAssistants);
    console.log(`[Optimization] Type config changed, writing UAPTypeConfig`);
  } else {
    console.log(
      `[Optimization] Type config unchanged, skipping UAPTypeConfig write`
    );
  }

  // STEP 2: Set Executive Config (assistant address + config data)
  if (!options?.skipExecutiveConfig) {
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
  } else {
    console.log(
      `[Optimization] Skipping executive config write for ${typeId} (unchanged)`
    );
  }

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

    // Set screener addresses array (skip if selection hasn't changed)
    if (!options?.skipScreenerArray) {
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
    } else {
      console.log(
        `[Optimization] Skipping screener array write for ${typeId} (unchanged)`
      );
    }

    // Configure each screener
    for (let i = 0; i < screenerConfig.selectedScreeners.length; i++) {
      const instanceId = screenerConfig.selectedScreeners[i];
      const screenerAddress = screenerAddresses[i];
      const config = screenerConfig.screenerConfigs[instanceId] || {};
      const screenerOrder = executionOrder * 1000 + i;

      // Determine screener type based on config structure
      const isCreatorListScreener =
        config.addresses !== undefined && config.requireAllCreators !== undefined;
      const isCreatorCurationScreener =
        config.curatedListAddress !== undefined &&
        config.requireAllCreators !== undefined;
      const isAddressListScreener =
        config.addresses !== undefined && config.requireAllCreators === undefined;
      const isCuratedListScreener =
        config.curatedListAddress !== undefined &&
        config.requireAllCreators === undefined;

      // Skip screener config write if configs haven't changed
      // UAPScreenerConfig contains the screener's config (e.g., returnValueWhenInList boolean)
      // This is separate from the address list DATA (GraveSafeAssets[] or GraveSafeCreators[] items)
      if (!options?.skipScreenerConfigs) {
        // Set screener config using manual byte packing
        const screenerConfigKey = erc725UAP.encodeKeyName(
          'UAPScreenerConfig:<bytes32>:<uint256>',
          [typeId, screenerOrder.toString()]
        );

        // Encode screener-specific config data
        let screenerConfigBytes = '0x';

        // Check which screener type we're configuring
        if (isCreatorListScreener) {
          // Creator List Screener: config contains requireAllCreators + returnValueWhenInList
          const requireAllCreators = config.requireAllCreators ?? false;
          const returnValueWhenInList = config.returnValueWhenInList ?? false;
          screenerConfigBytes = abiCoder.encode(
            ['bool', 'bool'],
            [requireAllCreators, returnValueWhenInList]
          );
        } else if (isCreatorCurationScreener) {
          // Creator Curation Screener: config contains (address, requireAllCreators, returnValueWhenCurated)
          const requireAllCreators = config.requireAllCreators ?? false;
          const returnValueWhenCurated = config.returnValueWhenCurated ?? false;
          screenerConfigBytes = abiCoder.encode(
            ['address', 'bool', 'bool'],
            [config.curatedListAddress, requireAllCreators, returnValueWhenCurated]
          );
        } else if (isAddressListScreener) {
          // Address List Screener: config contains returnValueWhenInList boolean
          const returnValueWhenInList = config.returnValueWhenInList ?? false;
          screenerConfigBytes = abiCoder.encode(
            ['bool'],
            [returnValueWhenInList]
          );
        } else if (isCuratedListScreener) {
          // Curated List Screener: config contains (address, bool)
          const returnValueWhenCurated = config.returnValueWhenCurated ?? false;
          screenerConfigBytes = abiCoder.encode(
            ['address', 'bool'],
            [config.curatedListAddress, returnValueWhenCurated]
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
      }

      // Handle address list (including empty lists that need to clear existing data)
      if (config.addresses !== undefined) {
        // Determine list name based on screener type
        // Creator List Screener uses 'GraveSafeCreators'
        // Address List Screener uses 'GraveSafeAssets'
        // Both lists are shared between LSP7 and LSP8 to save ~50% storage
        const listName = isCreatorListScreener ? 'GraveSafeCreators' : 'GraveSafeAssets';

        // Set list name (only write if screener configs are being written, i.e., initial setup or config changed)
        if (!options?.skipScreenerConfigs) {
          const listNameKey = erc725UAP.encodeKeyName(
            'UAPAddressListName:<bytes32>:<uint256>',
            [typeId, screenerOrder.toString()]
          );
          const encodedListName = erc725UAP.encodeValueType('string', listName);
          keys.push(listNameKey);
          values.push(encodedListName);
        } else {
          console.log(
            `[Optimization] Skipping list name write for ${typeId} (unchanged)`
          );
        }

        // Only write shared list data once (skip on subsequent transaction types)
        // Also skip if address list data hasn't changed
        if (!options?.skipSharedListWrite && !options?.skipAddressListData) {
          // Use smart diff to only write keys that actually changed
          const diffResult = await computeAddressListDiff(
            erc725UAP,
            upContract,
            listName,
            config.addresses
          );
          keys.push(...diffResult.keys);
          values.push(...diffResult.values);

          if (diffResult.keys.length === 0) {
            console.log(
              `[Optimization] No address list changes detected for ${typeId}`
            );
          }
        } else if (options?.skipSharedListWrite) {
          console.log(
            `[Optimization] Skipping shared list write for ${typeId} (already written)`
          );
        } else if (options?.skipAddressListData) {
          console.log(
            `[Optimization] Skipping address list write for ${typeId} (unchanged)`
          );
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
