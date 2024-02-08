// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.4;

// interfaces
import { LSP1UniversalReceiverDelegateUP } from '@lukso/lsp-smart-contracts/contracts/LSP1UniversalReceiver/LSP1UniversalReceiverDelegateUP/LSP1UniversalReceiverDelegateUP.sol';
import { IERC725X } from '@erc725/smart-contracts/contracts/interfaces/IERC725X.sol';
import { ILSP7DigitalAsset } from '@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/ILSP7DigitalAsset.sol';
import { ILSP8IdentifiableDigitalAsset } from '@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/ILSP8IdentifiableDigitalAsset.sol';

// constants
import { _INTERFACEID_LSP9 } from '@lukso/lsp-smart-contracts/contracts/LSP9Vault/LSP9Constants.sol';
import { _INTERFACEID_LSP0 } from '@lukso/lsp-smart-contracts/contracts/LSP0ERC725Account/LSP0Constants.sol';
import { _INTERFACEID_LSP1_DELEGATE } from '@lukso/lsp-smart-contracts/contracts/LSP1UniversalReceiver/LSP1Constants.sol';
import { _TYPEID_LSP7_TOKENSRECIPIENT } from '@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/LSP7Constants.sol';
import { _TYPEID_LSP8_TOKENSRECIPIENT } from '@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8Constants.sol';

// modules
import { ERC165 } from '@openzeppelin/contracts/utils/introspection/ERC165.sol';
import { ERC165Checker } from '@openzeppelin/contracts/utils/introspection/ERC165Checker.sol';

interface IVault {
  function owner() external view returns (address);
}

contract LSP1GraveForwarder is LSP1UniversalReceiverDelegateUP {
  mapping(address => address) public graveVaults;
  mapping(address => mapping(address => bool)) public tokenAllowlist;

  // Counters
  uint256 public lsp7RedirectedCounter;
  uint256 public lsp8RedirectedCounter;
  uint256 public graveUserCounter;

  function setGrave(address grave) public {
    // Check if the provided address implements the LSP9Vault interface
    require(
      ERC165Checker.supportsInterface(grave, _INTERFACEID_LSP9),
      'Provided address does not implement LSP9Vault interface'
    );
    IVault vaultContract = IVault(grave);
    require(
      vaultContract.owner() == msg.sender,
      'Caller is not the owner of the vault contract.'
    );
    updateGraveUserCounter(msg.sender);
    graveVaults[msg.sender] = grave;
  }

  function getGrave() public view returns (address) {
    return graveVaults[msg.sender];
  }

  function addTokenToAllowlist(address token) public {
    tokenAllowlist[msg.sender][token] = true;
  }

  function removeTokenFromAllowlist(address token) public {
    delete tokenAllowlist[msg.sender][token];
  }

  function getAddressStatus(address token) public view returns (bool) {
    return tokenAllowlist[msg.sender][token];
  }

  function updateGraveUserCounter(address up) internal {
    if (graveVaults[up] == address(0)) {
        graveUserCounter++;
    } 
  }

  function universalReceiverDelegate(
    address notifier,
    uint256 value,
    bytes32 typeId,
    bytes memory data
  )
    public
    virtual
    override(LSP1UniversalReceiverDelegateUP)
    returns (bytes memory)
  {
    // CHECK that the address of the LSP7/LSP8 is whitelisted
    if (tokenAllowlist[msg.sender][notifier]) {
      return super.universalReceiverDelegate(notifier, value, typeId, data);
    }
    require(
      graveVaults[msg.sender] != address(0),
      'LSP1GraveForwarder: user vault not set'
    );

    // CHECK that the caller is a LSP0 (UniversalProfile)
    // by checking its interface support
    if (
      !ERC165Checker.supportsERC165InterfaceUnchecked(
        msg.sender,
        _INTERFACEID_LSP0
      )
    ) {
      return ': caller is not a LSP0';
    }
    // CHECK that notifier is a contract with a `balanceOf` method
    // and that msg.sender (the UP) has a positive balance
    if (notifier.code.length > 0) {
      try ILSP7DigitalAsset(notifier).balanceOf(msg.sender) returns (
        uint256 balance
      ) {
        if (balance == 0) {
          return ': UP balance is zero';
        }
      } catch {
        return ': `balanceOf(address)` function not found';
      }
    }

    if (typeId == _TYPEID_LSP7_TOKENSRECIPIENT) {
      // extract data (we only need the amount that was transferred / minted)
      (, , , uint256 amount, ) = abi.decode(
        data,
        (address, address, address, uint256, bytes)
      );
      bytes memory encodedLSP7Tx = abi.encodeCall(
        ILSP7DigitalAsset.transfer,
        (msg.sender, graveVaults[msg.sender], amount, false, data)
      );
      lsp7RedirectedCounter++;
      // 0 = CALL
      return IERC725X(msg.sender).execute(0, notifier, 0, encodedLSP7Tx);
    } else if (typeId == _TYPEID_LSP8_TOKENSRECIPIENT) {
      // extract data (we only need the amount that was transferred / minted)
      (, , , bytes32 tokenId, ) = abi.decode(
        data,
        (address, address, address, bytes32, bytes)
      );
      bytes memory encodedLSP8Tx = abi.encodeCall(
        ILSP8IdentifiableDigitalAsset.transfer,
        (msg.sender, graveVaults[msg.sender], tokenId, false, data)
      );
      lsp8RedirectedCounter++;
      // 0 = CALL
      return IERC725X(msg.sender).execute(0, notifier, 0, encodedLSP8Tx);
    }

    return '';
  }
}
