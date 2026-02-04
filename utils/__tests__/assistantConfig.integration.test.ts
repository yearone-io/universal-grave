import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AbiCoder } from 'ethers';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import uapSchema from '@/schemas/UAP.json';
import { getErc725Read } from '@/utils/erc725Client';
import type { ForwarderAssistantConfig } from '../assistantConfig';
import * as assistantConfigModule from '../assistantConfig';
import configureExecutiveAssistantWithUnifiedSystem from '@/utils/configureExecutiveAssistant';

const getDataMock = vi.fn();
const getDataBatchMock = vi.fn();
const setDataBatchMock = vi.fn();

vi.mock('@/utils/configureExecutiveAssistant', () => ({
  default: vi.fn(),
}));

vi.mock('@/utils/walletClient', () => ({
  getWalletSigner: vi.fn().mockResolvedValue({}),
}));

vi.mock('ethers', async () => {
  const actual = await vi.importActual<any>('ethers');
  return {
    ...actual,
    Contract: vi.fn().mockImplementation(() => ({
      setDataBatch: setDataBatchMock,
      getData: getDataMock,
      getDataBatch: getDataBatchMock,
    })),
  };
});

const mockConfigure = vi.mocked(configureExecutiveAssistantWithUnifiedSystem);

describe('saveForwarderAssistantConfig integration', () => {
  const upAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const networkConfig = {
    forwarderAssistantAddress: '0x9999999999999999999999999999999999999999',
    addressListScreenerAddress: '0x1111111111111111111111111111111111111111',
    curatedListScreenerAddress: '0x2222222222222222222222222222222222222222',
    creatorListScreenerAddress: '0x3333333333333333333333333333333333333333',
    creatorCurationScreenerAddress:
      '0x4444444444444444444444444444444444444444',
  };

  const baseConfig: ForwarderAssistantConfig = {
    vaultAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    whitelistAddresses: ['0x5555555555555555555555555555555555555555'],
    curatedListAddress: null,
    useCuratedList: false,
    isConfigured: true,
    executionOrderLSP7: 0,
    executionOrderLSP8: 0,
    listName: 'GraveSafeAssets',
    listLengthMissing: false,
    addressScreenerConfigMissing: false,
    addressListNameMissing: false,
    creatorWhitelistAddresses: [
      '0x7777777777777777777777777777777777777777',
    ],
    creatorCuratedListAddress: null,
    requireAllCreatorsForList: false,
    requireAllCreatorsForCuration: false,
    creatorListName: 'GraveSafeCreators',
    creatorListLengthMissing: false,
    creatorScreenerConfigMissing: false,
    creatorListNameMissing: false,
  };

  beforeEach(() => {
    mockConfigure.mockReset();
    mockConfigure.mockResolvedValue({
      keys: ['0xkey'],
      values: ['0xvalue'],
    });
    getDataMock.mockReset();
    getDataBatchMock.mockReset();
    setDataBatchMock.mockReset();
    setDataBatchMock.mockResolvedValue({
      wait: vi.fn().mockResolvedValue(undefined),
    });
  });

  const mockExistingConfigReads = (provider: any) => {
    const erc725 = getErc725Read(uapSchema as any, upAddress, { provider });
    const abiCoder = new AbiCoder();
    const LSP7_TYPE = LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification;
    const LSP8_TYPE = LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification;

    const typeConfigValue = erc725.encodeValueType('address[]', [
      networkConfig.forwarderAssistantAddress,
    ]);

    const execConfigValue = assistantConfigModule.encodeExecDataValue(
      networkConfig.forwarderAssistantAddress,
      abiCoder.encode(['address'], [baseConfig.vaultAddress])
    );

    const screenersValue = erc725.encodeValueType('address[]', [
      networkConfig.creatorListScreenerAddress,
      networkConfig.addressListScreenerAddress,
    ]);

    const minimalScreenerConfig =
      '0x' + '11'.repeat(20) + '22'.repeat(20);

    const makeListItemKey = (listName: string, index: number) => {
      const baseArrayKey = erc725.encodeKeyName(`${listName}[]`);
      const keyPrefix = baseArrayKey.slice(0, 34);
      const indexBytes16 = index.toString(16).padStart(32, '0');
      return keyPrefix + indexBytes16;
    };

    const data: Record<string, string> = {
      [erc725.encodeKeyName('UAPTypeConfig:<bytes32>', [LSP7_TYPE])]:
        typeConfigValue,
      [erc725.encodeKeyName('UAPTypeConfig:<bytes32>', [LSP8_TYPE])]:
        typeConfigValue,
      [erc725.encodeKeyName('UAPExecutiveConfig:<bytes32>:<uint256>', [
        LSP7_TYPE,
        '0',
      ])]: execConfigValue,
      [erc725.encodeKeyName('UAPExecutiveScreeners:<bytes32>:<uint256>', [
        LSP7_TYPE,
        '0',
      ])]: screenersValue,
      [erc725.encodeKeyName('UAPScreenerConfig:<bytes32>:<uint256>', [
        LSP7_TYPE,
        '0',
      ])]: minimalScreenerConfig,
      [erc725.encodeKeyName('UAPScreenerConfig:<bytes32>:<uint256>', [
        LSP7_TYPE,
        '1',
      ])]: minimalScreenerConfig,
      [erc725.encodeKeyName('UAPAddressListName:<bytes32>:<uint256>', [
        LSP7_TYPE,
        '0',
      ])]: erc725.encodeValueType('string', 'GraveSafeCreators'),
      [erc725.encodeKeyName('UAPAddressListName:<bytes32>:<uint256>', [
        LSP7_TYPE,
        '1',
      ])]: erc725.encodeValueType('string', 'GraveSafeAssets'),
      [erc725.encodeKeyName('GraveSafeCreators[]')]: erc725.encodeValueType(
        'uint256',
        BigInt(1)
      ),
      [erc725.encodeKeyName('GraveSafeAssets[]')]: erc725.encodeValueType(
        'uint256',
        BigInt(1)
      ),
      [makeListItemKey('GraveSafeCreators', 0)]: erc725.encodeValueType(
        'address',
        baseConfig.creatorWhitelistAddresses[0]
      ),
      [makeListItemKey('GraveSafeAssets', 0)]: erc725.encodeValueType(
        'address',
        baseConfig.whitelistAddresses[0]
      ),
    };

    getDataBatchMock.mockImplementation((keys: string[]) => {
      return Promise.resolve(keys.map(key => data[key] || '0x'));
    });

    getDataMock.mockImplementation((key: string) => {
      return Promise.resolve(data[key] || '0x');
    });
  };

  it('should apply skip optimizations when no changes detected', async () => {
    const provider = { request: vi.fn() } as any;
    mockExistingConfigReads(provider);

    await assistantConfigModule.saveForwarderAssistantConfig(
      provider,
      upAddress,
      baseConfig.vaultAddress!,
      baseConfig.whitelistAddresses,
      baseConfig.useCuratedList,
      baseConfig.curatedListAddress,
      baseConfig.creatorWhitelistAddresses,
      baseConfig.creatorCuratedListAddress,
      baseConfig.requireAllCreatorsForList,
      baseConfig.requireAllCreatorsForCuration,
      networkConfig,
      {},
      42
    );

    expect(mockConfigure).toHaveBeenCalledTimes(2);
    const firstCallOptions = mockConfigure.mock.calls[0][8];
    const secondCallOptions = mockConfigure.mock.calls[1][8];

    expect(firstCallOptions).toMatchObject({
      skipSharedListWrite: false,
      skipExecutiveConfig: true,
      skipScreenerArray: true,
      skipScreenerConfigs: true,
      skipAddressListData: true,
    });

    expect(secondCallOptions).toMatchObject({
      skipSharedListWrite: true,
      skipExecutiveConfig: true,
      skipScreenerArray: true,
      skipScreenerConfigs: true,
      skipAddressListData: true,
    });
  });

  it('should not skip executive config when vault changes', async () => {
    const provider = { request: vi.fn() } as any;
    mockExistingConfigReads(provider);

    await assistantConfigModule.saveForwarderAssistantConfig(
      provider,
      upAddress,
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      baseConfig.whitelistAddresses,
      baseConfig.useCuratedList,
      baseConfig.curatedListAddress,
      baseConfig.creatorWhitelistAddresses,
      baseConfig.creatorCuratedListAddress,
      baseConfig.requireAllCreatorsForList,
      baseConfig.requireAllCreatorsForCuration,
      networkConfig,
      {},
      42
    );

    const firstCallOptions = mockConfigure.mock.calls[0][8];
    expect(firstCallOptions?.skipExecutiveConfig).toBe(false);
  });
});
