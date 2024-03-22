import { ethers } from 'ethers';
import LSP9Vault from '@lukso/lsp-smart-contracts/artifacts/LSP9Vault.json';
import LSP1GraveForwarder from '@/abis/LSP1GraveForwarder.json';
import { ERC725YDataKeys } from '@lukso/lsp-smart-contracts';
import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers';

export const createUpVault = async (
  provider: JsonRpcProvider | Web3Provider,
  account: string
) => {
  const signer = provider.getSigner();
  // create an factory for the LSP9Vault contract
  let vaultFactory = new ethers.ContractFactory(
    LSP9Vault.abi,
    LSP9Vault.bytecode
  );
  const vaultTransaction = await vaultFactory.connect(signer).deploy(account);
  return await vaultTransaction.deployTransaction.wait();
};

export const setVaultURD = async (
  provider: JsonRpcProvider | Web3Provider,
  vaultAddress: string,
  vaultURDAddress: string
) => {
  const signer = provider.getSigner();
  const vault = new ethers.Contract(
    vaultAddress as string,
    LSP9Vault.abi,
    signer
  );
  try {
    //1. Check if it is neccessary to set the delegate in the vault
    const lsp1 = await vault
      .connect(signer)
      .getData(ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate);
    if (lsp1.toLocaleLowerCase() === vaultURDAddress.toLocaleLowerCase()) {
      return;
    }
  } catch (err: any) {
    console.error('Error setVaultURD: ', err);
  }
  //2. Set the delegate in the vault if neccesary
  return await vault
    .connect(signer)
    .setData(
      ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate,
      vaultURDAddress
    );
};

export const migrateVaultToNewForwarder = async (
  provider: JsonRpcProvider | Web3Provider,
  oldForwarderAddress: string,
  newForwarderAddress: string
) => {
  const signer = provider.getSigner();
  const oldForwarder = new ethers.Contract(
    oldForwarderAddress,
    LSP1GraveForwarder.abi,
    provider
  );
  const vaultAddress = await oldForwarder.connect(signer).getGrave();
  const newForwarder = new ethers.Contract(
    newForwarderAddress,
    LSP1GraveForwarder.abi,
    provider
  );
  return await newForwarder.connect(signer).setGrave(vaultAddress);
};
