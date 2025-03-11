import { ExecutiveAssistant, ScreenerAssistant } from './CustomTypes';
import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';

export const forwarderAssistantTestnet: ExecutiveAssistant = {
  address: '0x67cc9c63af02f743c413182379e0f41ed3807801',
  name: 'Forwarder Assistant',
  description: 'Forward incoming assets to an external address.',
  iconPath: '/assistants/forwarder.jpg',
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
  assistantType: 'Executive',
  creatorAddress: '0xfE67D89DeBEC38592aB2FeD217b8bbb28851DF88',
  supportedTransactionTypes: [
    LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification,
    LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification,
  ],
  configParams: [
    {
      name: 'targetAddress',
      type: 'address',
      hidden: false,
      description: 'The address you want to forward assets to:',
      placeholder: 'Enter destination address',
      validationMessage: 'Destination address cannot be your own address',
      validate: (value: any, upAddress: string) => {
        return value.toLowerCase() !== upAddress.toLowerCase();
      },
    },
  ],
  chainId: 4201,
};

export const forwarderAssistantMainnet: ExecutiveAssistant = {
  address: '0xf958412f67085b616ce741e7432ab6acac08b5d0',
  name: 'Forwarder Assistant',
  description: 'Forward incoming assets to an external address.',
  iconPath: '/assistants/forwarder.jpg',
  links: [{ name: 'X', url: 'https://x.com/yearone_io' }],
  assistantType: 'Executive',
  creatorAddress: '0xec1c59E78De6f840A66b6EE8E4066700Be863529',
  supportedTransactionTypes: [
    LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification,
    LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification,
  ],
  configParams: [
    {
      name: 'targetAddress',
      type: 'address',
      hidden: false,
      description: 'The address you want to forward assets to:',
      placeholder: 'Enter destination address',
      validationMessage: 'Destination address cannot be your own address',
      validate: (value: any, upAddress: string) => {
        return value.toLowerCase() !== upAddress.toLowerCase();
      },
    },
  ],
  chainId: 42,
};

