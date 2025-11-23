import { BrowserProvider, Contract, ZeroAddress } from 'ethers';
import { ERC725YDataKeys, INTERFACE_IDS } from '@lukso/lsp-smart-contracts';
import { universalProfileAbi } from '@lukso/lsp-smart-contracts/abi';

/**
 * Register an existing vault with a Universal Profile
 * This adds the vault to the UP's LSP10Vaults[] array
 * @param provider - Browser provider with signer
 * @param upAddress - Universal Profile address
 * @param vaultAddress - Vault address to register
 */
export async function registerVaultWithUP(
  provider: BrowserProvider,
  upAddress: string,
  vaultAddress: string
): Promise<void> {
  try {
    console.log('=== registerVaultWithUP called ===');
    console.log('UP Address:', upAddress);
    console.log('Vault Address:', vaultAddress);

    const signer = await provider.getSigner();
    const upContract = new Contract(upAddress, universalProfileAbi, signer);

    // Get current vaults array length
    const lengthKey = ERC725YDataKeys.LSP10['LSP10Vaults[]'].length;
    console.log('Getting current vault array length...');
    const currentLengthData = await upContract.getData(lengthKey);
    const currentLength =
      currentLengthData === '0x' ? 0 : parseInt(currentLengthData, 16);
    console.log('Current vaults count:', currentLength);

    // Prepare data keys and values to add vault
    const newLength = currentLength + 1;
    const indexKey =
      ERC725YDataKeys.LSP10['LSP10Vaults[]'].index +
      currentLength.toString(16).padStart(32, '0');

    const keys = [
      lengthKey, // Update array length
      indexKey, // Add vault at new index
      ERC725YDataKeys.LSP10.LSP10VaultsMap + vaultAddress.substring(2), // Map vault address
    ];

    // LSP10VaultsMap value format: bytes4 (interface ID) + uint128 (index)
    // Interface ID for LSP9Vault is 0x28af17e6 (4 bytes)
    // Index is the position in the LSP10Vaults[] array (16 bytes / 128 bits)
    const interfaceId = INTERFACE_IDS.LSP9Vault.substring(2); // Remove '0x'
    const indexAsBytes16 = currentLength.toString(16).padStart(32, '0'); // 16 bytes = 32 hex chars

    const values = [
      '0x' + newLength.toString(16).padStart(64, '0'), // New length as bytes32
      vaultAddress.toLowerCase(), // Vault address
      '0x' + interfaceId + indexAsBytes16, // Interface ID (4 bytes) + index (16 bytes)
    ];

    console.log('Keys to set:', keys);
    console.log('Values to set:', values);
    console.log('Calling setDataBatch on UP contract...');

    // Set data on UP
    const tx = await (upContract as any).setDataBatch(keys, values);
    console.log('Transaction sent! Hash:', tx.hash);
    console.log('Waiting for transaction confirmation...');
    await tx.wait();

    console.log('✅ Vault registered with UP:', vaultAddress);
  } catch (error) {
    console.error('❌ Error registering vault with UP:', error);
    throw error;
  }
}

/**
 * Check if a vault is already registered with a UP
 * @param provider - Provider
 * @param upAddress - Universal Profile address
 * @param vaultAddress - Vault address to check
 * @returns true if vault is registered
 */
export async function isVaultRegistered(
  provider: BrowserProvider,
  upAddress: string,
  vaultAddress: string
): Promise<boolean> {
  try {
    const upContract = new Contract(upAddress, universalProfileAbi, provider);

    // Check if vault exists in LSP10VaultsMap
    const mapKey =
      ERC725YDataKeys.LSP10.LSP10VaultsMap + vaultAddress.substring(2);
    const mapValue = await upContract.getData(mapKey);

    return mapValue !== '0x' && mapValue !== ZeroAddress;
  } catch (error) {
    console.error('Error checking if vault is registered:', error);
    return false;
  }
}

/**
 * Get all vaults registered with a UP
 * @param provider - Provider
 * @param upAddress - Universal Profile address
 * @returns Array of vault addresses
 */
