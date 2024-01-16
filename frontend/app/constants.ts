import { PERMISSIONS } from '@lukso/lsp-smart-contracts';
export const constants = {
  UNIVERSAL_GRAVE_FORWARDER: '0x1e2f66d2dC19bB13617D1d06CBb3E8d8aa4567e3',
  LSP1_URD_VAULT_TESTNET: '0xBc7b3980614215c8090dF310661685Cc393B601A',
  IPFS: 'https://api.universalprofile.cloud/ipfs',
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
  LUKSO_EXPLORER: {
    TESTNET: {
      ADDRESS: 'https://explorer.execution.testnet.lukso.network/address/',
    },
  },
  IPFS_GATEWAY: 'https://gateway.pinata.cloud/ipfs/',
  METADATA: {
    TITLE: 'GRAVE | Digital Spambox',
    IMAGE: '/images/ghoulie.jpg',
    DESCRIPTION:
      'GRAVE is a digital spambox that allows you to receive and manage web3 digital assets.',
  },
};

/*
UP! Extension Profile Default Main Controller Permissions
extacted using https://erc725-inspect.lukso.tech/data-fetcher
and 🔑  AddressPermissions:Permissions:<address> for the URD of new UP! extension profile
  {
  "CHANGEOWNER": false,
  "ADDCONTROLLER": true,
  "EDITPERMISSIONS": true,
  "ADDEXTENSIONS": false,
  "CHANGEEXTENSIONS": false,
  "ADDUNIVERSALRECEIVERDELEGATE": false,
  "CHANGEUNIVERSALRECEIVERDELEGATE": false,
  "REENTRANCY": false,
  "SUPER_TRANSFERVALUE": true,
  "TRANSFERVALUE": true,
  "SUPER_CALL": true,
  "CALL": true,
  "SUPER_STATICCALL": true,
  "STATICCALL": true,
  "SUPER_DELEGATECALL": false,
  "DELEGATECALL": false,
  "DEPLOY": true,
  "SUPER_SETDATA": true,
  "SETDATA": true,
  "ENCRYPT": true,
  "DECRYPT": true,
  "SIGN": true,
  "EXECUTE_RELAY_CALL": true
}
*/

export const DEFAULT_UP_CONTROLLER_PERMISSIONS = {
  [PERMISSIONS.SUPER_SETDATA]: true,
  [PERMISSIONS.SETDATA]: true,
  [PERMISSIONS.SIGN]: true,
  [PERMISSIONS.ENCRYPT]: true,
  [PERMISSIONS.DECRYPT]: true,
  [PERMISSIONS.SUPER_CALL]: true,
  [PERMISSIONS.CALL]: true,
  [PERMISSIONS.SUPER_STATICCALL]: true,
  [PERMISSIONS.STATICCALL]: true,
  [PERMISSIONS.SUPER_TRANSFERVALUE]: true,
  [PERMISSIONS.TRANSFERVALUE]: true,
  [PERMISSIONS.DEPLOY]: true,
  [PERMISSIONS.EXECUTE_RELAY_CALL]: true,
  [PERMISSIONS.EDITPERMISSIONS]: true,
  [PERMISSIONS.ADDCONTROLLER]: true,
};

export const GRAVE_CONTROLLER_PERMISSIONS = {
  [PERMISSIONS.ADDUNIVERSALRECEIVERDELEGATE]: true,
  [PERMISSIONS.CHANGEUNIVERSALRECEIVERDELEGATE]: true,
};

/*
  UP! Extension Default UP URD Permissions
  extacted using https://erc725-inspect.lukso.tech/data-fetcher
  and 🔑  AddressPermissions:Permissions:<address> for the main controller of new UP! extension profile
  {
  "CHANGEOWNER": false,
  "ADDCONTROLLER": false,
  "EDITPERMISSIONS": false,
  "ADDEXTENSIONS": false,
  "CHANGEEXTENSIONS": false,
  "ADDUNIVERSALRECEIVERDELEGATE": false,
  "CHANGEUNIVERSALRECEIVERDELEGATE": false,
  "REENTRANCY": true,
  "SUPER_TRANSFERVALUE": false,
  "TRANSFERVALUE": false,
  "SUPER_CALL": false,
  "CALL": false,
  "SUPER_STATICCALL": false,
  "STATICCALL": false,
  "SUPER_DELEGATECALL": false,
  "DELEGATECALL": false,
  "DEPLOY": false,
  "SUPER_SETDATA": true,
  "SETDATA": true,
  "ENCRYPT": false,
  "DECRYPT": false,
  "SIGN": false,
  "EXECUTE_RELAY_CALL": false
}
*/

export const DEFAULT_UP_URD_PERMISSIONS = {
  [PERMISSIONS.REENTRANCY]: true,
  [PERMISSIONS.SUPER_SETDATA]: true,
  [PERMISSIONS.SETDATA]: true,
};
