import { ExecutiveAssistant } from '@/constants/CustomTypes';
import {
  forwarderAssistantMainnet,
  forwarderAssistantTestnet,
} from '@/constants/assistantsConfig';

export enum ChainSlugs {
  LUKSO = 'lukso',
  LUKSO_TESTNET = 'lukso-testnet',
}

export const networkNameToIdMapping: { [key: string]: number } = {
  [ChainSlugs.LUKSO]: 42,
  [ChainSlugs.LUKSO_TESTNET]: 4201,
};

export interface NetworkConfig {
  name: string;
  displayName: string;
  chainSlug: string;
  chainId: number;
  baseUrl: string;
  rpcUrl: string;
  ipfsGateway: string;
  explorer: string;
  marketplaceCollectionsURL: string;
  token: string;
  assistantsProtocolAddress: string;
  defaultUniversalReceiverDelegateUP: string;
  icon: string;
  universalEverything: string;
  graveAssistant: ExecutiveAssistant;
  screenerAddress: string;
}

export const supportedNetworks: { [key: string]: NetworkConfig } = {
  '42': {
    chainId: 42,
    name: 'LUKSO',
    token: 'LYX',
    displayName: 'Lukso Mainnet',
    chainSlug: 'lukso',
    icon: '/lyx_icon_mainnet.svg',
    baseUrl: 'https://universalgrave.com',
    rpcUrl: 'https://42.rpc.thirdweb.com',
    ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
    explorer: 'https://explorer.execution.mainnet.lukso.network',
    universalEverything: 'https://universaleverything.io',
    marketplaceCollectionsURL: 'https://universal.page/collections',
    assistantsProtocolAddress: '0xdbdf20705491e524ebd77957eed2c41ec9d7e5dc',
    defaultUniversalReceiverDelegateUP: '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D',
    graveAssistant: forwarderAssistantMainnet,
    screenerAddress: "0x7870C5B8BC9572A8001C3f96f7ff59961B23500D", // fixme: this is a placeholder
  },
  '4201': {
    chainId: 4201,
    name: 'LUKSO Testnet',
    token: 'LYXt',
    displayName: 'Lukso Testnet',
    chainSlug: 'lukso-testnet',
    icon: '/lyx_icon_testnet.svg',
    baseUrl: 'https://universalgrave.com',
    rpcUrl: 'https://4201.rpc.thirdweb.com',
    ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
    explorer: 'https://explorer.execution.testnet.lukso.network/',
    universalEverything: 'https://universaleverything.io',
    marketplaceCollectionsURL: 'https://universalpage.dev/collections',
    assistantsProtocolAddress: '0xcf44a050c9b1fc87141d77b646436443bdc05a2b',
    defaultUniversalReceiverDelegateUP: '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D',
    graveAssistant: forwarderAssistantTestnet,
    screenerAddress: "0x7870C5B8BC9572A8001C3f96f7ff59961B23500D", // fixme: this is a placeholder
  },
};
