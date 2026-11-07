import {defineConfig} from '@playwright/test';
const port=Number(process.env.E2E_PORT||3000);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid E2E_PORT');
const baseURL=`http://127.0.0.1:${port}`;
export default defineConfig({testDir:'./e2e',use:{baseURL,browserName:'chromium',launchOptions:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:undefined},webServer:process.env.E2E_EXTERNAL_SERVER?undefined:{command:`node ./node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port ${port}`,url:baseURL,reuseExistingServer:!process.env.CI,timeout:120000}});
