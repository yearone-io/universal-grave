# Solidity 

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/biancabuzea200/createUP
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. If you have an UP address or Wallet for LUKSO testnet already you can enter them in the `.env`

   ```md
   MY_PRIVATE_KEY=
   MY_PUPLIC_KEY=
   MY_UP_ADDRESS=
   ```


### Basic Usage

1. The normal order to follow is `generateKeys.js` -> `deployUP.js` -> `readProfileData.js` since this order generates all values needed for subsequent examples.
2. Each example can be run simply with
   ```sh
   node [filepath]/filename.js
   ```
3. Make sure to add any newly generated variables to the `.env` before proceeding to the next example.

   ```md
   MY_PRIVATE_KEY=
   MY_PUPLIC_KEY=
   MY_UP_ADDRESS=
   ```
