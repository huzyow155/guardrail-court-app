import { describe, it, expect } from 'vitest';
import { auditWordCounts, LANDING_MAX_WORDS, APP_MAX_STATIC_WORDS } from '../../scripts/count-words.mjs';

describe('Strict Word Budget Verification', () => {
  it(`landing page visible word count is strictly <= ${LANDING_MAX_WORDS} words`, () => {
    const results = auditWordCounts();
    expect(results.landing.count).toBeLessThanOrEqual(LANDING_MAX_WORDS);
    expect(results.landing.pass).toBe(true);
  });

  it(`all /app pages contain <= ${APP_MAX_STATIC_WORDS} static descriptive words each`, () => {
    const results = auditWordCounts();
    for (const appPage of results.app) {
      expect(appPage.count, `${appPage.name} had ${appPage.count} static words > ${APP_MAX_STATIC_WORDS}`).toBeLessThanOrEqual(APP_MAX_STATIC_WORDS);
      expect(appPage.pass).toBe(true);
    }
  });
});
