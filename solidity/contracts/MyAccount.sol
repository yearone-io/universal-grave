// SPDX-License-Identifier: MIT 
import "@lukso/lsp-smart-contracts/contracts/LSP0ERC725Account/LSP0ERC725Account.sol";

contract MyAccount is LSP0ERC725Account {
    constructor(address _newOwner) LSP0ERC725Account(_newOwner) {}
}
