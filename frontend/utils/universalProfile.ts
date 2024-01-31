import { ethers } from 'ethers';
import LSP1GraveForwarder from '@/abis/LSP1GraveForwarder.json';
import { AddressZero } from '@ethersproject/constants';

export const getGraveVaultFor = async (
  account: string,
  universalGraveForwarder: string
): Promise<string | null> => {
  const provider = new ethers.providers.Web3Provider(window.lukso);
  const signer = provider.getSigner();

  const graveForwarder = new ethers.Contract(
    universalGraveForwarder,
    LSP1GraveForwarder.abi,
    provider
  );
  const graveYardAddress = await graveForwarder
    .connect(signer)
    .graveVaults(account);
  return graveYardAddress === AddressZero ? null : graveYardAddress;
};
