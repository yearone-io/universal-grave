export interface Network {
  chainId: number;
  symbol: string;
  rpcUrl: string;
  explorerURL: string;
  universalGraveForwarder: string;
  lsp1UrdVault: string;
}

const NETWORKS = {
  mainnet: {
    chainId: 42,
    symbol: 'LYX',
    rpcUrl: 'https://rpc.lukso.gateway.fm',
    explorerURL: 'https://explorer.execution.mainnet.lukso.network',
    universalGraveForwarder: '0xa5467dfe7019bf2c7c5f7a707711b9d4cad118c8',
    lsp1UrdVault: '',
  },
  testnet: {
    chainId: 4201,
    symbol: 'LYXt',
    rpcUrl: 'https://rpc.testnet.lukso.network',
    explorerURL: 'https://explorer.execution.testnet.lukso.network',
    universalGraveForwarder: '0x7e77c704be7a6bba042f66eaba0b9557a872902d',
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
