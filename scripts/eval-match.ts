/**
 * Offline evaluation of the pronunciation check on synthetic Korean data.
 * Positives: the 12 built-in lines, reformatted or with learner-style letter slips.
 * Negatives: a different built-in line or question, or only the first half of the line.
 * Run: npx vite-node scripts/eval-match.ts  → prints a table and writes docs/eval-match.json
 */
import { writeFileSync } from 'node:fs';
import { bestScore, verdict, type Verdict } from '../src/core/match';
import { QUESTIONS, STARTERS } from '../src/data/content';

const V_SWAP: Record<number, number[]> = { 4: [8], 8: [4], 1: [5], 5: [1], 18: [13], 13: [18], 6: [12], 12: [6], 11: [10, 15], 10: [11], 15: [11], 19: [20] };
const I_SWAP: Record<number, number[]> = { 0: [1, 15], 1: [0], 15: [0], 3: [4, 16], 4: [3], 16: [3], 7: [8, 17], 8: [7], 17: [7], 12: [13, 14], 13: [12], 14: [12], 9: [10], 10: [9] };

const syl = (ch: string) => { const c = ch.charCodeAt(0) - 0xac00; return c < 0 || c > 11171 ? null : { i: Math.floor(c / 588), v: Math.floor((c % 588) / 28), f: c % 28 }; };
const make = (i: number, v: number, f: number) => String.fromCharCode(0xac00 + i * 588 + v * 28 + f);

function slips(text: string): string[] {
  const chars = Array.from(text);
  const out: string[] = [];
  chars.forEach((ch, k) => {
    const s = syl(ch);
    if (!s) return;
    for (const v of V_SWAP[s.v] ?? []) out.push([...chars.slice(0, k), make(s.i, v, s.f), ...chars.slice(k + 1)].join(''));
    for (const i of I_SWAP[s.i] ?? []) out.push([...chars.slice(0, k), make(i, s.v, s.f), ...chars.slice(k + 1)].join(''));
  });
  return out;
}

let seed = 7;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);

type Group = 'reformatted' | 'one slip' | 'two slips' | 'other line' | 'first half';
const rows: { group: Group; target: string; heard: string; v: Verdict; score: number }[] = [];
const add = (group: Group, target: string, heard: string) => {
  const score = bestScore(target, [heard], 'ko');
  rows.push({ group, target, heard, score, v: verdict(score) });
};

const others = [...STARTERS.map((s) => s.ko), ...QUESTIONS.map((q) => q.ko)];
for (const { ko } of STARTERS) {
  add('reformatted', ko, ko);
  add('reformatted', ko, ko.replace(/[.?!]/g, ''));
  add('reformatted', ko, ko.replace(/\s/g, ''));
  const one = slips(ko);
  one.forEach((h) => add('one slip', ko, h));
  for (let n = 0; n < 6 && one.length; n++) {
    const first = one[Math.floor(rand() * one.length)];
    const second = slips(first).filter((x) => x !== ko);
    if (second.length) add('two slips', ko, second[Math.floor(rand() * second.length)]);
  }
  others.filter((o) => o !== ko).forEach((o) => add('other line', ko, o));
  const sy = Array.from(ko.replace(/[.?!]/g, ''));
  if (sy.length >= 4) add('first half', ko, sy.slice(0, Math.ceil(sy.length / 2)).join(''));
}

const groups: Group[] = ['reformatted', 'one slip', 'two slips', 'other line', 'first half'];
const table = groups.map((g) => {
  const r = rows.filter((x) => x.group === g);
  const c = (v: Verdict) => r.filter((x) => x.v === v).length;
  return { group: g, n: r.length, match: c('match'), close: c('close'), miss: c('miss'), meanScore: +(r.reduce((a, x) => a + x.score, 0) / r.length).toFixed(3) };
});
console.table(table);
// Ablation: the same pairs compared syllable by syllable instead of letter (jamo) by letter.
const ablation = groups.map((g) => {
  const r = rows.filter((x) => x.group === g);
  const m = r.filter((x) => verdict(bestScore(x.target, [x.heard], 'syllables')) === 'match').length;
  return { group: g, n: r.length, matchJamo: r.filter((x) => x.v === 'match').length, matchSyllable: m };
});
console.table(ablation);
const pos = rows.filter((r) => r.group === 'reformatted' || r.group === 'one slip');
const neg = rows.filter((r) => r.group === 'other line');
const summary = {
  note: 'Synthetic text pairs, not recordings. Measures the scoring function only, not speech recognition accuracy.',
  thresholds: { match: 0.8, close: 0.6 },
  acceptReformattedOrOneSlip: +(pos.filter((r) => r.v === 'match').length / pos.length).toFixed(4),
  falseMatchOtherLine: +(neg.filter((r) => r.v === 'match').length / neg.length).toFixed(4),
  table,
  ablationSyllableLevel: ablation,
};
console.log(JSON.stringify(summary, null, 2));
writeFileSync(new URL('../docs/eval-match.json', import.meta.url), JSON.stringify(summary, null, 2) + '\n');
