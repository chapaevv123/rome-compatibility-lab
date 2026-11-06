declare module '../vendor/rome-sdk/write.mjs' {
  export function submitRomeTx(provider:{request(args:{method:string;params?:unknown[]}):Promise<unknown>},tx:{from:`0x${string}`;to?:`0x${string}`;data?:`0x${string}`;fallbackGas?:bigint;minGas?:bigint}):Promise<`0x${string}`>;
  export function padRomeGas(estimate:bigint):bigint;
}
