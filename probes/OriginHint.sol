// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
/// Intentionally triggers a heuristic; it is not a proven Rome incompatibility.
contract OriginHint { function origin() external view returns(address) { return tx.origin; } }
