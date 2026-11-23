import { FOLLOW_GENERIC, FOLLOW_RULES, KIN } from '../data/content';

export interface Suggestion { id: string; en: string; ko?: string }

const hasBatchim = (word: string) => {
  const c = word.charCodeAt(word.length - 1) - 0xac00;
  return c >= 0 && c <= 11171 && c % 28 !== 0;
};
export const topicParticle = (word: string) => word + (hasBatchim(word) ? '은' : '는');

// Kin words, but not "your mom" (the grandchild's own family).
const KIN_RE = new RegExp(`(?<!\\byour\\s)\\b(${Object.keys(KIN).join('|')})\\b`, 'i');

/** Up to `max` follow-up questions for the elder's answer (given in English), skipping ids already asked. */
export function followUps(answerEn: string, asked: ReadonlySet<string>, max = 3): Suggestion[] {
  const out: Suggestion[] = [];
  const push = (s: Suggestion) => {
    if (out.length < max && !asked.has(s.id) && !out.some((o) => o.id === s.id)) out.push(s);
  };
  const kin = answerEn.match(KIN_RE)?.[1]?.toLowerCase();
  if (kin) {
    const ko = KIN[kin];
    push({
      id: `fu-kin-${kin}`,
      en: `What was your ${kin} like?`,
      ko: kin === 'friend' ? '그 친구는 어떤 사람이었어요?' : `${topicParticle(ko)} 어떤 분이셨어요?`,
    });
  }
  for (const r of FOLLOW_RULES) if (r.re.test(answerEn)) push({ id: r.id, en: r.en, ko: r.ko });
  for (const g of FOLLOW_GENERIC) push(g);
  return out;
}
