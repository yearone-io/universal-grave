import { BrowserProvider, Contract, AbiCoder } from 'ethers';
import { universalProfileAbi } from '@lukso/lsp-smart-contracts/abi';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { getChecksumAddress } from './tokenUtils';
import ERC725 from '@erc725/erc725.js';
import { ERC725JSONSchema } from '@erc725/erc725.js';
import uapSchema from '@/schemas/UAP.json';

// Using LSP7Tokens_RecipientNotification (not SenderNotification) to match UP Assistants
// This is the correct type for Forwarder Assistant which receives tokens on behalf of the UP
const LSP7_TRANSACTION_TYPE = LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification;
const LSP8_TRANSACTION_TYPE = LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification;

/**
 * Updates the Address List Screener to remove an asset address from the whitelist.
 * This is called when reviving an asset - the asset is removed from the trusted sender list.
 *
 * REWRITTEN to use LSP5-style arrays (matching addAssetToAddressListScreener pattern)
 * Uses swap-and-pop strategy: move last item to removed position, then decrement length
 */
export async function removeAssetFromAddressListScreener(
  provider: BrowserProvider,
  upAddress: string,
  assetAddress: string,
  addressListScreenerAddress: string,
  networkConfig: {
    forwarderAssistantAddress: string;
  }
): Promise<void> {
  const signer = await provider.getSigner();
  const upContract = new Contract(upAddress, universalProfileAbi, signer);
  const erc725UAP = new ERC725(
    uapSchema as ERC725JSONSchema[],
    upAddress,
    provider
  );
  const checksumAssetAddress = getChecksumAddress(assetAddress) as string;

  const keys: string[] = [];
  const values: string[] = [];

  // OPTIMIZATION: Since both LSP7 and LSP8 share the same list name ('GraveSafeAssets'),
  // we only need to update the list once, not twice

  let sharedListName: string | null = null;

  // Find the shared list name (should be 'GraveSafeAssets' for both LSP7 and LSP8)
  for (const txType of [LSP7_TRANSACTION_TYPE, LSP8_TRANSACTION_TYPE]) {
    // Find the Forwarder Assistant's execution order
    const typeConfigKey = erc725UAP.encodeKeyName('UAPTypeConfig:<bytes32>', [
      txType,
    ]);
    const typeConfigData = await upContract.getData(typeConfigKey);

    if (!typeConfigData || typeConfigData === '0x') {
      continue;
    }

    const executives = erc725UAP.decodeValueType(
      'address[]',
      typeConfigData
    ) as string[];

    const executionOrder = executives.findIndex(
      addr =>
        addr.toLowerCase() ===
        networkConfig.forwarderAssistantAddress.toLowerCase()
    );

    if (executionOrder === -1) {
      continue;
    }

    // Find the Address List Screener
    const screenersKey = erc725UAP.encodeKeyName(
      'UAPExecutiveScreeners:<bytes32>:<uint256>',
      [txType, executionOrder.toString()]
    );
    const screenersData = await upContract.getData(screenersKey);

    if (!screenersData || screenersData === '0x') {
      continue;
    }

    const screeners = erc725UAP.decodeValueType(
      'address[]',
      screenersData
    ) as string[];

    const screenerIndex = screeners.findIndex(
      addr => addr.toLowerCase() === addressListScreenerAddress.toLowerCase()
    );

    if (screenerIndex === -1) {
      continue;
    }

    const screenerOrder = executionOrder * 1000 + screenerIndex;

    // Get the list name
    const listNameKey = erc725UAP.encodeKeyName(
      'UAPAddressListName:<bytes32>:<uint256>',
      [txType, screenerOrder.toString()]
    );
    const listNameData = await upContract.getData(listNameKey);

    if (!listNameData || listNameData === '0x') {
      continue;
    }

    const listName = erc725UAP.decodeValueType(
      'string',
      listNameData
    ) as string;

    // Capture the shared list name
    if (!sharedListName) {
      sharedListName = listName;
      console.log(
        `[Optimization] Found shared list name for removal: ${sharedListName}`
      );
    }
  }

  if (!sharedListName) {
    console.warn(
      'No list name found for Address List Screener, nothing to remove'
    );
    return;
  }

  // Read current list length
  const listLengthKey = erc725UAP.encodeKeyName(`${sharedListName}[]`);
  const listLengthRaw = await upContract.getData(listLengthKey);

  if (!listLengthRaw || listLengthRaw === '0x') {
    console.warn('List is empty, nothing to remove');
    return;
  }

  const currentLength = Number(
    erc725UAP.decodeValueType('uint256', listLengthRaw)
  );

  if (currentLength === 0) {
    console.warn('List is empty, nothing to remove');
    return;
  }

  // Find the index of the address to remove using the map
  const mapKey = erc725UAP.encodeKeyName(`${sharedListName}Map:<address>`, [
    checksumAssetAddress,
  ]);
  const mapData = await upContract.getData(mapKey);

  if (!mapData || mapData === '0x') {
    console.log(
      `[Optimization] Asset ${checksumAssetAddress} not in list, skipping removal`
    );
    return; // Address not in list, nothing to remove
  }

  // Decode the position from the map value
  // Format: 0x00000000<position as 32-byte hex>
  const positionHex = mapData.slice(10); // Skip '0x00000000'
  const removedIndex = parseInt(positionHex, 16);

  console.log(
    `[Optimization] Removing asset at index ${removedIndex} from ${sharedListName}`
  );

  // Swap-and-pop strategy: move last item to removed position, then decrement length
  const lastIndex = currentLength - 1;

  if (removedIndex === lastIndex) {
    // Removing last item, just decrement length
    const newLength = currentLength - 1;
    const newLengthEncoded = erc725UAP.encodeValueType(
      'uint256',
      BigInt(newLength)
    );
    keys.push(listLengthKey);
    values.push(newLengthEncoded);

    console.log(
      `[Optimization] Removed last item, writing 1 key (length only)`
    );
  } else {
    // Swap last item into removed position
    const baseArrayKey = erc725UAP.encodeKeyName(`${sharedListName}[]`);
    const keyPrefix = baseArrayKey.slice(0, 34);

    // Read last item
    const lastItemIndexBytes = lastIndex.toString(16).padStart(32, '0');
    const lastItemKey = keyPrefix + lastItemIndexBytes;
    const lastItemData = await upContract.getData(lastItemKey);
    const lastItemAddress = erc725UAP.decodeValueType(
      'address',
      lastItemData
    ) as string;

    // Write last item to removed position
    const removedIndexBytes = removedIndex.toString(16).padStart(32, '0');
    const removedItemKey = keyPrefix + removedIndexBytes;
    keys.push(removedItemKey);
    values.push(lastItemData); // Copy last item data

    // Update map for the swapped item
    const swappedMapKey = erc725UAP.encodeKeyName(
      `${sharedListName}Map:<address>`,
      [lastItemAddress]
    );
    const newPositionHex = removedIndex.toString(16).padStart(64, '0');
    const newMapValue = '0x00000000' + newPositionHex;
    keys.push(swappedMapKey);
    values.push(newMapValue);

    // Decrement length
    const newLength = currentLength - 1;
    const newLengthEncoded = erc725UAP.encodeValueType(
      'uint256',
      BigInt(newLength)
    );
    keys.push(listLengthKey);
    values.push(newLengthEncoded);

    console.log(
      `[Optimization] Swapped last item to removed position, writing 3 keys (item + map + length)`
    );
  }

  // Execute batch update
  const tx = await upContract.setDataBatch(keys, values);
  await tx.wait();
}

