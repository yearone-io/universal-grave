import erc20 from '@openzeppelin/contracts/build/contracts/ERC20.json';
import { AbiItem } from 'viem';

export const erc20ABI: AbiItem[] = erc20.abi as AbiItem[];