export async function getRegisteredVaults(
  provider: BrowserProvider,
  upAddress: string
): Promise<string[]> {
  try {
    const upContract = new Contract(upAddress, universalProfileAbi, provider);

    // Get vaults array length
    const lengthKey = ERC725YDataKeys.LSP10['LSP10Vaults[]'].length;
    const lengthData = await upContract.getData(lengthKey);

    if (!lengthData || lengthData === '0x') {
      return [];
    }

    const vaultCount = parseInt(lengthData, 16);
    const vaults: string[] = [];

    console.log('[VAULT FETCH] Total vault count from LSP10Vaults[].length:', vaultCount);

    // Fetch each vault address
    for (let i = 0; i < vaultCount; i++) {
      const indexKey =
        ERC725YDataKeys.LSP10['LSP10Vaults[]'].index +
        i.toString(16).padStart(32, '0');
      const vaultData = await upContract.getData(indexKey);

      console.log(`[VAULT FETCH] Index ${i}:`, {
        indexKey,
        vaultData,
      });

      if (vaultData && vaultData !== '0x') {
        // Convert bytes32 to address
        const vaultAddress = '0x' + vaultData.slice(-40);
        vaults.push(vaultAddress);
        console.log(`[VAULT FETCH] ✅ Added vault ${i}:`, vaultAddress);
      } else {
        console.warn(`[VAULT FETCH] ⚠️ Skipped vault ${i}: empty data`);
      }
    }

    console.log('[VAULT FETCH] Final vault list:', vaults);

    return vaults;
  } catch (error) {
    console.error('Error getting registered vaults:', error);
    return [];
  }
}

/**
 * Deploy a new LSP9 Vault using proxy pattern for 94% gas savings
 * Uses minimal proxy (EIP-1167) that delegates to a shared implementation
 *
 * @param provider - Browser provider with signer
 * @param upAddress - Universal Profile address (will be vault owner)
 * @param networkConfig - Network configuration with implementation address
 * @returns Deployed vault address
 */
export async function deployVault(
  provider: BrowserProvider,
  upAddress: string,
  networkConfig: { chainId: number; name: string; vaultImplementation?: string }
): Promise<string> {
  console.log('Deploying LSP9 Vault using proxy pattern for UP:', upAddress);

  // Import proxy deployment utilities
  const {
    getOrDeployImplementation,
    deployMinimalProxy,
    hasImplementation,
    getProxySavings,
  } = await import('./proxyDeployment');

  const hasImpl = hasImplementation(networkConfig as any);

  if (!hasImpl) {
    console.log(
      'First vault deployment - deploying implementation contract...'
    );
  } else {
    console.log('Deploying vault using proxy pattern (94% gas savings!)...');
  }

  // Step 1: Get or deploy the implementation contract
  const {
    address: implementationAddress,
    wasDeployed: implementationDeployed,
  } = await getOrDeployImplementation(provider, networkConfig as any);

  if (implementationDeployed) {
    console.log(`⚠️ Implementation deployed at ${implementationAddress}`);
    console.log('⚠️ Consider adding this to constants/networks.ts!');
  }

  // Step 2: Deploy a minimal proxy pointing to the implementation
  const vaultAddress = await deployMinimalProxy(
    provider,
    implementationAddress,
    upAddress
  );

  console.log('Vault proxy deployed at:', vaultAddress);
  console.log('Using implementation:', implementationAddress);

  const savings = getProxySavings();
  if (implementationDeployed) {
    console.log('First deployment - Implementation deployed for this network');
  } else {
    console.log(
      `✅ Saved ~${savings.savingsPerVault.toLocaleString()} gas (${savings.savingsPercent}%)!`
    );
  }

  // Step 3: Register vault with UP
  console.log('Registering vault with Universal Profile...');
  await registerVaultWithUP(provider, upAddress, vaultAddress);
  console.log('Vault registered with UP successfully!');

  return vaultAddress;
}
