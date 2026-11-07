import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const recorded=JSON.parse(readFileSync('evidence/live-differential.json','utf8'));

test('reviewer path keeps differential and historical evidence distinct',async({page})=>{
  await page.route('**/api/differential/live',route=>route.fulfill({json:{...recorded,source:'FRESH_RPC'}}));
  await page.goto('/');
  await page.getByRole('link',{name:'Scan Solidity →'}).click();
  await page.getByRole('button',{name:/Run preflight/}).click();
  await expect(page.getByRole('heading',{name:'Compatibility Report'})).toBeVisible();
  await page.getByRole('navigation').getByRole('link',{name:'EVM vs Rome'}).click();
  await expect(page.getByRole('heading',{name:'Live Differential'})).toBeVisible();
  await expect(page.getByText('FRESH_RPC · COMPATIBLE')).toHaveCount(4);
  await expect(page.getByText('FRESH_RPC · BLOCKED')).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Historical local run'})).toBeVisible();
  await page.getByRole('navigation').getByRole('link',{name:'Hadrian Lab'}).click();
  await expect(page.getByRole('heading',{name:'Hadrian Execution Lab'})).toBeVisible();
  await page.getByRole('navigation').getByRole('link',{name:'CPI Lab'}).click();
  await expect(page.getByRole('heading',{name:'Cross-VM CPI Lab'})).toBeVisible();
  await page.getByRole('navigation').getByRole('link',{name:'Evidence'}).click();
  await expect(page.getByRole('heading',{name:'Evidence Explorer'})).toBeVisible();
});
test('RPC error shows recorded check and no fresh claim on mobile',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.route('**/api/differential/live',route=>route.fulfill({status:503,json:{error:'RPC unavailable'}}));
  await page.goto('/cross-vm');
  await expect(page.getByText(/fresh check unavailable: RPC unavailable/)).toBeVisible();
  await expect(page.getByText('RECORDED_RPC_CHECK · COMPATIBLE')).toHaveCount(4);
  await expect(page.getByText('FRESH_RPC · COMPATIBLE')).toHaveCount(0);
  await expect(page.getByRole('link',{name:/Verified Hadrian transaction/}).first()).toBeVisible();
  await page.getByRole('navigation').getByRole('link',{name:'Evidence'}).click();
  await expect(page.getByRole('heading',{name:'Evidence Explorer'})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
