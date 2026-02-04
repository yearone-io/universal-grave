import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ERC725YDataKeys, LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';
import uapSchema from '@/schemas/UAP.json';
import { getErc725Read } from '@/utils/erc725Client';
import { subscribeAndConfigureGrave } from '../uapSubscription';

const setDataBatchMock = vi.fn();
const getDataMock = vi.fn();

vi.mock('@/utils/walletClient', () => ({
  getWalletSigner: vi.fn().mockResolvedValue({}),
}));

vi.mock('ethers', async () => {
  const actual = await vi.importActual<any>('ethers');
  return {
    ...actual,
    Contract: vi.fn().mockImplementation(() => ({
      getData: getDataMock,
      setDataBatch: setDataBatchMock,
    })),
  };
});

describe('subscribeAndConfigureGrave', () => {
  const provider = {
    request: vi.fn().mockImplementation((payload: any) => {
      if (Array.isArray(payload)) {
        return payload.map(() => '0x');
      }
      return { result: '0x' };
    }),
  } as any;
  const upAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const protocolAddress = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
  const vaultAddress = '0xcccccccccccccccccccccccccccccccccccccccc';
  const networkConfig = {
    forwarderAssistantAddress: '0xdddddddddddddddddddddddddddddddddddddddd',
    addressListScreenerAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    creatorListScreenerAddress: '0xffffffffffffffffffffffffffffffffffffffff',
  };
  const erc725 = getErc725Read(uapSchema as any, upAddress, { provider });
  const LSP7_TYPE = LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification;
  const LSP8_TYPE = LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification;

  beforeEach(() => {
    setDataBatchMock.mockReset();
    getDataMock.mockReset();
    setDataBatchMock.mockResolvedValue({
      wait: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('initializes screeners and empty lists when lists are missing', async () => {
    getDataMock.mockResolvedValue('0x');

    await subscribeAndConfigureGrave(
      provider,
      upAddress,
      protocolAddress,
      vaultAddress,
      networkConfig
    );

    const keys = setDataBatchMock.mock.calls[0][0] as string[];
    const values = setDataBatchMock.mock.calls[0][1] as string[];

    const urdKey = ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate;
    expect(keys).toContain(urdKey);

    const listLengthKey = erc725.encodeKeyName('GraveSafeAssets[]');
    const creatorListLengthKey = erc725.encodeKeyName('GraveSafeCreators[]');
    expect(keys).toContain(listLengthKey);
    expect(keys).toContain(creatorListLengthKey);
    expect(values[keys.indexOf(listLengthKey)]).toBe(
      erc725.encodeValueType('uint256', BigInt(0))
    );
    expect(values[keys.indexOf(creatorListLengthKey)]).toBe(
      erc725.encodeValueType('uint256', BigInt(0))
    );

    const creatorListNameKey = erc725.encodeKeyName(
      'UAPAddressListName:<bytes32>:<uint256>',
      [LSP7_TYPE, '0']
    );
    const addressListNameKey = erc725.encodeKeyName(
      'UAPAddressListName:<bytes32>:<uint256>',
      [LSP7_TYPE, '1']
    );
    expect(keys).toContain(creatorListNameKey);
    expect(keys).toContain(addressListNameKey);
    expect(values[keys.indexOf(creatorListNameKey)]).toBe(
      erc725.encodeValueType('string', 'GraveSafeCreators')
    );
    expect(values[keys.indexOf(addressListNameKey)]).toBe(
      erc725.encodeValueType('string', 'GraveSafeAssets')
    );

    const logicKey = erc725.encodeKeyName(
      'UAPExecutiveScreenersANDLogic:<bytes32>:<uint256>',
      [LSP7_TYPE, '0']
    );
    expect(values[keys.indexOf(logicKey)]).toBe('0x01');

    const lsp8CreatorListNameKey = erc725.encodeKeyName(
      'UAPAddressListName:<bytes32>:<uint256>',
      [LSP8_TYPE, '0']
    );
    const lsp8AddressListNameKey = erc725.encodeKeyName(
      'UAPAddressListName:<bytes32>:<uint256>',
      [LSP8_TYPE, '1']
    );
    expect(keys).toContain(lsp8CreatorListNameKey);
    expect(keys).toContain(lsp8AddressListNameKey);
  });

  it('preserves existing list lengths when present', async () => {
    const listLengthKey = erc725.encodeKeyName('GraveSafeAssets[]');
    const creatorListLengthKey = erc725.encodeKeyName('GraveSafeCreators[]');

    getDataMock.mockImplementation((key: string) => {
      if (key === listLengthKey || key === creatorListLengthKey) {
        return Promise.resolve(
          erc725.encodeValueType('uint256', BigInt(5))
        );
      }
      return Promise.resolve('0x');
    });

    await subscribeAndConfigureGrave(
      provider,
      upAddress,
      protocolAddress,
      vaultAddress,
      networkConfig
    );

    const keys = setDataBatchMock.mock.calls[0][0] as string[];
    expect(keys).not.toContain(listLengthKey);
    expect(keys).not.toContain(creatorListLengthKey);
  });
});
