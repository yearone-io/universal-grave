import { BrowserProvider, JsonRpcProvider, Contract } from 'ethers';
import { universalProfileAbi } from '@lukso/lsp-smart-contracts/abi';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import { ERC725JSONSchema } from '@erc725/erc725.js';
import uapSchema from '@/schemas/UAP.json';
import { getErc725Read } from '@/utils/erc725Client';
import {
  getForwarderAssistantConfig,
  ForwarderAssistantConfig,
} from './assistantConfig';

const LSP7_TRANSACTION_TYPE = LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification;
const LSP8_TRANSACTION_TYPE = LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification;

export interface OutdatedScreenerInfo {
  oldScreeners: string[];
  expectedScreeners: string[];
  existingVaultAddress: string | null;
  existingWhitelistAddresses: string[];
  existingCreatorAddresses: string[];
  existingConfig: {
    requireAllCreatorsForList: boolean;
    requireAllCreatorsForCuration: boolean;
    curatedListAddress: string | null;
    creatorCuratedListAddress: string | null;
  };
}

export interface ScreenerMigrationResult {
  needsMigration: boolean;
  migrationInfo: OutdatedScreenerInfo | null;
}

/**
 * Detect if a user has outdated screener addresses configured that need migration.
 * This compares the actual screener addresses in the user's UP against the expected
 * network screener addresses.
 */
export async function detectScreenerMigration(
  provider: BrowserProvider | JsonRpcProvider,
  upAddress: string,
  networkConfig: {
    forwarderAssistantAddress: string;
    addressListScreenerAddress: string;
    curatedListScreenerAddress: string;
    creatorListScreenerAddress: string;
    creatorCurationScreenerAddress: string;
  }
): Promise<ScreenerMigrationResult> {
  try {
    const upContract = new Contract(upAddress, universalProfileAbi, provider);
    const erc725UAP = getErc725Read(
      uapSchema as ERC725JSONSchema[],
      upAddress,
      { provider }
    );

    // Expected screener addresses (lowercase for comparison)
    const expectedScreeners = [
      networkConfig.addressListScreenerAddress.toLowerCase(),
      networkConfig.curatedListScreenerAddress.toLowerCase(),
      networkConfig.creatorListScreenerAddress.toLowerCase(),
      networkConfig.creatorCurationScreenerAddress.toLowerCase(),
    ];

    // Read current screener addresses from UP for both LSP7 and LSP8
    const actualScreeners: string[] = [];
    let existingVaultAddress: string | null = null;
    const txTypes = [LSP7_TRANSACTION_TYPE, LSP8_TRANSACTION_TYPE];

    for (const txType of txTypes) {
      // Get executives (assistants) for this tx type
      const typeConfigKey = erc725UAP.encodeKeyName('UAPTypeConfig:<bytes32>', [
        txType,
      ]);
      const typeConfigData = await upContract.getData(typeConfigKey);

      if (!typeConfigData || typeConfigData === '0x') {
        continue;
      }

      let executives: string[];
      try {
        executives = erc725UAP.decodeValueType(
          'address[]',
          typeConfigData
        ) as string[];
      } catch {
        continue;
      }

      // Find forwarder assistant's execution order
      const executionOrder = executives.findIndex(
        (addr: string) =>
          addr.toLowerCase() ===
          networkConfig.forwarderAssistantAddress.toLowerCase()
      );

      if (executionOrder < 0) {
        continue;
      }

      // Read vault address from executive config if we don't have it yet
      if (!existingVaultAddress) {
        try {
          const execConfigKey = erc725UAP.encodeKeyName(
            'UAPExecutiveConfig:<bytes32>:<uint256>',
            [txType, executionOrder.toString()]
          );
          const execConfigData = await upContract.getData(execConfigKey);
          if (execConfigData && execConfigData !== '0x' && execConfigData.length >= 42) {
            // First 20 bytes of the value is the vault address
            const vaultAddr = '0x' + execConfigData.slice(2, 42);
            if (vaultAddr !== '0x0000000000000000000000000000000000000000') {
              existingVaultAddress = vaultAddr;
            }
          }
        } catch {
          // Ignore vault read errors
        }
      }

      // Read screeners array for this forwarder
      const screenersKey = erc725UAP.encodeKeyName(
        'UAPExecutiveScreeners:<bytes32>:<uint256>',
        [txType, executionOrder.toString()]
      );
      const screenersData = await upContract.getData(screenersKey);

      if (!screenersData || screenersData === '0x') {
        continue;
      }

      try {
        const screeners = erc725UAP.decodeValueType(
          'address[]',
          screenersData
        ) as string[];
        for (const s of screeners) {
          const lowerS = s.toLowerCase();
          if (!actualScreeners.includes(lowerS)) {
            actualScreeners.push(lowerS);
          }
        }
      } catch {
        continue;
      }
    }

    // If no screeners configured at all, no migration needed
    if (actualScreeners.length === 0) {
      return { needsMigration: false, migrationInfo: null };
    }

    // Check for any screener that doesn't match expected addresses
    const oldScreeners = actualScreeners.filter(
      addr => !expectedScreeners.includes(addr)
    );

    if (oldScreeners.length === 0) {
      // All screeners are current, no migration needed
      return { needsMigration: false, migrationInfo: null };
    }

    // Migration needed! Read existing config data to preserve during migration
    const config = await getForwarderAssistantConfig(provider, upAddress, {
      forwarderAssistantAddress: networkConfig.forwarderAssistantAddress,
      addressListScreenerAddress: networkConfig.addressListScreenerAddress,
      curatedListScreenerAddress: networkConfig.curatedListScreenerAddress,
      creatorListScreenerAddress: networkConfig.creatorListScreenerAddress,
      creatorCurationScreenerAddress:
        networkConfig.creatorCurationScreenerAddress,
    });

    // Also try to read from old screener addresses to get any data stored there
    const existingData = await readDataFromOldScreeners(
      provider,
      upAddress,
      oldScreeners,
      networkConfig.forwarderAssistantAddress,
      erc725UAP,
      upContract
    );

    // Merge data from old screeners with current config
    const migrationInfo: OutdatedScreenerInfo = {
      oldScreeners,
      expectedScreeners: [
        networkConfig.addressListScreenerAddress,
        networkConfig.curatedListScreenerAddress,
        networkConfig.creatorListScreenerAddress,
        networkConfig.creatorCurationScreenerAddress,
      ],
      existingVaultAddress: existingVaultAddress || config.vaultAddress,
      existingWhitelistAddresses: mergeArrays(
        config.whitelistAddresses,
        existingData.whitelistAddresses
      ),
      existingCreatorAddresses: mergeArrays(
        config.creatorWhitelistAddresses,
        existingData.creatorAddresses
      ),
      existingConfig: {
        requireAllCreatorsForList:
          existingData.requireAllCreatorsForList ??
          config.requireAllCreatorsForList,
        requireAllCreatorsForCuration:
          existingData.requireAllCreatorsForCuration ??
          config.requireAllCreatorsForCuration,
        curatedListAddress:
          existingData.curatedListAddress ?? config.curatedListAddress,
        creatorCuratedListAddress:
          existingData.creatorCuratedListAddress ??
          config.creatorCuratedListAddress,
      },
    };

    return { needsMigration: true, migrationInfo };
  } catch (error) {
    console.error('[detectScreenerMigration] Error:', error);
    return { needsMigration: false, migrationInfo: null };
  }
}

