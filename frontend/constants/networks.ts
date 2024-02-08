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
    lsp1UrdVault: '',
  },
  testnet: {
    chainId: 4201,
    symbol: 'LYXt',
    rpcUrl: process.env.NEXT_PUBLIC_TESTNET_RPC_URL,
    fallbackRpcUrl: 'https://rpc.testnet.lukso.network',
    explorerURL: 'https://explorer.execution.testnet.lukso.network',
    universalGraveForwarder: '0xc0ffc9ca39e79c6fdbb89c3d0528f112e54e7b31',
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
