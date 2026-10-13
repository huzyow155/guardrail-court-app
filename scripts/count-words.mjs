import fs from 'fs';
import path from 'path';

// Words counter for landing page text content
// Rules: Comprehensive 6-section editorial narrative (250 to 1200 visible words on '/')

export function extractVisibleWordsFromTsx(content) {
  const stringMatches = content.match(/>([^<]+)</g) || [];
  const propTextMatches = content.match(/\btext="([^"]+)"/g) || [];

  const jsxText = stringMatches
    .map((m) => m.slice(1, -1).trim())
    .filter(Boolean)
    .join(' ');

  const propText = propTextMatches
    .map((m) => m.replace(/^text="/, '').replace(/"$/, '').trim())
    .filter(Boolean)
    .join(' ');

  const cleaned = `${jsxText} ${propText}`
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]+\}/g, ' ')
    .replace(/[#*`_~•→–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return [];
  return cleaned.split(' ').filter(Boolean);
}

const MIN_WORDS = 250;
const MAX_WORDS = 1200;
const landingComponentPath = path.resolve('src/pages/Landing.tsx');

if (process.argv[1] && process.argv[1].endsWith('count-words.mjs')) {
  if (fs.existsSync(landingComponentPath)) {
    const content = fs.readFileSync(landingComponentPath, 'utf8');
    const words = extractVisibleWordsFromTsx(content);
    const wordCount = words.length;
    console.log(`Landing page visible word count: ${wordCount} words (Range: ${MIN_WORDS}–${MAX_WORDS} words)`);
    if (wordCount < MIN_WORDS || wordCount > MAX_WORDS) {
      console.error(`ERROR: Word count (${wordCount}) outside ${MIN_WORDS}–${MAX_WORDS} words range!`);
      process.exit(1);
    } else {
      console.log(`PASSED: Word count (${wordCount} in ${MIN_WORDS}..${MAX_WORDS}) is within editorial bounds.`);
    }
  } else {
    console.error('Landing.tsx does not exist.');
    process.exit(1);
  }
}