/**
 * Updates the Curated List Screener to add an asset to the exception list.
 * This is called when reviving an asset that's NOT in the curated list -
 * adding it to the exception list means it won't be sent to GRAVE anymore.
 */
export async function addAssetToCuratedListException(
  provider: BrowserProvider,
  upAddress: string,
  assetAddress: string,
  curatedListScreenerAddress: string,
  curatedListAddress: string
): Promise<void> {
  const signer = await provider.getSigner();
  const upContract = new Contract(upAddress, universalProfileAbi, signer);
  const abiCoder = new AbiCoder();
  const checksumAssetAddress = getChecksumAddress(assetAddress) as string;

  const keys: string[] = [];
  const values: string[] = [];

  for (const txType of [LSP7_TRANSACTION_TYPE, LSP8_TRANSACTION_TYPE]) {
    // Read current screener configuration
    const screenerKey = `0x${Buffer.from(
      `UAP:Screener:${curatedListScreenerAddress}:${txType}`
    ).toString('hex')}`;

    let currentCuratedList: string = curatedListAddress;
    let currentFlag: boolean = false;

    try {
      const currentData = await upContract.getData(screenerKey);
      if (currentData && currentData !== '0x') {
        [currentCuratedList, currentFlag] = abiCoder.decode(
          ['address', 'bool'],
          currentData
        );
      }
    } catch (error) {
      console.error(
        'Error reading current curated list screener config:',
        error
      );
    }

    // Read current exception list
    const exceptionKey = `0x${Buffer.from(
      `UAP:Screener:${curatedListScreenerAddress}:${txType}:Exceptions`
    ).toString('hex')}`;

    let currentExceptions: string[] = [];
    try {
      const exceptionData = await upContract.getData(exceptionKey);
      if (exceptionData && exceptionData !== '0x') {
        [currentExceptions] = abiCoder.decode(['address[]'], exceptionData);
      }
    } catch (error) {
      console.error('Error reading current exceptions:', error);
      currentExceptions = [];
    }

    // Add asset to exceptions if not already present
    const assetAlreadyInExceptions = currentExceptions.some(
      (addr: string) => getChecksumAddress(addr) === checksumAssetAddress
    );

    if (!assetAlreadyInExceptions) {
      const updatedExceptions = [...currentExceptions, checksumAssetAddress];
      const updatedExceptionData = abiCoder.encode(
        ['address[]'],
        [updatedExceptions]
      );
      keys.push(exceptionKey);
      values.push(updatedExceptionData);
    }
  }

  // Execute batch update if there are changes
  if (keys.length > 0) {
    const tx = await upContract.setDataBatch(keys, values);
    await tx.wait();
  }
}

