import { BrowserProvider, Contract, AbiCoder } from 'ethers';
import { universalProfileAbi } from '@lukso/lsp-smart-contracts/abi';
import { getChecksumAddress } from './tokenUtils';
import ERC725 from '@erc725/erc725.js';
import { ERC725JSONSchema } from '@erc725/erc725.js';
import uapSchema from '@/schemas/UAP.json';

// Using LSP7Tokens_RecipientNotification (not SenderNotification) to match UP Assistants
// This is the correct type for Forwarder Assistant which receives tokens on behalf of the UP
const LSP7_TRANSACTION_TYPE =
  '0x20804611b3e2ea21c480dc465142210acf4a2485947541770ec1fb87dee4a55c';
const LSP8_TRANSACTION_TYPE =
  '0x0b084a55ebf70fd3c06fd755269dac2212c4d3f0f4d09079780bfa50c1b2984d';

/**
 * Updates the Address List Screener to remove an asset address from the whitelist.
 * This is called when reviving an asset - the asset is removed from the trusted sender list.
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
  const abiCoder = new AbiCoder();
  const checksumAssetAddress = getChecksumAddress(assetAddress) as string;

  // Get current whitelist from both LSP7 and LSP8 screener configs
  const keys: string[] = [];
  const values: string[] = [];

  for (const txType of [LSP7_TRANSACTION_TYPE, LSP8_TRANSACTION_TYPE]) {
    const screenerKey = `0x${Buffer.from(
      `UAP:Screener:${addressListScreenerAddress}:${txType}`
    ).toString('hex')}`;

    // Read current configuration
    let currentWhitelist: string[] = [];
    try {
      const currentData = await upContract.getData(screenerKey);
      if (currentData && currentData !== '0x') {
        [currentWhitelist] = abiCoder.decode(['address[]'], currentData);
      }
    } catch (error) {
      console.error(
        'Error reading current address list screener config:',
        error
      );
      currentWhitelist = [];
    }

    // Remove the asset address from the whitelist (case-insensitive)
    const updatedWhitelist = currentWhitelist.filter(
      (addr: string) => getChecksumAddress(addr) !== checksumAssetAddress
    );

    // Only update if something changed
    if (updatedWhitelist.length !== currentWhitelist.length) {
      const updatedConfig = abiCoder.encode(['address[]'], [updatedWhitelist]);
      keys.push(screenerKey);
      values.push(updatedConfig);
    }
  }

  // Execute batch update if there are changes
  if (keys.length > 0) {
    const tx = await upContract.setDataBatch(keys, values);
    await tx.wait();
  }
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

  // Add to whitelist for both LSP7 and LSP8 transaction types
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
      addr =>
        addr.toLowerCase() === forwarderAssistantAddress.toLowerCase()
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

    if (!screenersData || screenersData === '0x') {
      console.warn(`No screeners found for Forwarder Assistant on ${txType}`);
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
      console.warn(`Address List Screener not found for ${txType}`);
      continue;
    }

    const screenerOrder = executionOrder * 1000 + screenerIndex;

    // STEP 3: Get the list name for this screener
    const listNameKey = erc725UAP.encodeKeyName(
      'UAPAddressListName:<bytes32>:<uint256>',
      [txType, screenerOrder.toString()]
    );
    const listNameData = await upContract.getData(listNameKey);

    if (!listNameData || listNameData === '0x') {
      console.warn(`No list name found for Address List Screener on ${txType}`);
      continue;
    }

    const listName = erc725UAP.decodeValueType('string', listNameData) as string;

    // STEP 4: Read current address list
    const listLengthKey = erc725UAP.encodeKeyName(`${listName}[]`);
    const listLengthRaw = await upContract.getData(listLengthKey);

    let currentLength = 0;
    let currentAddresses: string[] = [];

    if (listLengthRaw && listLengthRaw !== '0x') {
      currentLength = Number(
        erc725UAP.decodeValueType('uint256', listLengthRaw)
      );

      if (currentLength > 0) {
        const itemKeys: string[] = [];
        for (let j = 0; j < currentLength; j++) {
          const baseArrayKey = erc725UAP.encodeKeyName(`${listName}[]`);
          const keyPrefix = baseArrayKey.slice(0, 34);
          const indexBytes16 = j.toString(16).padStart(32, '0');
          const itemKey = keyPrefix + indexBytes16;
          itemKeys.push(itemKey);
        }

        const itemValues = await upContract.getDataBatch(itemKeys);
        currentAddresses = itemValues
          .filter((value: any) => value && value !== '0x')
          .map((value: any) =>
            erc725UAP.decodeValueType('address', value) as string
          );
      }
    }

    // STEP 5: Check if asset already in list (case-insensitive)
    const assetAlreadyInList = currentAddresses.some(
      (addr: string) =>
        getChecksumAddress(addr) === checksumAssetAddress
    );

    if (assetAlreadyInList) {
      console.log(`Asset ${checksumAssetAddress} already in whitelist for ${txType}`);
      continue;
    }

    // STEP 6: Add the new address to the list
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
    const baseArrayKey = erc725UAP.encodeKeyName(`${listName}[]`);
    const keyPrefix = baseArrayKey.slice(0, 34);
    const indexBytes16 = newIndex.toString(16).padStart(32, '0');
    const itemKey = keyPrefix + indexBytes16;
    const encodedAddress = erc725UAP.encodeValueType('address', checksumAssetAddress);
    keys.push(itemKey);
    values.push(encodedAddress);

    // Add mapping for fast lookup
    const mapKey = erc725UAP.encodeKeyName(`${listName}Map:<address>`, [
      checksumAssetAddress,
    ]);
    const positionHex = newIndex.toString(16).padStart(64, '0');
    const mapValue = '0x00000000' + positionHex; // Generic item type + position
    keys.push(mapKey);
    values.push(mapValue);
  }

  // Execute batch update if there are changes
  if (keys.length > 0) {
    const tx = await upContract.setDataBatch(keys, values);
    await tx.wait();
  }
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
