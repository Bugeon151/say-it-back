/**
 * Korean → Revised Romanization, with the sound changes a learner hears most:
 * linking (맛있어요 → ma·si·sseo·yo), nasalisation (합니다 → ham·ni·da), ㄹ-assimilation (신라 → sil·la),
 * ㅎ aspiration (좋다 → jo·ta) and silent ㅎ before a vowel (좋아요 → jo·a·yo).
 * Syllables are joined with "·" so a learner can read them one beat at a time.
 */
const INI = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const VOW = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
// Final consonant index → [sound before a consonant, carried-over initial index (or -1 for none), kept part]
// Initial indices: ㄱ0 ㄲ1 ㄴ2 ㄷ3 ㄹ5 ㅁ6 ㅂ7 ㅅ9 ㅆ10 ㅇ11 ㅈ12 ㅊ14 ㅋ15 ㅌ16 ㅍ17 ㅎ18
const FIN: [string, number, string][] = [
  ['', -1, ''], ['k', 0, ''], ['k', 1, ''], ['k', 9, 'k'], ['n', 2, ''], ['n', 12, 'n'], ['n', 18, 'n'],
  ['t', 3, ''], ['l', 5, ''], ['k', 0, 'l'], ['m', 6, 'l'], ['l', 7, 'l'], ['l', 9, 'l'], ['l', 16, 'l'],
  ['p', 17, 'l'], ['l', 18, 'l'], ['m', 6, ''], ['p', 7, ''], ['p', 9, 'p'], ['t', 9, ''], ['t', 10, ''],
  ['ng', -1, 'ng'], ['t', 12, ''], ['t', 14, ''], ['k', 15, ''], ['t', 16, ''], ['p', 17, ''], ['t', 18, ''],
];
const K_GROUP = new Set([1, 2, 3, 9, 24]);
const T_GROUP = new Set([7, 19, 20, 22, 23, 25, 27]);
const P_GROUP = new Set([17, 18, 26, 11, 14]);
const H_FINALS = new Set([6, 15, 27]); // ㄶ ㅀ ㅎ
const ASPIRATE: Record<number, number> = { 0: 15, 3: 16, 12: 14 }; // ㄱ→ㅋ ㄷ→ㅌ ㅈ→ㅊ

type Syl = { i: number; v: number; f: number } | { raw: string };

function decompose(ch: string): Syl {
  const c = ch.charCodeAt(0) - 0xac00;
  if (c < 0 || c > 11171) return { raw: ch };
  return { i: Math.floor(c / 588), v: Math.floor((c % 588) / 28), f: c % 28 };
}

// Linking overrides: ㄶ/ㅀ drop the ㅎ and carry ㄴ/ㄹ; ㅎ alone is silent.
const LINK: Record<number, [string, number]> = { 6: ['', 2], 15: ['', 5], 27: ['', -1] };
// Final + ㅎ → aspirated initial (축하 chu·ka, 생각해요 saeng·ga·kae·yo).
const H_AFTER: Record<number, number> = { 1: 15, 2: 15, 24: 15, 7: 16, 19: 16, 20: 16, 25: 16, 17: 17, 26: 17, 22: 14, 23: 14 };

function romanizeWord(word: string): string {
  const syl = Array.from(word).map(decompose);
  const out: string[] = [];
  let prevTail = '';
  for (let k = 0; k < syl.length; k++) {
    const s = syl[k];
    if ('raw' in s) { out.push(s.raw); prevTail = ''; continue; }
    const next = syl[k + 1];
    let tail = FIN[s.f][0];
    if (next && !('raw' in next) && s.f) {
      const [, carry, keep] = FIN[s.f];
      if (next.i === 11 && s.f !== 21) {
        const [lk, lc] = LINK[s.f] ?? [keep, carry];
        tail = lk;
        if (lc !== -1 && lc !== 18) next.i = lc;
        // Palatalisation before 이: ㄷ → ㅈ, ㅌ → ㅊ (굳이 gu·ji, 같이 ga·chi).
        if (next.v === 20 && (s.f === 7 || s.f === 25 || s.f === 13)) next.i = s.f === 7 ? 12 : 14;
      } else if (H_FINALS.has(s.f) && ASPIRATE[next.i] !== undefined) {
        tail = keep;
        next.i = ASPIRATE[next.i];
      } else if (next.i === 18 && H_AFTER[s.f] !== undefined) {
        tail = '';
        next.i = H_AFTER[s.f];
      } else if (next.i === 2 || next.i === 6) {
        if (K_GROUP.has(s.f)) tail = 'ng';
        else if (T_GROUP.has(s.f)) tail = 'n';
        else if (P_GROUP.has(s.f)) tail = 'm';
        if (s.f === 8 && next.i === 2) next.i = 5;
      } else if (next.i === 5 && (s.f === 4 || s.f === 8)) {
        tail = 'l';
      } else if (next.i === 5 && s.f === 21) {
        next.i = 2;
      }
    }
    const ini = s.i === 5 && prevTail.endsWith('l') ? 'l' : INI[s.i];
    out.push(ini + VOW[s.v] + tail);
    prevTail = tail;
  }
  return out.join('·').replace(/·(?=[^a-z])|(?<=[^a-z])·/g, '');
}

export function romanizeKo(text: string): string {
  return text
    .split(/(\s+)/)
    .map((w) => (/\s/.test(w) ? ' ' : romanizeWord(w)))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

export const romanize = (text: string, lang: string): string | undefined =>
  lang.startsWith('ko') ? romanizeKo(text) : undefined;
