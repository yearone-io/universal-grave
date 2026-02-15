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

const isRecoverableReadError = (error: any) => {
  const message = error?.message?.toLowerCase?.() || '';
  return (
    error?.code === 'CALL_EXCEPTION' ||
    error?.code === 'BAD_DATA' ||
    message.includes('missing revert data') ||
    message.includes('execution reverted') ||
    message.includes('could not decode result data') ||
    message.includes('load failed')
  );
};

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
    if (!isRecoverableReadError(error)) {
      console.error('Error checking UAP subscription:', error);
    }
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
    if (!isRecoverableReadError(error)) {
      console.error('Error getting UAP vault address:', error);
    }
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
    if (!isRecoverableReadError(error)) {
      console.error('Error validating vault:', error);
    }
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
    // IMPORTANT: Only consider GRAVE active if the Forwarder Assistant is properly configured
    // Having a vault in LSP10Vaults[] does NOT mean GRAVE is active - the forwarder must be configured
    let uapVaultAddress: string | null = null;
    let isForwarderConfigured = false;

    if (hasUAPSubscription && networkConfig.forwarderAssistantAddress) {
      // Get vault from Forwarder Assistant config - this is the authoritative source
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
        // Track whether forwarder is configured (this is the key indicator of active protection)
        isForwarderConfigured = assistantConfig.isConfigured;
        uapVaultAddress = assistantConfig.vaultAddress;
      } catch (error) {
        // Forwarder assistant is not configured - GRAVE is NOT active
        isForwarderConfigured = false;
        uapVaultAddress = null;
      }
    }
    // Note: We intentionally don't fall back to getUAPVaultAddress() anymore
    // Having a vault doesn't mean GRAVE is protecting the profile - the forwarder must be configured

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
      // Silently ignore legacy vault check errors
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
          // Silently ignore old forwarder check errors
        }
      }
    }

    const hasLegacyGrave = !!legacyVaultAddress;

    // Determine setup type
    // Use isForwarderConfigured as the key indicator - this means the forwarder is in the executives list
    // uapVaultAddress might be null even when configured if there's a decoding issue
    let setupType: 'none' | 'legacy' | 'uap' | 'both' = 'none';
    if (hasUAPSubscription && isForwarderConfigured && hasLegacyGrave) {
      setupType = 'both';
    } else if (hasUAPSubscription && isForwarderConfigured) {
      setupType = 'uap';
    } else if (hasUAPSubscription && !isForwarderConfigured) {
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
    return {
      hasUAPSubscription: false,
      hasLegacyGrave: false,
      legacyVaultAddress: null,
      uapVaultAddress: null,
      setupType: 'none',
    };
  }
}
