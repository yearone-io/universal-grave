import { ethers } from 'ethers';
import LSP1GraveForwader from '@/abis/LSP1GraveForwader.json';
import { AddressZero } from '@ethersproject/constants';

export const getGraveVaultFor = async (
  account: string,
  universalGraveForwarder: string,
): Promise<string | null> => {
  const provider = new ethers.providers.Web3Provider(window.lukso);
  const signer = provider.getSigner();

  const graveForwarder = new ethers.Contract(
    universalGraveForwarder,
    LSP1GraveForwader.abi,
    provider
  );
  const graveYardAddress = await graveForwarder
    .connect(signer)
    .graveVaults(account);
  return graveYardAddress === AddressZero ? null : graveYardAddress;
};