/**
 * Checks if a curated list screener is configured for this UP
 */
export async function isCuratedListScreenerConfigured(
  provider: BrowserProvider,
  upAddress: string,
  curatedListScreenerAddress: string
): Promise<boolean> {
  const upContract = new Contract(upAddress, universalProfileAbi, provider);
  const abiCoder = new AbiCoder();

  // Check LSP7 configuration as representative
  const screenerKey = `0x${Buffer.from(
    `UAP:Screener:${curatedListScreenerAddress}:${LSP7_TRANSACTION_TYPE}`
  ).toString('hex')}`;

  try {
    const currentData = await upContract.getData(screenerKey);
    if (!currentData || currentData === '0x') {
      return false;
    }
    const [curatedList] = abiCoder.decode(['address', 'bool'], currentData);
    return (
      curatedList &&
      curatedList !== '0x0000000000000000000000000000000000000000'
    );
  } catch (error) {
    console.error('Error checking curated list screener configuration:', error);
    return false;
  }
}

/**
 * Checks if an asset is present in the curated list.
 * This requires calling the curated list contract directly.
 * The exact implementation depends on the curated list contract interface.
 */
export async function isAssetInCuratedList(
  provider: BrowserProvider,
  curatedListAddress: string,
  assetAddress: string
): Promise<boolean> {
  // TODO: This needs to be implemented based on the actual curated list contract interface
  // For now, we'll assume a simple mapping-based check
  // The curated list contract should have a method like `isListed(address) returns (bool)`

  try {
    const curatedListContract = new Contract(
      curatedListAddress,
      [
        'function isListed(address asset) view returns (bool)',
        'function contains(address asset) view returns (bool)',
      ],
      provider
    );

    // Try different possible method names
    try {
      return await curatedListContract.isListed(assetAddress);
    } catch {
      try {
        return await curatedListContract.contains(assetAddress);
      } catch {
        console.warn(
          'Could not determine if asset is in curated list - assuming not listed'
        );
        return false;
      }
    }
  } catch (error) {
    console.error('Error checking if asset is in curated list:', error);
    return false;
  }
}

/**
 * Adds an asset address to the Address List Screener whitelist.
 * This is called when "unblocking" an asset - adding it to the whitelist
 * means future receives of this asset won't be sent to GRAVE.
 *
 * Following the pattern from configureExecutiveAssistant.ts, Address List Screener
 * stores addresses in a separate LSP5-style list, NOT in the screener config bytes.
 */
