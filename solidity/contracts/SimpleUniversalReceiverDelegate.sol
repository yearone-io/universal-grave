// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.17;

import {ILSP1UniversalReceiverDelegate} from "@lukso/lsp-smart-contracts/contracts/LSP1UniversalReceiver/ILSP1UniversalReceiverDelegate.sol";

contract SimpleUniversalReceiverDelegate is ILSP1UniversalReceiverDelegate {

    function universalReceiverDelegate(
        address sender,
        uint256 /*value*/,
        bytes32 typeId,
        bytes memory /*data*/
    ) public view returns (bytes memory) {
        return "";
    }

    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return interfaceId == type(ILSP1UniversalReceiverDelegate).interfaceId;
    }
}
