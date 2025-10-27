import {
  ContractFactory,
  JsonRpcProvider,
  BrowserProvider,
  Contract,
} from 'ethers';
import { lsp9VaultAbi } from '@lukso/lsp-smart-contracts/abi';
import { ERC725YDataKeys } from '@lukso/lsp-smart-contracts';
import { LSP1GraveForwarder__factory } from '@/contracts';

// Note: LSP9Vault bytecode needs to be imported separately or provided
// For now, we'll need to check if this functionality is still used
const LSP9VaultBytecode = ''; // TODO: Get bytecode from package if needed

export const createUpVault = async (
  provider: JsonRpcProvider | BrowserProvider,
  account: string
) => {
  const signer = await provider.getSigner();
  // create an factory for the LSP9Vault contract
  let vaultFactory = new ContractFactory(
    lsp9VaultAbi,
    LSP9VaultBytecode,
    signer
  );
  const vaultTransaction = await vaultFactory.deploy(account);
  return await vaultTransaction.deploymentTransaction()?.wait();
};

export const setVaultURD = async (
  provider: JsonRpcProvider | BrowserProvider,
  vaultAddress: string,
  vaultURDAddress: string
) => {
  const signer = await provider.getSigner();
  const vault = new Contract(vaultAddress, lsp9VaultAbi, signer);
  try {
    //1. Check if it is neccessary to set the delegate in the vault
    const lsp1 = await (vault as any).getData(
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate
    );
    if (lsp1.toLowerCase() === vaultURDAddress.toLowerCase()) {
      return;
    }
  } catch (err: any) {
    console.error('Error setVaultURD: ', err);
  }
  //2. Set the delegate in the vault if neccesary
  return await (vault as any).setData(
    ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate,
    vaultURDAddress
  );
};

export const migrateVaultToNewForwarder = async (
  provider: JsonRpcProvider | BrowserProvider,
  oldForwarderAddress: string,
  newForwarderAddress: string
) => {
  const signer = await provider.getSigner();
  const oldForwarder = LSP1GraveForwarder__factory.connect(
    oldForwarderAddress,
    provider
  );
  const vaultAddress = await oldForwarder.connect(signer).getGrave();
  const newForwarder = LSP1GraveForwarder__factory.connect(
    newForwarderAddress,
    provider
  );
  return await newForwarder.connect(signer).setGrave(vaultAddress);
};
