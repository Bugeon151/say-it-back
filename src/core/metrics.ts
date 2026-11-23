import type { Phrase, Session } from './types';

export interface SessionMetrics {
  index: number;
  kidTurns: number;
  elderTurns: number;
  direct: number;
  /** Direct Speech Ratio: kid turns said in the elder's language without the full line on screen, and confirmed by the elder. */
  dsr: number;
  /** Listening Independence Ratio: elder turns understood without looking at the translation. */
  lir: number;
}

const ratio = (a: number, b: number) => (b ? a / b : 0);

export function sessionMetrics(s: Session): SessionMetrics {
  const kid = s.turns.filter((t) => t.speaker === 'kid');
  const elder = s.turns.filter((t) => t.speaker === 'elder');
  const direct = kid.filter((t) => t.inElderLang && t.support !== undefined && t.support < 2 && t.ok === true).length;
  const understood = elder.filter((t) => t.hidden && !t.revealed).length;
  return {
    index: s.index,
    kidTurns: kid.length,
    elderTurns: elder.length,
    direct,
    dsr: ratio(direct, kid.length),
    lir: ratio(understood, elder.length),
  };
}

export const seriesMetrics = (sessions: Session[]) => sessions.map(sessionMetrics);

export function boxCounts(phrases: Phrase[]): [number, number, number, number] {
  const c: [number, number, number, number] = [0, 0, 0, 0];
  for (const p of phrases) c[p.box]++;
  return c;
}

export const pct = (x: number) => `${Math.round(x * 100)}%`;
