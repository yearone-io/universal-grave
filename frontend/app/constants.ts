import {
  PERMISSIONS,
} from '@lukso/lsp-smart-contracts';
export const constants = {
  UNIVERSAL_GRAVE_FORWARDER: '0xb599063e482c7d062e05e5510e0384ed4b4ba434',
  LSP1_URD_VAULT_TESTNET: '0xBc7b3980614215c8090dF310661685Cc393B601A',
  IPFS: 'https://api.universalprofile.cloud/ipfs',
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
  LUKSO_TESTNET_EXPLORER: 'https://explorer.execution.testnet.lukso.network',
  IPFS_GATEWAY: 'https://gateway.pinata.cloud/ipfs/',
  METADATA: {
    TITLE: 'GRAVE | Digital Spambox',
    IMAGE: '/images/ghoulie.jpg',
    DESCRIPTION:
      'GRAVE is a digital spambox that allows you to receive and manage web3 digital assets.',
  },
};

export const DEFAULT_MAIN_CONTROLLER_PERMISSIONS = 
  parseInt(PERMISSIONS.SETDATA, 16) ^
  parseInt(PERMISSIONS.SIGN, 16) ^
  parseInt(PERMISSIONS.ENCRYPT, 16) ^
  parseInt(PERMISSIONS.DECRYPT, 16) ^
  parseInt(PERMISSIONS.CALL, 16) ^
  parseInt(PERMISSIONS.STATICCALL, 16) ^
  parseInt(PERMISSIONS.TRANSFERVALUE, 16) ^
  parseInt(PERMISSIONS.EXECUTE_RELAY_CALL, 16) ^
  parseInt(PERMISSIONS.EDITPERMISSIONS, 16) ^
  parseInt(PERMISSIONS.ADDCONTROLLER, 16);

export const GRAVE_PERMISSIONS = 
  parseInt(PERMISSIONS.DEPLOY, 16) ^ // necessary deploying user's Grave Vault
  parseInt(PERMISSIONS.ADDUNIVERSALRECEIVERDELEGATE, 16) ^ // necessary for adding a Grave Forwarder as Universal Receiver Delegate
  parseInt(PERMISSIONS.CHANGEUNIVERSALRECEIVERDELEGATE, 16); // necessary for in future removing a Grave Forwarder as Universal Receiver Delegate

