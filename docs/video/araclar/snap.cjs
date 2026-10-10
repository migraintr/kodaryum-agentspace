// Kullanım: node snap.js <index.html> <çıktı klasörü> t1 t2 ... [--debug]
// Zaman çizelgesinin belirli saniyelerinden PNG kare alır (önizleme için).
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
(async () => {
  const args = process.argv.slice(2), dbg = args.includes('--debug');
  const [html, out, ...ts] = args.filter(a => a !== '--debug');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--force-color-profile=srgb', '--hide-scrollbars', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() !== 'log') console.log('console:', m.type(), m.text()); });
  page.on('pageerror', e => console.log('pageerror:', e.message));
  await page.goto('file:///' + path.resolve(html).replace(/\\/g, '/') + '?render' + (dbg ? '&debug' : ''));
  await page.waitForFunction('window.__ready === true', null, { timeout: 60000 });
  const d = await page.evaluate(() => window.__duration);
  console.log('süre', d);
  for (const t of ts.map(Number)) {
    await page.evaluate(t => window.__seek(t), t);
    await page.screenshot({ path: path.join(out, `t_${t.toFixed(1).padStart(5, '0')}.png`) });
  }
  await browser.close();
})();