/**
 * Read data from old screener configurations
 */
async function readDataFromOldScreeners(
  provider: BrowserProvider | JsonRpcProvider,
  upAddress: string,
  oldScreenerAddresses: string[],
  forwarderAssistantAddress: string,
  erc725UAP: any,
  upContract: Contract
): Promise<{
  whitelistAddresses: string[];
  creatorAddresses: string[];
  requireAllCreatorsForList: boolean | null;
  requireAllCreatorsForCuration: boolean | null;
  curatedListAddress: string | null;
  creatorCuratedListAddress: string | null;
}> {
  const result = {
    whitelistAddresses: [] as string[],
    creatorAddresses: [] as string[],
    requireAllCreatorsForList: null as boolean | null,
    requireAllCreatorsForCuration: null as boolean | null,
    curatedListAddress: null as string | null,
    creatorCuratedListAddress: null as string | null,
  };

  const txTypes = [LSP7_TRANSACTION_TYPE, LSP8_TRANSACTION_TYPE];

  for (const txType of txTypes) {
    // Get execution order for forwarder
    const typeConfigKey = erc725UAP.encodeKeyName('UAPTypeConfig:<bytes32>', [
      txType,
    ]);
    const typeConfigData = await upContract.getData(typeConfigKey);
    if (!typeConfigData || typeConfigData === '0x') continue;

    let executives: string[];
    try {
      executives = erc725UAP.decodeValueType(
        'address[]',
        typeConfigData
      ) as string[];
    } catch {
      continue;
    }

    const executionOrder = executives.findIndex(
      (addr: string) =>
        addr.toLowerCase() === forwarderAssistantAddress.toLowerCase()
    );
    if (executionOrder < 0) continue;

    // Get screeners for this forwarder
    const screenersKey = erc725UAP.encodeKeyName(
      'UAPExecutiveScreeners:<bytes32>:<uint256>',
      [txType, executionOrder.toString()]
    );
    const screenersData = await upContract.getData(screenersKey);
    if (!screenersData || screenersData === '0x') continue;

    let screeners: string[];
    try {
      screeners = erc725UAP.decodeValueType(
        'address[]',
        screenersData
      ) as string[];
    } catch {
      continue;
    }

    // For each old screener, try to read its data
    for (let i = 0; i < screeners.length; i++) {
      const screenerAddr = screeners[i].toLowerCase();
      if (!oldScreenerAddresses.includes(screenerAddr)) continue;

      const screenerOrder = executionOrder * 1000 + i;

      // Try to read list name
      const listNameKey = erc725UAP.encodeKeyName(
        'UAPAddressListName:<bytes32>:<uint256>',
        [txType, screenerOrder.toString()]
      );
      const listNameData = await upContract.getData(listNameKey);

      let listName: string | null = null;
      if (listNameData && listNameData !== '0x') {
        try {
          listName = erc725UAP.decodeValueType('string', listNameData);
        } catch {
          listName = null;
        }
      }

      // If we have a list name, try to read its contents
      if (listName) {
        const listItems = await readListItems(upContract, erc725UAP, listName);

        if (
          listName === 'GraveSafeAssets' ||
          listName.toLowerCase().includes('asset')
        ) {
          result.whitelistAddresses.push(...listItems);
        } else if (
          listName === 'GraveSafeCreators' ||
          listName.toLowerCase().includes('creator')
        ) {
          result.creatorAddresses.push(...listItems);
        }
      }

      // Try to read screener config
      const configKey = erc725UAP.encodeKeyName(
        'UAPScreenerConfig:<bytes32>:<uint256>',
        [txType, screenerOrder.toString()]
      );
      const configData = await upContract.getData(configKey);

      if (configData && configData !== '0x' && configData.length >= 82) {
        // Config format: executive(20bytes) + screener(20bytes) + configBytes
        const configBytes = '0x' + configData.slice(82);

        // Try to decode based on config bytes length
        // CreatorList: (bool requireAllCreators, bool returnValueWhenInList) = 64 bytes
        // CreatorCuration: (address curatedList, bool requireAll, bool returnValue) = 96 bytes
        // AddressList: (bool returnValueWhenInList) = 32 bytes
        // CuratedList: (address curatedList, bool returnValue) = 64 bytes

        try {
          const { AbiCoder } = await import('ethers');
          const coder = new AbiCoder();

          if (configBytes.length === 66) {
            // 32 bytes = AddressList config
            // Just a bool, nothing useful to extract
          } else if (configBytes.length === 130) {
            // 64 bytes = could be CreatorList or CuratedList
            // Try CreatorList first (bool, bool)
            try {
              const [requireAll] = coder.decode(['bool', 'bool'], configBytes);
              if (typeof requireAll === 'boolean') {
                result.requireAllCreatorsForList = requireAll;
              }
            } catch {
              // Try CuratedList (address, bool)
              try {
                const [addr] = coder.decode(['address', 'bool'], configBytes);
                if (typeof addr === 'string' && addr !== '0x0000000000000000000000000000000000000000') {
                  result.curatedListAddress = addr;
                }
              } catch {
                // Ignore
              }
            }
          } else if (configBytes.length === 194) {
            // 96 bytes = CreatorCuration (address, bool, bool)
            try {
              const [addr, requireAll] = coder.decode(
                ['address', 'bool', 'bool'],
                configBytes
              );
              if (typeof addr === 'string' && addr !== '0x0000000000000000000000000000000000000000') {
                result.creatorCuratedListAddress = addr;
              }
              if (typeof requireAll === 'boolean') {
                result.requireAllCreatorsForCuration = requireAll;
              }
            } catch {
              // Ignore
            }
          }
        } catch {
          // Ignore decode errors
        }
      }
    }
  }

  // Dedupe arrays
  result.whitelistAddresses = [...new Set(result.whitelistAddresses)];
  result.creatorAddresses = [...new Set(result.creatorAddresses)];

  return result;
}

