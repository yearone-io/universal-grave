import { ExecutiveAssistant } from '@/constants/CustomTypes';
import {
  forwarderAssistantMainnet,
  forwarderAssistantTestnet,
} from '@/constants/assistantsConfig';

interface ChainInfo {
  name: string;
  displayName: string;
  urlName: string;
  chainId: number;
  baseUrl: string;
  rpcUrl: string;
  ipfsGateway: string;
  explorer: string;
  marketplaceCollectionsURL: string;
  token: string;
  protocolAddress: string;
  defaultURDUP: string;
  hasUPSupport: boolean;
  icon: string;
  universalEverything: string;
  luksoSiteName: string;
  graveAssistant: ExecutiveAssistant;
}

export enum CHAINS {
  LUKSO = 'lukso',
  LUKSO_TESTNET = 'lukso-testnet',
}

export const supportedNetworks: { [key: string]: ChainInfo } = {
  '42': {
    name: 'LUKSO',
    displayName: 'Lukso Mainnet',
    urlName: 'lukso',
    chainId: 42,
    baseUrl: 'https://universalgrave.com',
    rpcUrl: 'https://42.rpc.thirdweb.com',
    ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
    explorer: 'https://explorer.execution.mainnet.lukso.network',
    marketplaceCollectionsURL: 'https://universal.page/collections',
    token: 'LYX',
    protocolAddress: '0xdbdf20705491e524ebd77957eed2c41ec9d7e5dc',
    defaultURDUP: '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D',
    hasUPSupport: true,
    icon: '/lyx_icon_mainnet.svg',
    universalEverything: 'https://universaleverything.io',
    luksoSiteName: 'mainnet',
    graveAssistant: forwarderAssistantMainnet,
  },
  '4201': {
    name: 'LUKSO Testnet',
    displayName: 'Lukso Testnet',
    urlName: 'lukso-testnet',
    chainId: 4201,
    baseUrl: 'https://universalgrave.com',
    rpcUrl: 'https://4201.rpc.thirdweb.com',
    ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
    explorer: 'https://explorer.execution.testnet.lukso.network/',
    marketplaceCollectionsURL: 'https://universalpage.dev/collections',
    token: 'LYXt',
    protocolAddress: '0xcf44a050c9b1fc87141d77b646436443bdc05a2b',
    defaultURDUP: '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D',
    hasUPSupport: true,
    icon: '/lyx_icon_testnet.svg',
    universalEverything: 'https://universaleverything.io',
    luksoSiteName: 'testnet',
    graveAssistant: forwarderAssistantTestnet,
  },
};

export const networkNameToIdMapping: { [key: string]: number } = {
  [CHAINS.LUKSO]: 42,
  [CHAINS.LUKSO_TESTNET]: 4201,
};
