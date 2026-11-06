// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Review hint: exact timestamps and block numbers differ between environments.
contract BlockContextDemo {
    function snapshot() external view returns (uint256, uint256) {
        return (block.number, block.timestamp);
    }
}
