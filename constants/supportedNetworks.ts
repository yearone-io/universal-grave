interface ChainInfo {
  name: string;
  displayName: string;
  urlName: string;
  chainId: number;
  url: string;
  rpcUrl: string;
  ipfsGateway: string;
  explorer: string;
  token: string;
  protocolAddress: string; // UAP Protocol contract address
  forwarderAssistantAddress: string; // Forwarder Assistant contract address
  curatedListScreenerAddress: string; // Curated List Screener address
  addressListScreenerAddress: string; // Address List Screener address
  creatorCurationScreenerAddress: string; // Creator Curation Screener address
  creatorListScreenerAddress: string; // Creator List Screener address
  lsp1UrdVault: string; // Vault URD address
  lsp1UrdUp: string; // UP URD address (used when deactivating spambox)
  vaultImplementation?: string; // Pre-deployed LSP9VaultInit implementation for proxy pattern
  graveVaultFactoryAddress?: string; // Optional factory for GRAVE spambox deployment counter
  hasUPSupport: boolean;
  icon: string;
  // Legacy GRAVE support
  universalGraveForwarder: string; // Current GRAVE forwarder address
  marketplaceCollectionsURL: string; // URL for viewing collections
  previousGraveForwarders: string[];
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
    url: 'https://universalgrave.com',
    rpcUrl: 'https://42.rpc.thirdweb.com',
    ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
    explorer: 'https://explorer.execution.mainnet.lukso.network/',
    token: 'LYX',
    protocolAddress: '0x74cdf5beb4a2323fd386b87a1522d9aa0f59aeb9',
    forwarderAssistantAddress: '0xc503d7f50c4d2c0649fa86e43c247eb4e2e62fec',
    curatedListScreenerAddress: '0x56d3ef8a7bf8b04b51ff7c9f4b5d7e4e375b2664',
    addressListScreenerAddress: '0x2e1fc250e758651bd0ab0edc355d7986ab138edc',
    creatorCurationScreenerAddress:
      '0x844472b633c0911dd3fe4c335e8764e2510c180d',
    creatorListScreenerAddress: '0x6031249b8f0427fa7ac4092706eb7a6d53141451',
    lsp1UrdVault: '0x9292dAf1cdc3d03a1A0BbD4B3319C49A3B91d703',
    lsp1UrdUp: '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D',
    vaultImplementation: '0x137f75c7e05aecf4cbbae0141cf624edbbe6c54c', // Shared LSP9VaultInit implementation
    graveVaultFactoryAddress: '0x72205f508e7ad239ad2e4f8c7ec8e6d8da22f960',
    hasUPSupport: true,
    icon: '/lyx_icon_mainnet.svg',
    universalGraveForwarder: '0x42562196ee7aac3e8501db777b25ffc976ed8463',
    marketplaceCollectionsURL: 'https://universal.page/collections',
    previousGraveForwarders: ['0x433908ce6457b302a6452257Bc40e466d95c78E9'],
  },
  '4201': {
    name: 'LUKSO Testnet',
    displayName: 'Lukso Testnet',
    urlName: 'lukso-testnet',
    chainId: 4201,
    url: 'https://testnet--universal-grave.netlify.app',
    rpcUrl: 'https://4201.rpc.thirdweb.com',
    ipfsGateway: 'https://api.universalprofile.cloud/ipfs',
    explorer: 'https://explorer.execution.testnet.lukso.network/',
    token: 'LYXt',
    protocolAddress: '0x091ebe012c1e92b8e7cc8d5acffdea2fc6052efc',
    forwarderAssistantAddress: '0x1296ace80af3230c961c79a9bee6a07b4a45f53f',
    curatedListScreenerAddress: '0xcc3d9c2b38499cdfdaf5de6e5ad3ee3efdaea39e',
    addressListScreenerAddress: '0xbcceeabf2f555631bd481813d783d7eeb7c1799c',
    creatorCurationScreenerAddress:
      '0xd2ecf93c3588c8da4ada3f30d434bc0cd0e1f1c4',
    creatorListScreenerAddress: '0xf922fab253f7e7c6e1d63323f42a870cd896b449',
    lsp1UrdVault: '0xBc7b3980614215c8090dF310661685Cc393B601A',
    lsp1UrdUp: '0x7870C5B8BC9572A8001C3f96f7ff59961B23500D',
    vaultImplementation: '0x392e18585b89bd795204c634cce5878f1cf40a58', // Shared LSP9VaultInit implementation
    graveVaultFactoryAddress: '0x968c19ed81ccd7543cf35e563f8199f4f308926e',
    hasUPSupport: true,
    icon: '/lyx_icon_testnet.svg',
    universalGraveForwarder: '0x72e5b0aeaa8456fa43ba94db703f74052b4cdaac',
    marketplaceCollectionsURL: 'https://universalpage.dev/collections',
    previousGraveForwarders: [
      '0x7e77c704be7a6bba042f66eaba0b9557a872902d',
      '0x1e2f66d2dC19bB13617D1d06CBb3E8d8aa4567e3',
      '0x9c27a05310dC8aF53B60124B244cc9d12f202cdF',
    ],
  },
};

export const networkNameToIdMapping: { [key: string]: number } = {
  [CHAINS.LUKSO]: 42,
  [CHAINS.LUKSO_TESTNET]: 4201,
};

/**
 * Get network configuration by network name (lukso, lukso-testnet)
 */
export const getNetworkByName = (
  networkName: string
): ChainInfo | undefined => {
  const chainId = networkNameToIdMapping[networkName];
  return chainId ? supportedNetworks[chainId.toString()] : undefined;
};

/**
 * Get network configuration by chain ID
 */
export const getNetworkById = (chainId: number): ChainInfo | undefined => {
  return supportedNetworks[chainId.toString()];
};

/**
 * Legacy Network type for backward compatibility
 * Mapped from ChainInfo to match old networks.ts interface
 */
export interface Network {
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerURL: string;
  marketplaceCollectionsURL: string;
  universalGraveForwarder: string;
  previousGraveForwarders: string[];
  lsp1UrdVault: string;
  lsp1UrdUp: string;
  baseUrl: string;
  vaultImplementation?: string;
  graveVaultFactoryAddress?: string;
}

/**
 * Helper to convert ChainInfo to legacy Network type
 */
const toNetwork = (info: ChainInfo): Network => ({
  chainId: info.chainId,
  name: info.name,
  symbol: info.token,
  rpcUrl: info.rpcUrl,
  explorerURL: info.explorer,
  marketplaceCollectionsURL: info.marketplaceCollectionsURL,
  universalGraveForwarder: info.universalGraveForwarder,
  previousGraveForwarders: info.previousGraveForwarders,
  lsp1UrdVault: info.lsp1UrdVault,
  lsp1UrdUp: info.lsp1UrdUp,
  baseUrl: info.url,
  vaultImplementation: info.vaultImplementation,
  graveVaultFactoryAddress: info.graveVaultFactoryAddress,
});

/**
 * Get network configuration by network name (mainnet, testnet)
 * This provides compatibility with the old networks.ts pattern
 */
export const getNetworkConfig = (name: string): Network => {
  let chainInfo: ChainInfo;
  switch (name) {
    case 'mainnet':
      chainInfo = supportedNetworks['42'];
      break;
    case 'testnet':
      chainInfo = supportedNetworks['4201'];
      break;
    default:
      throw new Error(`Unknown network ${name}`);
  }
  return toNetwork(chainInfo);
};
