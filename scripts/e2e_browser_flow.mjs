import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PREVIEW_PORT = 4173;
const CDP_PORT = 9223;
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

async function captureScreenshot(cdp, filepath) {
  const { data } = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
  });
  fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
  console.log(`Saved screenshot: ${filepath}`);
}

async function main() {
  console.log('=== STARTING BROWSER E2E WRITE FLOW SCREENSHOT CAPTURE ===');
  const viteBin = path.resolve('node_modules/vite/bin/vite.js');
  const previewProc = spawn(process.execPath, [viteBin, 'preview', '--port', String(PREVIEW_PORT), '--host', '127.0.0.1'], {
    stdio: 'ignore',
  });
  const baseUrl = `http://127.0.0.1:${PREVIEW_PORT}`;

  const userDataDir = path.resolve('.chrome-headless-e2e-browser');
  fs.mkdirSync(userDataDir, { recursive: true });

  let chromeProc = null;
  let cdp = null;

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
    if (!pageTarget) throw new Error('No page target found in Chrome');

    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // Inject mock EIP-1193 provider with owner/agent address
    const mockAddr = '0xa359c620Ca5c539a473cfb983d9eD4333c64FA24';
    const providerScript = `
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '${mockAddr}',
        request: async ({ method, params }) => {
          if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
            return ['${mockAddr}'];
          }
          if (method === 'eth_chainId') {
            return '0xF22F'; // 61999
          }
          if (method === 'wallet_switchEthereumChain') {
            return null;
          }
          if (method === 'eth_sendTransaction') {
            return '0xbc909da498aa2c9c14bffb268720bf1f234d5d2d7cf1dcea5e42ed2b54198c9b';
          }
          return null;
        },
        on: (ev, fn) => {},
        removeListener: (ev, fn) => {},
      };
    `;
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: providerScript });

    // Set viewport: 1440 x 900
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // 1. /app/new screenshot
    console.log('Navigating to /app/new...');
    await cdp.send('Page.navigate', { url: `${baseUrl}/app/new` });
    await sleep(2000);
    // Connect wallet in UI if button present
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const connectBtn = btns.find(b => b.textContent.includes('Connect Wallet'));
        if (connectBtn) connectBtn.click();
      })()`,
    });
    await sleep(1000);
    await captureScreenshot(cdp, path.join(SCREENSHOT_DIR, 'write-01-new-policy.png'));

    // 2. /app/request screenshot
    console.log('Navigating to /app/request...');
    await cdp.send('Page.navigate', { url: `${baseUrl}/app/request` });
    await sleep(2000);
    // Select policy 7
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const p7 = btns.find(b => b.textContent.trim() === '#5' || b.textContent.trim() === '#1');
        if (p7) p7.click();
      })()`,
    });
    await sleep(1500);
    await captureScreenshot(cdp, path.join(SCREENSHOT_DIR, 'write-02-request-action.png'));

    // 3. /app/desk screenshot
    console.log('Navigating to /app/desk...');
    await cdp.send('Page.navigate', { url: `${baseUrl}/app/desk` });
    await sleep(2000);
    await captureScreenshot(cdp, path.join(SCREENSHOT_DIR, 'write-03-desk-resolve.png'));

    console.log('=== BROWSER E2E WRITE FLOW SCREENSHOTS COMPLETE ===');
  } finally {
    cdp?.close();
    try {
      chromeProc?.kill();
    } catch {}
    try {
      previewProc?.kill();
    } catch {}
  }
}

main().catch((err) => {
  console.error('Browser E2E flow failure:', err);
  process.exit(1);
});
