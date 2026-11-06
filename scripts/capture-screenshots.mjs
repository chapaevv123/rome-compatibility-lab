import {mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';

const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
try{
 await mkdir('screenshots',{recursive:true});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:3000/',{waitUntil:'networkidle'});
 await page.screenshot({path:'screenshots/landing.png',fullPage:true});
 await page.goto('http://127.0.0.1:3000/scan',{waitUntil:'networkidle'});
 await page.screenshot({path:'screenshots/scan.png',fullPage:true});
 await page.getByRole('button',{name:/Run preflight/}).click();
 await page.waitForURL('**/report');
 await page.getByText('EVM-BLOCK-CONTEXT').first().waitFor();
 await page.screenshot({path:'screenshots/report.png',fullPage:true});
 console.log('Captured actual landing, scan and report pages');
}finally{await browser.close();}
