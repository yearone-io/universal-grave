# Solidity 

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/yearone-io/universal-grave
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. If you have an UP address or Wallet for LUKSO testnet already you can enter them in the `.env`

   ```md
   EOA_PRIVATE_KEY=
   CONTROLLER_PUBLIC_KEY=
   UP_ADDR=
   RECEIVER_UP_ADDR=
   ```


### Basic Usage

Can deploy a new Grave forwarder using:
   ```sh
   npx hardhat run scripts/deployGraveForwarder.ts
   ```
