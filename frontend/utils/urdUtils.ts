import { ethers } from 'ethers';
import { getNetworkConfig } from '@/constants/networks';

const getChecksumAddress = (address: string | null) => {
  // Check if the address is valid
  if (!address || !ethers.utils.isAddress(address)) {
    // Handle invalid address
    return address;
  }

  // Convert to checksum address
  return ethers.utils.getAddress(address);
};

export const hasOlderGraveDelegate = (
  URDLsp7: string | null,
  URDLsp8: string | null
): string | null => {
  const networkConfig = getNetworkConfig(
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK!
  );
  if (!URDLsp7 || !URDLsp8) return null;
  const urd7 = getChecksumAddress(URDLsp7)!;
  const urd8 = getChecksumAddress(URDLsp8)!;
  let urd7Index = networkConfig.previousGraveForwarders.indexOf(urd7);
  let urd8Index = networkConfig.previousGraveForwarders.indexOf(urd8);
  if (urd7Index > -1 && urd8Index > -1 && urd7 === urd8) {
    return networkConfig.previousGraveForwarders[urd7Index];
  }
  return null;
};
