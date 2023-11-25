/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from 'ethers';
import type { FunctionFragment, Result } from '@ethersproject/abi';
import type { Listener, Provider } from '@ethersproject/providers';
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
} from './common';

export interface LSP1GraveForwaderInterface extends utils.Interface {
  functions: {
    'VERSION()': FunctionFragment;
    'addTokenToAllowlist(address)': FunctionFragment;
    'getAddressStatus(address)': FunctionFragment;
    'getGrave()': FunctionFragment;
    'graveVaults(address)': FunctionFragment;
    'removeTokenFromAllowlist(address)': FunctionFragment;
    'setGrave(address)': FunctionFragment;
    'supportsInterface(bytes4)': FunctionFragment;
    'tokenAllowlist(address,address)': FunctionFragment;
    'universalReceiverDelegate(address,uint256,bytes32,bytes)': FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | 'VERSION'
      | 'addTokenToAllowlist'
      | 'getAddressStatus'
      | 'getGrave'
      | 'graveVaults'
      | 'removeTokenFromAllowlist'
      | 'setGrave'
      | 'supportsInterface'
      | 'tokenAllowlist'
      | 'universalReceiverDelegate'
  ): FunctionFragment;

  encodeFunctionData(functionFragment: 'VERSION', values?: undefined): string;
  encodeFunctionData(
    functionFragment: 'addTokenToAllowlist',
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: 'getAddressStatus',
    values: [string]
  ): string;
  encodeFunctionData(functionFragment: 'getGrave', values?: undefined): string;
  encodeFunctionData(functionFragment: 'graveVaults', values: [string]): string;
  encodeFunctionData(
    functionFragment: 'removeTokenFromAllowlist',
    values: [string]
  ): string;
  encodeFunctionData(functionFragment: 'setGrave', values: [string]): string;
  encodeFunctionData(
    functionFragment: 'supportsInterface',
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: 'tokenAllowlist',
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: 'universalReceiverDelegate',
    values: [string, BigNumberish, BytesLike, BytesLike]
  ): string;

  decodeFunctionResult(functionFragment: 'VERSION', data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: 'addTokenToAllowlist',
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: 'getAddressStatus',
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: 'getGrave', data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: 'graveVaults',
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: 'removeTokenFromAllowlist',
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: 'setGrave', data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: 'supportsInterface',
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: 'tokenAllowlist',
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: 'universalReceiverDelegate',
    data: BytesLike
  ): Result;

  events: {};
}

export interface LSP1GraveForwader extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: LSP1GraveForwaderInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    VERSION(overrides?: CallOverrides): Promise<[string]>;

    addTokenToAllowlist(
      token: string,
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    getAddressStatus(
      token: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    getGrave(overrides?: CallOverrides): Promise<[string]>;

    graveVaults(arg0: string, overrides?: CallOverrides): Promise<[string]>;

    removeTokenFromAllowlist(
      token: string,
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    setGrave(
      grave: string,
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    tokenAllowlist(
      arg0: string,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    universalReceiverDelegate(
      tokenAddress: string,
      value: BigNumberish,
      typeId: BytesLike,
      data: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;
  };

  VERSION(overrides?: CallOverrides): Promise<string>;

  addTokenToAllowlist(
    token: string,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  getAddressStatus(token: string, overrides?: CallOverrides): Promise<boolean>;

  getGrave(overrides?: CallOverrides): Promise<string>;

  graveVaults(arg0: string, overrides?: CallOverrides): Promise<string>;

  removeTokenFromAllowlist(
    token: string,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  setGrave(
    grave: string,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  supportsInterface(
    interfaceId: BytesLike,
    overrides?: CallOverrides
  ): Promise<boolean>;

  tokenAllowlist(
    arg0: string,
    arg1: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  universalReceiverDelegate(
    tokenAddress: string,
    value: BigNumberish,
    typeId: BytesLike,
    data: BytesLike,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  callStatic: {
    VERSION(overrides?: CallOverrides): Promise<string>;

    addTokenToAllowlist(
      token: string,
      overrides?: CallOverrides
    ): Promise<void>;

    getAddressStatus(
      token: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    getGrave(overrides?: CallOverrides): Promise<string>;

    graveVaults(arg0: string, overrides?: CallOverrides): Promise<string>;

    removeTokenFromAllowlist(
      token: string,
      overrides?: CallOverrides
    ): Promise<void>;

    setGrave(grave: string, overrides?: CallOverrides): Promise<void>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;

    tokenAllowlist(
      arg0: string,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    universalReceiverDelegate(
      tokenAddress: string,
      value: BigNumberish,
      typeId: BytesLike,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;
  };

  filters: {};

  estimateGas: {
    VERSION(overrides?: CallOverrides): Promise<BigNumber>;

    addTokenToAllowlist(
      token: string,
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    getAddressStatus(
      token: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getGrave(overrides?: CallOverrides): Promise<BigNumber>;

    graveVaults(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;

    removeTokenFromAllowlist(
      token: string,
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    setGrave(
      grave: string,
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    tokenAllowlist(
      arg0: string,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    universalReceiverDelegate(
      tokenAddress: string,
      value: BigNumberish,
      typeId: BytesLike,
      data: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    VERSION(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    addTokenToAllowlist(
      token: string,
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    getAddressStatus(
      token: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getGrave(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    graveVaults(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    removeTokenFromAllowlist(
      token: string,
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    setGrave(
      grave: string,
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    tokenAllowlist(
      arg0: string,
      arg1: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    universalReceiverDelegate(
      tokenAddress: string,
      value: BigNumberish,
      typeId: BytesLike,
      data: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;
  };
}
