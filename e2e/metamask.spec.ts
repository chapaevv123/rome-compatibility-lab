import {test,expect} from '@playwright/test';

test('existing operations remain linked and new operations require explicit wallet connection',async({page})=>{
  await page.goto('/hadrian/metamask');
  await expect(page.getByRole('heading',{name:'Rome Compatibility Lab 2.0'})).toBeVisible();
  await expect(page.getByText('The original LaneProbe and CPI operations are complete.',{exact:false})).toBeVisible();
  await expect(page.getByRole('button',{name:/Confirm in MetaMask/})).toHaveCount(0);
  await expect(page.getByRole('link',{name:/0x89c4c377/})).toHaveAttribute('href',/via-hadrian\.testnet\.romeprotocol\.xyz\/tx\//);
});

test('local differential quote is read-only until owner confirms',async({page})=>{
  await page.addInitScript(()=>{
    const address='0x765fb7e6a0BdDDc29f57eeCE34AEda0Fb318805d';
    (window as Window&{ethereum?:unknown;differentialSendCount?:number}).differentialSendCount=0;
    (window as Window&{ethereum?:unknown}).ethereum={isMetaMask:true,request:async({method}:{method:string})=>{
      if(method==='eth_sendTransaction'){(window as Window&{differentialSendCount?:number}).differentialSendCount!++;throw Error('Unexpected send')}
      const values:Record<string,unknown>={eth_requestAccounts:[address],eth_accounts:[address],eth_chainId:'0x30d4a',eth_getTransactionCount:'0x4',eth_getBalance:'0xa2d12ad75f1c8400',eth_getCode:'0x',eth_estimateGas:'0x3553c1',eth_gasPrice:'0x27b7000000',eth_getBlockByNumber:{baseFeePerGas:'0x27b7000000'},eth_maxPriorityFeePerGas:'0x0'};
      if(!(method in values))throw Error(`Unexpected ${method}`);return values[method];
    }};
  });
  await page.goto('/hadrian/metamask');
  await page.getByRole('button',{name:'Connect MetaMask'}).click();
  await page.getByRole('button',{name:'Refresh estimate'}).click();
  await expect(page.getByText(/Max fee per gas/)).toBeVisible();
  await expect(page.getByRole('button',{name:'Confirm in MetaMask: deploy:Clean'})).toBeDisabled();
  expect(await page.evaluate(()=>(window as Window&{differentialSendCount?:number}).differentialSendCount)).toBe(0);
});
