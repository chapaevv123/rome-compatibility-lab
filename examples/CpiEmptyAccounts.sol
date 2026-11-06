// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Deliberately invalid for Rome CPI. This is a scanner fixture, not a deployable integration.
interface IDemoCpi {
    struct AccountMeta { bytes32 pubkey; bool isSigner; bool isWritable; }
    function invoke(bytes32 programId, AccountMeta[] calldata accounts, bytes calldata data) external;
}
contract CpiEmptyAccountsDemo {
    IDemoCpi constant CpiProgram = IDemoCpi(0xFF00000000000000000000000000000000000008);
    function call(bytes32 programId, bytes calldata data) external {
        CpiProgram.invoke(programId, new IDemoCpi.AccountMeta[](0), data);
    }
}
