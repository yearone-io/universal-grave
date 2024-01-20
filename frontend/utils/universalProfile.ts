import { ethers } from 'ethers';
import { constants } from '@/app/constants';
import LSP1GraveForwader from '@/abis/LSP1GraveForwader.json';

export const getGraveVaultFor = async (account: string) => {
  const provider = new ethers.providers.Web3Provider(window.lukso);
  const signer = provider.getSigner();

  const graveForwarder = new ethers.Contract(
    constants.UNIVERSAL_GRAVE_FORWARDER,
    LSP1GraveForwader.abi,
    provider
  );
  return await graveForwarder.connect(signer).graveVaults(account);
};
