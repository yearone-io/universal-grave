import {
  BrowserProvider,
  Contract,
  ZeroAddress,
  ContractFactory,
  getCreateAddress,
} from 'ethers';
import { ERC725YDataKeys, OPERATION_TYPES } from '@lukso/lsp-smart-contracts';
import {
  universalProfileAbi,
  lsp9VaultAbi,
} from '@lukso/lsp-smart-contracts/abi';
import { luksoTypechain } from '@lukso/lsp-utils';
import ERC725 from '@erc725/erc725.js';
import LSP3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';

/**
 * Deploy a new LSP9 Vault for a Universal Profile using LSP23 Factory
 * @param provider - Browser provider with signer
 * @param upAddress - Universal Profile address
 * @param lsp23FactoryAddress - LSP23 Factory contract address
 * @param lsp9VaultBaseContract - LSP9 Vault base contract address
 * @param lsp9VaultInitAddress - LSP9 Vault init contract address
 * @returns Deployed vault address
 */
export async function deployVaultViaLSP23(
  provider: BrowserProvider,
  upAddress: string,
  lsp23FactoryAddress: string,
  lsp9VaultBaseContract: string,
  lsp9VaultInitAddress: string
): Promise<string> {
  // Note: LSP23 factory deployment is not yet implemented
  // This would require the LSP23 factory ABI which is not exported from lsp-smart-contracts
  throw new Error(
    'Vault deployment via LSP23 is not yet implemented. Please use an existing vault or deploy manually.'
  );
}

/**
 * Simpler approach: Deploy vault directly without LSP23 factory
 * This creates a basic LSP9 Vault owned by the UP
 * @param provider - Browser provider with signer
 * @param upAddress - Universal Profile address (will be vault owner)
 * @returns Deployed vault address
 */
export async function deployBasicVault(
  provider: BrowserProvider,
  upAddress: string
): Promise<string> {
  try {
    const signer = await provider.getSigner();

    // For now, we'll use the UP to execute a CREATE operation to deploy the vault
    // In practice, you'd need the vault bytecode and constructor args
    // This is a simplified version - in production you'd use LSP23 or deploy bytecode

    // Alternative: If vaults are already deployed, just register one
    // For GRAVE, we might want to use an existing shared vault pattern
    // or have the UP execute a vault deployment

    throw new Error(
      'Direct vault deployment not yet implemented. Use LSP23 factory or existing vault.'
    );
  } catch (error) {
    console.error('Error deploying basic vault:', error);
    throw error;
  }
}

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
    const signer = await provider.getSigner();
    const upContract = new Contract(upAddress, universalProfileAbi, signer);

    // Get current vaults array length
    const lengthKey = ERC725YDataKeys.LSP10['LSP10Vaults[]'].length;
    const currentLengthData = await upContract.getData(lengthKey);
    const currentLength =
      currentLengthData === '0x' ? 0 : parseInt(currentLengthData, 16);

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

    const values = [
      '0x' + newLength.toString(16).padStart(64, '0'), // New length as bytes32
      vaultAddress.toLowerCase(), // Vault address
      '0x' +
        currentLength.toString(16).padStart(32, '0') +
        '0'.padStart(32, '0'), // Interface ID + index
    ];

    // Set data on UP
    const tx = await (upContract as any).setDataBatch(keys, values);
    await tx.wait();

    console.log('Vault registered with UP:', vaultAddress);
  } catch (error) {
    console.error('Error registering vault with UP:', error);
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

    // Fetch each vault address
    for (let i = 0; i < vaultCount; i++) {
      const indexKey =
        ERC725YDataKeys.LSP10['LSP10Vaults[]'].index +
        i.toString(16).padStart(32, '0');
      const vaultData = await upContract.getData(indexKey);

      if (vaultData && vaultData !== '0x') {
        // Convert bytes32 to address
        const vaultAddress = '0x' + vaultData.slice(-40);
        vaults.push(vaultAddress);
      }
    }

    return vaults;
  } catch (error) {
    console.error('Error getting registered vaults:', error);
    return [];
  }
}

/**
 * Upload LSP3 metadata JSON to IPFS using universal.page API
 * @param metadata - LSP3Profile metadata object
 * @returns IPFS hash (CID)
 */