export async function addAssetToAddressListScreener(
  provider: BrowserProvider,
  upAddress: string,
  assetAddress: string,
  addressListScreenerAddress: string,
  forwarderAssistantAddress: string
): Promise<void> {
  const signer = await provider.getSigner();
  const upContract = new Contract(upAddress, universalProfileAbi, signer);
  const erc725UAP = new ERC725(
    uapSchema as ERC725JSONSchema[],
    upAddress,
    provider
  );
  const checksumAssetAddress = getChecksumAddress(assetAddress) as string;

  const keys: string[] = [];
  const values: string[] = [];

  // OPTIMIZATION: Since both LSP7 and LSP8 now share the same list name ('GraveSafeAssets'),
  // we only need to read/write the list once, not twice
  // We still need to verify the list name is set for both transaction types

  let sharedListName: string | null = null;

  // Track screener info for each transaction type (for auto-creation if needed)
  const screenerInfo: Array<{
    txType: string;
    executionOrder: number;
    screenerOrder: number;
  }> = [];

  // Find the shared list name (should be 'GraveSafeAssets' for both LSP7 and LSP8)
  for (const txType of [LSP7_TRANSACTION_TYPE, LSP8_TRANSACTION_TYPE]) {
    // STEP 1: Find the Forwarder Assistant's execution order for this transaction type
    const typeConfigKey = erc725UAP.encodeKeyName('UAPTypeConfig:<bytes32>', [
      txType,
    ]);
    const typeConfigData = await upContract.getData(typeConfigKey);

    if (!typeConfigData || typeConfigData === '0x') {
      console.warn(`No type config found for ${txType}`);
      continue;
    }

    const executives = erc725UAP.decodeValueType(
      'address[]',
      typeConfigData
    ) as string[];

    const executionOrder = executives.findIndex(
      addr => addr.toLowerCase() === forwarderAssistantAddress.toLowerCase()
    );

    if (executionOrder === -1) {
      console.warn(`Forwarder Assistant not found in executives for ${txType}`);
      continue;
    }

    // STEP 2: Find the Address List Screener in the screeners list
    const screenersKey = erc725UAP.encodeKeyName(
      'UAPExecutiveScreeners:<bytes32>:<uint256>',
      [txType, executionOrder.toString()]
    );
    const screenersData = await upContract.getData(screenersKey);

    let screenerIndex = 0; // Default to first screener position
    let needsScreenersCreation = false;
    let needsLogicCreation = false;
    let needsScreenerConfigCreation = false;
    let needsListNameCreation = false;

    if (!screenersData || screenersData === '0x') {
      console.log(
        `[Auto-create] No screeners found for Forwarder Assistant on ${txType}, will create`
      );
      needsScreenersCreation = true;
      needsLogicCreation = true;
      needsScreenerConfigCreation = true;
      needsListNameCreation = true;
    } else {
      const screeners = erc725UAP.decodeValueType(
        'address[]',
        screenersData
      ) as string[];

      const foundIndex = screeners.findIndex(
        addr => addr.toLowerCase() === addressListScreenerAddress.toLowerCase()
      );

      if (foundIndex === -1) {
        console.warn(
          `[Auto-create] Address List Screener not found in screeners array for ${txType}, will create`
        );
        // Screener exists but Address List Screener not in it - will add to existing array
        screenerIndex = screeners.length; // Add at the end
        needsScreenerConfigCreation = true;
        needsListNameCreation = true;

        // Update screeners array to include Address List Screener
        const updatedScreeners = [...screeners, addressListScreenerAddress];
        const encodedScreeners = erc725UAP.encodeValueType(
          'address[]',
          updatedScreeners
        );
        keys.push(screenersKey);
        values.push(encodedScreeners);
      } else {
        screenerIndex = foundIndex;
      }
    }

    const screenerOrder = executionOrder * 1000 + screenerIndex;

    // Store screener info for all transaction types (even if missing config)
    screenerInfo.push({
      txType,
      executionOrder,
      screenerOrder,
    });

    // STEP 3: Auto-create missing screener configuration keys
    if (needsScreenersCreation) {
      // Create UAPExecutiveScreeners array
      const encodedScreeners = erc725UAP.encodeValueType('address[]', [
        addressListScreenerAddress,
      ]);
      keys.push(screenersKey);
      values.push(encodedScreeners);
      console.log(
        `[Auto-create] Creating UAPExecutiveScreeners for ${txType}`
      );
    }

    if (needsLogicCreation) {
      // Create UAPExecutiveScreenersANDLogic
      const logicKey = erc725UAP.encodeKeyName(
        'UAPExecutiveScreenersANDLogic:<bytes32>:<uint256>',
        [txType, executionOrder.toString()]
      );
      keys.push(logicKey);
      values.push('0x01'); // AND logic
      console.log(
        `[Auto-create] Creating UAPExecutiveScreenersANDLogic for ${txType}`
      );
    }

    if (needsScreenerConfigCreation) {
      // Create UAPScreenerConfig
      const screenerConfigKey = erc725UAP.encodeKeyName(
        'UAPScreenerConfig:<bytes32>:<uint256>',
        [txType, screenerOrder.toString()]
      );

      const abiCoder = new AbiCoder();
      const returnValueWhenInList = false; // Addresses in list should FAIL screening (go to UP)
      const configBytes = abiCoder.encode(['bool'], [returnValueWhenInList]);

      // Manual byte packing: executive + screener + config
      const executiveBytes = forwarderAssistantAddress.toLowerCase().slice(2);
      const screenerBytes = addressListScreenerAddress.toLowerCase().slice(2);
      const screenerConfigValue =
        '0x' + executiveBytes + screenerBytes + configBytes.slice(2);

      keys.push(screenerConfigKey);
      values.push(screenerConfigValue);
      console.log(
        `[Auto-create] Creating UAPScreenerConfig for ${txType} at screenerOrder ${screenerOrder}`
      );
    }

    if (needsListNameCreation) {
      // Check if list name exists, create if missing
      const listNameKey = erc725UAP.encodeKeyName(
        'UAPAddressListName:<bytes32>:<uint256>',
        [txType, screenerOrder.toString()]
      );
      const listNameData = await upContract.getData(listNameKey);

      if (!listNameData || listNameData === '0x') {
        // Will be created below in the shared list name section
        console.log(
          `[Auto-create] List name missing for ${txType}, will create`
        );
      } else {
        const listName = erc725UAP.decodeValueType(
          'string',
          listNameData
        ) as string;

        // Capture the shared list name (should be same for both LSP7 and LSP8)
        if (!sharedListName) {
          sharedListName = listName;
          console.log(`[Optimization] Found shared list name: ${sharedListName}`);
        } else if (listName !== sharedListName) {
          console.warn(
            `[Warning] List names differ! LSP7/LSP8 using different lists: ${sharedListName} vs ${listName}`
          );
        }
      }
    } else {
      // List name should exist, read it
      const listNameKey = erc725UAP.encodeKeyName(
        'UAPAddressListName:<bytes32>:<uint256>',
        [txType, screenerOrder.toString()]
      );
      const listNameData = await upContract.getData(listNameKey);

      if (listNameData && listNameData !== '0x') {
        const listName = erc725UAP.decodeValueType(
          'string',
          listNameData
        ) as string;

        if (!sharedListName) {
          sharedListName = listName;
          console.log(`[Optimization] Found shared list name: ${sharedListName}`);
        } else if (listName !== sharedListName) {
          console.warn(
            `[Warning] List names differ! LSP7/LSP8 using different lists: ${sharedListName} vs ${listName}`
          );
        }
      }
    }
  }

  // Auto-create address list name if not found
  if (!sharedListName) {
    console.log(
      '[Auto-create] Address list name not found, creating with default: GraveSafeAssets'
    );
    sharedListName = 'GraveSafeAssets';
  }

  // Set the list name keys for all transaction types where it's missing
  for (const info of screenerInfo) {
    const listNameKey = erc725UAP.encodeKeyName(
      'UAPAddressListName:<bytes32>:<uint256>',
      [info.txType, info.screenerOrder.toString()]
    );
    const listNameData = await upContract.getData(listNameKey);

    if (!listNameData || listNameData === '0x') {
      const encodedListName = erc725UAP.encodeValueType(
        'string',
        sharedListName
      );
      keys.push(listNameKey);
      values.push(encodedListName);
      console.log(
        `[Auto-create] Creating UAPAddressListName for ${info.txType} with value: ${sharedListName}`
      );
    }
  }

  // STEP 4: Read current address list ONCE (since it's shared)
  const listLengthKey = erc725UAP.encodeKeyName(`${sharedListName}[]`);
  const listLengthRaw = await upContract.getData(listLengthKey);

  let currentLength = 0;
  let currentAddresses: string[] = [];

  if (listLengthRaw && listLengthRaw !== '0x') {
    currentLength = Number(erc725UAP.decodeValueType('uint256', listLengthRaw));

    if (currentLength > 0) {
      const itemKeys: string[] = [];
      for (let j = 0; j < currentLength; j++) {
        const baseArrayKey = erc725UAP.encodeKeyName(`${sharedListName}[]`);
        const keyPrefix = baseArrayKey.slice(0, 34);
        const indexBytes16 = j.toString(16).padStart(32, '0');
        const itemKey = keyPrefix + indexBytes16;
        itemKeys.push(itemKey);
      }

      const itemValues = await upContract.getDataBatch(itemKeys);
      currentAddresses = itemValues
        .filter((value: any) => value && value !== '0x')
        .map(
          (value: any) => erc725UAP.decodeValueType('address', value) as string
        );
    }
  }

  // STEP 5: Check if asset already in list (case-insensitive)
  const assetAlreadyInList = currentAddresses.some(
    (addr: string) => getChecksumAddress(addr) === checksumAssetAddress
  );

  if (assetAlreadyInList) {
    console.log(
      `[Optimization] Asset ${checksumAssetAddress} already in whitelist, skipping write`
    );
    return; // No-op, asset already exists
  }

  // STEP 6: Add the new address to the shared list (ONCE, not per transaction type)
  const newIndex = currentLength;
  const newLength = currentLength + 1;

  // Update list length
  const newLengthEncoded = erc725UAP.encodeValueType(
    'uint256',
    BigInt(newLength)
  );
  keys.push(listLengthKey);
  values.push(newLengthEncoded);

  // Add new array item
  const baseArrayKey = erc725UAP.encodeKeyName(`${sharedListName}[]`);
  const keyPrefix = baseArrayKey.slice(0, 34);
  const indexBytes16 = newIndex.toString(16).padStart(32, '0');
  const itemKey = keyPrefix + indexBytes16;
  const encodedAddress = erc725UAP.encodeValueType(
    'address',
    checksumAssetAddress
  );
  keys.push(itemKey);
  values.push(encodedAddress);

  // Add mapping for fast lookup
  const mapKey = erc725UAP.encodeKeyName(`${sharedListName}Map:<address>`, [
    checksumAssetAddress,
  ]);
  const positionHex = newIndex.toString(16).padStart(64, '0');
  const mapValue = '0x00000000' + positionHex; // Generic item type + position
  keys.push(mapKey);
  values.push(mapValue);

  console.log(
    `[Optimization] Adding asset to shared list. Writing 3 keys instead of 6`
  );

  // Execute batch update
  const tx = await upContract.setDataBatch(keys, values);
  await tx.wait();
}

/**
 * Main function to handle screener updates when reviving an asset.
 * Adds the asset address to the Address List Screener whitelist,
 * which prevents future receives of this asset from being sent to GRAVE.
 */
export async function updateScreenersOnRevive(
  provider: BrowserProvider,
  upAddress: string,
  assetAddress: string,
  networkConfig: {
    forwarderAssistantAddress: string;
    addressListScreenerAddress: string;
    curatedListScreenerAddress: string;
  }
): Promise<void> {
  const checksumAssetAddress = getChecksumAddress(assetAddress) as string;

  // Add asset to Address List Screener whitelist
  // This is the "unblock" action - asset will no longer be sent to GRAVE
  await addAssetToAddressListScreener(
    provider,
    upAddress,
    checksumAssetAddress,
    networkConfig.addressListScreenerAddress,
    networkConfig.forwarderAssistantAddress
  );
}
