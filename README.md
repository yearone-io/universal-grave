# The Universal GRAVE - a Global Reserve for Abandoned Virtual Entities

## Conceptual Overview

Spam presents a significant challenge in the Web3 space, particularly on L2 networks. Due to the low cost of transactions on these networks, there is an overwhelming volume of content, making attention curation and information filtering essential for maintaining a healthy blockchain ecosystem. A common issue is the receipt of unwanted fungible and non-fungible tokens, with users having no ability to reject these transactions. This lack of opt-out options diminishes the signal-to-noise ratio in the ecosystem. Many examples of this can be seen on Ethereum accounts believed to belong to prominent figures, such as this [Ethereum account](https://etherscan.io/address/0x94845333028B1204Fbe14E1278Fd4Adde46B22ce#tokentxns). You can see the account getting inundated with numerous transfers from other accounts with everything from airdrops, meme coins, NFTs, and seemingly outright scams, without any ability to reject those assets.

Lukso, leveraging its innovative application of the LSP0 and LSP1 standards, offers the first viable blockchain solution to this issue. Our hackathon submission demonstrates a proof of concept that addresses the handling of LSP7 and LSP8 digital assets, with its potential applications extending to other areas.

Our solution empowers Universal Profile (LSP0) accounts to implement a unique LSP7 and LSP8 asset forwarder (LSP1) on their account. By default, this forwarder redirects all LSP7 and LSP8 digital assets to a specialized Vault (LSP9), termed the Universal GRAVE (Global Reserve for Abandoned Virtual Entities). This Vault acts as a 'spambox' and is under the control of the Universal Profile. At the same time we recognize that one person's spam may be another's treasure, thus we include a feature allowing users to 'revive' desired assets from the GRAVE, back to their Universal Profile. This is achieved by whitelisting specific asset addresses on the forwarder.

The GRAVE is designed with flexibility in mind, allowing users to easily toggle its functionality without losing access to their Vault or underlying assets. Moreover, when assets are retrieved from the GRAVE, they still undergo the standard accounting process enjoyed by UP profiles through the UniversalReceiverDelegateUP implementation. Future enhancements could include the integration of incentivized curators, either individuals or communities, who maintain their own whitelists, that other users could subscribe to. Additionally, there is the prospect of allowing users to auction assets from their GRAVE, with the option to retain the proceeds or donate a portion to charity or public goods funding.

We hope that our hackathon submission inspires further exploration of practical solutions to the spam problem in Web3.

## Set up

# Deploy a new LSP1GraveForwarder contract

The LSP1GraveForwarder is a Universal Receiver Delegate, gets attached to a user's UP, and is activated as a forwarder whenever user gets incoming LSP7 & LSP8 assets.

You can deploy a new forwarder using /solidity/scripts/deployGraveForwarder.ts

