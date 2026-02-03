import {
  BrowserProvider,
  JsonRpcProvider,
  Contract,
  AbiCoder,
  isAddress,
  ethers,
} from 'ethers';
import { universalProfileAbi } from '@lukso/lsp-smart-contracts/abi';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import ERC725 from '@erc725/erc725.js';
import { ERC725JSONSchema } from '@erc725/erc725.js';
import uapSchema from '@/schemas/UAP.json';

// Using LSP7Tokens_RecipientNotification (not SenderNotification) to match UP Assistants
// This is the correct type for Forwarder Assistant which receives tokens on behalf of the UP
const LSP7_TRANSACTION_TYPE = LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification;
const LSP8_TRANSACTION_TYPE = LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification;

export interface ForwarderAssistantConfig {
  vaultAddress: string | null;
  whitelistAddresses: string[];
  curatedListAddress: string | null;
  useCuratedList: boolean;
  isConfigured: boolean;
  executionOrderLSP7: number | null;
  executionOrderLSP8: number | null;
  listName: string | null; // Address list name used by screeners (default: 'GraveSafeAssets')
  listLengthMissing: boolean; // True when list name exists but length key missing
  addressScreenerConfigMissing: boolean; // True when address list screener config key missing
  addressListNameMissing: boolean; // True when address list name key missing
  // Creator filter fields
  creatorWhitelistAddresses: string[];
  creatorCuratedListAddress: string | null;
  requireAllCreatorsForList: boolean; // AND/OR toggle for creator list screener
  requireAllCreatorsForCuration: boolean; // AND/OR toggle for creator curation screener
  creatorListName: string | null; // Address list name for creator screeners (default: 'GraveSafeCreators')
  creatorListLengthMissing: boolean; // True when creator list name exists but length key missing
  creatorScreenerConfigMissing: boolean; // True when creator list screener config key missing
  creatorListNameMissing: boolean; // True when creator list name key missing
}

/**
 * Custom decoding function matching the Solidity contract's decodeExecDataValue logic
 * This matches the UP Assistants implementation for proper compatibility
 */
export const decodeExecDataValue = (
  execDataValue: string
): [string, string] => {
  // Remove 0x prefix if present
  const hexData = execDataValue.startsWith('0x')
    ? execDataValue.slice(2)
    : execDataValue;

  // Must have at least 20 bytes (40 hex chars) for the address
  if (hexData.length < 40) {
    throw new Error('Invalid encoded data: too short');
  }

  // First 20 bytes (40 hex chars) = address
  const addressHex = hexData.slice(0, 40);
  const address = ethers.getAddress('0x' + addressHex);

  // Remaining bytes = config data
  const configDataHex = hexData.slice(40);
  const configBytes = '0x' + configDataHex;

  return [address, configBytes];
};

/**
 * Encode executive config value as address + bytes (UP Assistants format)
 */
export const encodeExecDataValue = (
  assistantAddress: string,
  configBytes: string
): string => {
  const addressHex = assistantAddress.startsWith('0x')
    ? assistantAddress.slice(2)
    : assistantAddress;
  const configHex = configBytes.startsWith('0x')
    ? configBytes.slice(2)
    : configBytes;
  return `0x${addressHex}${configHex}`;
};

/**
 * Updates only the Forwarder Assistant vault address (exec config) without touching screeners or lists.
 */
export async function updateForwarderVaultAddress(
  provider: BrowserProvider,
  upAddress: string,
  vaultAddress: string,
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
  const abiCoder = new AbiCoder();

  if (!isAddress(vaultAddress)) {
    throw new Error('Invalid vault address');
  }

  const assistantConfigData = abiCoder.encode(['address'], [vaultAddress]);
  const execData = encodeExecDataValue(
    networkConfig.forwarderAssistantAddress,
    assistantConfigData
  );

  const keys: string[] = [];
  const values: string[] = [];

  for (const typeId of [LSP7_TRANSACTION_TYPE, LSP8_TRANSACTION_TYPE]) {
    const typeConfigKey = erc725UAP.encodeKeyName('UAPTypeConfig:<bytes32>', [
      typeId,
    ]);
    const typeConfigData = await upContract.getData(typeConfigKey);
    if (!typeConfigData || typeConfigData === '0x') {
      throw new Error('Forwarder assistant not configured for this profile');
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
      throw new Error('Forwarder assistant not configured for this profile');
    }

    const executiveConfigKey = erc725UAP.encodeKeyName(
      'UAPExecutiveConfig:<bytes32>:<uint256>',
      [typeId, executionOrder.toString()]
    );

    keys.push(executiveConfigKey);
    values.push(execData);
  }

  if (keys.length > 0) {
    const tx = await upContract.setDataBatch(keys, values);
    await tx.wait();
  }
}

/**
 * Fetches the current Forwarder Assistant configuration from the Universal Profile
 */
