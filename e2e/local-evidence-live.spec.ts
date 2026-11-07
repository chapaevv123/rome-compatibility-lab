import {test,expect} from '@playwright/test';

test('local wallet quote and existing public receipt save without a new transaction',async({page})=>{
  test.skip(process.env.E2E_LIVE_RPC!=='1','Requires explicit read-only public RPC check');
  await page.addInitScript(()=>{
    const address='0x765fb7e6a0BdDDc29f57eeCE34AEda0Fb318805d';
    (window as Window&{ethereum?:unknown;differentialSendCount?:number}).differentialSendCount=0;
    (window as Window&{ethereum?:unknown}).ethereum={isMetaMask:true,request:async({method}:{method:string})=>{
      if(method==='eth_sendTransaction'){(window as Window&{differentialSendCount?:number}).differentialSendCount!++;throw Error('No transaction allowed in this test')}
      const values:Record<string,unknown>={eth_requestAccounts:[address],eth_accounts:[address],eth_chainId:'0x30d4a',eth_getTransactionCount:4n,eth_getBalance:'0xa2d12ad75f1c8400',eth_getCode:'0x',eth_estimateGas:'0x3553c1',eth_gasPrice:'0x27b7000000',eth_getBlockByNumber:{baseFeePerGas:'0x27b7000000'},eth_maxPriorityFeePerGas:'0x0'};
      if(!(method in values))throw Error(`Unexpected ${method}`);return values[method];
    }};
  });
  await page.goto('/hadrian/metamask');
  await page.getByRole('button',{name:'Connect MetaMask'}).click();
  await page.getByRole('button',{name:'Refresh estimate'}).click();
  await expect(page.getByText('Nonce 4 · Balance',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Check receipts and save evidence'}).click();
  await expect(page.getByText('Local evidence saved: 0 verified operations')).toBeVisible();
  await page.reload();
  await page.getByRole('button',{name:'Connect MetaMask'}).click();
  await expect(page.getByRole('button',{name:'Refresh estimate'})).toBeVisible();
  expect(await page.evaluate(()=>(window as Window&{differentialSendCount?:number}).differentialSendCount)).toBe(0);
});
