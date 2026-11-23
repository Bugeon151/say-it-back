import { bestScore, levenshtein, normalize, similarity, verdict } from './match';
import { duePhrases, grade, hint, newPhrase, supportFor } from './fade';
import { romanizeKo } from './romanize';
import { boxCounts, sessionMetrics } from './metrics';
import { followUps, topicParticle } from './followup';
import { herWords } from './candidates';
import type { Session, Turn } from './types';

describe('match', () => {
  it('splits Korean into jamo so one wrong letter costs less than a syllable', () => {
    expect(normalize('고마워요', 'ko').length).toBe(8);
    const nearMiss = similarity('고마워요', '고마어요', 'ko'); // ㅝ → ㅓ
    expect(nearMiss).toBeGreaterThan(0.8);
    expect(similarity('고마워요', '고마워요', 'ko')).toBe(1);
  });
  it('ignores punctuation, spaces and case', () => {
    expect(similarity('더 얘기해 주세요.', '더 얘기해주세요', 'ko')).toBe(1);
    expect(similarity('Tell me more.', 'tell me MORE', 'en')).toBe(1);
  });
  it('accepts extra words around the phrase but not a long unrelated ramble', () => {
    expect(similarity('사랑해요', '할머니 사랑해요', 'ko')).toBe(1);
    expect(similarity('사랑해요', '오늘 날씨가 정말 좋아서 공원에 갔는데 사람이 많았어요 사랑해요', 'ko')).toBeLessThan(0.8);
  });
  it('rejects a different phrase', () => {
    expect(verdict(similarity('정말요?', '알겠어요', 'ko'))).toBe('miss');
    expect(verdict(similarity('Really?', 'I understand', 'en'))).toBe('miss');
  });
  it('takes the best recognition alternative and handles empty input', () => {
    expect(bestScore('정말요', ['절말요', '정말요'], 'ko')).toBe(1);
    expect(bestScore('정말요', [], 'ko')).toBe(0);
    expect(similarity('', '정말요', 'ko')).toBe(0);
    expect(levenshtein([], ['a'])).toBe(1);
  });
  it('maps scores to verdicts at the thresholds', () => {
    expect(verdict(0.8)).toBe('match');
    expect(verdict(0.79)).toBe('close');
    expect(verdict(0.6)).toBe('close');
    expect(verdict(0.59)).toBe('miss');
  });
});

describe('fade', () => {
  const p0 = newPhrase('p', '정말요?', 'Really?', 'starter', 1);
  it('starts new phrases with full help, due now', () => {
    expect(p0.box).toBe(0);
    expect(p0.due).toBe(1);
    expect(supportFor(0)).toBe(2);
    expect(supportFor(1)).toBe(1);
    expect(supportFor(2)).toBe(1);
    expect(supportFor(3)).toBe(0);
  });
  it('moves up on success, down on failure, and spaces reviews by 2^box sessions', () => {
    const p1 = grade(p0, true, 1);
    expect([p1.box, p1.due]).toEqual([1, 3]);
    const p2 = grade(p1, true, 3);
    expect([p2.box, p2.due]).toEqual([2, 7]);
    const p3 = grade(p2, false, 7);
    expect([p3.box, p3.due]).toEqual([1, 9]);
    expect(grade(p0, false, 1).box).toBe(0);
  });
  it('caps at box 3 and lets only the first verdict of a session move the box', () => {
    let p = p0;
    p = grade(p, true, 1);
    p = grade(p, true, 1);
    p = grade(p, true, 1);
    expect(p.box).toBe(1);
    expect(p.history).toHaveLength(3);
    p = grade(grade(grade(p, true, 3), true, 7), true, 15);
    expect(p.box).toBe(3);
  });
  it('returns due phrases weakest first, within the limit', () => {
    const a = { ...newPhrase('a', 'a', 'a', 'starter', 1), box: 2 as const, due: 2 };
    const b = { ...newPhrase('b', 'b', 'b', 'starter', 1), box: 0 as const, due: 2 };
    const c = { ...newPhrase('c', 'c', 'c', 'starter', 1), box: 1 as const, due: 9 };
    expect(duePhrases([a, b, c], 2).map((p) => p.id)).toEqual(['b', 'a']);
    expect(duePhrases([a, b, c], 2, 1).map((p) => p.id)).toEqual(['b']);
  });
  it('masks all but the first syllable of each word for a hint', () => {
    expect(hint('jeong·mal·yo')).toBe('jeong·___·__');
    expect(hint('deo yae·gi·hae')).toBe('deo yae·__·___');
    expect(hint('ju·se·yo.')).toBe('ju·__·__.');
  });
});

