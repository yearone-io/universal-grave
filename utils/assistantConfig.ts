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
}

/**
 * Custom decoding function matching the Solidity contract's decodeExecDataValue logic
 * This matches the UP Assistants implementation for proper compatibility
 */
export const decodeExecDataValue = (execDataValue: string): [string, string] => {
  // Remove 0x prefix if present
  const hexData = execDataValue.startsWith('0x') ? execDataValue.slice(2) : execDataValue;

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
 * Fetches the current Forwarder Assistant configuration from the Universal Profile
 */
export async function getForwarderAssistantConfig(
  provider: BrowserProvider | JsonRpcProvider,
  upAddress: string,
  networkConfig: {
    forwarderAssistantAddress: string;
    addressListScreenerAddress: string;
    curatedListScreenerAddress: string;
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
  };

  try {
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
                  const [configAddress, configBytes] = decodeExecDataValue(assistantData);

                  console.log('[GRAVE READ] Decoded data:', {
                    configAddress,
                    configBytes,
                    configBytesLength: configBytes.length,
                  });

                  // Verify configBytes has data before attempting to decode
                  if (configBytes && configBytes !== '0x' && configBytes.length >= 66) {
                    // Decode the vault address from the config bytes
                    // The config bytes contain an ABI-encoded address
                    const abiCoder = new AbiCoder();
                    const [vaultAddr] = abiCoder.decode(['address'], configBytes);

                    console.log('[GRAVE READ] Decoded vault address:', vaultAddr);

                    if (
                      vaultAddr &&
                      vaultAddr !== '0x0000000000000000000000000000000000000000'
                    ) {
                      config.vaultAddress = vaultAddr;
                      console.log('[GRAVE READ] ✅ Successfully set vault address:', vaultAddr);
                    } else {
                      console.warn('[GRAVE READ] ⚠️ Vault address is zero address');
                    }
                  } else {
                    console.warn('[GRAVE READ] ⚠️ configBytes is empty or too short:', configBytes);
                  }
                } catch (error) {
                  console.error('[GRAVE READ] ❌ Error decoding assistant config:', error);
                  console.error('[GRAVE READ] Failed on assistantData:', assistantData);
                }
              } else {
                console.warn('[GRAVE READ] ⚠️ No assistant data found at key:', assistantConfigKey);
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
                  if (
                    screenerConfigData &&
                    screenerConfigData !== '0x' &&
                    screenerConfigData.length >= 82
                  ) {
                    // Manual byte unpacking: first 20 bytes = executive, next 20 bytes = screener, rest = config
                    const configBytes = '0x' + screenerConfigData.slice(82);

                    if (
                      screenerAddr.toLowerCase() ===
                      networkConfig.addressListScreenerAddress.toLowerCase()
                    ) {
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
                              }
                            } catch (listError) {
                              console.warn(
                                'Error fetching address list:',
                                listError
                              );
                            }
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
                              const curatedListAddr = decoded[0] as string;
                              const membershipTriggersFailure =
                                decoded[1] as boolean;

                              if (
                                curatedListAddr &&
                                curatedListAddr !==
                                  '0x0000000000000000000000000000000000000000'
                              ) {
                                config.curatedListAddress = curatedListAddr;
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
                                const curatedListAddr = '0x' + configBytesClean;
                                if (
                                  curatedListAddr !==
                                  '0x0000000000000000000000000000000000000000'
                                ) {
                                  config.curatedListAddress = curatedListAddr;
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

    return config;
  } catch (error) {
    console.error('Error fetching forwarder assistant config:', error);
    return config;
  }
}

/**
 * Helper function to build screener configuration for Forwarder Assistant
 */
function buildForwarderScreenerConfig(
  whitelistAddresses: string[],
  useCuratedList: boolean,
  curatedListAddress: string | null,
  networkConfig: {
    addressListScreenerAddress: string;
    curatedListScreenerAddress: string;
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
    useANDLogic: true, // Always use AND logic for GRAVE
  };

  // Build screeners list: Address List Screener first, then optionally Curated List Screener
  const screeners: string[] = [];

  // Always include Address List Screener (even if whitelist is empty)
  screeners.push(networkConfig.addressListScreenerAddress);

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
        networkConfig.addressListScreenerAddress.toLowerCase()
      ) {
        // Address List Screener config: just the addresses array
        screenerConfig.screenerConfigs[instanceId] = {
          addresses: whitelistAddresses,
        };
      } else if (
        screenerAddr.toLowerCase() ===
        networkConfig.curatedListScreenerAddress.toLowerCase()
      ) {
        // Curated List Screener config: contract address and flag
        screenerConfig.screenerConfigs[instanceId] = {
          curatedListAddress: curatedListAddress,
          membershipTriggersFailure: true, // Assets IN the curated list should trigger screening failure (go to GRAVE)
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
  networkConfig: {
    forwarderAssistantAddress: string;
    addressListScreenerAddress: string;
    curatedListScreenerAddress: string;
  },
  supportedNetworks: any,
  chainId: number
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

  if (
    useCuratedList &&
    (!curatedListAddress || !isAddress(curatedListAddress))
  ) {
    throw new Error('Invalid curated list address');
  }

  // Build assistant config data (just the vault address for Forwarder Assistant)
  const assistantConfigData = abiCoder.encode(['address'], [vaultAddress]);

  // Build screener configuration
  const screenerConfig = buildForwarderScreenerConfig(
    whitelistAddresses,
    useCuratedList,
    curatedListAddress,
    networkConfig
  );

  // Import the unified system function from uap-frontend pattern
  const { default: configureExecutiveAssistantWithUnifiedSystem } =
    await import('@/utils/configureExecutiveAssistant');

  const allKeys: string[] = [];
  const allValues: string[] = [];

  // Configure for both LSP7 and LSP8 transaction types
  for (const typeId of [LSP7_TRANSACTION_TYPE, LSP8_TRANSACTION_TYPE]) {
    const configResult = await configureExecutiveAssistantWithUnifiedSystem(
      erc725UAP,
      upContract,
      typeId,
      networkConfig.forwarderAssistantAddress,
      assistantConfigData,
      screenerConfig,
      chainId,
      supportedNetworks
    );

    if (!configResult) {
      throw new Error(
        `Failed to configure Forwarder Assistant for transaction type ${typeId}`
      );
    }

    allKeys.push(...configResult.keys);
    allValues.push(...configResult.values);
  }

  // Execute the batch transaction
  if (allKeys.length > 0) {
    const tx = await upContract.setDataBatch(allKeys, allValues);
    await tx.wait();
  } else {
    throw new Error('No configuration data generated');
  }
}
