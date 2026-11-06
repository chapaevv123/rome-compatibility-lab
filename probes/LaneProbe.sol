// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
/// Hypothesis: a state-changing EVM transaction emits the caller and block number.
/// Compare semantic event fields and receipt status, not exact block or gas parity.
contract LaneProbe {
    event Observed(address indexed caller, uint256 blockNumber, uint256 timestamp);
    function observe() external { emit Observed(msg.sender, block.number, block.timestamp); }
    function caller() external view returns (address) { return msg.sender; }
}
