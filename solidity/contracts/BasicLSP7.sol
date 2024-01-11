// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// modules
import {
    LSP7Mintable
} from "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/presets/LSP7Mintable.sol";

contract BasicLSP7 is LSP7Mintable {
    constructor(
        string memory nftCollectionName,
        string memory nftCollectionSymbol,
        address contractOwner,
        uint256 lsp4Type,
        bool isNonDivisible
    )
        LSP7Mintable(
            nftCollectionName,
            nftCollectionSymbol,
            contractOwner,
            lsp4Type,
            isNonDivisible
        )
    {}
}