export async function getForwarderAssistantConfig(
  provider: BrowserProvider | JsonRpcProvider,
  upAddress: string,
  networkConfig: {
    forwarderAssistantAddress: string;
    addressListScreenerAddress: string;
    curatedListScreenerAddress: string;
    creatorListScreenerAddress: string;
    creatorCurationScreenerAddress: string;
  }
): Promise<ForwarderAssistantConfig> {
  const upContract = new Contract(upAddress, universalProfileAbi, provider);
  const erc725UAP = new ERC725(
    uapSchema as ERC725JSONSchema[],
    upAddress,
    provider
  );
  const abiCoder = new AbiCoder();

  const config: ForwarderAssistantConfig = {
    vaultAddress: null,
    whitelistAddresses: [],
    curatedListAddress: null,
    useCuratedList: false,
    isConfigured: false,
    executionOrderLSP7: null,
    executionOrderLSP8: null,
    listName: null,
    listLengthMissing: false,
    addressScreenerConfigMissing: false,
    addressListNameMissing: false,
    // Creator filter fields
    creatorWhitelistAddresses: [],
    creatorCuratedListAddress: null,
    requireAllCreatorsForList: false,
    requireAllCreatorsForCuration: false,
    creatorListName: null,
    creatorListLengthMissing: false,
    creatorScreenerConfigMissing: false,
    creatorListNameMissing: false,
  };

  try {
    let addressConfigFound = false;
    let addressConfigMissing = false;
    let addressListNameFound = false;
    let addressListNameMissing = false;
    let creatorConfigFound = false;
    let creatorConfigMissing = false;
    let creatorListNameFound = false;
    let creatorListNameMissing = false;

    // Check both LSP7 and LSP8 configurations to get complete picture
    // We'll merge data from both, with LSP8 taking precedence if there's a conflict
    for (const txType of [LSP7_TRANSACTION_TYPE, LSP8_TRANSACTION_TYPE]) {
      const typeConfigKey = erc725UAP.encodeKeyName('UAPTypeConfig:<bytes32>', [
        txType,
      ]);
      const typeConfigData = await upContract.getData(typeConfigKey);

      if (typeConfigData && typeConfigData !== '0x') {
        try {
          const executives = erc725UAP.decodeValueType(
            'address[]',
            typeConfigData
          ) as string[];

          // Find the Forwarder Assistant in the executive list
          const executionOrder = executives.findIndex(
            addr =>
              addr.toLowerCase() ===
              networkConfig.forwarderAssistantAddress.toLowerCase()
          );

          if (executionOrder !== -1) {
            // Assistant found in executive list - mark as configured
            // Following uap-frontend pattern: if assistant is in the list, it's configured
            config.isConfigured = true;

            // Store execution order for this transaction type
            if (txType === LSP7_TRANSACTION_TYPE) {
              config.executionOrderLSP7 = executionOrder;
            } else if (txType === LSP8_TRANSACTION_TYPE) {
              config.executionOrderLSP8 = executionOrder;
            }

            // 1. Get vault address from Forwarder Assistant executive config (only set once)
            if (!config.vaultAddress) {
              const assistantConfigKey = erc725UAP.encodeKeyName(
                'UAPExecutiveConfig:<bytes32>:<uint256>',
                [txType, executionOrder.toString()]
              );

              console.log('[GRAVE READ] Reading vault address for:', {
                txType,
                executionOrder,
                assistantConfigKey,
              });

              const assistantData =
                await upContract.getData(assistantConfigKey);

              console.log('[GRAVE READ] Raw assistantData:', assistantData);

              if (assistantData && assistantData !== '0x') {
                try {
                  // Decode using decodeExecDataValue - same as UP Assistants
                  const [configAddress, configBytes] =
                    decodeExecDataValue(assistantData);

                  console.log('[GRAVE READ] Decoded data:', {
                    configAddress,
                    configBytes,
                    configBytesLength: configBytes.length,
                  });

                  // Verify configBytes has data before attempting to decode
                  if (
                    configBytes &&
                    configBytes !== '0x' &&
                    configBytes.length >= 66
                  ) {
                    // Decode the vault address from the config bytes
                    // The config bytes contain an ABI-encoded address
                    const abiCoder = new AbiCoder();
                    const [vaultAddr] = abiCoder.decode(
                      ['address'],
                      configBytes
                    );

                    console.log(
                      '[GRAVE READ] Decoded vault address:',
                      vaultAddr
                    );

                    if (
                      vaultAddr &&
                      vaultAddr !== '0x0000000000000000000000000000000000000000'
                    ) {
                      config.vaultAddress = vaultAddr;
                      console.log(
                        '[GRAVE READ] ✅ Successfully set vault address:',
                        vaultAddr
                      );
                    } else {
                      console.warn(
                        '[GRAVE READ] ⚠️ Vault address is zero address'
                      );
                    }
                  } else {
                    console.warn(
                      '[GRAVE READ] ⚠️ configBytes is empty or too short:',
                      configBytes
                    );
                  }
                } catch (error) {
                  console.error(
                    '[GRAVE READ] ❌ Error decoding assistant config:',
                    error
                  );
                  console.error(
                    '[GRAVE READ] Failed on assistantData:',
                    assistantData
                  );
                }
              } else {
                console.warn(
                  '[GRAVE READ] ⚠️ No assistant data found at key:',
                  assistantConfigKey
                );
              }
            }

            // 2. Get screeners for this executive
            const screenersKey = erc725UAP.encodeKeyName(
              'UAPExecutiveScreeners:<bytes32>:<uint256>',
              [txType, executionOrder.toString()]
            );

            const screenersData = await upContract.getData(screenersKey);
            if (screenersData && screenersData !== '0x') {
              try {
                const screeners = erc725UAP.decodeValueType(
                  'address[]',
                  screenersData
                ) as string[];

                // Find Address List Screener and Curated List Screener
                for (let i = 0; i < screeners.length; i++) {
                  const screenerAddr = screeners[i];
                  const screenerOrder = executionOrder * 1000 + i;

                  const screenerConfigKey = erc725UAP.encodeKeyName(
                    'UAPScreenerConfig:<bytes32>:<uint256>',
                    [txType, screenerOrder.toString()]
                  );

                  const screenerConfigData =
                    await upContract.getData(screenerConfigKey);
                  const configIsValid =
                    screenerConfigData &&
                    screenerConfigData !== '0x' &&
                    screenerConfigData.length >= 82;
                  const configBytes = configIsValid
                    ? '0x' + screenerConfigData.slice(82)
                    : null;
                  const isAddressListScreener =
                    screenerAddr.toLowerCase() ===
                    networkConfig.addressListScreenerAddress.toLowerCase();
                  const isCreatorListScreener =
                    screenerAddr.toLowerCase() ===
                    networkConfig.creatorListScreenerAddress.toLowerCase();

                  if (isAddressListScreener) {
                    if (configIsValid) {
                      addressConfigFound = true;
                    } else {
                      addressConfigMissing = true;
                    }
                  }

                  if (isCreatorListScreener) {
                    if (configIsValid) {
                      creatorConfigFound = true;
                    } else {
                      creatorConfigMissing = true;
                    }
                  }

                  if (configIsValid) {
                    // Manual byte unpacking: first 20 bytes = executive, next 20 bytes = screener, rest = config
                    if (isAddressListScreener) {
                      // Address List Screener - addresses are stored in a separate LSP5-style list
                      // Only fetch if we haven't already (from LSP7)
                      if (config.whitelistAddresses.length === 0) {
                        try {
                          const listNameKey = erc725UAP.encodeKeyName(
                            'UAPAddressListName:<bytes32>:<uint256>',
                            [txType, screenerOrder.toString()]
                          );
                          const listNameData =
                            await upContract.getData(listNameKey);
                          if (listNameData && listNameData !== '0x') {
                            const listName = erc725UAP.decodeValueType(
                              'string',
                              listNameData
                            ) as string;
                            addressListNameFound = true;

                            // Capture the list name (only set once from first transaction type)
                            if (!config.listName) {
                              config.listName = listName;
                            }

                            // Fetch the address list using LSP5 pattern
                            try {
                              const listLengthKey = erc725UAP.encodeKeyName(
                                `${listName}[]`
                              );
                              const listLengthRaw =
                                await upContract.getData(listLengthKey);

                              if (listLengthRaw && listLengthRaw !== '0x') {
                                const listLength = Number(
                                  erc725UAP.decodeValueType(
                                    'uint256',
                                    listLengthRaw
                                  )
                                );

                                if (listLength > 0) {
                                  const itemKeys: string[] = [];
                                  for (let j = 0; j < listLength; j++) {
                                    const baseArrayKey =
                                      erc725UAP.encodeKeyName(`${listName}[]`);
                                    const keyPrefix = baseArrayKey.slice(0, 34);
                                    const indexBytes16 = j
                                      .toString(16)
                                      .padStart(32, '0');
                                    const itemKey = keyPrefix + indexBytes16;
                                    itemKeys.push(itemKey);
                                  }

                                  const itemValues =
                                    await upContract.getDataBatch(itemKeys);
                                  config.whitelistAddresses = itemValues
                                    .filter(
                                      (value: any) => value && value !== '0x'
                                    )
                                    .map(
                                      (value: any) =>
                                        erc725UAP.decodeValueType(
                                          'address',
                                          value
                                        ) as string
                                    );
                                }
                              } else {
                                config.listLengthMissing = true;
                              }
                            } catch (listError) {
                              console.warn(
                                'Error fetching address list:',
                                listError
                              );
                            }
                          } else {
                            addressListNameMissing = true;
                          }
                        } catch (error) {
                          console.error(
                            'Error decoding address screener config:',
                            error
                          );
                        }
                      }
                    } else if (
                      screenerAddr.toLowerCase() ===
                      networkConfig.curatedListScreenerAddress.toLowerCase()
                    ) {
                      // Curated List Screener - config should be ABI-encoded as (address, bool)
                      // Only set if we haven't already
                      if (!config.curatedListAddress) {
                        try {
                          // Try to ABI-decode as (address, bool)
                          if (configBytes && configBytes !== '0x') {
                            try {
                              const decoded = abiCoder.decode(
                                ['address', 'bool'],
                                configBytes
                              );
                              const curatedListAddress = decoded[0] as string;
                              const returnValueWhenCurated =
                                decoded[1] as boolean;

                              if (
                                curatedListAddress &&
                                curatedListAddress !==
                                  '0x0000000000000000000000000000000000000000'
                              ) {
                                config.curatedListAddress = curatedListAddress;
                                config.useCuratedList = true;
                              }
                            } catch (decodeError) {
                              // If ABI decoding fails, try legacy format (raw address bytes)
                              console.warn(
                                'Failed to ABI-decode curated list config, trying legacy format'
                              );
                              const configBytesClean = configBytes.replace(
                                '0x',
                                ''
                              );

                              if (configBytesClean.length === 40) {
                                // Raw 20-byte address (40 hex chars) - legacy format
                                const curatedListAddress =
                                  '0x' + configBytesClean;
                                if (
                                  curatedListAddress !==
                                  '0x0000000000000000000000000000000000000000'
                                ) {
                                  config.curatedListAddress =
                                    curatedListAddress;
                                  config.useCuratedList = true;
                                }
                              } else {
                                console.warn(
                                  `Curated list config has unexpected length: ${configBytesClean.length} chars`
                                );
                              }
                            }
                          }
                        } catch (error) {
                          console.error(
                            'Error decoding curated screener config:',
                            error
                          );
                        }
                      }
                    } else if (isCreatorListScreener) {
                      // Creator List Screener - config is ABI-encoded as (bool requireAllCreators, bool returnValueWhenInList)
                      // Addresses are stored in a separate LSP5-style list
                      if (config.creatorWhitelistAddresses.length === 0) {
                        try {
                          // Decode the config to get requireAllCreators
                          if (configBytes && configBytes !== '0x') {
                            try {
                              const decoded = abiCoder.decode(
                                ['bool', 'bool'],
                                configBytes
                              );
                              config.requireAllCreatorsForList =
                                decoded[0] as boolean;
                            } catch (decodeError) {
                              console.warn(
                                'Failed to decode creator list screener config:',
                                decodeError
                              );
                            }
                          }

                          // Fetch the creator address list
                          const listNameKey = erc725UAP.encodeKeyName(
                            'UAPAddressListName:<bytes32>:<uint256>',
                            [txType, screenerOrder.toString()]
                          );
                          const listNameData =
                            await upContract.getData(listNameKey);
                          if (listNameData && listNameData !== '0x') {
                            const listName = erc725UAP.decodeValueType(
                              'string',
                              listNameData
                            ) as string;
                            creatorListNameFound = true;

                            if (!config.creatorListName) {
                              config.creatorListName = listName;
                            }

                            // Fetch the address list using LSP5 pattern
                            try {
                              const listLengthKey = erc725UAP.encodeKeyName(
                                `${listName}[]`
                              );
                              const listLengthRaw =
                                await upContract.getData(listLengthKey);

                              if (listLengthRaw && listLengthRaw !== '0x') {
                                const listLength = Number(
                                  erc725UAP.decodeValueType(
                                    'uint256',
                                    listLengthRaw
                                  )
                                );

                                if (listLength > 0) {
                                  const itemKeys: string[] = [];
                                  for (let j = 0; j < listLength; j++) {
                                    const baseArrayKey =
                                      erc725UAP.encodeKeyName(`${listName}[]`);
                                    const keyPrefix = baseArrayKey.slice(0, 34);
                                    const indexBytes16 = j
                                      .toString(16)
                                      .padStart(32, '0');
                                    const itemKey = keyPrefix + indexBytes16;
                                    itemKeys.push(itemKey);
                                  }

                                  const itemValues =
                                    await upContract.getDataBatch(itemKeys);
                                  config.creatorWhitelistAddresses = itemValues
                                    .filter(
                                      (value: any) => value && value !== '0x'
                                    )
                                    .map(
                                      (value: any) =>
                                        erc725UAP.decodeValueType(
                                          'address',
                                          value
                                        ) as string
                                    );
                                }
                              } else {
                                config.creatorListLengthMissing = true;
                              }
                            } catch (listError) {
                              console.warn(
                                'Error fetching creator address list:',
                                listError
                              );
                            }
                          } else {
                            creatorListNameMissing = true;
                          }
                        } catch (error) {
                          console.error(
                            'Error decoding creator list screener config:',
                            error
                          );
                        }
                      }
                    } else if (
                      screenerAddr.toLowerCase() ===
                      networkConfig.creatorCurationScreenerAddress.toLowerCase()
                    ) {
                      // Creator Curation Screener - config is ABI-encoded as (address curatedListAddress, bool requireAllCreators, bool returnValueWhenCurated)
                      if (!config.creatorCuratedListAddress) {
                        try {
                          if (configBytes && configBytes !== '0x') {
                            try {
                              const decoded = abiCoder.decode(
                                ['address', 'bool', 'bool'],
                                configBytes
                              );
                              const curatedListAddress = decoded[0] as string;
                              config.requireAllCreatorsForCuration =
                                decoded[1] as boolean;

                              if (
                                curatedListAddress &&
                                curatedListAddress !==
                                  '0x0000000000000000000000000000000000000000'
                              ) {
                                config.creatorCuratedListAddress =
                                  curatedListAddress;
                              }
                            } catch (decodeError) {
                              console.warn(
                                'Failed to decode creator curation screener config:',
                                decodeError
                              );
                            }
                          }
                        } catch (error) {
                          console.error(
                            'Error decoding creator curation screener config:',
                            error
                          );
                        }
                      }
                    }
                  }
                }
              } catch (error) {
                console.error('Error decoding screeners:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error decoding type config:', error);
        }
      }
    }

    config.addressScreenerConfigMissing =
      !addressConfigFound && addressConfigMissing;
    config.addressListNameMissing =
      !addressListNameFound && addressListNameMissing;
    config.creatorScreenerConfigMissing =
      !creatorConfigFound && creatorConfigMissing;
    config.creatorListNameMissing =
      !creatorListNameFound && creatorListNameMissing;

    return config;
  } catch (error) {
    console.error('Error fetching forwarder assistant config:', error);
    return config;
  }
}

/**
 * Diagnostics helper: reads raw UAP keys for the Forwarder Assistant
 * to help debug screener config/list issues.
 */
export async function getForwarderAssistantDiagnostics(
  provider: BrowserProvider | JsonRpcProvider,
  upAddress: string,
  networkConfig: {
    forwarderAssistantAddress: string;
    addressListScreenerAddress: string;
    curatedListScreenerAddress: string;
    creatorListScreenerAddress: string;
    creatorCurationScreenerAddress: string;
  }
): Promise<any> {
  const upContract = new Contract(upAddress, universalProfileAbi, provider);
  const erc725UAP = new ERC725(
    uapSchema as ERC725JSONSchema[],
    upAddress,
    provider
  );

  const txTypes = [LSP7_TRANSACTION_TYPE, LSP8_TRANSACTION_TYPE];
  const result: any = {
    upAddress,
    timestamp: new Date().toISOString(),
    txTypes: [],
  };

  for (const txType of txTypes) {
    const entry: any = {
      txType,
      typeConfigKey: erc725UAP.encodeKeyName('UAPTypeConfig:<bytes32>', [
        txType,
      ]),
      typeConfigData: null,
      executives: null,
      executionOrder: null,
      screenersKey: null,
      screenersData: null,
      screeners: [],
      screenersInfo: [],
    };

    try {
      entry.typeConfigData = await upContract.getData(entry.typeConfigKey);
      if (entry.typeConfigData && entry.typeConfigData !== '0x') {
        try {
          entry.executives = erc725UAP.decodeValueType(
            'address[]',
            entry.typeConfigData
          ) as string[];
          entry.executionOrder = entry.executives.findIndex(
            addr =>
              addr.toLowerCase() ===
              networkConfig.forwarderAssistantAddress.toLowerCase()
          );
        } catch (decodeError) {
          entry.executives = null;
          entry.executivesDecodeError =
            (decodeError as Error).message || String(decodeError);
        }
      }

      if (entry.executionOrder !== null && entry.executionOrder >= 0) {
        entry.screenersKey = erc725UAP.encodeKeyName(
          'UAPExecutiveScreeners:<bytes32>:<uint256>',
          [txType, entry.executionOrder.toString()]
        );
        entry.screenersData = await upContract.getData(entry.screenersKey);

        if (entry.screenersData && entry.screenersData !== '0x') {
          try {
            entry.screeners = erc725UAP.decodeValueType(
              'address[]',
              entry.screenersData
            ) as string[];
          } catch (decodeError) {
            entry.screenersDecodeError =
              (decodeError as Error).message || String(decodeError);
          }
        }

        for (let i = 0; i < entry.screeners.length; i++) {
          const screenerAddress = entry.screeners[i];
          const screenerOrder = entry.executionOrder * 1000 + i;
          const screenerConfigKey = erc725UAP.encodeKeyName(
            'UAPScreenerConfig:<bytes32>:<uint256>',
            [txType, screenerOrder.toString()]
          );
          const listNameKey = erc725UAP.encodeKeyName(
            'UAPAddressListName:<bytes32>:<uint256>',
            [txType, screenerOrder.toString()]
          );

          const [screenerConfigData, listNameData] =
            await upContract.getDataBatch([screenerConfigKey, listNameKey]);

          const configValid =
            screenerConfigData &&
            screenerConfigData !== '0x' &&
            screenerConfigData.length >= 82;
          const configBytes = configValid
            ? '0x' + screenerConfigData.slice(82)
            : null;

          let listName: string | null = null;
          if (listNameData && listNameData !== '0x') {
            try {
              listName = erc725UAP.decodeValueType('string', listNameData);
            } catch (decodeError) {
              listName = null;
            }
          }

          let listLengthKey: string | null = null;
          let listLengthData: string | null = null;
          let listLengthDecoded: string | null = null;
          if (listName) {
            listLengthKey = erc725UAP.encodeKeyName(`${listName}[]`);
            listLengthData = await upContract.getData(listLengthKey);
            if (listLengthData && listLengthData !== '0x') {
              try {
                listLengthDecoded = BigInt(listLengthData).toString();
              } catch (decodeError) {
                try {
                  listLengthDecoded = erc725UAP
                    .decodeValueType('uint256', listLengthData)
                    .toString();
                } catch {
                  listLengthDecoded = null;
                }
              }
            }
          }

          entry.screenersInfo.push({
            index: i,
            screenerAddress,
            screenerOrder,
            screenerConfigKey,
            screenerConfigData,
            configValid,
            configBytes,
            listNameKey,
            listNameData,
            listName,
            listLengthKey,
            listLengthData,
            listLengthDecoded,
          });
        }
      }
    } catch (error) {
      entry.error = (error as Error).message || String(error);
    }

    result.txTypes.push(entry);
  }

  return result;
}

/**
 * Helper function to build screener configuration for Forwarder Assistant
 */
function buildForwarderScreenerConfig(
  whitelistAddresses: string[],
  useCuratedList: boolean,
  curatedListAddress: string | null,
  creatorWhitelistAddresses: string[],
  creatorCuratedListAddress: string | null,
  requireAllCreatorsForList: boolean,
  requireAllCreatorsForCuration: boolean,
  networkConfig: {
    addressListScreenerAddress: string;
    curatedListScreenerAddress: string;
    creatorListScreenerAddress: string;
    creatorCurationScreenerAddress: string;
  }
): {
  enableScreeners: boolean;
  selectedScreeners: string[];
  screenerConfigs: { [screenerId: string]: any };
  useANDLogic: boolean;
} {
  const screenerConfig = {
    enableScreeners: false,
    selectedScreeners: [] as string[],
    screenerConfigs: {} as { [screenerId: string]: any },
    useANDLogic: true, // Use AND logic - asset only reaches GRAVE if ALL filters allow it
  };

  // Build screeners list: Creator filters first, then Asset filters
  // With AND logic, any screener failure keeps the asset with the UP
  const screeners: string[] = [];

  // 1. Creator List Screener (always include, even with empty list)
  const validCreatorAddresses = creatorWhitelistAddresses.filter(
    addr => addr.trim() !== '' && isAddress(addr)
  );
  screeners.push(networkConfig.creatorListScreenerAddress);

  // 2. Creator Curation Screener (if curated list configured)
  if (creatorCuratedListAddress && isAddress(creatorCuratedListAddress)) {
    screeners.push(networkConfig.creatorCurationScreenerAddress);
  }

  // 3. Address List Screener (always include, even with empty list)
  screeners.push(networkConfig.addressListScreenerAddress);

  // 4. Curated List Screener (if asset curated list configured)
  if (useCuratedList && curatedListAddress && isAddress(curatedListAddress)) {
    screeners.push(networkConfig.curatedListScreenerAddress);
  }

  if (screeners.length > 0) {
    screenerConfig.enableScreeners = true;

    // Create screener instance IDs and configs
    screeners.forEach((screenerAddr, index) => {
      const instanceId = `${screenerAddr}_loaded_${index}`;
      screenerConfig.selectedScreeners.push(instanceId);

      if (
        screenerAddr.toLowerCase() ===
        networkConfig.creatorListScreenerAddress.toLowerCase()
      ) {
        // Creator List Screener config: requireAllCreators + returnValueWhenInList
        screenerConfig.screenerConfigs[instanceId] = {
          addresses: validCreatorAddresses,
          requireAllCreators: requireAllCreatorsForList,
          returnValueWhenInList: false, // Creators in list = asset goes to UP (fails screening)
        };
      } else if (
        screenerAddr.toLowerCase() ===
        networkConfig.creatorCurationScreenerAddress.toLowerCase()
      ) {
        // Creator Curation Screener config: curatedListAddress + requireAllCreators + returnValueWhenCurated
        screenerConfig.screenerConfigs[instanceId] = {
          curatedListAddress: creatorCuratedListAddress,
          requireAllCreators: requireAllCreatorsForCuration,
          returnValueWhenCurated: false, // Curated creators = asset goes to UP (fails screening)
        };
      } else if (
        screenerAddr.toLowerCase() ===
        networkConfig.addressListScreenerAddress.toLowerCase()
      ) {
        // Address List Screener config: addresses array + returnValueWhenInList boolean
        screenerConfig.screenerConfigs[instanceId] = {
          addresses: whitelistAddresses,
          returnValueWhenInList: false, // Addresses in whitelist should FAIL screening (go to UP)
        };
      } else if (
        screenerAddr.toLowerCase() ===
        networkConfig.curatedListScreenerAddress.toLowerCase()
      ) {
        // Curated List Screener config: contract address and flag
        screenerConfig.screenerConfigs[instanceId] = {
          curatedListAddress: curatedListAddress,
          returnValueWhenCurated: false, // Assets IN the curated list should trigger screening failure (go to UP)
        };
      }
    });
  }

  return screenerConfig;
}

/**
 * Saves the Forwarder Assistant configuration to both LSP7 and LSP8 transaction types
 * Following the UP Assistants pattern using configureExecutiveAssistantWithUnifiedSystem
 */
export async function saveForwarderAssistantConfig(
  provider: BrowserProvider,
  upAddress: string,
  vaultAddress: string,
  whitelistAddresses: string[],
  useCuratedList: boolean,
  curatedListAddress: string | null,
  creatorWhitelistAddresses: string[],
  creatorCuratedListAddress: string | null,
  requireAllCreatorsForList: boolean,
  requireAllCreatorsForCuration: boolean,
  networkConfig: {
    forwarderAssistantAddress: string;
    addressListScreenerAddress: string;
    curatedListScreenerAddress: string;
    creatorListScreenerAddress: string;
    creatorCurationScreenerAddress: string;
  },
  supportedNetworks: any,
  chainId: number,
  options?: {
    forceListNameUpdate?: boolean;
  }
): Promise<void> {
  const signer = await provider.getSigner();
  const upContract = new Contract(upAddress, universalProfileAbi, signer);
  const erc725UAP = new ERC725(
    uapSchema as ERC725JSONSchema[],
    upAddress,
    provider
  );
  const abiCoder = new AbiCoder();

  // Validate inputs
  if (!isAddress(vaultAddress)) {
    throw new Error('Invalid vault address');
  }

  const invalidAddresses = whitelistAddresses.filter(addr => !isAddress(addr));
  if (invalidAddresses.length > 0) {
    throw new Error(
      `Invalid addresses in whitelist: ${invalidAddresses.join(', ')}`
    );
  }

  // Validate creator whitelist addresses (filter out empty ones)
  const validCreatorAddresses = creatorWhitelistAddresses.filter(
    addr => addr.trim() !== ''
  );
  const invalidCreatorAddresses = validCreatorAddresses.filter(
    addr => !isAddress(addr)
  );
  if (invalidCreatorAddresses.length > 0) {
    throw new Error(
      `Invalid addresses in creator whitelist: ${invalidCreatorAddresses.join(', ')}`
    );
  }

  if (
    useCuratedList &&
    (!curatedListAddress || !isAddress(curatedListAddress))
  ) {
    throw new Error('Invalid curated list address');
  }

  if (
    creatorCuratedListAddress &&
    creatorCuratedListAddress.trim() !== '' &&
    !isAddress(creatorCuratedListAddress)
  ) {
    throw new Error('Invalid creator curated list address');
  }

  // Build assistant config data (just the vault address for Forwarder Assistant)
  const assistantConfigData = abiCoder.encode(['address'], [vaultAddress]);

  // OPTIMIZATION: Read current configuration to compare what changed
  console.log('[Optimization] Reading current config to detect changes...');
  const currentConfig = await getForwarderAssistantConfig(
    provider,
    upAddress,
    networkConfig
  );

  // Check if a complete config already exists (required for optimization to work)
  // If no config exists, we must write ALL keys - can't skip anything
  const configExists =
    currentConfig.isConfigured && currentConfig.listName !== null;

  console.log(
    `[Optimization] Config exists: ${configExists} (isConfigured=${currentConfig.isConfigured}, listName=${currentConfig.listName})`
  );

  const forceListNameUpdate = options?.forceListNameUpdate === true;

  // Determine what changed (only meaningful if config already exists)
  const currentHasCreatorList = currentConfig.creatorListName !== null;
  const proposedHasCreatorList = true; // Creator list screener is always included
  const currentHasCreatorCuration =
    currentConfig.creatorCuratedListAddress !== null;
  const proposedHasCreatorCuration =
    !!creatorCuratedListAddress && creatorCuratedListAddress.trim() !== '';

  const changes = {
    vaultChanged: hasVaultChanged(currentConfig.vaultAddress, vaultAddress),
    addressListChanged: compareAddressLists(
      currentConfig.whitelistAddresses,
      whitelistAddresses
    ),
    curatedListChanged: hasCuratedListChanged(
      currentConfig.curatedListAddress,
      curatedListAddress
    ),
    creatorAddressListChanged: compareAddressLists(
      currentConfig.creatorWhitelistAddresses,
      validCreatorAddresses
    ),
    creatorCuratedListChanged: hasCuratedListChanged(
      currentConfig.creatorCuratedListAddress,
      creatorCuratedListAddress
    ),
    requireAllCreatorsChanged:
      currentConfig.requireAllCreatorsForList !== requireAllCreatorsForList ||
      currentConfig.requireAllCreatorsForCuration !==
        requireAllCreatorsForCuration,
    screenerSelectionChanged: haveScreenersChanged(
      currentConfig.useCuratedList,
      useCuratedList,
      currentHasCreatorList,
      proposedHasCreatorList,
      currentHasCreatorCuration,
      proposedHasCreatorCuration
    ),
    listNameMigrationRequested: forceListNameUpdate,
  };

  console.log('[Optimization] Detected changes:', changes);

  // Build screener configuration
  const screenerConfig = buildForwarderScreenerConfig(
    whitelistAddresses,
    useCuratedList,
    curatedListAddress,
    validCreatorAddresses,
    creatorCuratedListAddress,
    requireAllCreatorsForList,
    requireAllCreatorsForCuration,
    networkConfig
  );

  // Import the unified system function from uap-frontend pattern
  const { default: configureExecutiveAssistantWithUnifiedSystem } =
    await import('@/utils/configureExecutiveAssistant');

  const allKeys: string[] = [];
  const allValues: string[] = [];

  // Configure for both LSP7 and LSP8 transaction types
  // Write shared list data only on first iteration to avoid redundant writes
  let isFirstIteration = true;
  for (const typeId of [LSP7_TRANSACTION_TYPE, LSP8_TRANSACTION_TYPE]) {
    const configResult = await configureExecutiveAssistantWithUnifiedSystem(
      erc725UAP,
      upContract,
      typeId,
      networkConfig.forwarderAssistantAddress,
      assistantConfigData,
      screenerConfig,
      chainId,
      supportedNetworks,
      {
        skipSharedListWrite: !isFirstIteration, // Skip on LSP8 (second iteration)
        // Only apply skip optimizations if config already exists
        // If no config exists, we must write ALL keys
        skipExecutiveConfig: configExists && !changes.vaultChanged,
        skipScreenerArray:
          configExists &&
          !changes.screenerSelectionChanged &&
          !changes.listNameMigrationRequested,
        skipScreenerConfigs:
          configExists &&
          !changes.screenerSelectionChanged &&
          !changes.curatedListChanged &&
          !changes.creatorCuratedListChanged &&
          !changes.requireAllCreatorsChanged &&
          !changes.listNameMigrationRequested,
        skipAddressListData:
          configExists &&
          !changes.addressListChanged &&
          !changes.creatorAddressListChanged &&
          !changes.listNameMigrationRequested,
      }
    );

    if (!configResult) {
      throw new Error(
        `Failed to configure Forwarder Assistant for transaction type ${typeId}`
      );
    }

    allKeys.push(...configResult.keys);
    allValues.push(...configResult.values);
    isFirstIteration = false;
  }

  // Calculate savings
  const wouldHaveWritten = (() => {
    // Rough estimate of keys without optimization:
    // - 2x UAPTypeConfig (2)
    // - 2x UAPExecutiveConfig (2)
    // - 2x UAPExecutiveScreeners + logic (4)
    // - 2x UAPScreenerConfig for address list (2)
    // - 2x UAPScreenerConfig for curated list if enabled (2)
    // - 2x UAPAddressListName (2)
    // - 1x GraveSafeAssets[] length + items + maps (~3x addresses)
    const baseKeys = 14 + (useCuratedList ? 2 : 0);
    const listKeys = whitelistAddresses.length * 3; // item + map + length
    return baseKeys + listKeys;
  })();

  const percentSaved = Math.round(
    ((wouldHaveWritten - allKeys.length) / wouldHaveWritten) * 100
  );

  console.log(
    `[Optimization] Writing ${allKeys.length} keys (would have been ~${wouldHaveWritten} without optimization, ${percentSaved}% saved)`
  );

  // Execute the batch transaction
  if (allKeys.length > 0) {
    const tx = await upContract.setDataBatch(allKeys, allValues);
    await tx.wait();
  } else {
    throw new Error('No configuration data generated');
  }
}

/**
 * Compares two address lists for equality (case-insensitive)
 * Returns true if lists differ, false if identical
 */
export function compareAddressLists(
  current: string[],
  proposed: string[]
): boolean {
  if (current.length !== proposed.length) {
    return true; // Different lengths = different
  }

  // Normalize to lowercase for comparison
  const currentNormalized = current.map(addr => addr.toLowerCase()).sort();
  const proposedNormalized = proposed.map(addr => addr.toLowerCase()).sort();

  // Compare each address
  for (let i = 0; i < currentNormalized.length; i++) {
    if (currentNormalized[i] !== proposedNormalized[i]) {
      return true; // Found a difference
    }
  }

  return false; // Lists are identical
}

/**
 * Compares vault addresses (case-insensitive)
 * Returns true if different, false if same
 */
export function hasVaultChanged(
  currentVault: string | null,
  proposedVault: string
): boolean {
  if (!currentVault) return true; // No current vault means it's new
  return currentVault.toLowerCase() !== proposedVault.toLowerCase();
}

/**
 * Compares curated list addresses (case-insensitive)
 * Returns true if different, false if same
 */
export function hasCuratedListChanged(
  currentCuratedList: string | null,
  proposedCuratedList: string | null
): boolean {
  // Both null/empty = no change
  if (!currentCuratedList && !proposedCuratedList) return false;

  // One is null/empty, other isn't = changed
  if (!currentCuratedList || !proposedCuratedList) return true;

  // Both exist, compare case-insensitive
  return currentCuratedList.toLowerCase() !== proposedCuratedList.toLowerCase();
}

/**
 * Compares screener selection (whether screeners were added/removed)
 * Returns true if different, false if same
 */
export function haveScreenersChanged(
  currentUseCuratedList: boolean,
  proposedUseCuratedList: boolean,
  currentHasCreatorList?: boolean,
  proposedHasCreatorList?: boolean,
  currentHasCreatorCuration?: boolean,
  proposedHasCreatorCuration?: boolean
): boolean {
  // For GRAVE, Address List Screener is always present
  // Check if any screener selection has changed
  if (currentUseCuratedList !== proposedUseCuratedList) return true;
  if (currentHasCreatorList !== proposedHasCreatorList) return true;
  if (currentHasCreatorCuration !== proposedHasCreatorCuration) return true;
  return false;
}

/**
 * Fetches all whitelist addresses from both LSP7 and LSP8 screener lists
 * This is used for migration to ensure no addresses are lost
 * Returns merged and deduplicated addresses from both transaction types
 */
export async function getAllWhitelistAddresses(
  provider: BrowserProvider | JsonRpcProvider,
  upAddress: string,
  networkConfig: {
    forwarderAssistantAddress: string;
    addressListScreenerAddress: string;
  }
): Promise<{
  addresses: string[];
  listNameLSP7: string | null;
  listNameLSP8: string | null;
  lsp7Addresses: string[];
  lsp8Addresses: string[];
}> {
  const upContract = new Contract(upAddress, universalProfileAbi, provider);
  const erc725UAP = new ERC725(
    uapSchema as ERC725JSONSchema[],
    upAddress,
    provider
  );

  const result = {
    addresses: [] as string[],
    listNameLSP7: null as string | null,
    listNameLSP8: null as string | null,
    lsp7Addresses: [] as string[],
    lsp8Addresses: [] as string[],
  };

  // Read addresses from both LSP7 and LSP8 separately
  for (const txType of [LSP7_TRANSACTION_TYPE, LSP8_TRANSACTION_TYPE]) {
    try {
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
        addr =>
          addr.toLowerCase() ===
          networkConfig.addressListScreenerAddress.toLowerCase()
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

      // Store list name
      if (txType === LSP7_TRANSACTION_TYPE) {
        result.listNameLSP7 = listName;
      } else {
        result.listNameLSP8 = listName;
      }

      // Fetch addresses from this list
      const listLengthKey = erc725UAP.encodeKeyName(`${listName}[]`);
      const listLengthRaw = await upContract.getData(listLengthKey);

      if (!listLengthRaw || listLengthRaw === '0x') {
        continue;
      }

      const listLength = Number(
        erc725UAP.decodeValueType('uint256', listLengthRaw)
      );

      if (listLength > 0) {
        const itemKeys: string[] = [];
        for (let j = 0; j < listLength; j++) {
          const baseArrayKey = erc725UAP.encodeKeyName(`${listName}[]`);
          const keyPrefix = baseArrayKey.slice(0, 34);
          const indexBytes16 = j.toString(16).padStart(32, '0');
          const itemKey = keyPrefix + indexBytes16;
          itemKeys.push(itemKey);
        }

        const itemValues = await upContract.getDataBatch(itemKeys);
        const addresses = itemValues
          .filter((value: any) => value && value !== '0x')
          .map(
            (value: any) =>
              erc725UAP.decodeValueType('address', value) as string
          );

        if (txType === LSP7_TRANSACTION_TYPE) {
          result.lsp7Addresses = addresses;
        } else {
          result.lsp8Addresses = addresses;
        }
      }
    } catch (error) {
      console.error(`Error reading addresses for ${txType}:`, error);
    }
  }

  // Merge and deduplicate addresses (case-insensitive)
  const addressMap = new Map<string, string>();

  for (const addr of [...result.lsp7Addresses, ...result.lsp8Addresses]) {
    const normalized = addr.toLowerCase();
    if (!addressMap.has(normalized)) {
      addressMap.set(normalized, addr); // Keep original checksum
    }
  }

  result.addresses = Array.from(addressMap.values());

  return result;
}

/**
 * Helper function to calculate screener order
 * Following UP Assistants pattern: screenerOrder = executionOrder * 1000 + screenerIndex
 */
function calculateScreenerOrder(
  executionOrder: number,
  screenerIndex: number
): number {
  return executionOrder * 1000 + screenerIndex;
}

/**
 * Removes the Forwarder Assistant configuration from both LSP7 and LSP8 transaction types
 * This clears all UAP configuration keys and migrates subsequent assistants if necessary
 * Following the UP Assistants pattern from uap-frontend/utils/configDataKeyValueStore.ts
 */
export async function removeForwarderAssistant(
  provider: BrowserProvider,
  upAddress: string,
  networkConfig: {
    forwarderAssistantAddress: string;
    addressListScreenerAddress: string;
    curatedListScreenerAddress: string;
    creatorListScreenerAddress: string;
    creatorCurationScreenerAddress: string;
  }
): Promise<void> {
  const signer = await provider.getSigner();
  const upContract = new Contract(upAddress, universalProfileAbi, signer);
  const erc725UAP = new ERC725(
    uapSchema as ERC725JSONSchema[],
    upAddress,
    provider
  );

  const allKeys: string[] = [];
  const allValues: string[] = [];

  const forwarderAddress =
    networkConfig.forwarderAssistantAddress.toLowerCase();

  // Process both LSP7 and LSP8 transaction types
  for (const typeId of [LSP7_TRANSACTION_TYPE, LSP8_TRANSACTION_TYPE]) {
    console.log(`[Grave Deactivate] Processing typeId: ${typeId}`);

    // PHASE A: Determine Current Position
    const typeConfigKey = erc725UAP.encodeKeyName('UAPTypeConfig:<bytes32>', [
      typeId,
    ]);

    let currentAssistants: string[] = [];
    try {
      const typeConfigValue = await upContract.getData(typeConfigKey);
      if (typeConfigValue && typeConfigValue !== '0x') {
        currentAssistants = erc725UAP.decodeValueType(
          'address[]',
          typeConfigValue
        ) as string[];
      }
    } catch (error) {
      console.warn(`Could not fetch current assistants for ${typeId}:`, error);
    }

    // Find forwarder's index
    const forwarderIndex = currentAssistants.findIndex(
      addr => addr.toLowerCase() === forwarderAddress
    );

    if (forwarderIndex === -1) {
      console.log(
        `[Grave Deactivate] Forwarder not found in ${typeId}, skipping`
      );
      continue;
    }

    console.log(
      `[Grave Deactivate] Found forwarder at index ${forwarderIndex} in ${typeId}`
    );

    // PHASE B: Clear Forwarder's Configuration
    // Get the current config to know which screeners exist
    const currentConfig = await getForwarderAssistantConfig(
      provider,
      upAddress,
      networkConfig
    );

    const executionOrder = forwarderIndex;

    // Clear executive config
    const executiveKey = erc725UAP.encodeKeyName(
      'UAPExecutiveConfig:<bytes32>:<uint256>',
      [typeId, executionOrder.toString()]
    );
    allKeys.push(executiveKey);
    allValues.push('0x');

    // Clear screeners array and logic
    const screenersKey = erc725UAP.encodeKeyName(
      'UAPExecutiveScreeners:<bytes32>:<uint256>',
      [typeId, executionOrder.toString()]
    );
    allKeys.push(screenersKey);
    allValues.push('0x');

    const logicKey = erc725UAP.encodeKeyName(
      'UAPExecutiveScreenersANDLogic:<bytes32>:<uint256>',
      [typeId, executionOrder.toString()]
    );
    allKeys.push(logicKey);
    allValues.push('0x');

    // Clear individual screener configs
    // Screener 0: Address List Screener (always present)
    const addressListScreenerOrder = calculateScreenerOrder(executionOrder, 0);

    const addressListConfigKey = erc725UAP.encodeKeyName(
      'UAPScreenerConfig:<bytes32>:<uint256>',
      [typeId, addressListScreenerOrder.toString()]
    );
    allKeys.push(addressListConfigKey);
    allValues.push('0x');

    const addressListNameKey = erc725UAP.encodeKeyName(
      'UAPAddressListName:<bytes32>:<uint256>',
      [typeId, addressListScreenerOrder.toString()]
    );
    allKeys.push(addressListNameKey);
    allValues.push('0x');

    // Screener 1: Curated List Screener (if enabled)
    if (currentConfig.useCuratedList) {
      const curatedListScreenerOrder = calculateScreenerOrder(
        executionOrder,
        1
      );

      const curatedListConfigKey = erc725UAP.encodeKeyName(
        'UAPScreenerConfig:<bytes32>:<uint256>',
        [typeId, curatedListScreenerOrder.toString()]
      );
      allKeys.push(curatedListConfigKey);
      allValues.push('0x');

      const curatedListNameKey = erc725UAP.encodeKeyName(
        'UAPAddressListName:<bytes32>:<uint256>',
        [typeId, curatedListScreenerOrder.toString()]
      );
      allKeys.push(curatedListNameKey);
      allValues.push('0x');
    }

    // NOTE: We intentionally do NOT clear the shared address list data (GraveSafeAssets)
    // This preserves the user's safe assets list so if they reactivate, their list will still be there

    // PHASE C: Migrate Subsequent Assistants
    if (forwarderIndex < currentAssistants.length - 1) {
      console.log(
        `[Grave Deactivate] Migrating ${currentAssistants.length - forwarderIndex - 1} subsequent assistants`
      );

      for (let i = forwarderIndex + 1; i < currentAssistants.length; i++) {
        const oldIndex = i;
        const newIndex = i - 1;
        const assistantToMigrate = currentAssistants[i];

        console.log(
          `[Grave Deactivate] Migrating assistant ${assistantToMigrate} from ${oldIndex} to ${newIndex}`
        );

        // Read old executive config
        const oldExecutiveKey = erc725UAP.encodeKeyName(
          'UAPExecutiveConfig:<bytes32>:<uint256>',
          [typeId, oldIndex.toString()]
        );
        let executiveValue = '0x';
        try {
          executiveValue = await upContract.getData(oldExecutiveKey);
        } catch (error) {
          console.warn(
            `Could not read executive config for ${assistantToMigrate}:`,
            error
          );
        }

        // Write to new position
        const newExecutiveKey = erc725UAP.encodeKeyName(
          'UAPExecutiveConfig:<bytes32>:<uint256>',
          [typeId, newIndex.toString()]
        );
        allKeys.push(newExecutiveKey);
        allValues.push(executiveValue);

        // Clear old position
        allKeys.push(oldExecutiveKey);
        allValues.push('0x');

        // Migrate screeners array
        const oldScreenersKey = erc725UAP.encodeKeyName(
          'UAPExecutiveScreeners:<bytes32>:<uint256>',
          [typeId, oldIndex.toString()]
        );
        let screenersValue = '0x';
        try {
          screenersValue = await upContract.getData(oldScreenersKey);
        } catch (error) {
          console.warn('Could not read screeners array:', error);
        }

        const newScreenersKey = erc725UAP.encodeKeyName(
          'UAPExecutiveScreeners:<bytes32>:<uint256>',
          [typeId, newIndex.toString()]
        );
        allKeys.push(newScreenersKey);
        allValues.push(screenersValue);
        allKeys.push(oldScreenersKey);
        allValues.push('0x');

        // Migrate AND/OR logic
        const oldLogicKey = erc725UAP.encodeKeyName(
          'UAPExecutiveScreenersANDLogic:<bytes32>:<uint256>',
          [typeId, oldIndex.toString()]
        );
        let logicValue = '0x';
        try {
          logicValue = await upContract.getData(oldLogicKey);
        } catch (error) {
          console.warn('Could not read logic flag:', error);
        }

        const newLogicKey = erc725UAP.encodeKeyName(
          'UAPExecutiveScreenersANDLogic:<bytes32>:<uint256>',
          [typeId, newIndex.toString()]
        );
        allKeys.push(newLogicKey);
        allValues.push(logicValue);
        allKeys.push(oldLogicKey);
        allValues.push('0x');

        // Migrate individual screener configs
        // We need to read the screeners to know how many there are
        let screenerAddresses: string[] = [];
        if (screenersValue && screenersValue !== '0x') {
          try {
            screenerAddresses = erc725UAP.decodeValueType(
              'address[]',
              screenersValue
            ) as string[];
          } catch (error) {
            console.warn('Could not decode screener addresses:', error);
          }
        }

        for (let j = 0; j < screenerAddresses.length; j++) {
          const oldScreenerOrder = calculateScreenerOrder(oldIndex, j);
          const newScreenerOrder = calculateScreenerOrder(newIndex, j);

          // Migrate screener config
          const oldScreenerConfigKey = erc725UAP.encodeKeyName(
            'UAPScreenerConfig:<bytes32>:<uint256>',
            [typeId, oldScreenerOrder.toString()]
          );
          let screenerConfigValue = '0x';
          try {
            screenerConfigValue =
              await upContract.getData(oldScreenerConfigKey);
          } catch (error) {
            console.warn(
              `Could not read screener config at ${oldScreenerOrder}:`,
              error
            );
          }

          const newScreenerConfigKey = erc725UAP.encodeKeyName(
            'UAPScreenerConfig:<bytes32>:<uint256>',
            [typeId, newScreenerOrder.toString()]
          );
          allKeys.push(newScreenerConfigKey);
          allValues.push(screenerConfigValue);
          allKeys.push(oldScreenerConfigKey);
          allValues.push('0x');

          // Migrate address list name
          const oldListNameKey = erc725UAP.encodeKeyName(
            'UAPAddressListName:<bytes32>:<uint256>',
            [typeId, oldScreenerOrder.toString()]
          );
          let listNameValue = '0x';
          try {
            listNameValue = await upContract.getData(oldListNameKey);
          } catch (error) {
            console.warn(
              `Could not read list name at ${oldScreenerOrder}:`,
              error
            );
          }

          const newListNameKey = erc725UAP.encodeKeyName(
            'UAPAddressListName:<bytes32>:<uint256>',
            [typeId, newScreenerOrder.toString()]
          );
          allKeys.push(newListNameKey);
          allValues.push(listNameValue);
          allKeys.push(oldListNameKey);
          allValues.push('0x');
        }
      }
    }

    // PHASE D: Update Type Config Array
    const updatedAssistants = currentAssistants.filter(
      addr => addr.toLowerCase() !== forwarderAddress
    );

    if (updatedAssistants.length === 0) {
      // Last assistant removed, clear the type config
      allKeys.push(typeConfigKey);
      allValues.push('0x');
    } else {
      // Update the array with remaining assistants
      const encodedAssistants = erc725UAP.encodeValueType(
        'address[]',
        updatedAssistants
      );
      allKeys.push(typeConfigKey);
      allValues.push(encodedAssistants);
    }
  }

  // PHASE E: Execute Transaction
  console.log(
    `[Grave Deactivate] Executing setDataBatch with ${allKeys.length} operations`
  );

  const tx = await upContract.setDataBatch(allKeys, allValues);
  await tx.wait();

  console.log('[Grave Deactivate] Successfully removed Forwarder Assistant');
}
