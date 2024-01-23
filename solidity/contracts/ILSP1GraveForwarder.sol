// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.4;

import { ILSP1UniversalReceiverDelegate } from "@lukso/lsp-smart-contracts/contracts/LSP1UniversalReceiver/ILSP1UniversalReceiverDelegate.sol";

contract LSP1GraveForwarder is ILSP1UniversalReceiverDelegate {
    mapping (address => address) public graveVaults;
    mapping(address => mapping (address => bool)) public tokenAllowlist;

    function setGrave(address grave) public;

    function getGrave() public view returns (address);

    function addTokenToAllowlist(address token) public;

    function removeTokenFromAllowlist(address token) public;

    function getAddressStatus(address token) public view returns (bool);

    function universalReceiverDelegate(
        address notifier,
        uint256 value,
        bytes32 typeId,
        bytes memory data
    ) public virtual override(LSP1UniversalReceiverDelegateUP) returns (bytes memory);

}
