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
  lsp1UrdVault: string; // Vault URD address
  vaultImplementation?: string; // Pre-deployed LSP9VaultInit implementation for proxy pattern
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
    protocolAddress: '0x289286ce00da26e723a0069d715882fab2d18ed4',
    forwarderAssistantAddress: '0xc503d7f50c4d2c0649fa86e43c247eb4e2e62fec',
    curatedListScreenerAddress: '0x9ae3cdfe679935428094eea1668d30cdad8ede8c',
    addressListScreenerAddress: '0x7fe2bf2ec24f94fd43f10d6911123a18450e3c5e',
    lsp1UrdVault: '0x9292dAf1cdc3d03a1A0BbD4B3319C49A3B91d703',
    vaultImplementation: '0x137f75c7e05aecf4cbbae0141cf624edbbe6c54c', // Shared LSP9VaultInit implementation
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
    protocolAddress: '0xf6fa5d9b08a9e5a7bea5c816757e6b0dd548b920',
    forwarderAssistantAddress: '0x1296ace80af3230c961c79a9bee6a07b4a45f53f',
    curatedListScreenerAddress: '0x647360684dd6ad295d1c62bebc43c11a843a4248',
    addressListScreenerAddress: '0x31c7ab87662132f5901f190032d49e0abe9fabec',
    lsp1UrdVault: '0xBc7b3980614215c8090dF310661685Cc393B601A',
    vaultImplementation: '0x392e18585b89bd795204c634cce5878f1cf40a58', // Shared LSP9VaultInit implementation
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
