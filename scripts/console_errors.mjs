import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PREVIEW_PORT = 4174;
const CDP_PORT = 9230;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.pending = new Map();
    this.eventListeners = new Map();
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
      } else if (msg.method) {
        const listeners = this.eventListeners.get(msg.method) || [];
        for (const fn of listeners) {
          try {
            fn(msg.params);
          } catch (e) {
            console.error('Error in listener:', e);
          }
        }
      }
    });
  }

  on(method, callback) {
    if (!this.eventListeners.has(method)) {
      this.eventListeners.set(method, []);
    }
    this.eventListeners.get(method).push(callback);
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
  let baseUrl = isProd ? 'https://guardrail-court-app.vercel.app' : `http://127.0.0.1:${PREVIEW_PORT}`;
  let previewProc = null;

  if (!isProd) {
    const viteBin = path.resolve('node_modules/vite/bin/vite.js');
    previewProc = spawn(process.execPath, [viteBin, 'preview', '--port', String(PREVIEW_PORT), '--host', '127.0.0.1'], {
      stdio: 'pipe',
    });
  }

  const userDataDir = path.resolve(`.chrome-headless-console-test`);
  fs.mkdirSync(userDataDir, { recursive: true });

  let chromeProc = null;
  try {
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
    if (!pageTarget) throw new Error('No page target found in headless Chrome');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');
    await cdp.send('Network.enable');

    const routes = [
      '/',
      '/app',
      '/app/desk',
      '/app/new',
      '/app/evidence',
      '/app/decision/1',
    ];

    const capturedErrors = [];

    let currentUrl = '';

    cdp.on('Runtime.consoleAPICalled', (params) => {
      if (params.type === 'error' || params.type === 'assert') {
        const text = params.args
          ? params.args.map((a) => a.value || a.description || JSON.stringify(a)).join(' ')
          : 'Unknown console error';
        capturedErrors.push({
          type: 'console.error',
          url: currentUrl,
          message: text,
        });
      }
    });

    cdp.on('Runtime.exceptionThrown', (params) => {
      const text = params.exceptionDetails?.exception?.description ||
                   params.exceptionDetails?.text ||
                   'Uncaught exception';
      capturedErrors.push({
        type: 'pageerror',
        url: currentUrl,
        message: text,
      });
    });

    cdp.on('Log.entryAdded', (params) => {
      if (params.entry?.level === 'error') {
        capturedErrors.push({
          type: 'log.error',
          url: currentUrl,
          message: params.entry.text,
        });
      }
    });

    cdp.on('Network.responseReceived', (params) => {
      if (params.response?.status >= 400) {
        capturedErrors.push({
          type: 'network.failed',
          url: currentUrl,
          message: `HTTP ${params.response.status} ${params.response.statusText} on ${params.response.url}`,
        });
      }
    });

    console.log(`=== BROWSER CONSOLE & NETWORK ERROR AUDIT ===`);
    console.log(`Target: ${baseUrl} (${isProd ? 'PRODUCTION' : 'LOCAL PREVIEW'})\n`);

    for (const route of routes) {
      currentUrl = `${baseUrl}${route}`;
      await cdp.send('Page.navigate', { url: currentUrl });
      await sleep(2200); // allow async data fetch and rendering
    }

    cdp.close();

    console.log(`TOTAL DETECTED ISSUES: ${capturedErrors.length}\n`);
    if (capturedErrors.length > 0) {
      console.log('CAPTURED ERRORS:');
      for (const err of capturedErrors) {
        console.log(`[${err.type}] Route: ${err.url}\n  Message: ${err.message}\n`);
      }
      process.exit(1);
    } else {
      console.log('STATUS: ZERO CONSOLE ERRORS, ZERO EXCEPTIONS, ZERO FAILED REQUESTS (PASS)');
      process.exit(0);
    }
  } finally {
    if (chromeProc) {
      chromeProc.kill('SIGKILL');
    }
    if (previewProc) {
      previewProc.kill('SIGKILL');
    }
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {}
  }
}

main().catch((err) => {
  console.error('Fatal in console_errors audit:', err);
  process.exit(1);
});
