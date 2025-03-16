import { ZeroAddress } from 'ethers';
import { SiweMessage } from 'siwe';
import { getNetworkConfig } from '@/constants/networks';
import { LSP1GraveForwarder__factory } from '@/contracts';
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js';
import lsp3ProfileSchema from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import { LSP3ProfileMetadata } from '@lukso/lsp3-contracts';
import { supportedNetworks } from '@/constants/supportedNetworks';
import { getNetwork } from '@/utils/utils';

export interface IProfileBasicInfo {
  upName: string | null;
  avatar: string | null;
}

export const getProfileBasicInfo = async (
  chainId: number,
  contributor: string
): Promise<IProfileBasicInfo> => {
  let upName = null,
    avatar = null;
  try {
    const networkConfig = getNetwork(chainId);
    const ipfsGateway = networkConfig.ipfsGateway;
    const profileData = await getProfileData(
      contributor,
      ipfsGateway,
      networkConfig.rpcUrl
    );
    if (profileData) {
      if (profileData.profileImage && profileData.profileImage.length > 0) {
        avatar = `${ipfsGateway}/${profileData.profileImage[0].url.replace(
          'ipfs://',
          ''
        )}`;
      }
      upName = profileData.name;
    }
  } catch (error) {
    console.error('Error fetching profile data for', contributor, error);
  } finally {
    return { upName, avatar };
  }
};

const getProfileData = async (
  universalProfileAddress: string,
  ipfsGateway: string,
  rpcUrl: string
): Promise<LSP3ProfileMetadata> => {
  const erc725js = new ERC725(
    lsp3ProfileSchema as ERC725JSONSchema[],
    universalProfileAddress,
    rpcUrl,
    {
      ipfsGateway: ipfsGateway,
    }
  );

  const profileData = await erc725js.fetchData('LSP3Profile');
  return (profileData!.value as { LSP3Profile: Record<string, any> })
    .LSP3Profile as LSP3ProfileMetadata;
};

// todo: change so that config for executive is read from user profile
export const getGraveVault = async (
  provider: any,
  account: string,
  assistantAddress: string
): Promise<string | null> => {
  return null;
  const graveForwarder = LSP1GraveForwarder__factory.connect(
    assistantAddress,
    provider
  );
  const graveVaultAddress = await graveForwarder.graveVaults(account);
  return graveVaultAddress === ZeroAddress
    ? null
    : graveVaultAddress;
};

export const buildSIWEMessage = (upAddress: string): string => {
  const siweParams = {
    domain: window.location.host, // required, Domain requesting the signing
    uri: window.location.origin, // required, URI from the resource that is the subject of the signing
    address: upAddress, // Address performing the signing
    statement:
      'Welcome to the Universal GRAVE! Tired of being spammed by unwanted LSP7 and LSP8 assets. Send theem to the GRAVE! Before you use our service, please make sure you have read and understood our terms of service and conditions and privacy policy. By signing in, you confirm that you have read and agree to these documents and will use the platform in accordance with their provisions. Thank you for using Universal GRAVE, and we hope we solve all your spam problems once and for all.', // a human-readable assertion user signs
    version: '1', // Current version of the SIWE Message
    chainId: getNetworkConfig(process.env.NEXT_PUBLIC_DEFAULT_NETWORK!).chainId, // Chain ID to which the session is bound, 4201 is LUKSO Testnet
    resources: [
      `${window.location.origin}/terms`,
      `${window.location.origin}/terms#disclaimer`,
      `${window.location.origin}/terms#privacy`,
    ], // Information the user wishes to have resolved as part of authentication by the relying party
  };
  return new SiweMessage(siweParams).prepareMessage();
};

export const getUrlNameByChainId = (chainId: number): string => {
  return supportedNetworks[chainId].chainSlug;
};

export const getChainIdByUrlName = (chainSlug: string): number => {
  return (
    Object.values(supportedNetworks).find(
      network => network.chainSlug === chainSlug
    )?.chainId || 42
  );
};
