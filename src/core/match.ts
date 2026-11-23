/**
 * Pronunciation check: compares what speech recognition heard with the target phrase.
 * Korean is compared at the jamo level (NFD splits each syllable into its consonant/vowel letters),
 * so one wrong letter costs a fraction of a syllable instead of a whole syllable.
 */
export type Verdict = 'match' | 'close' | 'miss';
export const MATCH_AT = 0.8;
export const CLOSE_AT = 0.6;

export function normalize(text: string, lang: string): string[] {
  const base = text.normalize('NFC').toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, '');
  const s = lang.startsWith('ko') ? base.normalize('NFD') : base;
  return Array.from(s);
}

export function levenshtein(a: string[], b: string[]): number {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Edit distance of `target` against its best-matching substring of `heard` (extra words around it are free). */
export function infixDistance(target: string[], heard: string[]): number {
  let prev = new Array(heard.length + 1).fill(0);
  for (let i = 1; i <= target.length; i++) {
    const cur = [i];
    for (let j = 1; j <= heard.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (target[i - 1] === heard[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return Math.min(...prev);
}

export function similarity(target: string, heard: string, lang: string): number {
  const t = normalize(target, lang);
  const h = normalize(heard, lang);
  if (!t.length || !h.length) return 0;
  const whole = 1 - levenshtein(t, h) / Math.max(t.length, h.length);
  // Allow extra words ("Halmoni, thank you") but not a long ramble that happens to contain the phrase.
  const inner = h.length <= t.length * 3 ? 1 - infixDistance(t, h) / t.length : 0;
  return Math.max(0, whole, inner);
}

export function bestScore(target: string, heard: string[], lang: string): number {
  return heard.reduce((m, h) => Math.max(m, similarity(target, h, lang)), 0);
}

export function verdict(score: number): Verdict {
  return score >= MATCH_AT ? 'match' : score >= CLOSE_AT ? 'close' : 'miss';
}
