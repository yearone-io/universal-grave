// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract GraveDataForwarder {
  function forwardSetData(
    address target,
    bytes32 key,
    bytes calldata value
  ) external {
    (bool success, ) = target.delegatecall(
      abi.encodeWithSignature('setData(bytes32,bytes)', key, value)
    );
    require(success, 'setData failed');
  }
}
