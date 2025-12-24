import {
  BrowserProvider,
  JsonRpcProvider,
  Contract,
  ZeroAddress,
} from 'ethers';
import { ERC725YDataKeys } from '@lukso/lsp-smart-contracts';
import {
  universalProfileAbi,
  lsp9VaultAbi,
} from '@lukso/lsp-smart-contracts/abi';

/**
 * Check if a Universal Profile is subscribed to the UAP protocol
 * @param provider - Ethers provider
 * @param upAddress - Universal Profile address
 * @param protocolAddress - UAP protocol contract address
 * @returns true if subscribed, false otherwise
 */
export async function isSubscribedToUAP(
  provider: BrowserProvider | JsonRpcProvider,
  upAddress: string,
  protocolAddress: string
): Promise<boolean> {
  try {
    const upContract = new Contract(upAddress, universalProfileAbi, provider);
    const urdValue = await upContract.getData(
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate
    );

    // Check if URD is set to UAP protocol address
    return (
      urdValue &&
      urdValue !== '0x' &&
      urdValue.toLowerCase() === protocolAddress.toLowerCase()
    );
  } catch (error) {
    console.error('Error checking UAP subscription:', error);
    return false;
  }
}

/**
 * Get the vault address for a UP from the UAP protocol
 * The vault is stored in the UP's data with a specific key
 * @param provider - Ethers provider
 * @param upAddress - Universal Profile address
 * @returns Vault address or null if not found
 */
export async function getUAPVaultAddress(
  provider: BrowserProvider | JsonRpcProvider,
  upAddress: string
): Promise<string | null> {
  try {
    const upContract = new Contract(upAddress, universalProfileAbi, provider);

    // The vault address is stored under a specific data key in the UP
    // For UAP, vaults are typically stored under LSP10Vaults[] array
    const vaultsData = await upContract.getData(
      ERC725YDataKeys.LSP10['LSP10Vaults[]'].length
    );

    if (!vaultsData || vaultsData === '0x') {
      return null;
    }

    // Get the number of vaults
    const vaultCount = parseInt(vaultsData, 16);

    if (vaultCount === 0) {
      return null;
    }

    // Get the first vault address (index 0)
    // For GRAVE, we'll use the first vault
    const vaultAddressKey =
      ERC725YDataKeys.LSP10['LSP10Vaults[]'].index +
      '00000000000000000000000000000000';
    const vaultAddress = await upContract.getData(vaultAddressKey);

    if (
      !vaultAddress ||
      vaultAddress === '0x' ||
      vaultAddress === ZeroAddress
    ) {
      return null;
    }

    // Convert bytes32 to address (last 20 bytes)
    const addressHex = '0x' + vaultAddress.slice(-40);
    return addressHex;
  } catch (error) {
    console.error('Error getting UAP vault address:', error);
    return null;
  }
}

/**
 * Check if a vault exists and is owned by the UP
 * @param provider - Ethers provider
 * @param vaultAddress - Vault address to check
 * @param expectedOwner - Expected owner address (UP address)
 * @returns true if vault exists and owner matches
 */
export async function isValidVault(
  provider: BrowserProvider | JsonRpcProvider,
  vaultAddress: string,
  expectedOwner: string
): Promise<boolean> {
  try {
    const vaultContract = new Contract(vaultAddress, lsp9VaultAbi, provider);
    const owner = await vaultContract.owner();

    return owner.toLowerCase() === expectedOwner.toLowerCase();
  } catch (error) {
    console.error('Error validating vault:', error);
    return false;
  }
}

/**
 * Detect the GRAVE setup type for a UP
 * @param provider - Ethers provider
 * @param upAddress - Universal Profile address
 * @param networkConfig - Network configuration with protocol addresses
 * @returns Object with setup information
 */
