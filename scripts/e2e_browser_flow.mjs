import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PREVIEW_PORT = 4173;
const CDP_PORT = 9224;
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

async function waitForServer(url, timeoutMs = 20000) {
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

async function setViewport(cdp, width, height) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
}

async function main() {
  console.log('=== STARTING HEADLESS BROWSER EIP-1193 FLOW & MULTI-VIEWPORT SCREENSHOTS ===');
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

    // Inject mock EIP-1193 provider with test burner address
    const mockAddr = '0xd904a5C23F53eF153Bcd059914e3E25D2F828f92';
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
            return '0x9999999999999999999999999999999999999999999999999999999999999999';
          }
          return null;
        },
        on: (ev, fn) => {},
        removeListener: (ev, fn) => {},
      };
    `;
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: providerScript });

    const viewports = [
      { name: '1440', width: 1440, height: 900 },
      { name: '768', width: 768, height: 1024 },
      { name: '375', width: 375, height: 812 },
    ];

    const pages = [
      { path: '/app', prefix: 'app-explorer' },
      { path: '/app/request', prefix: 'app-request' },
      { path: '/app/vault', prefix: 'app-vault' },
      { path: '/app/desk', prefix: 'app-desk' },
      { path: '/app/new', prefix: 'app-new' },
    ];

    for (const p of pages) {
      console.log(`\nNavigating to ${p.path}...`);
      await setViewport(cdp, 1440, 900);
      await cdp.send('Page.navigate', { url: `${baseUrl}${p.path}` });
      await sleep(1500);

      // Connect wallet if button is visible
      await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const connectBtn = btns.find(b => b.textContent && b.textContent.includes('Connect Wallet'));
          if (connectBtn) connectBtn.click();
        })()`,
      });
      await sleep(500);

      for (const vp of viewports) {
        await setViewport(cdp, vp.width, vp.height);
        await sleep(500);
        const filename = `${p.prefix}-${vp.name}.png`;
        await captureScreenshot(cdp, path.join(SCREENSHOT_DIR, filename));
      }
    }

    console.log('=== ALL BROWSER E2E SCREENSHOTS CAPTURED SUCCESSFULLY ===');
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
  console.error('Browser E2E flow error:', err);
  process.exit(1);
});
