export type Link = {
  name: string;
  url: string;
};
export type AbstractAssistant = {
  address: string;
  name: string;
  description: string;
  iconPath: string;
  links: Link[];
  creatorAddress: string;
  supportedTransactionTypes: string[];
  chainId: number;
};

export type ExecutiveAssistant = AbstractAssistant & {
  assistantType: 'Executive';
  configParams: {
    name: string;
    type: string;
    description: string;
    defaultValue?: string;
    placeholder?: string;
    hidden?: boolean;
    validate?: (value: any, upAddress: string) => boolean;
    validationMessage?: string;
  }[];
};

export type ScreenerAssistant = AbstractAssistant & {
  assistantType: 'Screener';
  configParams: { name: string; type: string }[];
};
