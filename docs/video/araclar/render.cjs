// Kullanım: node render.js <index.html> <çıktı klasörü> [fps=30] [işçi=4] [başlangıç=0] [bitiş=film sonu]
// Zaman çizelgesini kare kare ilerletip PNG yakalar, ffmpeg (libx264) ile parçalara kodlar.
// Ortam değişkenleri: FFMPEG (ffmpeg.exe yolu, varsayılan PATH'teki ffmpeg), CHROME (chrome.exe yolu).
const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const FF = process.env.FFMPEG || 'ffmpeg';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const [html, out, fpsA, wA, startA, endA] = process.argv.slice(2);
  const fps = +(fpsA || 30), W = +(wA || 4);
  fs.mkdirSync(out, { recursive: true });
  const url = 'file:///' + path.resolve(html).replace(/\\/g, '/') + '?render';
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--force-color-profile=srgb', '--hide-scrollbars', '--allow-file-access-from-files', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const open = async () => {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => console.log('pageerror:', e.message));
    await page.goto(url);
    await page.waitForFunction('window.__ready === true', null, { timeout: 90000 });
    return page;
  };
  const p0 = await open();
  const meta = await p0.evaluate(() => ({ duration: window.__duration, scenes: window.__scenes, sfx: window.__sfx, marks: window.__marks }));
  meta.end = meta.duration;
  fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify(meta, null, 1));
  await p0.close();
  const t0 = +(startA || 0), t1 = endA ? +endA : meta.end;
  const F0 = Math.round(t0 * fps), F1 = Math.round(t1 * fps), N = F1 - F0, per = Math.ceil(N / W);
  console.log(`kareler ${F0}..${F1} (${N}) · ${W} işçi · film ${meta.end}s`);
  const started = Date.now(); let done = 0;
  await Promise.all(Array.from({ length: W }, async (_, w) => {
    const a = F0 + w * per, b = Math.min(F1, F0 + (w + 1) * per);
    if (a >= b) return;
    const page = await open();
    const cdp = await page.context().newCDPSession(page);
    const ff = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(fps), path.join(out, `part${w}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = a; f < b; f++) {
      await page.evaluate(t => window.__seek(t), f / fps);
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
      if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if (++done % 200 === 0) {
        const el = (Date.now() - started) / 1000;
        console.log(`${done}/${N} kare · ${el.toFixed(0)} sn · kalan ~${((N - done) * el / done).toFixed(0)} sn`);
      }
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    await page.close();
  }));
  await browser.close();
  fs.writeFileSync(path.join(out, 'parts.txt'), Array.from({ length: W }, (_, w) => `file 'part${w}.mp4'`).join('\n'));
  console.log(`bitti · ${((Date.now() - started) / 1000).toFixed(0)} sn`);
})();
