/**
 * Pure functions for text animation:
 * - Word-mask delay scheduling (40-60ms per word)
 * - Deterministic fixed-width scramble for numbers, addresses, and hashes (zero CLS)
 * - Real elapsed seconds calculation for transaction timers
 */

export interface WordDelayItem {
  word: string;
  index: number;
  delayMs: number;
}

const SCRAMBLE_HEX_CHARS = '0123456789ABCDEF';
const SCRAMBLE_DIGIT_CHARS = '0123456789';

/**
 * Splits a heading into words and assigns a 40-60ms stagger delay per word.
 * Returns 0ms delays when reducedMotion is true.
 */
export function computeWordMaskDelays(
  text: string,
  stepMs: number = 48,
  reducedMotion: boolean = false
): WordDelayItem[] {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const clampedStep = Math.max(40, Math.min(60, stepMs));

  return words.map((word, index) => ({
    word,
    index,
    delayMs: reducedMotion ? 0 : index * clampedStep,
  }));
}

/**
 * Deterministic scramble step for addresses, hashes, and numbers.
 * Preserves exact character count and punctuation ('0x', '.', '%', 's', ' ') so layout never shifts (CLS = 0).
 * Always returns the exact target string when progress >= 1 or reducedMotion is true.
 */
export function scrambleStep(
  target: string,
  progress: number,
  seed: number = 61999,
  reducedMotion: boolean = false
): string {
  if (!target) return '';
  if (reducedMotion || progress >= 1) return target;
  const clamped = Math.max(0, Math.min(1, progress));
  const resolvedCount = Math.floor(clamped * target.length);
  const stepIndex = Math.floor(clamped * 24);

  let out = '';
  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    // Preserve '0x' prefix, punctuation, and already-resolved prefix
    if (
      i < resolvedCount ||
      (i < 2 && target.startsWith('0x')) ||
      ch === '.' ||
      ch === ':' ||
      ch === '-' ||
      ch === ' ' ||
      ch === 's' ||
      ch === '%' ||
      ch === '#'
    ) {
      out += ch;
      continue;
    }

    const isDigitOnly = ch >= '0' && ch <= '9';
    const pool = isDigitOnly ? SCRAMBLE_DIGIT_CHARS : SCRAMBLE_HEX_CHARS;
    const hash = Math.abs(Math.imul(i + 1, 2654435761) ^ Math.imul(stepIndex + 1, 1597334677) ^ seed);
    out += pool[hash % pool.length];
  }
  return out;
}

/**
 * Computes real elapsed seconds from start timestamp to current timestamp.
 */
export function computeElapsedSeconds(startTimeMs: number, nowMs: number): number {
  if (nowMs <= startTimeMs) return 0;
  return Number(((nowMs - startTimeMs) / 1000).toFixed(1));
}
