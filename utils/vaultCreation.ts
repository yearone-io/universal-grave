import {
  BrowserProvider,
  Contract,
  Interface,
  ZeroAddress,
  JsonRpcProvider,
} from 'ethers';
import { ERC725YDataKeys, INTERFACE_IDS } from '@lukso/lsp-smart-contracts';
import {
  universalProfileAbi,
  lsp9VaultAbi,
} from '@lukso/lsp-smart-contracts/abi';

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

    console.log(
      '[VAULT FETCH] Total vault count from LSP10Vaults[].length:',
      vaultCount
    );

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
  networkConfig: {
    chainId: number;
    name: string;
    vaultImplementation?: string;
    lsp1UrdVault?: string;
    graveVaultFactoryAddress?: string;
  }
): Promise<string> {
  if (networkConfig.graveVaultFactoryAddress) {
    console.log(
      'Deploying GRAVE Spambox via factory:',
      networkConfig.graveVaultFactoryAddress
    );
    const signer = await provider.getSigner();
    const factoryAbi = [
      'function createVault(address owner) external returns (address)',
      'event VaultCreated(address indexed owner, address indexed vault, address implementation)',
    ];
    const factory = new Contract(
      networkConfig.graveVaultFactoryAddress,
      factoryAbi,
      signer
    );
    const tx = await factory.createVault(upAddress);
    const receipt = await tx.wait();
    const iface = new Interface(factoryAbi);
    let vaultAddress: string | null = null;
    for (const log of receipt?.logs || []) {
      if (
        log.address.toLowerCase() !==
        networkConfig.graveVaultFactoryAddress.toLowerCase()
      ) {
        continue;
      }
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === 'VaultCreated') {
          vaultAddress = parsed.args?.vault;
          break;
        }
      } catch {
        // Ignore non-matching logs
      }
    }
    if (!vaultAddress) {
      throw new Error('Failed to read vault address from factory event');
    }

    console.log('Vault deployed at (factory):', vaultAddress);

    // Step: Set LSP1 Universal Receiver Delegate on vault
    console.log('Setting LSP1 Universal Receiver Delegate on vault...');
    await setVaultURD(provider, upAddress, vaultAddress, networkConfig);
    console.log('Vault URD set successfully!');

    return vaultAddress;
  }

  console.log('Deploying LSP9 Vault using proxy pattern for UP:', upAddress);

  // Import proxy deployment utilities
  const {
    getVaultImplementation,
    deployMinimalProxy,
    hasImplementation,
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
  } = await getVaultImplementation(networkConfig as any);

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

  // Step 3: Set LSP1 Universal Receiver Delegate on vault
  console.log('Setting LSP1 Universal Receiver Delegate on vault...');
  await setVaultURD(provider, upAddress, vaultAddress, networkConfig);
  console.log('Vault URD set successfully!');

  return vaultAddress;
}

/**
 * Set the LSP1UniversalReceiverDelegate on a vault
 * This is required for the vault to properly receive and register LSP7/LSP8 assets
 */
export async function setVaultURD(
  provider: BrowserProvider,
  upAddress: string,
  vaultAddress: string,
  networkConfig: { lsp1UrdVault?: string }
): Promise<void> {
  const signer = await provider.getSigner();
  const upContract = new Contract(upAddress, universalProfileAbi, signer);
  const vaultContract = new Contract(vaultAddress, lsp9VaultAbi, signer);

  if (!networkConfig.lsp1UrdVault) {
    throw new Error('LSP1 URD Vault address not found in network config');
  }

  const urdAddress = networkConfig.lsp1UrdVault;

  // Prepare the setData call
  const setDataCalldata = vaultContract.interface.encodeFunctionData(
    'setData',
    [ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate, urdAddress]
  );

  // Execute via UP
  const tx = await upContract.execute(
    0, // OPERATION_CALL
    vaultAddress,
    0, // value
    setDataCalldata
  );

  await tx.wait();
  console.log('✅ LSP1 URD set on vault:', urdAddress);
}

/**
 * Check if a vault has the LSP1UniversalReceiverDelegate set correctly
 */
export async function hasVaultURDSet(
  provider: BrowserProvider | JsonRpcProvider,
  vaultAddress: string,
  expectedURD: string
): Promise<boolean> {
  try {
    const vaultContract = new Contract(vaultAddress, lsp9VaultAbi, provider);
    const currentURD = await vaultContract.getData(
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate
    );

    // Check if URD is set and matches expected address
    return (
      currentURD &&
      currentURD !== '0x' &&
      currentURD.toLowerCase() === expectedURD.toLowerCase()
    );
  } catch (error) {
    console.error('Error checking vault URD:', error);
    return false;
  }
}
