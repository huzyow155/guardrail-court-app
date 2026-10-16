/**
 * Canonical Action Hash calculation for Guardrail Court V2
 *
 * Implements exact parity with `GuardrailCourtV2._compute_action_hash`:
 * `GC2|policy_id|category|recipient.lower()|asset_norm|amount|calldata_hash.lower()`
 * where `asset_norm = asset.lower() if asset.startswith("0x") else asset.upper()`
 */

export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i: number, j: number;
  let result = '';
  const words: number[] = [];
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  const utf8 = unescape(encodeURIComponent(ascii));
  const utf8Len = utf8.length;
  const wordsLength = (((utf8Len + 8) >> 6) + 1) * 16;
  for (i = 0; i < wordsLength; i++) words[i] = 0;
  for (i = 0; i < utf8Len; i++) {
    words[i >> 2] |= (utf8.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  words[utf8Len >> 2] |= 0x80 << (24 - (utf8Len % 4) * 8);
  const bitLength = utf8Len * 8;
  words[wordsLength - 1] = bitLength & 0xffffffff;
  words[wordsLength - 2] = Math.floor(bitLength / 0x100000000);

  for (j = 0; j < wordsLength; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash.slice(0);
    for (i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    for (i = 0; i < 64; i++) {
      const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1 + ch + k[i] + w[i]) | 0;
      const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;
      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export function normalizeAsset(asset: string): string {
  const trimmed = asset.trim();
  return trimmed.startsWith('0x') ? trimmed.toLowerCase() : trimmed.toUpperCase();
}

export function buildCanonicalActionString(
  policyId: string | number,
  category: string,
  recipient: string,
  asset: string,
  amount: string | number,
  calldataHash: string
): string {
  const pId = String(policyId).trim();
  const cat = String(category).trim();
  const rec = String(recipient).trim().toLowerCase();
  const ast = normalizeAsset(asset).toLowerCase();
  const amt = String(amount).trim();
  const cdh = String(calldataHash).trim().toLowerCase();
  return `GC2|${pId}|${cat}|${rec}|${ast}|${amt}|${cdh}`;
}

export function computeActionHash(
  policyId: string | number,
  category: string,
  recipient: string,
  asset: string,
  amount: string | number,
  calldataHash: string
): string {
  const canonical = buildCanonicalActionString(policyId, category, recipient, asset, amount, calldataHash);
  return sha256(canonical);
}

export function computeCalldataHash(input: string): string {
  return sha256(input.trim());
}
