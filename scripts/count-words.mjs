import fs from 'fs';
import path from 'path';

// Words counter for landing page text content
// Rules: Max 220 words on '/'

function countWordsInText(text) {
  // Strip code/tags/comments
  const cleaned = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]+\}/g, ' ')
    .replace(/[#*`_~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (!cleaned) return 0;
  return cleaned.split(' ').filter(Boolean).length;
}

const landingComponentPath = path.resolve('src/pages/Landing.tsx');
if (fs.existsSync(landingComponentPath)) {
  const content = fs.readFileSync(landingComponentPath, 'utf8');
  // Extract visible strings inside JSX
  const stringMatches = content.match(/>([^<]+)</g) || [];
  const text = stringMatches.map(m => m.slice(1, -1).trim()).filter(Boolean).join(' ');
  const wordCount = countWordsInText(text);
  console.log(`Landing page visible word count: ${wordCount} words (Limit: 220 words)`);
  if (wordCount > 220) {
    console.error(`ERROR: Word count exceeds 220 words limit!`);
    process.exit(1);
  } else {
    console.log(`PASSED: Word count is within limits.`);
  }
} else {
  console.log('Landing.tsx does not exist yet. Run this after building Landing.tsx.');
}
