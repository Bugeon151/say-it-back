import type { Box, Phrase, Support } from './types';

/**
 * Fading schedule (Leitner boxes).
 * box 0: full help · box 1–2: pronunciation hint · box 3: meaning only, say it from memory.
 * A phrase in box k comes back 2^k sessions later. Only the first verdict in a session moves the box,
 * so a phrase cannot jump from "new" to "mastered" in one sitting.
 */
export const MAX_BOX: Box = 3;

export const supportFor = (box: Box): Support => (box === 0 ? 2 : box < MAX_BOX ? 1 : 0);
export const interval = (box: Box): number => 2 ** box;

export function grade(p: Phrase, ok: boolean, session: number): Phrase {
  const history = [...p.history, { session, ok }];
  if (p.history.some((h) => h.session === session)) return { ...p, history };
  const box = (ok ? Math.min(MAX_BOX, p.box + 1) : Math.max(0, p.box - 1)) as Box;
  return { ...p, box, due: session + interval(box), history };
}

export const gradedIn = (p: Phrase, session: number) => p.history.some((h) => h.session === session);

/** Phrases to practise in `session`: due ones first, weakest first. */
export function duePhrases(phrases: Phrase[], session: number, limit = 6): Phrase[] {
  return phrases
    .filter((p) => p.due <= session)
    .sort((a, b) => a.box - b.box || a.due - b.due || a.createdSession - b.createdSession)
    .slice(0, limit);
}

export function newPhrase(
  id: string,
  elder: string,
  kid: string,
  source: Phrase['source'],
  session: number,
): Phrase {
  return { id, elder, kid, source, box: 0, due: session, createdSession: session, history: [] };
}

/** Pronunciation hint for box 1–2: first syllable/word visible, the rest masked. */
export function hint(roman: string): string {
  return roman
    .split(' ')
    .map((w) => {
      const parts = w.split('·');
      return parts.map((s, i) => (i === 0 ? s : s.replace(/\p{L}/gu, '_'))).join('·');
    })
    .join(' ');
}
