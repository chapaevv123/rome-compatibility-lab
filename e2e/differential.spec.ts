import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const recorded=JSON.parse(readFileSync('evidence/live-differential.json','utf8'));
const release=JSON.parse(readFileSync('evidence/hadrian-live.json','utf8'));

test('judge journey connects exact sample to pinned evidence',async({page})=>{
  await page.route('**/api/differential/live',route=>route.fulfill({json:{...recorded,source:'FRESH_RPC'}}));
  await page.route('**/api/evidence/live',route=>route.fulfill({json:release}));
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Judge Walkthrough'})).toBeVisible();
  await expect(page.getByText('4/4 tested scenarios compatible')).toBeVisible();
  await page.getByRole('link',{name:'Open sample scan'}).click();
  await page.getByRole('button',{name:/Run preflight/}).click();
  await expect(page.getByText('Related pinned LaneProbe runtime example').first()).toBeVisible();
  await page.getByRole('link',{name:'Live Differential case'}).first().click();
  await expect(page.locator('#laneprobe')).toBeVisible();
  await expect(page.getByText('FRESH_RPC · COMPATIBLE')).toHaveCount(4);
  await expect(page.locator('details')).not.toHaveAttribute('open');
  await page.getByText('Historical local run · archive').click();
  await expect(page.locator('details td').getByText('NOT_EXECUTED')).toHaveCount(4);
  await page.getByRole('navigation').getByRole('link',{name:'Hadrian Lab'}).click();
  await expect(page.getByRole('heading',{name:'LaneProbe observe()'})).toBeVisible();
  await page.getByRole('link',{name:'Inspect Solana Memo CPI'}).click();
  await expect(page.getByText('Rome Compatibility Lab CPI-MEMO-01')).toBeVisible();
  await page.getByRole('link',{name:'Open full Solana evidence'}).click();
  await expect(page.getByRole('heading',{name:'Evidence Explorer'})).toBeVisible();
  await page.getByRole('navigation').getByRole('link',{name:'History'}).click();
  await page.getByRole('button',{name:'Show fixture comparison'}).click();
  await expect(page.getByText('FIXTURE EXAMPLE')).toBeVisible();
  await page.getByRole('navigation').getByRole('link',{name:'Docs'}).click();
  await expect(page.getByRole('heading',{name:'Five-minute quickstart'})).toBeVisible();
});

test('modified source never inherits LaneProbe proof',async({page})=>{
  await page.goto('/scan');
  await page.getByLabel('Solidity source').fill('pragma solidity ^0.8.24; contract LaneProbe { function observe() external view returns(uint) { return block.number; } }');
  await page.getByRole('button',{name:/Run preflight/}).click();
  await expect(page.getByText('Runtime verification required').first()).toBeVisible();
  await expect(page.getByText('Related pinned LaneProbe runtime example')).toHaveCount(0);
  await expect(page.getByRole('link',{name:'Hadrian observe() receipt'})).toHaveCount(0);
});

test('RPC error shows stale recorded check on mobile without overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.route('**/api/differential/live',route=>route.fulfill({status:503,json:{error:'RPC unavailable'}}));
  await page.route('**/api/evidence/live',route=>route.fulfill({status:503,json:{error:'RPC unavailable'}}));
  await page.goto('/cross-vm');
  await expect(page.getByText(/STALE · RECORDED · Last successful check/)).toBeVisible();
  await expect(page.getByText('STALE · RECORDED · COMPATIBLE')).toHaveCount(4);
  await expect(page.getByText('FRESH_RPC · COMPATIBLE')).toHaveCount(0);
  await page.getByRole('navigation').getByRole('link',{name:'CPI Lab'}).click();
  await expect(page.getByText(/current RPC unavailable: RPC unavailable/)).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('History compares both supported JSON formats and explains invalid input',async({page})=>{
  await page.goto('/history');
  await expect(page.getByText('No comparison yet')).toBeVisible();
  await page.getByRole('button',{name:'Compare runs'}).click();
  await expect(page.getByRole('alert').first()).toContainText('Choose both Baseline and Current');
  await page.getByLabel('Baseline report').setInputFiles('examples/regression-baseline.json');
  await page.getByLabel('Current report').setInputFiles('examples/regression-baseline.json');
  await page.getByRole('button',{name:'Compare runs'}).click();
  await expect(page.getByText(/New 0 · Resolved 0/)).toBeVisible();
  await page.getByLabel('Baseline report').setInputFiles('evidence/local-execution.json');
  await page.getByLabel('Current report').setInputFiles('evidence/local-execution.json');
  await page.getByRole('button',{name:'Compare runs'}).click();
  await expect(page.getByText(/INCONCLUSIVE 4/)).toBeVisible();
});