async function uploadMetadataToIPFS(metadata: {
  LSP3Profile: { name: string };
}): Promise<string> {
  try {
    const response = await fetch(
      'https://api.universalprofile.cloud/api/v0/add',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    const ipfsHash = result.Hash || result.hash || result.cid;

    if (!ipfsHash) {
      throw new Error('No IPFS hash returned from upload');
    }

    return ipfsHash;
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    throw new Error(
      'Failed to upload metadata to IPFS. You can still use the vault without metadata.'
    );
  }
}

/**
 * Test deployment function using minimal contract
 * This helps verify the deployment mechanism works before trying LSP9Vault
 *
 * @param provider - Browser provider with signer
 * @param upAddress - Universal Profile address
 * @returns Deployed test contract address
 */
export async function deployTestContract(
  provider: BrowserProvider,
  upAddress: string
): Promise<string> {
  try {
    console.log('=== Starting deployTestContract ===');
    console.log('UP Address:', upAddress);

    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    console.log('Signer address:', signerAddress);

    // Minimal contract bytecode WITHOUT constructor (no constructor = simpler test)
    // Just has two storage variables that are publicly readable
    // contract MinimalTest { uint256 public value = 42; address public deployer = msg.sender; }
    const minimalContractBytecode =
      '0x6080604052602a60005560018054336001600160a01b031991909116179055348015601f575f80fd5b506101088061002d5f395ff3fe6080604052348015600e575f80fd5b50600436106030575f3560e01c80633fa4f2451460345780638da5cb5b14604c575b5f80fd5b603a5f5481565b60405190815260200160405180910390f35b6001546001600160a01b03165b6040516001600160a01b03909116815260200160405180910390f3fea264697066735822122012345678901234567890123456789012345678901234567890123456789012345664736f6c63430008180033';

    console.log('Bytecode length:', minimalContractBytecode.length);

    // Predict address
    const nonce = await provider.getTransactionCount(upAddress);
    console.log('UP nonce:', nonce);
    const predictedAddress = getCreateAddress({ from: upAddress, nonce });
    console.log('Predicted contract address:', predictedAddress);

    // Create UP contract instance
    const upContract = new Contract(upAddress, universalProfileAbi, signer);
    console.log('UP contract instance created');

    // Log the call parameters
    console.log('Calling UP.execute() with params:');
    console.log('  - operationType:', OPERATION_TYPES.CREATE);
    console.log('  - target:', ZeroAddress);
    console.log('  - value:', 0);
    console.log('  - data length:', minimalContractBytecode.length);

    // Try estimating gas first to see if that's where it fails
    console.log('Attempting to estimate gas...');
    try {
      const gasEstimate = await (upContract as any).execute.estimateGas(
        OPERATION_TYPES.CREATE,
        ZeroAddress,
        0,
        minimalContractBytecode
      );
      console.log('Gas estimate:', gasEstimate.toString());
    } catch (gasError: any) {
      console.error('Gas estimation failed:', gasError);
      console.error('Error code:', gasError.code);
      console.error('Error data:', gasError.data);
      throw new Error(`Gas estimation failed: ${gasError.message || gasError}`);
    }

    console.log('Sending transaction...');
    const tx = await (upContract as any).execute(
      OPERATION_TYPES.CREATE,
      ZeroAddress,
      0,
      minimalContractBytecode
    );

    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');
    const receipt = await tx.wait();

    console.log('Test contract deployed at:', predictedAddress);
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    return predictedAddress;
  } catch (error: any) {
    console.error('=== deployTestContract FAILED ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error data:', error.data);
    console.error('Full error:', error);
    throw error;
  }
}

/**
 * Deploy a new LSP9 Vault with LSP3 metadata naming it "GRAVE Spambox"
 * Uses UP.execute() with OPERATION_TYPES.CREATE (matching UAP backend pattern)
 * This is the CORRECT way to deploy contracts via Universal Profile
 *
 * @param provider - Browser provider with signer
 * @param upAddress - Universal Profile address (will be vault owner)
 * @param ipfsGateway - IPFS gateway URL from network config
 * @returns Deployed vault address
 */
export async function deployVaultWithMetadata(
  provider: BrowserProvider,
  upAddress: string,
): Promise<string> {
  try {
    const signer = await provider.getSigner();

    // Step 1: Deploy the Vault contract (or via UP.execute)  
    console.log("Preparing LSP9 Vault deployment…", upAddress);
    console.log("signer", signer)
    console.log("upAddress", upAddress)

    // Option A: Direct deployment of Vault logic (if appropriate)
    const vaultFactory = new luksoTypechain.LSP9Vault__factory(signer);
    // If constructor accepts args, pass them here (owner = upAddress for instance)
    const vaultContract = await vaultFactory.deploy(
      upAddress,
    );


    await vaultContract.deployed();
    const vaultAddress = vaultContract.address;
    console.log("Vault deployed at:", vaultAddress);

    /*

    // Step 1: Get the deployment bytecode for LSP9Vault
    console.log('Preparing LSP9 Vault deployment bytecode...');

    // Get bytecode from lsp-utils typechain factory
    const LSP9VaultBytecode = luksoTypechain.LSP9Vault__factory.bytecode;

    // Create factory to get deployment transaction with constructor args
    const vaultFactory = new ContractFactory(
      lsp9VaultAbi,
      LSP9VaultBytecode,
      signer
    );

    // Get the deployment transaction to extract the full bytecode (with constructor args encoded)
    const deploymentTx = await vaultFactory.getDeployTransaction(upAddress);
    const deploymentBytecode = deploymentTx.data;

    console.log('Deployment bytecode prepared');

    // Step 2: Predict the vault address based on UP's nonce
    const nonce = await provider.getTransactionCount(upAddress);
    const predictedVaultAddress = getCreateAddress({
      from: upAddress,
      nonce: nonce,
    });
    console.log('Predicted vault address:', predictedVaultAddress);

    // Step 3: Deploy via UP.execute() with OPERATION_TYPES.CREATE
    // This is the pattern used by UAP backend that WORKS
    const upContract = new Contract(upAddress, universalProfileAbi, signer);

    console.log('Deploying vault via UP.execute()...');
    const tx = await (upContract as any).execute(
      OPERATION_TYPES.CREATE,
      ZeroAddress, // target for CREATE is zero address
      0, // no value
      deploymentBytecode // bytecode + constructor args
    );

    console.log('Waiting for deployment transaction...');
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error('No receipt from vault deployment');
    }

    const vaultAddress = predictedVaultAddress;
    console.log('Vault deployed at:', vaultAddress);

    // Step 2: Optionally set LSP3 metadata on vault
    try {
      console.log('Uploading metadata to IPFS...');
      const metadata = {
        LSP3Profile: {
          name: 'GRAVE Spambox',
        },
      };

      const ipfsHash = await uploadMetadataToIPFS(metadata);
      const ipfsUrl = `ipfs://${ipfsHash}`;
      console.log('Metadata uploaded to IPFS:', ipfsUrl);

      // Encode LSP3Profile data with VerifiableURI
      const erc725 = new ERC725(
        LSP3ProfileSchema as any,
        vaultAddress,
        provider
      );

      const encodedData = erc725.encodeData([
        {
          keyName: 'LSP3Profile',
          value: {
            verification: {
              method: 'keccak256(utf8)',
              data: '0x' + ipfsHash,
            },
            url: ipfsUrl,
          },
        },
      ]);

      // Set LSP3Profile metadata on vault (separate transaction)
      console.log('Setting LSP3Profile metadata on vault...');
      const vaultContract = new Contract(vaultAddress, lsp9VaultAbi, signer);
      const setDataTx = await (vaultContract as any).setData(
        encodedData.keys[0],
        encodedData.values[0]
      );
      await setDataTx.wait();
      console.log('Metadata set on vault');
    } catch (metadataError) {
      console.warn(
        'Could not set metadata on vault (continuing anyway):',
        metadataError
      );
      // Continue even if metadata setting fails - the vault is still usable
    }

    // Step 3: Register vault with UP
    console.log('Registering vault with Universal Profile...');
    await registerVaultWithUP(provider, upAddress, vaultAddress);
    console.log('Vault registered with UP');

    return vaultAddress;
    */
  } catch (error) {
    console.error('Error deploying vault with metadata:', error);
    throw error;
  }
}
