import { BrowserProvider, Contract, AbiCoder } from 'ethers';
import { universalProfileAbi } from '@lukso/lsp-smart-contracts/abi';
import { getChecksumAddress } from './tokenUtils';

const LSP7_TRANSACTION_TYPE =
  '0x429ac7a06903dbc9c13dfcb3c9d11df8194581fa047c96d7a4171fc7402958ea';
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
 * Main function to handle screener updates when reviving an asset.
 * This orchestrates both the address list and curated list screener updates.
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

  // 1. Remove asset from address list screener (if present)
  await removeAssetFromAddressListScreener(
    provider,
    upAddress,
    checksumAssetAddress,
    networkConfig.addressListScreenerAddress,
    networkConfig
  );

  // 2. Check if curated list screener is configured
  const hasCuratedList = await isCuratedListScreenerConfigured(
    provider,
    upAddress,
    networkConfig.curatedListScreenerAddress
  );

  if (hasCuratedList) {
    // 3. Get the curated list address from screener config
    const upContract = new Contract(upAddress, universalProfileAbi, provider);
    const abiCoder = new AbiCoder();
    const screenerKey = `0x${Buffer.from(
      `UAP:Screener:${networkConfig.curatedListScreenerAddress}:${LSP7_TRANSACTION_TYPE}`
    ).toString('hex')}`;

    try {
      const currentData = await upContract.getData(screenerKey);
      if (currentData && currentData !== '0x') {
        const [curatedListAddress] = abiCoder.decode(
          ['address', 'bool'],
          currentData
        );

        // 4. Check if asset is in curated list
        const assetIsInCuratedList = await isAssetInCuratedList(
          provider,
          curatedListAddress,
          checksumAssetAddress
        );

        // 5. If NOT in curated list, add to exception list
        if (!assetIsInCuratedList) {
          await addAssetToCuratedListException(
            provider,
            upAddress,
            checksumAssetAddress,
            networkConfig.curatedListScreenerAddress,
            curatedListAddress
          );
        }
      }
    } catch (error) {
      console.error('Error processing curated list screener update:', error);
    }
  }
}
