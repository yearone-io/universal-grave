// Function to encode an array of addresses
import { getAddress, keccak256, toUtf8Bytes } from 'ethers';
/*
import { ERC725YDataKeys, LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import UniversalProfile from '@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json';
import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json';
import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js';
import { getChecksumAddress } from './fieldValidations';
import {
  DEFAULT_UP_CONTROLLER_PERMISSIONS,
  DEFAULT_UP_URD_PERMISSIONS,
  UAP_CONTROLLER_PERMISSIONS,
} from '@/constants/constants';
import { ERC725__factory } from '@/types';
import { transactionTypeMap } from '@/components/TransactionTypeBlock';
*/

export const generateMappingKey = (keyName: string, typeId: string): string => {
  const hashedKey = keccak256(toUtf8Bytes(keyName));
  const first10Bytes = hashedKey.slice(2, 22);
  const last20Bytes = typeId.slice(2, 42);
  return '0x' + first10Bytes + '0000' + last20Bytes;
};

export function generateExecutiveScreenersKey(typeId: string, executiveAddress: string): string {
  const hashedFirstWord = keccak256(toUtf8Bytes("UAPExecutiveScreeners"));
  const first6Bytes = hashedFirstWord.slice(2, 14);
  const second4Bytes = typeId.slice(2, 10);
  const last20Bytes = executiveAddress.slice(2, 42);
  return "0x" + first6Bytes + second4Bytes + "0000" + last20Bytes;
}

export function generateScreenerConfigKey(typeId: string, executiveAddress: string, screenerAddress: string): string {
  const hashedFirstWord = keccak256(toUtf8Bytes("UAPScreenerConfig"));
  const first6Bytes = hashedFirstWord.slice(2, 14);
  const second4Bytes = typeId.slice(2, 10);
  const last20Bytes = executiveAddress.slice(2, 22) + screenerAddress.slice(2, 22);
  return "0x" + first6Bytes + second4Bytes + "0000" + last20Bytes;
}


// Function to decode the encoded value for protocol assistant addresses
export function customDecodeAddresses(encoded: string): string[] {
  // Remove "0x" prefix for easier handling
  const data = encoded.startsWith('0x') ? encoded.substring(2) : encoded;

  // Decode the number of addresses (first 4 characters represent 2 bytes)
  const numAddressesHex = data.substring(0, 4);
  const numAddresses = parseInt(numAddressesHex, 16);

  // Extract each 20-byte address
  let addresses: string[] = [];
  for (let i = 0; i < numAddresses; i++) {
    const startIdx = 4 + i * 40; // 4 hex chars for length, then 40 hex chars per address (20 bytes)
    const addressHex = `0x${data.substring(startIdx, startIdx + 40)}`;
    addresses.push(getAddress(addressHex)); // Normalize address
  }

  return addresses;
}

