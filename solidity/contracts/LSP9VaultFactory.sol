// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.4;

import { LSP9Vault } from '@lukso/lsp-smart-contracts/contracts/LSP9Vault/LSP9Vault.sol';

contract LSP9VaultFactory {
  // Event to emit when a new LSP9Vault is created
  event LSP9VaultCreated(address indexed newVaultAddress);

  // Function to create a new LSP9Vault
  function createLSP9Vault(address newOwner) public returns (address) {
    LSP9Vault newVault = new LSP9Vault(newOwner);
    emit LSP9VaultCreated(address(newVault));
    return address(newVault);
  }
}
