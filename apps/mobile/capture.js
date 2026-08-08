const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url = 'http://localhost:8081';
const outputDir = '/Users/bryan/.gemini/antigravity-ide/brain/8e06567f-1a16-4332-b6f3-8a61266e1ff2';

async function capture(width, height, filename) {
  console.log(`Starting capture for ${width}x${height}...`);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    console.log(`Waiting 15 seconds for React Native Web JS loading and Metro compilation...`);
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    const outputPath = path.join(outputDir, filename);
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log(`Screenshot saved to ${outputPath}`);
  } catch (error) {
    console.error(`Error during capture:`, error);
  } finally {
    await browser.close();
  }
}

async function run() {
  // Capture mobile
  await capture(375, 812, 'screenshot_mobile.png');
  // Capture tablet
  await capture(768, 1024, 'screenshot_tablet.png');
  // Capture desktop
  await capture(1440, 900, 'screenshot_desktop.png');
  console.log('Capture process completed.');
}

run();
