const NETWORKS = {
  mainnet: {
    chainId: 42,
    symbol: 'LYX',
    rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
    fallbackRpcUrl: 'https://rpc.lukso.gateway.fm',
    explorerURL: 'https://explorer.execution.mainnet.lukso.network',
    universalGraveForwarder: '',
    lsp1UrdVault: '',
    luksoExplorer: 'https://explorer.execution.testnet.lukso.network/address/',
  },
  testnet: {
    chainId: 4201,
    symbol: 'LYXt',
    rpcUrl: process.env.NEXT_PUBLIC_TESTNET_RPC_URL,
    fallbackRpcUrl: 'https://rpc.testnet.lukso.network',
    explorerURL: 'https://explorer.execution.testnet.lukso.network',
    universalGraveForwarder: '0x1e2f66d2dC19bB13617D1d06CBb3E8d8aa4567e3',
    lsp1UrdVault: '0xBc7b3980614215c8090dF310661685Cc393B601A',
    luksoExplorer: 'https://explorer.execution.testnet.lukso.network/address/',
  },
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
