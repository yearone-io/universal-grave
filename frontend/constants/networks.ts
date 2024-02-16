export interface Network {
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerURL: string;
  universalGraveForwarder: string;
  previousGraveForwarders: string[];
  lsp1UrdVault: string;
}

const NETWORKS = {
  mainnet: {
    chainId: 42,
    name: 'LUKSO',
    symbol: 'LYX',
    rpcUrl: 'https://rpc.lukso.gateway.fm',
    explorerURL: 'https://explorer.execution.mainnet.lukso.network',
    universalGraveForwarder: '0x433908ce6457b302a6452257Bc40e466d95c78E9',
    previousGraveForwarders: [],
    lsp1UrdVault: '0x9292dAf1cdc3d03a1A0BbD4B3319C49A3B91d703',
  },
  testnet: {
    chainId: 4201,
    name: 'LUKSO Testnet',
    symbol: 'LYXt',
    rpcUrl: 'https://rpc.testnet.lukso.network',
    explorerURL: 'https://explorer.execution.testnet.lukso.network',
    universalGraveForwarder: '0x7e77c704be7a6bba042f66eaba0b9557a872902d',
    previousGraveForwarders: [
      '0x1e2f66d2dC19bB13617D1d06CBb3E8d8aa4567e3',
      '0x9c27a05310dC8aF53B60124B244cc9d12f202cdF',
    ],
    lsp1UrdVault: '0xBc7b3980614215c8090dF310661685Cc393B601A',
  },
} as {
  [key: string]: Network;
};

export const getNetworkConfig = (name: string) => {
  switch (name) {
    case 'mainnet':
      return NETWORKS.mainnet;
    case 'testnet':
      return NETWORKS.testnet;
    default:
      throw new Error(`Unknown network ${name}`);
  }
};
