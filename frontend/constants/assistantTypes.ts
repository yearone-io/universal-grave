import { LSP1_TYPE_IDS } from '@lukso/lsp-smart-contracts';

export const typeIdOptionsMap = {
  [LSP1_TYPE_IDS.LSP0ValueReceived]: {
    label: 'Receiving LYX',
    value: LSP1_TYPE_IDS.LSP0ValueReceived,
    description: 'Assistants are called when receiving LYX (native tokens)',
  },
  [LSP1_TYPE_IDS.LSP0OwnershipTransferStarted]: {
    label: 'LSP0 Ownership Transfer Started',
    value: LSP1_TYPE_IDS.LSP0OwnershipTransferStarted,
    description: 'Assistant are called when ownership transfer starts',
  },
  [LSP1_TYPE_IDS.LSP0OwnershipTransferred_SenderNotification]: {
    label: 'LSP0 Ownership Transferred (Sender Notification)',
    value: LSP1_TYPE_IDS.LSP0OwnershipTransferred_SenderNotification,
    description: 'Assistant are called when ownership is transferred (sender)',
  },
  [LSP1_TYPE_IDS.LSP0OwnershipTransferred_RecipientNotification]: {
    label: 'LSP0 Ownership Transferred (Recipient Notification)',
    value: LSP1_TYPE_IDS.LSP0OwnershipTransferred_RecipientNotification,
    description:
      'Assistant are called when ownership is transferred (recipient)',
  },
  [LSP1_TYPE_IDS.LSP7Tokens_SenderNotification]: {
    label: 'LSP7 Tokens Sender Notification',
    value: LSP1_TYPE_IDS.LSP7Tokens_SenderNotification,
    description: 'Assistant are called when LSP7 tokens are sent',
  },
  [LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification]: {
    label: 'Receiving LSP7 Tokens',
    value: LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification,
    description: 'Assistant are called when LSP7 tokens are received',
  },
  [LSP1_TYPE_IDS.LSP7Tokens_OperatorNotification]: {
    label: 'LSP7 Tokens Operator Notification',
    value: LSP1_TYPE_IDS.LSP7Tokens_OperatorNotification,
    description: 'Assistant are called when LSP7 operator actions occur',
  },
  [LSP1_TYPE_IDS.LSP8Tokens_SenderNotification]: {
    label: 'LSP8 Tokens Sender Notification',
    value: LSP1_TYPE_IDS.LSP8Tokens_SenderNotification,
    description: 'Assistant are called when LSP8 tokens are sent',
  },
  [LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification]: {
    label: 'Receiving LSP8 Tokens',
    value: LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification,
    description: 'Assistant are called when LSP8 tokens are received',
  },
  [LSP1_TYPE_IDS.LSP8Tokens_OperatorNotification]: {
    label: 'LSP8 Tokens Operator Notification',
    value: LSP1_TYPE_IDS.LSP8Tokens_OperatorNotification,
    description: 'Assistant are called when LSP8 operator actions occur',
  },
  [LSP1_TYPE_IDS.LSP9ValueReceived]: {
    label: 'LSP9 Value Received',
    value: LSP1_TYPE_IDS.LSP9ValueReceived,
    description: 'Assistant are called when LSP9 vault receives value',
  },
  [LSP1_TYPE_IDS.LSP9OwnershipTransferStarted]: {
    label: 'LSP9 Ownership Transfer Started',
    value: LSP1_TYPE_IDS.LSP9OwnershipTransferStarted,
    description: 'Assistant are called when LSP9 ownership transfer starts',
  },
  [LSP1_TYPE_IDS.LSP9OwnershipTransferred_SenderNotification]: {
    label: 'LSP9 Ownership Transferred (Sender Notification)',
    value: LSP1_TYPE_IDS.LSP9OwnershipTransferred_SenderNotification,
    description:
      'Assistant are called when LSP9 ownership is transferred (sender)',
  },
  [LSP1_TYPE_IDS.LSP9OwnershipTransferred_RecipientNotification]: {
    label: 'LSP9 Ownership Transferred (Recipient Notification)',
    value: LSP1_TYPE_IDS.LSP9OwnershipTransferred_RecipientNotification,
    description:
      'Assistant are called when LSP9 ownership is transferred (recipient)',
  },
  [LSP1_TYPE_IDS.LSP14OwnershipTransferStarted]: {
    label: 'LSP14 Ownership Transfer Started',
    value: LSP1_TYPE_IDS.LSP14OwnershipTransferStarted,
    description: 'Assistant are called when LSP14 ownership transfer starts',
  },
  [LSP1_TYPE_IDS.LSP14OwnershipTransferred_SenderNotification]: {
    label: 'LSP14 Ownership Transferred (Sender Notification)',
    value: LSP1_TYPE_IDS.LSP14OwnershipTransferred_SenderNotification,
    description:
      'Assistant are called when LSP14 ownership is transferred (sender)',
  },
  [LSP1_TYPE_IDS.LSP14OwnershipTransferred_RecipientNotification]: {
    label: 'LSP14 Ownership Transferred (Recipient Notification)',
    value: LSP1_TYPE_IDS.LSP14OwnershipTransferred_RecipientNotification,
    description:
      'Assistant are called when LSP14 ownership is transferred (recipient)',
  },
};

export const typeIdOrder = [
  LSP1_TYPE_IDS.LSP0ValueReceived,
  LSP1_TYPE_IDS.LSP0OwnershipTransferStarted,
  LSP1_TYPE_IDS.LSP0OwnershipTransferred_SenderNotification,
  LSP1_TYPE_IDS.LSP0OwnershipTransferred_RecipientNotification,
  LSP1_TYPE_IDS.LSP7Tokens_SenderNotification,
  LSP1_TYPE_IDS.LSP7Tokens_RecipientNotification,
  LSP1_TYPE_IDS.LSP7Tokens_OperatorNotification,
  LSP1_TYPE_IDS.LSP8Tokens_SenderNotification,
  LSP1_TYPE_IDS.LSP8Tokens_RecipientNotification,
  LSP1_TYPE_IDS.LSP8Tokens_OperatorNotification,
  LSP1_TYPE_IDS.LSP9ValueReceived,
  LSP1_TYPE_IDS.LSP9OwnershipTransferStarted,
  LSP1_TYPE_IDS.LSP9OwnershipTransferred_SenderNotification,
  LSP1_TYPE_IDS.LSP9OwnershipTransferred_RecipientNotification,
  LSP1_TYPE_IDS.LSP14OwnershipTransferStarted,
  LSP1_TYPE_IDS.LSP14OwnershipTransferred_SenderNotification,
  LSP1_TYPE_IDS.LSP14OwnershipTransferred_RecipientNotification,
];
