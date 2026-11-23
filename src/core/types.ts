export type Box = 0 | 1 | 2 | 3;
/** How much help the grandchild sees: 2 = full line + pronunciation, 1 = pronunciation hint, 0 = meaning only. */
export type Support = 0 | 1 | 2;
export type Speaker = 'kid' | 'elder';

export interface Phrase {
  id: string;
  /** The phrase in the elder's language. */
  elder: string;
  /** Its meaning in the grandchild's language. */
  kid: string;
  source: 'starter' | 'her-words';
  box: Box;
  /** Session index at which it is next due. */
  due: number;
  createdSession: number;
  history: { session: number; ok: boolean }[];
  audioId?: string;
}

export interface Turn {
  id: string;
  speaker: Speaker;
  at: number;
  /** What was said, in `lang`. */
  orig: string;
  lang: string;
  /** Translation into the other person's language, if any. */
  trans?: string;
  /** Kid turns: help shown while speaking. */
  support?: Support;
  /** Kid turns: spoken in the elder's language. */
  inElderLang?: boolean;
  phraseId?: string;
  /** Kid turns: id of the question or follow-up that was asked. */
  qid?: string;
  /** Kid phrase turns: the elder's verdict. */
  ok?: boolean;
  /** Elder turns: translation was hidden (listening mode). */
  hidden?: boolean;
  /** Elder turns: kid tapped to reveal the hidden translation. */
  revealed?: boolean;
  audioId?: string;
}

export interface Session {
  id: string;
  index: number;
  startedAt: number;
  endedAt?: number;
  turns: Turn[];
}

export interface Family {
  id: string;
  kidName: string;
  elderName: string;
  kidLang: string;
  elderLang: string;
  createdAt: number;
}

export interface AppData {
  family: Family;
  sessions: Session[];
  phrases: Phrase[];
  listenMode: boolean;
  sample?: boolean;
}
