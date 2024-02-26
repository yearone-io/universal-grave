export interface Network {
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerURL: string;
  universalGraveForwarder: string;
  previousGraveForwarders: string[];
  lsp1UrdVault: string;
  baseUrl: string;
}

const NETWORKS = {
  mainnet: {
    chainId: 42,
    name: 'LUKSO',
    symbol: 'LYX',
    rpcUrl: 'https://lukso.rpc.thirdweb.com',
    explorerURL: 'https://explorer.execution.mainnet.lukso.network',
    universalGraveForwarder: '0x42562196ee7aac3e8501db777b25ffc976ed8463',
    previousGraveForwarders: ['0x433908ce6457b302a6452257Bc40e466d95c78E9'],
    lsp1UrdVault: '0x9292dAf1cdc3d03a1A0BbD4B3319C49A3B91d703',
    baseUrl: 'https://universalgrave.com',
  },
  testnet: {
    chainId: 4201,
    name: 'LUKSO Testnet',
    symbol: 'LYXt',
    rpcUrl: 'https://lukso-testnet.rpc.thirdweb.com',
    explorerURL: 'https://explorer.execution.testnet.lukso.network',
    universalGraveForwarder: '0x72e5b0aeaa8456fa43ba94db703f74052b4cdaac',
    previousGraveForwarders: [
      '0x7e77c704be7a6bba042f66eaba0b9557a872902d',
      '0x1e2f66d2dC19bB13617D1d06CBb3E8d8aa4567e3',
      '0x9c27a05310dC8aF53B60124B244cc9d12f202cdF',
    ],
    lsp1UrdVault: '0xBc7b3980614215c8090dF310661685Cc393B601A',
    baseUrl: 'https://testnet--universal-grave.netlify.app',
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
