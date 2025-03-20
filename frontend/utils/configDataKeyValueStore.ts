// Function to encode an array of addresses
import { AbiCoder, getAddress, keccak256, toUtf8Bytes } from 'ethers';
import { ERC725 } from '@/types/ERC725';
/*
import { ERC725YDataKeys, LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
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

export function generateCurationScreenerBlocklistKey(executiveAddress: string, screenerAddress: string, itemAddress: string): string {
  const hashedFirstWord = keccak256(toUtf8Bytes("UAPList"));
  const first6Bytes = hashedFirstWord.slice(2, 14);
  const second4Bytes = executiveAddress.slice(2, 10);
  const last20Bytes = screenerAddress.slice(2, 22) + itemAddress.slice(2, 22);
  return "0x" + first6Bytes + second4Bytes + "0000" + last20Bytes;
}

export function generateListMappingKey(executiveAddress: string, screenerAddress: string, itemAddress: string): string {
  const hashedFirstWord = keccak256(toUtf8Bytes("UAPList"));
  const first6Bytes = hashedFirstWord.slice(2, 14);
  const executiveBytes4 = executiveAddress.slice(2, 10);
  const screenerBytes10 = screenerAddress.slice(2, 22);
  const itemBytes10 = itemAddress.slice(2, 22);
  return "0x" + first6Bytes + executiveBytes4 + "0000" + screenerBytes10 + itemBytes10;
}

// Generates the list set key (mirrors contract logic)
export function generateListSetKey(executiveAddress: string, screenerAddress: string): string {
  const hashedFirstWord = keccak256(toUtf8Bytes("UAPList"));
  const first6Bytes = hashedFirstWord.slice(2, 14);
  const executiveBytes4 = executiveAddress.slice(2, 10);
  const screenerBytes10 = screenerAddress.slice(2, 22);
  const endingBytes10 = "0".repeat(16) + "5b5d"
  return "0x" + first6Bytes + executiveBytes4 + "0000" + screenerBytes10 + endingBytes10;
}

// Reads the current list set from the Universal Profile
export async function getListSet(up: ERC725, executiveAddress: string, screenerAddress: string): Promise<string[]> {
  const setKey = generateListSetKey(executiveAddress, screenerAddress);
  const value = await up.getData(setKey);
  if (value === "0x" || value.length === 0) return [];
  return AbiCoder.defaultAbiCoder().decode(["address[]"], value)[0];
}

// Adds an address to the list set if not already present
export async function addToListSetPayload(up: ERC725, executiveAddress: string, screenerAddress: string, itemAddress: string) {
  const currentSet = await getListSet(up, executiveAddress, screenerAddress);
  if (currentSet.includes(itemAddress)) return AbiCoder.defaultAbiCoder().encode(["address[]"], [currentSet]);
  const newSet = [...currentSet, itemAddress];
  const encodedValue = AbiCoder.defaultAbiCoder().encode(["address[]"], [newSet]);
  return encodedValue;
}

// Removes an address from the list set if present
export async function removeFromListSetPayload(up: ERC725, executiveAddress: string, screenerAddress: string, itemAddress: string) {
  const currentSet = await getListSet(up, executiveAddress, screenerAddress);
  const index = currentSet.indexOf(itemAddress);
  if (index === -1) return AbiCoder.defaultAbiCoder().encode(["address[]"], [currentSet]);
  const newSet = currentSet.filter((_, i) => i !== index);
  const encodedValue = newSet.length ? AbiCoder.defaultAbiCoder().encode(["address[]"], [newSet]) : "0x";
  return encodedValue;
}

// Sets or removes an address in the list (combines mapping and set operations)
export async function setListEntry(up: ERC725, executiveAddress: string, screenerAddress: string, itemAddress: string, isInList: boolean) {
  const mappingKey = generateListMappingKey(executiveAddress, screenerAddress, itemAddress);
  const setKey = generateListSetKey(executiveAddress, screenerAddress);
  const value = isInList ? AbiCoder.defaultAbiCoder().encode(["bool"], [true]) : "0x";
  let listPayload = "0x"
  if (isInList) {
    listPayload = await addToListSetPayload(up, executiveAddress, screenerAddress, itemAddress);
  } else {
    listPayload = await removeFromListSetPayload(up, executiveAddress, screenerAddress, itemAddress);
  }
  await up.setDataBatch([mappingKey, setKey], [value, listPayload]);
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

