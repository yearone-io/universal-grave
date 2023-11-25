// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// modules
import {
    LSP7Mintable
} from "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/presets/LSP7Mintable.sol";

bytes32 constant _LSP4_TOKEN_TYPE_DATA_KEY = 0xe0261fa95db2eb3b5439bd033cda66d56b96f92f243a8228fd87550ed7bdfdb3;

enum TokenType {
    TOKEN,
    NFT,
    COLLECTION
}

contract EventTicketsNFT is LSP7Mintable {
    constructor(
        string memory eventName,
        string memory tokenSymbol,
        address contractOwner
    )
        LSP7Mintable(
            eventName,
            tokenSymbol,
            contractOwner,
            true // make the token non divisible
        )
    {
        // set the token type
        _setData(_LSP4_TOKEN_TYPE_DATA_KEY, abi.encode(TokenType.TOKEN));
    }
}