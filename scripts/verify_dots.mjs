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
  const viteBin = path.resolve('node_modules/vite/bin/vite.js');
  const previewProc = spawn(process.execPath, [viteBin, 'preview', '--port', String(PREVIEW_PORT), '--host', '127.0.0.1'], {
    stdio: 'pipe',
  });

  const userDataDir = path.resolve('.chrome-headless-dots-profile');
  fs.mkdirSync(userDataDir, { recursive: true });

  let chromeProc = null;
  try {
    const baseUrl = `http://127.0.0.1:${PREVIEW_PORT}`;
    await waitForServer(baseUrl);

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
    if (!pageTarget) throw new Error('No page target found');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const pages = [
      { route: '/', name: 'Landing (/)' },
      { route: '/app', name: 'Explorer (/app)' },
    ];

    const results = [];

    for (const p of pages) {
      await cdp.send('Page.navigate', { url: `${baseUrl}${p.route}` });
      await sleep(1500); // Wait for canvas to render and frame loop to establish

      // Audit 4x4 Grid in browser
      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const canvas = document.querySelector('canvas.global-dotfield-canvas');
          if (!canvas) return { error: 'Canvas not found' };
          const ctx = canvas.getContext('2d');
          const w = canvas.width;
          const h = canvas.height;
          const cols = 4;
          const rows = 4;
          const cellW = w / cols;
          const cellH = h / rows;
          const img = ctx.getImageData(0, 0, w, h).data;

          const grid = [];
          let populatedCount = 0;

          for (let r = 0; r < rows; r++) {
            const row = [];
            for (let c = 0; c < cols; c++) {
              let dotPixels = 0;
              const x0 = Math.floor(c * cellW);
              const x1 = Math.floor((c + 1) * cellW);
              const y0 = Math.floor(r * cellH);
              const y1 = Math.floor((r + 1) * cellH);

              // Sample grid cell with stride 4
              for (let y = y0; y < y1; y += 4) {
                for (let x = x0; x < x1; x += 4) {
                  const idx = (y * w + x) * 4;
                  const red = img[idx];
                  const green = img[idx + 1];
                  const blue = img[idx + 2];
                  const alpha = img[idx + 3];

                  // A dot is rendered with rgba(104, 151, 255, alpha >= 0.28)
                  // On black, blue pixel value > 25 and alpha > 40 indicates visible dot
                  if (alpha > 40 && (blue > 30 || green > 30 || red > 30)) {
                    dotPixels++;
                  }
                }
              }

              const hasDots = dotPixels >= 6;
              if (hasDots) populatedCount++;
              row.push({ cell: \`r\${r}c\${c}\`, dotPixels, hasDots });
            }
            grid.push(row);
          }

          // Check corner distribution (ensure dots are not isolated in one single quadrant)
          const topLeft = grid[0][0].hasDots;
          const topRight = grid[0][3].hasDots;
          const bottomLeft = grid[3][0].hasDots;
          const bottomRight = grid[3][3].hasDots;
          const distributedAcrossQuadrants = (topLeft && topRight && bottomLeft && bottomRight);

          return {
            canvasPresent: true,
            canvasDimensions: { w, h },
            populatedCount,
            totalCells: cols * rows,
            pass: populatedCount >= 14 && distributedAcrossQuadrants,
            distributedAcrossQuadrants,
            corners: { topLeft, topRight, bottomLeft, bottomRight },
            gridSummary: grid.map(r => r.map(c => (c.hasDots ? '●' : '○')).join(' '))
          };
        })()`,
        returnByValue: true,
      });

      const audit = evalRes.result.value;
      results.push({ page: p.name, ...audit });

      // Save screenshot
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const filename = p.route === '/' ? 'landing-1440-dots.png' : 'app-1440-dots.png';
      fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), Buffer.from(shot.data, 'base64'));
    }

    // Measure Scroll FPS
    await cdp.send('Page.navigate', { url: `${baseUrl}/` });
    await sleep(800);

    const fpsEval = await cdp.send('Runtime.evaluate', {
      expression: `new Promise((resolve) => {
        const deltas = [];
        let last = performance.now();
        let frames = 0;
        const total = 90;
        function step(now) {
          deltas.push(now - last);
          last = now;
          frames++;
          window.scrollTo(0, (frames / total) * 1600);
          if (frames < total) {
            requestAnimationFrame(step);
          } else {
            const valid = deltas.slice(1);
            const avgMs = valid.reduce((a, b) => a + b, 0) / valid.length;
            const maxMs = Math.max(...valid);
            const fps = 1000 / avgMs;
            resolve({
              sampledFrames: valid.length,
              avgFrameMs: Number(avgMs.toFixed(2)),
              maxFrameMs: Number(maxMs.toFixed(2)),
              measuredFps: Number(fps.toFixed(1))
            });
          }
        }
        requestAnimationFrame(step);
      })`,
      awaitPromise: true,
      returnByValue: true,
    });

    const fps = fpsEval.result.value;

    console.log('=== DOTFIELD 4x4 VIEWPORT COVERAGE AUDIT (1440x900) ===');
    let allPassed = true;
    for (const r of results) {
      console.log(`\nPage: ${r.page}`);
      console.log(`  Populated Grid Cells: ${r.populatedCount}/${r.totalCells} (Required >= 14)`);
      console.log(`  All 4 Viewport Quadrants Covered: ${r.distributedAcrossQuadrants}`);
      console.log(`  4x4 Grid Matrix (● = dots detected, ○ = empty):`);
      for (const rowStr of r.gridSummary) {
        console.log(`    ${rowStr}`);
      }
      console.log(`  Result: ${r.pass ? 'PASS' : 'FAIL'}`);
      if (!r.pass) allPassed = false;
    }

    console.log('\n=== SCROLL FPS WITH ENHANCED DOT DENSITY ===');
    console.log(JSON.stringify(fps, null, 2));

    cdp.close();

    const MIN_FPS = 45;
    const fpsPassed = fps.measuredFps >= MIN_FPS;

    if (!allPassed) {
      console.error('\nERROR: Dotfield coverage failed minimum threshold!');
      process.exit(1);
    } else if (!fpsPassed) {
      console.error(`\nERROR: Measured scroll FPS (${fps.measuredFps} fps) is below minimum threshold (${MIN_FPS} fps)!`);
      process.exit(1);
    } else {
      console.log(`\nPASSED: Dotfield covers >= 14/16 grid cells with measured ${fps.measuredFps} fps (threshold >= ${MIN_FPS} fps).`);
    }
  } finally {
    try {
      chromeProc?.kill();
    } catch {}
    try {
      previewProc?.kill();
    } catch {}
    await sleep(300);
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {}
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
