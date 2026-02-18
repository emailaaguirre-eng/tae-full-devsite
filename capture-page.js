// One-off script to capture full-page screenshot of dev site
const https = require('https');
const http = require('http');
const fs = require('fs');

async function main() {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto('https://dev.theartfulexperience.com', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshot-full.png', fullPage: true });
    await browser.close();
    console.log('Saved screenshot-full.png');
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }
}
main();
