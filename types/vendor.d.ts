declare module '@rome-protocol/registry' {
  export interface RomeChain { chainId: number; rpcUrl: string; explorerUrl?: string; name: string; [key: string]: unknown }
  export function getChain(chainId: number): RomeChain | null;
  export function getPrograms(network:'devnet'|'mainnet'): Record<string,string>;
}
