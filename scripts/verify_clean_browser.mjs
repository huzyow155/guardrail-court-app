import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const CDP_PORT = 9231;
const BASE_URL = 'https://guardrail-court-app.vercel.app';

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
  const userDataDir = path.resolve('.chrome-clean-context');
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

    const routes = ['/', '/app', '/app/evidence', '/app/decision/1'];

    console.log('=== CLEAN HEADLESS BROWSER INSPECTION (PRODUCTION) ===');
    console.log(`Target: ${BASE_URL}\n`);

    for (const r of routes) {
      const url = `${BASE_URL}${r}`;
      await cdp.send('Page.navigate', { url });
      await sleep(2200);

      const titleRes = await cdp.send('Runtime.evaluate', {
        expression: 'document.title',
        returnByValue: true,
      });

      const bodyRes = await cdp.send('Runtime.evaluate', {
        expression: `
          (function() {
            const lines = document.body.innerText.split('\\n').map(l => l.trim()).filter(Boolean);
            return lines.slice(0, 3);
          })()
        `,
        returnByValue: true,
      });

      console.log(`ROUTE: ${r}`);
      console.log(`  document.title: "${titleRes.result?.value}"`);
      console.log(`  First 3 lines of document.body.innerText:`);
      const lines = bodyRes.result?.value || [];
      lines.forEach((l, i) => console.log(`    [Line ${i + 1}] ${l}`));
      console.log('');
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
