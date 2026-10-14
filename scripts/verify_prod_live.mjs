import fs from 'fs';

async function verify() {
  const res = await fetch('https://guardrail-court-app.vercel.app', { cache: 'no-store' });
  const html = await res.text();

  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const scriptMatch = html.match(/src="(\/assets\/[^"]+\.js)"/);
  const cssMatch = html.match(/href="(\/assets\/[^"]+\.css)"/);

  const title = titleMatch ? titleMatch[1] : 'NOT FOUND';
  const prodScript = scriptMatch ? scriptMatch[1] : 'NOT FOUND';
  const prodCss = cssMatch ? cssMatch[1] : 'NOT FOUND';

  const distHtml = fs.readFileSync('dist/index.html', 'utf8');
  const distScriptMatch = distHtml.match(/src="(\/assets\/[^"]+\.js)"/);
  const distCssMatch = distHtml.match(/href="(\/assets\/[^"]+\.css)"/);

  const distScript = distScriptMatch ? distScriptMatch[1] : 'NOT FOUND';
  const distCss = distCssMatch ? distCssMatch[1] : 'NOT FOUND';

  console.log('=== PRODUCTION LIVE DEPLOYMENT VERIFICATION ===');
  console.log('Production URL       :', 'https://guardrail-court-app.vercel.app');
  console.log('Live <title>         :', title);
  console.log('Production JS Chunk  :', prodScript);
  console.log('Local dist/ JS Chunk :', distScript);
  console.log('Production CSS Chunk :', prodCss);
  console.log('Local dist/ CSS Chunk:', distCss);
  console.log('JS Chunk Matches     :', prodScript === distScript);
  console.log('CSS Chunk Matches    :', prodCss === distCss);

  if (title.includes('Guardrail Court') && prodScript === distScript) {
    console.log('STATUS: VERIFIED MATCHING PRODUCTION BUILD');
  } else {
    console.error('ERROR: Production does not match latest build!');
    process.exit(1);
  }
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
