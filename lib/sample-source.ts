// Exact UTF-8 contents of probes/LaneProbe.sol. SHA-256 is pinned in the execution ledger.
export const LANE_SAMPLE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
/// Hypothesis: a state-changing EVM transaction emits the caller and block number.
/// Compare semantic event fields and receipt status, not exact block or gas parity.
contract LaneProbe {
    event Observed(address indexed caller, uint256 blockNumber, uint256 timestamp);
    function observe() external { emit Observed(msg.sender, block.number, block.timestamp); }
    function caller() external view returns (address) { return msg.sender; }
}
`;
export const LANE_SOURCE_SHA256 = 'sha256:2ad0c44097cc945cef7a8d180e0382f814820cba43004d4d2e5d5caf7fdb7732';
export async function matchingLaneSource(files:{content:string}[]):Promise<boolean>{
  if(files.length!==1)return false;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(files[0].content));
  return `sha256:${Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')}`===LANE_SOURCE_SHA256;
}
