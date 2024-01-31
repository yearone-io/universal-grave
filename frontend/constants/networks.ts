export interface Network {
  chainId: number;
  symbol: string;
  rpcUrl: string;
  fallbackRpcUrl: string;
  explorerURL: string;
  universalGraveForwarder: string;
  lsp1UrdVault: string;
}

const NETWORKS = {
  mainnet: {
    chainId: 42,
    symbol: 'LYX',
    rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
    fallbackRpcUrl: 'https://rpc.lukso.gateway.fm',
    explorerURL: 'https://explorer.execution.mainnet.lukso.network',
    universalGraveForwarder: '0xa5467dfe7019bf2c7c5f7a707711b9d4cad118c8',
    lsp1UrdVault: '0x',
  },
  testnet: {
    chainId: 4201,
    symbol: 'LYXt',
    rpcUrl: process.env.NEXT_PUBLIC_TESTNET_RPC_URL,
    fallbackRpcUrl: 'https://rpc.testnet.lukso.network',
    explorerURL: 'https://explorer.execution.testnet.lukso.network',
    universalGraveForwarder: '0x1e2f66d2dC19bB13617D1d06CBb3E8d8aa4567e3',
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
