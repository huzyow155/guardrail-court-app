import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const CDP_PORT = 9232;

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
  const isProd = process.argv.includes('--prod');
  const targetUrl = isProd
    ? 'https://guardrail-court-app.vercel.app/app'
    : 'http://127.0.0.1:4174/app';

  const userDataDir = path.resolve('.chrome-cls-diag');
  fs.mkdirSync(userDataDir, { recursive: true });
  let chromeProc = null;

  try {
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

    // Inject PerformanceObserver script BEFORE navigation
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        window.__layoutShifts = [];
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                const shiftSources = [];
                if (entry.sources) {
                  for (const src of entry.sources) {
                    let desc = 'unknown';
                    if (src.node) {
                      desc = (src.node.tagName || '') +
                             (src.node.id ? '#' + src.node.id : '') +
                             (src.node.className ? '.' + String(src.node.className).replace(/\\s+/g, '.') : '');
                    }
                    shiftSources.push({
                      selector: desc,
                      previousRect: src.previousRect ? { x: src.previousRect.x, y: src.previousRect.y, w: src.previousRect.width, h: src.previousRect.height } : null,
                      currentRect: src.currentRect ? { x: src.currentRect.x, y: src.currentRect.y, w: src.currentRect.width, h: src.currentRect.height } : null,
                    });
                  }
                }
                window.__layoutShifts.push({
                  value: entry.value,
                  sources: shiftSources,
                });
              }
            }
          });
          observer.observe({ type: 'layout-shift', buffered: true });
        } catch (e) {
          window.__layoutShiftsError = String(e);
        }
      `,
    });

    console.log(`=== CLS LAYOUT SHIFT DIAGNOSTIC ===`);
    console.log(`Navigating to ${targetUrl} (1440x900 viewport)...`);

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await cdp.send('Page.navigate', { url: targetUrl });
    await sleep(3500); // Wait for fonts, state hydration, and async loads

    const evalRes = await cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const shifts = window.__layoutShifts || [];
          const totalCls = shifts.reduce((acc, s) => acc + s.value, 0);
          return {
            totalCls: Number(totalCls.toFixed(5)),
            shiftCount: shifts.length,
            shifts,
            error: window.__layoutShiftsError,
          };
        })()
      `,
      returnByValue: true,
    });

    const data = evalRes.result?.value;
    console.log(`\nMeasured Total CLS: ${data?.totalCls}`);
    console.log(`Layout Shift Events Detected: ${data?.shiftCount}\n`);

    if (data?.shifts && data.shifts.length > 0) {
      console.log('INDIVIDUAL SHIFT DETAILS:');
      data.shifts.forEach((s, idx) => {
        console.log(`[Shift #${idx + 1}] Value: ${s.value.toFixed(5)}`);
        if (s.sources && s.sources.length > 0) {
          s.sources.forEach((src) => {
            console.log(`   Element: ${src.selector}`);
            if (src.previousRect && src.currentRect) {
              console.log(`   Previous: [y=${src.previousRect.y}, h=${src.previousRect.h}] -> Current: [y=${src.currentRect.y}, h=${src.currentRect.h}]`);
            }
          });
        } else {
          console.log(`   Sources: [anonymous / sub-tree reflow]`);
        }
      });
    } else {
      console.log('No layout shift events recorded (Zero CLS).');
    }

    cdp.close();
  } finally {
    if (chromeProc) chromeProc.kill('SIGKILL');
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {}
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
