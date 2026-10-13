import fs from 'fs';
import path from 'path';

/**
 * Extracts visible words from a TSX file content.
 * Includes:
 * - JSX text nodes (>text<)
 * - Display attributes: alt="...", title="...", placeholder="...", aria-label="..."
 * - String literals passed to common display props: text="...", label="..."
 */
export function extractVisibleWordsFromTsx(content) {
  // Strip comments
  const withoutComments = content
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*/g, ' ');

  // Matches text inside JSX elements: >some text<
  const textMatches = withoutComments.match(/>([^<]+)</g) || [];
  const jsxTexts = textMatches.map((m) => {
    let t = m.slice(1, -1).trim();
    // Remove inline JS expressions { ... }
    t = t.replace(/\{[^}]+\}/g, ' ');
    return t;
  });

  // Matches display attributes
  const attrMatches =
    withoutComments.match(/\b(alt|title|placeholder|aria-label|text|label)="([^"]+)"/g) || [];
  const attrTexts = attrMatches.map((m) => {
    return m.replace(/^[a-z-]+="([^"]+)"$/, '$1').trim();
  });

  const rawCombined = [...jsxTexts, ...attrTexts]
    .join(' ')
    .replace(/[#*`_~•→–—\(\)\[\]\{\}:;,."']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!rawCombined) return [];

  // Split into words, filtering out pure numbers or code artifacts
  return rawCombined
    .split(' ')
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && !/^[\d\.\+x\-]+$/.test(w));
}

/**
 * Extracts static narrative/descriptive words from /app pages
 * excluding interactive field labels, buttons, and code IDs.
 */
export function extractStaticDescriptiveWordsFromApp(content) {
  const withoutComments = content
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*/g, ' ');

  // Extract HTML paragraphs <p>...</p> and explanatory callouts (avoid matching TS generic types like <PolicyRecord>)
  const pMatches = withoutComments.match(/<p(?:\s+[^>]*|>)([\s\S]*?)<\/p>/gi) || [];
  const noteMatches = withoutComments.match(/<(?:span|div)[^>]*class(?:Name)?="[^"]*(?:note|desc|explain|subtitle)[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div)>/gi) || [];

  const combined = [...pMatches, ...noteMatches]
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]+\}/g, ' ')
    .replace(/[#*`_~•→–—\(\)\[\]\{\}:;,."']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!combined) return [];
  return combined
    .split(' ')
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && !/^[\d\.\+x\-]+$/.test(w));
}

export const LANDING_MAX_WORDS = 160;
export const APP_MAX_STATIC_WORDS = 40;

export function auditWordCounts() {
  const landingPath = path.resolve('src/pages/Landing.tsx');
  if (!fs.existsSync(landingPath)) {
    throw new Error('Landing.tsx does not exist.');
  }

  const landingContent = fs.readFileSync(landingPath, 'utf8');
  const landingWords = extractVisibleWordsFromTsx(landingContent);
  const landingWordCount = landingWords.length;

  const appFiles = [
    { name: 'CourtExplorer (/app)', file: 'src/pages/CourtExplorer.tsx' },
    { name: 'Desk (/app/desk)', file: 'src/pages/Desk.tsx' },
    { name: 'CreatePolicy (/app/new)', file: 'src/pages/CreatePolicy.tsx' },
    { name: 'DecisionDetail (/app/decision/:id)', file: 'src/pages/DecisionDetail.tsx' },
    { name: 'Evidence (/app/evidence)', file: 'src/pages/Evidence.tsx' },
  ];

  const appResults = appFiles.map((item) => {
    const fullPath = path.resolve(item.file);
    if (!fs.existsSync(fullPath)) {
      return { ...item, count: 0, pass: true };
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    const words = extractStaticDescriptiveWordsFromApp(content);
    return {
      ...item,
      count: words.length,
      pass: words.length <= APP_MAX_STATIC_WORDS,
      words,
    };
  });

  return {
    landing: {
      count: landingWordCount,
      pass: landingWordCount <= LANDING_MAX_WORDS,
      words: landingWords,
    },
    app: appResults,
  };
}

if (process.argv[1] && process.argv[1].endsWith('count-words.mjs')) {
  console.log('=== WORD COUNT STRICT AUDIT ===');
  const results = auditWordCounts();

  console.log(`Landing Page (src/pages/Landing.tsx):`);
  console.log(`  Visible Word Count: ${results.landing.count} / ${LANDING_MAX_WORDS} max words`);
  console.log(`  Status: ${results.landing.pass ? 'PASS' : 'FAIL'}`);

  let allPass = results.landing.pass;

  console.log('\nApp Pages (/app static descriptive word budget <= 40):');
  for (const item of results.app) {
    console.log(`  ${item.name.padEnd(38)}: ${item.count} words (max ${APP_MAX_STATIC_WORDS}) -> ${item.pass ? 'PASS' : 'FAIL'}`);
    if (!item.pass) allPass = false;
  }

  console.log('-'.repeat(60));
  if (!allPass) {
    console.error('ERROR: Word count budget exceeded!');
    process.exit(1);
  } else {
    console.log('PASSED: All landing and app pages comply with strict word budgets.');
  }
}
