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
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from 'ethers';
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from '@ethersproject/abi';
import type { Listener, Provider } from '@ethersproject/providers';
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
} from './common';

export interface LSP7MintableInterface extends utils.Interface {
  functions: {
    'authorizeOperator(address,uint256,bytes)': FunctionFragment;
    'authorizedAmountFor(address,address)': FunctionFragment;
    'balanceOf(address)': FunctionFragment;
    'decimals()': FunctionFragment;
    'decreaseAllowance(address,uint256,bytes)': FunctionFragment;
    'getData(bytes32)': FunctionFragment;
    'getDataBatch(bytes32[])': FunctionFragment;
    'getOperatorsOf(address)': FunctionFragment;
    'increaseAllowance(address,uint256,bytes)': FunctionFragment;
    'mint(address,uint256,bool,bytes)': FunctionFragment;
    'owner()': FunctionFragment;
    'renounceOwnership()': FunctionFragment;
    'revokeOperator(address,bool,bytes)': FunctionFragment;
    'setData(bytes32,bytes)': FunctionFragment;
    'setDataBatch(bytes32[],bytes[])': FunctionFragment;
    'supportsInterface(bytes4)': FunctionFragment;
    'totalSupply()': FunctionFragment;
    'transfer(address,address,uint256,bool,bytes)': FunctionFragment;
    'transferBatch(address[],address[],uint256[],bool[],bytes[])': FunctionFragment;
    'transferOwnership(address)': FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | 'authorizeOperator'
      | 'authorizedAmountFor'
      | 'balanceOf'
      | 'decimals'
      | 'decreaseAllowance'
      | 'getData'
      | 'getDataBatch'
      | 'getOperatorsOf'
      | 'increaseAllowance'
      | 'mint'
      | 'owner'
      | 'renounceOwnership'
      | 'revokeOperator'
      | 'setData'
      | 'setDataBatch'
      | 'supportsInterface'
      | 'totalSupply'
      | 'transfer'
      | 'transferBatch'
      | 'transferOwnership'
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: 'authorizeOperator',
    values: [string, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: 'authorizedAmountFor',
    values: [string, string]
  ): string;
  encodeFunctionData(functionFragment: 'balanceOf', values: [string]): string;
  encodeFunctionData(functionFragment: 'decimals', values?: undefined): string;
  encodeFunctionData(
    functionFragment: 'decreaseAllowance',
    values: [string, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(functionFragment: 'getData', values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: 'getDataBatch',
    values: [BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: 'getOperatorsOf',
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: 'increaseAllowance',
    values: [string, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: 'mint',
    values: [string, BigNumberish, boolean, BytesLike]
  ): string;
  encodeFunctionData(functionFragment: 'owner', values?: undefined): string;
  encodeFunctionData(
    functionFragment: 'renounceOwnership',
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: 'revokeOperator',
    values: [string, boolean, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: 'setData',
    values: [BytesLike, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: 'setDataBatch',
    values: [BytesLike[], BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: 'supportsInterface',
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: 'totalSupply',
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: 'transfer',
    values: [string, string, BigNumberish, boolean, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: 'transferBatch',
    values: [string[], string[], BigNumberish[], boolean[], BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: 'transferOwnership',
    values: [string]
  ): string;

  decodeFunctionResult(
    functionFragment: 'authorizeOperator',
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: 'authorizedAmountFor',
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: 'balanceOf', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'decimals', data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: 'decreaseAllowance',
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: 'getData', data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: 'getDataBatch',
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: 'getOperatorsOf',
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: 'increaseAllowance',
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: 'mint', data: BytesLike): Result;
  decodeFunctionResult(functionFragment: 'owner', data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: 'renounceOwnership',
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: 'revokeOperator',
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: 'setData', data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: 'setDataBatch',
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: 'supportsInterface',
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: 'totalSupply',
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: 'transfer', data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: 'transferBatch',
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: 'transferOwnership',
    data: BytesLike
  ): Result;

  events: {
    'AuthorizedOperator(address,address,uint256,bytes)': EventFragment;
    'DataChanged(bytes32,bytes)': EventFragment;
    'OwnershipTransferred(address,address)': EventFragment;
    'RevokedOperator(address,address,bool,bytes)': EventFragment;
    'Transfer(address,address,address,uint256,bool,bytes)': EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: 'AuthorizedOperator'): EventFragment;
  getEvent(nameOrSignatureOrTopic: 'DataChanged'): EventFragment;
  getEvent(nameOrSignatureOrTopic: 'OwnershipTransferred'): EventFragment;
  getEvent(nameOrSignatureOrTopic: 'RevokedOperator'): EventFragment;
  getEvent(nameOrSignatureOrTopic: 'Transfer'): EventFragment;
}

export interface AuthorizedOperatorEventObject {
  operator: string;
  tokenOwner: string;
  amount: BigNumber;
  operatorNotificationData: string;
}
export type AuthorizedOperatorEvent = TypedEvent<
  [string, string, BigNumber, string],
  AuthorizedOperatorEventObject
>;

export type AuthorizedOperatorEventFilter =
  TypedEventFilter<AuthorizedOperatorEvent>;

export interface DataChangedEventObject {
  dataKey: string;
  dataValue: string;
}
export type DataChangedEvent = TypedEvent<
  [string, string],
  DataChangedEventObject
>;

export type DataChangedEventFilter = TypedEventFilter<DataChangedEvent>;

export interface OwnershipTransferredEventObject {
  previousOwner: string;
  newOwner: string;
}
export type OwnershipTransferredEvent = TypedEvent<
  [string, string],
  OwnershipTransferredEventObject
>;

export type OwnershipTransferredEventFilter =
  TypedEventFilter<OwnershipTransferredEvent>;

export interface RevokedOperatorEventObject {
  operator: string;
  tokenOwner: string;
  notified: boolean;
  operatorNotificationData: string;
}
export type RevokedOperatorEvent = TypedEvent<
  [string, string, boolean, string],
  RevokedOperatorEventObject
>;

export type RevokedOperatorEventFilter = TypedEventFilter<RevokedOperatorEvent>;

export interface TransferEventObject {
  operator: string;
  from: string;
  to: string;
  amount: BigNumber;
  force: boolean;
  data: string;
}
export type TransferEvent = TypedEvent<
  [string, string, string, BigNumber, boolean, string],
  TransferEventObject
>;

export type TransferEventFilter = TypedEventFilter<TransferEvent>;

export interface LSP7Mintable extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: LSP7MintableInterface;

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
    authorizeOperator(
      operator: string,
      amount: BigNumberish,
      operatorNotificationData: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    authorizedAmountFor(
      operator: string,
      tokenOwner: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    balanceOf(
      tokenOwner: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    decimals(overrides?: CallOverrides): Promise<[number]>;

    decreaseAllowance(
      operator: string,
      subtractedAmount: BigNumberish,
      operatorNotificationData: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    getData(
      dataKey: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string] & { dataValue: string }>;

    getDataBatch(
      dataKeys: BytesLike[],
      overrides?: CallOverrides
    ): Promise<[string[]] & { dataValues: string[] }>;

    getOperatorsOf(
      tokenOwner: string,
      overrides?: CallOverrides
    ): Promise<[string[]]>;

    increaseAllowance(
      operator: string,
      addedAmount: BigNumberish,
      operatorNotificationData: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    mint(
      to: string,
      amount: BigNumberish,
      force: boolean,
      data: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    renounceOwnership(
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    revokeOperator(
      operator: string,
      notify: boolean,
      operatorNotificationData: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    setData(
      dataKey: BytesLike,
      dataValue: BytesLike,
      overrides?: PayableOverrides & { from?: string }
    ): Promise<ContractTransaction>;

    setDataBatch(
      dataKeys: BytesLike[],
      dataValues: BytesLike[],
      overrides?: PayableOverrides & { from?: string }
    ): Promise<ContractTransaction>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    totalSupply(overrides?: CallOverrides): Promise<[BigNumber]>;

    transfer(
      from: string,
      to: string,
      amount: BigNumberish,
      force: boolean,
      data: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    transferBatch(
      from: string[],
      to: string[],
      amount: BigNumberish[],
      force: boolean[],
      data: BytesLike[],
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string }
    ): Promise<ContractTransaction>;
  };

  authorizeOperator(
    operator: string,
    amount: BigNumberish,
    operatorNotificationData: BytesLike,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  authorizedAmountFor(
    operator: string,
    tokenOwner: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  balanceOf(tokenOwner: string, overrides?: CallOverrides): Promise<BigNumber>;

  decimals(overrides?: CallOverrides): Promise<number>;

  decreaseAllowance(
    operator: string,
    subtractedAmount: BigNumberish,
    operatorNotificationData: BytesLike,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  getData(dataKey: BytesLike, overrides?: CallOverrides): Promise<string>;

  getDataBatch(
    dataKeys: BytesLike[],
    overrides?: CallOverrides
  ): Promise<string[]>;

  getOperatorsOf(
    tokenOwner: string,
    overrides?: CallOverrides
  ): Promise<string[]>;

  increaseAllowance(
    operator: string,
    addedAmount: BigNumberish,
    operatorNotificationData: BytesLike,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  mint(
    to: string,
    amount: BigNumberish,
    force: boolean,
    data: BytesLike,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  owner(overrides?: CallOverrides): Promise<string>;

  renounceOwnership(
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  revokeOperator(
    operator: string,
    notify: boolean,
    operatorNotificationData: BytesLike,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  setData(
    dataKey: BytesLike,
    dataValue: BytesLike,
    overrides?: PayableOverrides & { from?: string }
  ): Promise<ContractTransaction>;

  setDataBatch(
    dataKeys: BytesLike[],
    dataValues: BytesLike[],
    overrides?: PayableOverrides & { from?: string }
  ): Promise<ContractTransaction>;

  supportsInterface(
    interfaceId: BytesLike,
    overrides?: CallOverrides
  ): Promise<boolean>;

  totalSupply(overrides?: CallOverrides): Promise<BigNumber>;

  transfer(
    from: string,
    to: string,
    amount: BigNumberish,
    force: boolean,
    data: BytesLike,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  transferBatch(
    from: string[],
    to: string[],
    amount: BigNumberish[],
    force: boolean[],
    data: BytesLike[],
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: string,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransaction>;

  callStatic: {
    authorizeOperator(
      operator: string,
      amount: BigNumberish,
      operatorNotificationData: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    authorizedAmountFor(
      operator: string,
      tokenOwner: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    balanceOf(
      tokenOwner: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    decimals(overrides?: CallOverrides): Promise<number>;

    decreaseAllowance(
      operator: string,
      subtractedAmount: BigNumberish,
      operatorNotificationData: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    getData(dataKey: BytesLike, overrides?: CallOverrides): Promise<string>;

    getDataBatch(
      dataKeys: BytesLike[],
      overrides?: CallOverrides
    ): Promise<string[]>;

    getOperatorsOf(
      tokenOwner: string,
      overrides?: CallOverrides
    ): Promise<string[]>;

    increaseAllowance(
      operator: string,
      addedAmount: BigNumberish,
      operatorNotificationData: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    mint(
      to: string,
      amount: BigNumberish,
      force: boolean,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    owner(overrides?: CallOverrides): Promise<string>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    revokeOperator(
      operator: string,
      notify: boolean,
      operatorNotificationData: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    setData(
      dataKey: BytesLike,
      dataValue: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    setDataBatch(
      dataKeys: BytesLike[],
      dataValues: BytesLike[],
      overrides?: CallOverrides
    ): Promise<void>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;

    totalSupply(overrides?: CallOverrides): Promise<BigNumber>;

    transfer(
      from: string,
      to: string,
      amount: BigNumberish,
      force: boolean,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    transferBatch(
      from: string[],
      to: string[],
      amount: BigNumberish[],
      force: boolean[],
      data: BytesLike[],
      overrides?: CallOverrides
    ): Promise<void>;

    transferOwnership(
      newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    'AuthorizedOperator(address,address,uint256,bytes)'(
      operator?: string | null,
      tokenOwner?: string | null,
      amount?: BigNumberish | null,
      operatorNotificationData?: null
    ): AuthorizedOperatorEventFilter;
    AuthorizedOperator(
      operator?: string | null,
      tokenOwner?: string | null,
      amount?: BigNumberish | null,
      operatorNotificationData?: null
    ): AuthorizedOperatorEventFilter;

    'DataChanged(bytes32,bytes)'(
      dataKey?: BytesLike | null,
      dataValue?: null
    ): DataChangedEventFilter;
    DataChanged(
      dataKey?: BytesLike | null,
      dataValue?: null
    ): DataChangedEventFilter;

    'OwnershipTransferred(address,address)'(
      previousOwner?: string | null,
      newOwner?: string | null
    ): OwnershipTransferredEventFilter;
    OwnershipTransferred(
      previousOwner?: string | null,
      newOwner?: string | null
    ): OwnershipTransferredEventFilter;

    'RevokedOperator(address,address,bool,bytes)'(
      operator?: string | null,
      tokenOwner?: string | null,
      notified?: null,
      operatorNotificationData?: null
    ): RevokedOperatorEventFilter;
    RevokedOperator(
      operator?: string | null,
      tokenOwner?: string | null,
      notified?: null,
      operatorNotificationData?: null
    ): RevokedOperatorEventFilter;

    'Transfer(address,address,address,uint256,bool,bytes)'(
      operator?: string | null,
      from?: string | null,
      to?: string | null,
      amount?: null,
      force?: null,
      data?: null
    ): TransferEventFilter;
    Transfer(
      operator?: string | null,
      from?: string | null,
      to?: string | null,
      amount?: null,
      force?: null,
      data?: null
    ): TransferEventFilter;
  };

  estimateGas: {
    authorizeOperator(
      operator: string,
      amount: BigNumberish,
      operatorNotificationData: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    authorizedAmountFor(
      operator: string,
      tokenOwner: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    balanceOf(
      tokenOwner: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    decimals(overrides?: CallOverrides): Promise<BigNumber>;

    decreaseAllowance(
      operator: string,
      subtractedAmount: BigNumberish,
      operatorNotificationData: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    getData(dataKey: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    getDataBatch(
      dataKeys: BytesLike[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getOperatorsOf(
      tokenOwner: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    increaseAllowance(
      operator: string,
      addedAmount: BigNumberish,
      operatorNotificationData: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    mint(
      to: string,
      amount: BigNumberish,
      force: boolean,
      data: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    revokeOperator(
      operator: string,
      notify: boolean,
      operatorNotificationData: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    setData(
      dataKey: BytesLike,
      dataValue: BytesLike,
      overrides?: PayableOverrides & { from?: string }
    ): Promise<BigNumber>;

    setDataBatch(
      dataKeys: BytesLike[],
      dataValues: BytesLike[],
      overrides?: PayableOverrides & { from?: string }
    ): Promise<BigNumber>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    totalSupply(overrides?: CallOverrides): Promise<BigNumber>;

    transfer(
      from: string,
      to: string,
      amount: BigNumberish,
      force: boolean,
      data: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    transferBatch(
      from: string[],
      to: string[],
      amount: BigNumberish[],
      force: boolean[],
      data: BytesLike[],
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    authorizeOperator(
      operator: string,
      amount: BigNumberish,
      operatorNotificationData: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    authorizedAmountFor(
      operator: string,
      tokenOwner: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    balanceOf(
      tokenOwner: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    decimals(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    decreaseAllowance(
      operator: string,
      subtractedAmount: BigNumberish,
      operatorNotificationData: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    getData(
      dataKey: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getDataBatch(
      dataKeys: BytesLike[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getOperatorsOf(
      tokenOwner: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    increaseAllowance(
      operator: string,
      addedAmount: BigNumberish,
      operatorNotificationData: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    mint(
      to: string,
      amount: BigNumberish,
      force: boolean,
      data: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    revokeOperator(
      operator: string,
      notify: boolean,
      operatorNotificationData: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    setData(
      dataKey: BytesLike,
      dataValue: BytesLike,
      overrides?: PayableOverrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    setDataBatch(
      dataKeys: BytesLike[],
      dataValues: BytesLike[],
      overrides?: PayableOverrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    totalSupply(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    transfer(
      from: string,
      to: string,
      amount: BigNumberish,
      force: boolean,
      data: BytesLike,
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    transferBatch(
      from: string[],
      to: string[],
      amount: BigNumberish[],
      force: boolean[],
      data: BytesLike[],
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string }
    ): Promise<PopulatedTransaction>;
  };
}