export async function detectGraveSetup(
  provider: BrowserProvider | JsonRpcProvider,
  upAddress: string,
  networkConfig: {
    protocolAddress: string;
    universalGraveForwarder: string;
    previousGraveForwarders: string[];
    forwarderAssistantAddress?: string;
    addressListScreenerAddress?: string;
    curatedListScreenerAddress?: string;
    creatorListScreenerAddress?: string;
    creatorCurationScreenerAddress?: string;
  }
): Promise<{
  hasUAPSubscription: boolean;
  hasLegacyGrave: boolean;
  legacyVaultAddress: string | null;
  uapVaultAddress: string | null;
  setupType: 'none' | 'legacy' | 'uap' | 'both';
}> {
  try {
    // Check UAP subscription
    const hasUAPSubscription = await isSubscribedToUAP(
      provider,
      upAddress,
      networkConfig.protocolAddress
    );

    // Check for UAP vault from Forwarder Assistant configuration
    let uapVaultAddress: string | null = null;
    if (hasUAPSubscription && networkConfig.forwarderAssistantAddress) {
      // Get vault from Forwarder Assistant config instead of random vault from LSP10Vaults[]
      const { getForwarderAssistantConfig } = await import('./assistantConfig');
      try {
        const assistantConfig = await getForwarderAssistantConfig(
          provider,
          upAddress,
          {
            forwarderAssistantAddress: networkConfig.forwarderAssistantAddress,
            addressListScreenerAddress:
              networkConfig.addressListScreenerAddress || '',
            curatedListScreenerAddress:
              networkConfig.curatedListScreenerAddress || '',
            creatorListScreenerAddress:
              networkConfig.creatorListScreenerAddress || '',
            creatorCurationScreenerAddress:
              networkConfig.creatorCurationScreenerAddress || '',
          }
        );
        uapVaultAddress = assistantConfig.vaultAddress;
      } catch (error) {
        console.error(
          'Error getting vault from Forwarder Assistant config:',
          error
        );
        // Fall back to old method if assistant config fails
        uapVaultAddress = await getUAPVaultAddress(provider, upAddress);
      }
    } else if (hasUAPSubscription) {
      // Fallback: use first vault from LSP10Vaults[]
      uapVaultAddress = await getUAPVaultAddress(provider, upAddress);
    }

    // Check for legacy GRAVE vault
    const { getGraveVaultFor } = await import('./universalProfile');
    let legacyVaultAddress: string | null = null;

    // Check current legacy forwarder
    try {
      legacyVaultAddress = await getGraveVaultFor(
        provider,
        upAddress,
        networkConfig.universalGraveForwarder
      );
    } catch (error) {
      console.error('Error checking legacy vault:', error);
    }

    // If no vault found in current forwarder, check previous versions
    if (!legacyVaultAddress) {
      for (const oldForwarder of networkConfig.previousGraveForwarders) {
        try {
          const oldVault = await getGraveVaultFor(
            provider,
            upAddress,
            oldForwarder
          );
          if (oldVault) {
            legacyVaultAddress = oldVault;
            break;
          }
        } catch (error) {
          console.error(`Error checking old forwarder ${oldForwarder}:`, error);
        }
      }
    }

    const hasLegacyGrave = !!legacyVaultAddress;

    // Determine setup type
    let setupType: 'none' | 'legacy' | 'uap' | 'both' = 'none';
    if (hasUAPSubscription && uapVaultAddress && hasLegacyGrave) {
      setupType = 'both';
    } else if (hasUAPSubscription && uapVaultAddress) {
      setupType = 'uap';
    } else if (hasUAPSubscription && !uapVaultAddress) {
      // Has UAP subscription but no Forwarder config - needs configuration
      setupType = 'none';
    } else if (hasLegacyGrave) {
      // Only has legacy GRAVE, no UAP subscription
      setupType = 'legacy';
    }

    return {
      hasUAPSubscription,
      hasLegacyGrave,
      legacyVaultAddress,
      uapVaultAddress,
      setupType,
    };
  } catch (error) {
    console.error('Error detecting GRAVE setup:', error);
    return {
      hasUAPSubscription: false,
      hasLegacyGrave: false,
      legacyVaultAddress: null,
      uapVaultAddress: null,
      setupType: 'none',
    };
  }
}
