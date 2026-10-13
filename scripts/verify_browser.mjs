import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PREVIEW_PORT = 4173;
const CDP_PORT = 9229;
const SCREENSHOT_DIR = path.resolve('docs/screenshots');

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(String(event.data));
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    try {
      this.ws?.close();
    } catch {}
  }
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await sleep(250);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function main() {
  // 1. Start vite preview server
  const viteBin = path.resolve('node_modules/vite/bin/vite.js');
  const previewProc = spawn(process.execPath, [viteBin, 'preview', '--port', String(PREVIEW_PORT), '--host', '127.0.0.1'], {
    stdio: 'pipe',
  });

  const userDataDir = path.resolve('.chrome-headless-profile');
  fs.mkdirSync(userDataDir, { recursive: true });

  let chromeProc = null;
  try {
    const baseUrl = `http://127.0.0.1:${PREVIEW_PORT}`;
    await waitForServer(baseUrl);

    // 2. Launch Headless Chrome
    chromeProc = spawn(
      CHROME_PATH,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${userDataDir}`,
        `--remote-debugging-port=${CDP_PORT}`,
        'about:blank',
      ],
      { stdio: 'ignore' }
    );

    await waitForServer(`http://127.0.0.1:${CDP_PORT}/json/version`);
    const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found in headless Chrome');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    const axeSource = fs.readFileSync(path.resolve('node_modules/axe-core/axe.min.js'), 'utf8');

    const routes = [
      { path: '/', slug: 'landing' },
      { path: '/app', slug: 'app' },
      { path: '/evidence', slug: 'evidence' },
    ];
    const widths = [
      { w: 375, h: 812 },
      { w: 768, h: 1024 },
      { w: 1440, h: 900 },
    ];

    const axeSummary = [];
    const savedScreenshots = [];

    for (const route of routes) {
      // Navigate at 1440x900 first and run axe-core
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await cdp.send('Page.navigate', { url: `${baseUrl}${route.path}` });
      await sleep(1400); // allow RPC / animations to settle

      await cdp.send('Runtime.evaluate', { expression: axeSource });
      const axeEval = await cdp.send('Runtime.evaluate', {
        expression: `axe.run().then(r => JSON.stringify({
          route: ${JSON.stringify(route.path)},
          passesCount: r.passes.length,
          violationsCount: r.violations.length,
          seriousOrCriticalCount: r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').length,
          violations: r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }))
        }))`,
        awaitPromise: true,
        returnByValue: true,
      });
      axeSummary.push(JSON.parse(axeEval.result.value));

      // Take screenshots at 375, 768, 1440 (top and scrolled)
      for (const dim of widths) {
        await cdp.send('Emulation.setDeviceMetricsOverride', {
          width: dim.w,
          height: dim.h,
          deviceScaleFactor: 1,
          mobile: dim.w < 768,
        });
        await cdp.send('Runtime.evaluate', { expression: 'window.scrollTo({ top: 0, behavior: "instant" })' });
        await sleep(300);

        const topShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const topFile = `${route.slug}-${dim.w}-top.png`;
        fs.writeFileSync(path.join(SCREENSHOT_DIR, topFile), Buffer.from(topShot.data, 'base64'));
        savedScreenshots.push(`docs/screenshots/${topFile}`);

        await cdp.send('Runtime.evaluate', { expression: 'window.scrollTo({ top: 520, behavior: "instant" })' });
        await sleep(300);

        const scrolledShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const scrolledFile = `${route.slug}-${dim.w}-scrolled.png`;
        fs.writeFileSync(path.join(SCREENSHOT_DIR, scrolledFile), Buffer.from(scrolledShot.data, 'base64'));
        savedScreenshots.push(`docs/screenshots/${scrolledFile}`);
      }
    }

    // 3. Measure Scroll FPS on '/' at 1440x900
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.send('Page.navigate', { url: `${baseUrl}/` });
    await sleep(800);

    const fpsEval = await cdp.send('Runtime.evaluate', {
      expression: `new Promise((resolve) => {
        const deltas = [];
        let last = performance.now();
        let frames = 0;
        const totalFrames = 90;
        function step(now) {
          deltas.push(now - last);
          last = now;
          frames++;
          window.scrollTo(0, (frames / totalFrames) * 1800);
          if (frames < totalFrames) {
            requestAnimationFrame(step);
          } else {
            const valid = deltas.slice(1);
            const avgFrameMs = valid.reduce((a, b) => a + b, 0) / valid.length;
            const maxFrameMs = Math.max(...valid);
            const fps = 1000 / avgFrameMs;
            resolve(JSON.stringify({
              sampledFrames: valid.length,
              avgFrameMs: Number(avgFrameMs.toFixed(2)),
              maxFrameMs: Number(maxFrameMs.toFixed(2)),
              measuredFps: Number(fps.toFixed(1)),
              canvasPresent: Boolean(document.querySelector('canvas.global-dotfield-canvas'))
            }));
          }
        }
        requestAnimationFrame(step);
      })`,
      awaitPromise: true,
      returnByValue: true,
    });
    const fpsReport = JSON.parse(fpsEval.result.value);

    console.log('=== AXE-CORE SUMMARY (REAL HEADLESS CHROME) ===');
    console.log(JSON.stringify(axeSummary, null, 2));
    console.log('\n=== FULL-SCREEN CANVAS SCROLL FPS BENCHMARK ===');
    console.log(JSON.stringify(fpsReport, null, 2));
    console.log(`\n=== SAVED ${savedScreenshots.length} SCREENSHOTS ===`);
    for (const s of savedScreenshots) {
      console.log(`  ${s}`);
    }

    cdp.close();
  } finally {
    try {
      chromeProc?.kill();
    } catch {}
    try {
      previewProc?.kill();
    } catch {}
    await sleep(400);
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {}
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
