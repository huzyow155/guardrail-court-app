import { spawn, execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PREVIEW_PORT = 4174;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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
  let baseUrl = 'https://guardrail-court-app.vercel.app';
  let previewProc = null;

  if (!isProd) {
    const viteBin = path.resolve('node_modules/vite/bin/vite.js');
    previewProc = spawn(
      process.execPath,
      [viteBin, 'preview', '--port', String(PREVIEW_PORT), '--host', '127.0.0.1'],
      { stdio: 'pipe' }
    );
    baseUrl = `http://127.0.0.1:${PREVIEW_PORT}`;
  }

  try {
    await waitForServer(baseUrl);

    const routes = ['/', '/app'];
    const summary = [];

    for (const r of routes) {
      const outPath = path.resolve(`.lh-${r === '/' ? 'landing' : 'app'}.json`);
      const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      execFileSync(
        npxCmd,
        [
          '--yes',
          'lighthouse',
          `${baseUrl}${r}`,
          '--only-categories=performance,accessibility,best-practices',
          '--preset=desktop',
          `--chrome-path=${CHROME_PATH}`,
          '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
          '--output=json',
          `--output-path=${outPath}`,
          '--quiet',
        ],
        { stdio: 'inherit', shell: true }
      );

      const report = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      const perf = Math.round((report.categories.performance?.score ?? 0) * 100);
      const a11y = Math.round((report.categories.accessibility?.score ?? 0) * 100);
      const bpCategory = report.categories['best-practices'];
      const bp = Math.round((bpCategory?.score ?? 0) * 100);
      const cls = Number((report.audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(4));
      const fcpMs = Math.round(report.audits['first-contentful-paint']?.numericValue ?? 0);
      const lcpMs = Math.round(report.audits['largest-contentful-paint']?.numericValue ?? 0);
      const tbtMs = Math.round(report.audits['total-blocking-time']?.numericValue ?? 0);

      const failingBpAudits = [];
      if (bpCategory?.auditRefs) {
        for (const ref of bpCategory.auditRefs) {
          const audit = report.audits[ref.id];
          if (audit && audit.score !== null && audit.score < 1) {
            failingBpAudits.push({ id: ref.id, title: audit.title, score: audit.score, explanation: audit.explanation || audit.description });
          }
        }
      }

      const layoutShiftElements = (report.audits['layout-shift-elements']?.details?.items || []).map(item => ({
        node: item.node?.snippet || item.node?.selector,
        score: item.score,
      }));

      summary.push({
        route: r,
        target: isProd ? 'PRODUCTION' : 'LOCAL',
        performance: perf,
        accessibility: a11y,
        bestPractices: bp,
        cls,
        fcpMs,
        lcpMs,
        tbtMs,
        layoutShiftElements,
        failingBpAudits,
      });

      try {
        fs.unlinkSync(outPath);
      } catch {}
    }

    console.log(`=== LIGHTHOUSE AUDIT (${isProd ? 'PRODUCTION' : 'LOCAL'}) ===`);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    try {
      previewProc?.kill();
    } catch {}
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
