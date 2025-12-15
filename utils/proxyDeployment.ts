import {
  BrowserProvider,
  Contract,
  Interface,
  ZeroAddress,
  getCreateAddress,
} from 'ethers';
import { luksoTypechain } from '@lukso/lsp-utils';
import { OPERATION_TYPES } from '@lukso/lsp-smart-contracts';
import { universalProfileAbi } from '@lukso/lsp-smart-contracts/abi';
import { type Network } from '@/constants/supportedNetworks';

/**
 * EIP-1167 Minimal Proxy bytecode
 * This is a tiny contract that delegates all calls to an implementation
 * Gas cost: ~45,000 gas vs ~800,000+ for full LSP9Vault deployment
 */
const MINIMAL_PROXY_BYTECODE = '0x3d602d80600a3d3981f3363d3d373d3d3d363d73';
const MINIMAL_PROXY_SUFFIX = '5af43d82803e903d91602b57fd5bf3'; // No 0x prefix!

/**
 * Get or deploy the LSP9VaultInit implementation contract
 * The implementation is deployed ONCE PER NETWORK and shared by ALL users
 *
 * Priority order:
 * 1. Use pre-deployed implementation from network config (shared by everyone)
 * 2. Deploy a new implementation (first user on this network - should be rare)
 *
 * @param provider Browser provider with signer
 * @param networkConfig Network configuration
 * @returns Implementation address and whether it was newly deployed
 */
export async function getVaultImplementation(
  networkConfig: Network
): Promise<{ address: string; wasDeployed: boolean }> {
  // Check if there's a pre-deployed implementation in the network config
  // This is the SHARED implementation that all users should use
  if (networkConfig.vaultImplementation) {
    console.log(
      'Using pre-deployed shared implementation:',
      networkConfig.vaultImplementation
    );
    return { address: networkConfig.vaultImplementation, wasDeployed: false };
  } else {
    throw new Error('No vault implementation found on this network.')
  }
}

/**
 * Deploy a minimal proxy (EIP-1167 clone) pointing to the implementation
 * This is much cheaper than deploying a full contract (~45k gas vs ~800k+)
 *
 * When deploying from a Universal Profile, we must use UP.execute() with OPERATION_TYPES.CREATE
 * instead of direct contract deployment, because the UP is the deployer.
 *
 * @param provider Browser provider with signer
 * @param implementationAddress Address of the LSP9VaultInit implementation
 * @param upAddress Address of the Universal Profile (will own the vault)
 * @returns Deployed proxy address
 */
export async function deployMinimalProxy(
  provider: BrowserProvider,
  implementationAddress: string,
  upAddress: string
): Promise<string> {
  const signer = await provider.getSigner();

  // Construct the minimal proxy bytecode
  // Format: 0x3d602d80600a3d3981f3363d3d373d3d3d363d73 + implementation (20 bytes) + 0x5af43d82803e903d91602b57fd5bf3
  const proxyBytecode =
    MINIMAL_PROXY_BYTECODE +
    implementationAddress.slice(2).toLowerCase() +
    MINIMAL_PROXY_SUFFIX;

  console.log('Deploying minimal proxy via UP.execute()...');
  console.log('UP Address:', upAddress);
  console.log('Proxy bytecode length:', proxyBytecode.length);

  // Predict the proxy address based on UP's nonce
  const nonce = await provider.getTransactionCount(upAddress);
  const predictedProxyAddress = getCreateAddress({
    from: upAddress,
    nonce: nonce,
  });

  console.log('Predicted proxy address:', predictedProxyAddress);
  console.log('UP nonce:', nonce);

  // Deploy via UP.execute() with OPERATION_TYPES.CREATE
  // This is the correct way to deploy contracts from a Universal Profile
  const upContract = new Contract(upAddress, universalProfileAbi, signer);

  const tx = await (upContract as any).execute(
    OPERATION_TYPES.CREATE,
    ZeroAddress, // target for CREATE is zero address
    0, // no value
    proxyBytecode // deployment bytecode
  );

  console.log('Proxy deployment tx sent:', tx.hash);
  const receipt = await tx.wait();

  console.log('Receipt received:', {
    status: receipt?.status,
    blockNumber: receipt?.blockNumber,
  });

  if (!receipt) {
    throw new Error('No receipt received from proxy deployment transaction');
  }

  if (receipt.status !== 1) {
    throw new Error('Proxy deployment transaction failed');
  }

  const proxyAddress = predictedProxyAddress;
  console.log('Proxy deployed at:', proxyAddress);

  // Initialize the vault through the proxy (UP will be the owner)
  await initializeVaultProxy(provider, proxyAddress, upAddress);

  return proxyAddress;
}

/**
 * Initialize a vault proxy with the owner
 * This calls the initialize function on the proxy (which delegates to implementation)
 *
 * The initialization must be done through UP.execute() with OPERATION_TYPES.CALL
 * because the call needs to come from the Universal Profile.
 *
 * @param provider Browser provider with signer
 * @param proxyAddress Address of the deployed proxy
 * @param upAddress Address of the Universal Profile (will be the owner)
 */
async function initializeVaultProxy(
  provider: BrowserProvider,
  proxyAddress: string,
  upAddress: string
): Promise<void> {
  const signer = await provider.getSigner();

  // Create interface for the initialize call
  const vaultInterface = new Interface([
    'function initialize(address newOwner) external',
  ]);

  // Encode the initialize call with UP as the owner
  const initData = vaultInterface.encodeFunctionData('initialize', [upAddress]);

  console.log('Initializing vault proxy with owner:', upAddress);
  console.log('Calling initialize on proxy:', proxyAddress);

  // Call initialize via UP.execute() with OPERATION_TYPES.CALL
  const upContract = new Contract(upAddress, universalProfileAbi, signer);

  const tx = await (upContract as any).execute(
    OPERATION_TYPES.CALL,
    proxyAddress, // target is the proxy
    0, // no value
    initData // initialize(upAddress) call
  );

  const receipt = await tx.wait();

  if (receipt?.status !== 1) {
    throw new Error('Vault initialization failed');
  }

  console.log('Vault proxy initialized successfully');
}

/**
 * Get estimated gas savings from using proxy pattern
 *
 * @returns Gas savings information
 */
export function getProxySavings() {
  return {
    fullDeployment: 800000, // Approximate gas for full LSP9Vault deployment
    proxyDeployment: 45000, // Approximate gas for minimal proxy
    savingsPerVault: 755000, // Gas saved per vault after first one
    savingsPercent: 94, // ~94% gas savings
  };
}

/**
 * Check if implementation exists for current network
 *
 * @param networkConfig Network configuration
 * @returns True if implementation is configured
 */
export function hasImplementation(networkConfig: Network): boolean {
  return !!networkConfig.vaultImplementation;
}
