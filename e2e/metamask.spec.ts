import {test,expect} from '@playwright/test';

test('existing operations remain linked and new operations require explicit wallet connection',async({page})=>{
  await page.goto('/hadrian/metamask');
  await expect(page.getByRole('heading',{name:'Rome Compatibility Lab 2.0'})).toBeVisible();
  await expect(page.getByText('The original LaneProbe and CPI operations are complete.',{exact:false})).toBeVisible();
  await expect(page.getByRole('button',{name:/Confirm in MetaMask/})).toHaveCount(0);
  await expect(page.getByRole('link',{name:/0x89c4c377/})).toHaveAttribute('href',/via-hadrian\.testnet\.romeprotocol\.xyz\/tx\//);
});

test('completed differential operations cannot be sent on page load',async({page})=>{
  await page.addInitScript(()=>{
    const address='0x765fb7e6a0BdDDc29f57eeCE34AEda0Fb318805d';
    (window as Window&{ethereum?:unknown;differentialSendCount?:number}).differentialSendCount=0;
    (window as Window&{ethereum?:unknown}).ethereum={isMetaMask:true,request:async({method}:{method:string})=>{
      if(method==='eth_sendTransaction'){(window as Window&{differentialSendCount?:number}).differentialSendCount!++;throw Error('Unexpected send')}
      const values:Record<string,unknown>={eth_requestAccounts:[address],eth_accounts:[address],eth_chainId:'0x30d4a',eth_getTransactionCount:4n,eth_getBalance:'0xa2d12ad75f1c8400',eth_getCode:'0x',eth_estimateGas:'0x3553c1',eth_gasPrice:'0x27b7000000',eth_getBlockByNumber:{baseFeePerGas:'0x27b7000000'},eth_maxPriorityFeePerGas:'0x0'};
      if(!(method in values))throw Error(`Unexpected ${method}`);return values[method];
    }};
  });
  await page.goto('/hadrian/metamask');
  await expect(page.getByRole('button',{name:'Confirm in MetaMask: deploy:Clean'})).toHaveCount(0);
  await expect(page.getByText(/Refresh estimate/)).toHaveCount(0);
  expect(await page.evaluate(()=>(window as Window&{differentialSendCount?:number}).differentialSendCount)).toBe(0);
});
test('pending hash survives reload and blocks a second deployment',async({page})=>{
  test.skip(!!process.env.E2E_EXTERNAL_SERVER,'Production build intentionally has no wallet console');
  await page.addInitScript(()=>{
    const address='0x765fb7e6a0BdDDc29f57eeCE34AEda0Fb318805d';
    localStorage.setItem('rome-lab-differential-v1',JSON.stringify({version:1,chainId:200010,sender:address,hashes:{'deploy:Clean':`0x${'ab'.repeat(32)}`}}));
    (window as Window&{ethereum?:unknown;differentialSendCount?:number}).differentialSendCount=0;
    (window as Window&{ethereum?:unknown}).ethereum={isMetaMask:true,request:async({method}:{method:string})=>{
      if(method==='eth_sendTransaction'){(window as Window&{differentialSendCount?:number}).differentialSendCount!++;throw Error('Unexpected send')}
      if(method==='eth_requestAccounts'||method==='eth_accounts')return [address];
      if(method==='eth_chainId')return '0x30d4a';
      if(method==='eth_getTransactionReceipt'||method==='eth_getTransactionByHash')return null;
      throw Error(`Unexpected ${method}`);
    }};
  });
  await page.goto('/hadrian/metamask');
  await page.getByRole('button',{name:'Connect MetaMask'}).click();
  await expect(page.getByText(/Submitted, awaiting receipt/)).toBeVisible();
  await expect(page.getByRole('button',{name:'Refresh estimate'})).toHaveCount(0);
  await page.reload();
  await page.getByRole('button',{name:'Connect MetaMask'}).click();
  await expect(page.getByText(/Submitted, awaiting receipt/)).toBeVisible();
  await expect(page.getByRole('button',{name:/Confirm in MetaMask/})).toHaveCount(0);
  expect(await page.evaluate(()=>(window as Window&{differentialSendCount?:number}).differentialSendCount)).toBe(0);
});
