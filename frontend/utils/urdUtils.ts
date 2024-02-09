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

const hasJoinedTheGrave = (URDLsp7: string | null, URDLsp8: string | null) => {
  // Note: check sum case address to avoid issues with case sensitivity
  let networkConfig = getNetworkConfig(
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK!
  );
  return (
    getChecksumAddress(URDLsp7) ===
      getChecksumAddress(networkConfig.universalGraveForwarder) &&
    getChecksumAddress(URDLsp8) ===
      getChecksumAddress(networkConfig.universalGraveForwarder)
  );
};

export const hasOlderGraveDelegate = (
  URDLsp7: string | null,
  URDLsp8: string | null
): string | null => {
  const networkConfig = getNetworkConfig(
    process.env.NEXT_PUBLIC_DEFAULT_NETWORK!
  );
  if (!URDLsp7 || !URDLsp8) return null;
  console.log(getChecksumAddress('0x1e2f66d2dC19bB13617D1d06CBb3E8d8aa4567e3'));
  console.log(getChecksumAddress('0x9c27a05310dc8af53b60124b244cc9d12f202cdf'));
  const urd7 = getChecksumAddress(URDLsp7)!;
  const urd8 = getChecksumAddress(URDLsp8)!;
  let urd7Index = networkConfig.previousGraveForwarders.indexOf(urd7);
  let urd8Index = networkConfig.previousGraveForwarders.indexOf(urd8);
  if (urd7Index > -1 && urd8Index > -1 && urd7 === urd8) {
    return networkConfig.previousGraveForwarders[urd7Index];
  }
  return null;
};
