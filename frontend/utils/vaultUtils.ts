import { ethers } from 'ethers';
import LSP1GraveForwarder from '@/abis/LSP1GraveForwarder.json';
import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers';

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
