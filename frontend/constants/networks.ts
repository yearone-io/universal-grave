export const NETWORKS = {
  mainnet: {
    chainId: 42,
    symbol: 'LYX',
    rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
    fallbackRpcUrl: 'https://rpc.lukso.gateway.fm',
    explorerURL: 'https://explorer.execution.mainnet.lukso.network',
  },
  testnet: {
    chainId: 4201,
    symbol: 'LYXt',
    rpcUrl: process.env.NEXT_PUBLIC_TESTNET_RPC_URL,
    fallbackRpcUrl: 'https://rpc.testnet.lukso.network',
    explorerURL: 'https://explorer.execution.testnet.lukso.network',
  },
};
