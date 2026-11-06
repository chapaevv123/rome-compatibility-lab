import {test,expect} from '@playwright/test';

test('completed MetaMask operations have no transaction controls',async({page})=>{
  await page.goto('/hadrian/metamask');
  await expect(page.getByRole('heading',{name:'Rome Compatibility Lab 2.0'})).toBeVisible();
  await expect(page.getByText('All planned MetaMask operations are complete.')).toBeVisible();
  await expect(page.getByRole('button',{name:/approval|deploy|send/i})).toHaveCount(0);
  await expect(page.getByRole('link',{name:/0x89c4c377/})).toHaveAttribute('href',/via-hadrian\.testnet\.romeprotocol\.xyz\/tx\//);
});
