// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// tx.origin and block.timestamp in comments must not produce findings.
contract CommentOnlyDemo {
    string public constant NOTE = "tx.origin and block.timestamp are text";
}
