// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TestContract
 * @dev Minimal test contract for deployment testing
 */
contract TestContract {
    address public owner;
    uint256 public value;

    constructor(address _owner) {
        owner = _owner;
        value = 42;
    }

    function getValue() public view returns (uint256) {
        return value;
    }
}