describe('romanizeKo', () => {
  const cases: [string, string][] = [
    ['안녕하세요', 'an·nyeong·ha·se·yo'],
    ['할머니', 'hal·meo·ni'],
    ['사랑해요', 'sa·rang·hae·yo'],
    ['고마워요', 'go·ma·wo·yo'],
    ['감사합니다', 'gam·sa·ham·ni·da'],
    ['맛있어요', 'ma·si·sseo·yo'],
    ['좋아요', 'jo·a·yo'],
    ['좋다', 'jo·ta'],
    ['많아요', 'ma·na·yo'],
    ['읽어요', 'il·geo·yo'],
    ['없어요', 'eop·seo·yo'],
    ['국물', 'gung·mul'],
    ['신라', 'sil·la'],
    ['설날', 'seol·lal'],
    ['종로', 'jong·no'],
    ['축하해요', 'chu·ka·hae·yo'],
    ['같이', 'ga·chi'],
    ['굳이', 'gu·ji'],
    ['다음에 같이 담그자.', 'da·eu·me ga·chi dam·geu·ja.'],
    ['정말요?', 'jeong·ma·ryo?'],
    ['더 얘기해 주세요.', 'deo yae·gi·hae ju·se·yo.'],
  ];
  it.each(cases)('%s → %s', (ko, rr) => expect(romanizeKo(ko)).toBe(rr));
  it('leaves non-Hangul untouched', () => expect(romanizeKo('LA 1988')).toBe('LA 1988'));
});

describe('metrics', () => {
  const t = (x: Partial<Turn>): Turn => ({ id: Math.random().toString(), speaker: 'kid', at: 0, orig: '', lang: 'ko', ...x });
  const s: Session = {
    id: 's', index: 2, startedAt: 0,
    turns: [
      t({ support: 2, inElderLang: true, ok: true }),
      t({ support: 1, inElderLang: true, ok: true }),
      t({ support: 0, inElderLang: true, ok: false }),
      t({ support: 0, inElderLang: true, ok: true }),
      t({ speaker: 'elder', hidden: true }),
      t({ speaker: 'elder', hidden: true, revealed: true }),
      t({ speaker: 'elder' }),
    ],
  };
  it('counts only confirmed, unscaffolded kid turns as direct speech', () => {
    const m = sessionMetrics(s);
    expect([m.kidTurns, m.direct, m.dsr]).toEqual([4, 2, 0.5]);
  });
  it('counts elder turns understood without revealing the translation', () => {
    expect(sessionMetrics(s).lir).toBeCloseTo(1 / 3);
  });
  it('returns zero ratios for an empty session', () => {
    const m = sessionMetrics({ id: 'e', index: 1, startedAt: 0, turns: [] });
    expect([m.dsr, m.lir]).toEqual([0, 0]);
  });
  it('counts phrases per box', () => {
    const p = (box: 0 | 1 | 2 | 3) => ({ ...newPhraseStub(), box });
    expect(boxCounts([p(0), p(3), p(3)])).toEqual([1, 0, 0, 2]);
  });
});
function newPhraseStub() { return newPhrase('x', 'x', 'x', 'starter', 1); }

describe('followUps', () => {
  it('asks about a family member the elder mentioned, with the right Korean particle', () => {
    const s = followUps('My mother made kimchi every winter.', new Set());
    expect(s[0]).toMatchObject({ en: 'What was your mother like?', ko: '어머니는 어떤 분이셨어요?' });
    expect(s.map((x) => x.id)).toContain('fu-food');
  });
  it('does not ask about the grandchild’s own parent', () => {
    const s = followUps('I came here so your mom could study.', new Set());
    expect(s.map((x) => x.id)).not.toContain('fu-kin-mom');
    expect(s[0].id).toBe('fu-move');
  });
  it('skips questions already asked and falls back to generic ones', () => {
    const s = followUps('Hmm.', new Set(['st4']));
    expect(s.map((x) => x.id)).toEqual(['fu-who', 'st5']);
  });
  it('picks 은 or 는 from the last syllable', () => {
    expect(topicParticle('선생님')).toBe('선생님은');
    expect(topicParticle('아버지')).toBe('아버지는');
  });
});

describe('herWords', () => {
  it('extracts short Korean sentences without numbers, shortest first', () => {
    const w = herWords('그럼, 다음에 같이 담그자. 1988년에 LA에 왔어. 천천히 해도 돼!', 'ko');
    expect(w).toEqual(['천천히 해도 돼!', '그럼, 다음에 같이 담그자.']);
  });
  it('uses word counts for space-separated languages', () => {
    const w = herWords('Ven aquí. Te voy a contar una historia muy larga sobre mi pueblo y mi familia.', 'es');
    expect(w).toEqual(['Ven aquí.']);
  });
});