/**
 * Read items from an LSP5-style array
 */
async function readListItems(
  upContract: Contract,
  erc725UAP: any,
  listName: string
): Promise<string[]> {
  try {
    const lengthKey = erc725UAP.encodeKeyName(`${listName}[]`);
    const lengthData = await upContract.getData(lengthKey);

    if (!lengthData || lengthData === '0x') {
      return [];
    }

    let length: number;
    try {
      length = Number(BigInt(lengthData));
    } catch {
      try {
        length = Number(erc725UAP.decodeValueType('uint256', lengthData));
      } catch {
        return [];
      }
    }

    if (length === 0 || length > 1000) {
      // Sanity check
      return [];
    }

    const items: string[] = [];
    const baseKey = erc725UAP.encodeKeyName(`${listName}[]`);
    const baseKeyWithoutLength = baseKey.slice(0, 34); // First 16 bytes

    for (let i = 0; i < length; i++) {
      const indexHex = i.toString(16).padStart(32, '0');
      const itemKey = baseKeyWithoutLength + indexHex;

      try {
        const itemData = await upContract.getData(itemKey);
        if (itemData && itemData !== '0x') {
          // Item is stored as bytes32, address is last 20 bytes
          const addr = '0x' + itemData.slice(-40);
          items.push(addr);
        }
      } catch {
        // Continue on error
      }
    }

    return items;
  } catch (error) {
    console.error('[readListItems] Error reading list:', listName, error);
    return [];
  }
}

/**
 * Merge two arrays, removing duplicates (case-insensitive for addresses)
 */
function mergeArrays(arr1: string[], arr2: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of [...arr1, ...arr2]) {
    const lower = item.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(item);
    }
  }

  return result;
}
