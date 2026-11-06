// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "../vendor/rome-solidity/interface.sol";

/// @notice Prepared CPI hypothesis. Invoke only on Hadrian with a reviewed Solana account meta.
contract CpiMemoProbe {
    ICrossProgramInvocation constant CPI = ICrossProgramInvocation(0xFF00000000000000000000000000000000000008);
    IHelperProgram constant HELPER = IHelperProgram(0xff00000000000000000000000000000000000009);
    bytes32 public immutable memoProgram;
    constructor(bytes32 memoProgram_) { require(memoProgram_ != bytes32(0), "memo program required"); memoProgram = memoProgram_; }
    function accountLamports(bytes32 pubkey) external view returns (uint64 lamports) {
        (lamports,,,,,) = CPI.account_info(pubkey);
    }
    function invokeMemo(bytes calldata memo) external {
        require(memo.length > 0 && memo.length <= 64, "invalid memo request");
        bytes32 authority = HELPER.pda(address(this));
        ICrossProgramInvocation.AccountMeta[] memory accounts = new ICrossProgramInvocation.AccountMeta[](1);
        accounts[0] = ICrossProgramInvocation.AccountMeta(authority, true, false);
        CPI.invoke(memoProgram, accounts, memo);
    }
}
