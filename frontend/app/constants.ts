export const constants = {
  IPFS: 'https://api.universalprofile.cloud/ipfs',
  IPFS_GATEWAY: 'https://api.universalprofile.cloud/ipfs/',
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
  SUPER_SETDATA: true,
  SETDATA: true,
  SIGN: true,
  ENCRYPT: true,
  DECRYPT: true,
  SUPER_CALL: true,
  CALL: true,
  SUPER_STATICCALL: true,
  STATICCALL: true,
  SUPER_TRANSFERVALUE: true,
  TRANSFERVALUE: true,
  DEPLOY: true,
  EXECUTE_RELAY_CALL: true,
  EDITPERMISSIONS: true,
  ADDCONTROLLER: true,
};

export const GRAVE_CONTROLLER_PERMISSIONS = {
  ADDUNIVERSALRECEIVERDELEGATE: true,
  CHANGEUNIVERSALRECEIVERDELEGATE: true,
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
  REENTRANCY: true,
  SUPER_SETDATA: true,
  SETDATA: true,
};
