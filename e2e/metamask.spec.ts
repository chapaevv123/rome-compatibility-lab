import {test,expect} from '@playwright/test';

test('manual LaneProbe page sends only after explicit click and displays receipt',async({page})=>{
  await page.addInitScript(()=>{
    const wallet='0x765fb7e6a0BdDDc29f57eeCE34AEda0Fb318805d';
    const hash='0x'+'ab'.repeat(32);
    const state={sent:0};
    Object.assign(window,{__laneTest:state});
    Object.defineProperty(window,'ethereum',{value:{isMetaMask:true,request:async({method,params}:{method:string;params?:unknown[]})=>{
      if(method==='eth_sendTransaction'){
        const tx=(params as Record<string,unknown>[])[0];
        if(tx.from!==wallet||tx.to!==undefined||typeof tx.data!=='string'||!tx.data.startsWith('0x60806040'))throw Error('Unexpected transaction');
        state.sent++;
        return hash;
      }
      if(method==='eth_getTransactionReceipt')return {transactionHash:hash,status:'0x1',contractAddress:'0x'+'12'.repeat(20),gasUsed:'0x1000',effectiveGasPrice:'0x64',blockNumber:'0x2'};
      const values:Record<string,unknown>={eth_chainId:'0x30d4a',eth_accounts:[wallet],eth_requestAccounts:[wallet],eth_getBalance:'0xde0b6b3a7640000',eth_estimateGas:'0x1000',eth_gasPrice:'0x64',eth_getBlockByNumber:{baseFeePerGas:'0x64'},eth_maxPriorityFeePerGas:'0x0'};
      return values[method];
    }},configurable:true});
  });
  await page.goto('/hadrian/metamask');
  expect(await page.evaluate(()=>(window as unknown as {__laneTest:{sent:number}}).__laneTest.sent)).toBe(0);
  await page.getByRole('button',{name:'Connect MetaMask'}).click();
  await page.getByRole('button',{name:'Refresh read-only estimate'}).click();
  await expect(page.getByText('Maximum displayed fee:')).toBeVisible();
  expect(await page.evaluate(()=>(window as unknown as {__laneTest:{sent:number}}).__laneTest.sent)).toBe(0);
  await page.getByRole('button',{name:'Open MetaMask approval for LaneProbe'}).click();
  await expect(page.getByText('Gas used: 4096')).toBeVisible();
  await expect(page.getByText('Actual fee: 0.0000000000004096 USDC')).toBeVisible();
  expect(await page.evaluate(()=>(window as unknown as {__laneTest:{sent:number}}).__laneTest.sent)).toBe(1);
});
