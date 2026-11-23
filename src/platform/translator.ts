/**
 * Translation: hand-written English↔Korean lines first, then Chrome's on-device Translator API.
 * Nothing is sent to a server for translation. Returns null when no translation is possible.
 */
import { ELDER_UI, FOLLOW_GENERIC, FOLLOW_RULES, QUESTIONS, STARTERS, type Line } from '../data/content';

export type Availability = 'unavailable' | 'downloadable' | 'downloading' | 'available';
export type PairState = Availability | 'unsupported';

interface TranslatorInstance { translate(text: string): Promise<string>; destroy?(): void }
interface Monitor extends EventTarget {}
interface TranslatorStatic {
  availability(o: { sourceLanguage: string; targetLanguage: string }): Promise<Availability>;
  create(o: { sourceLanguage: string; targetLanguage: string; monitor?: (m: Monitor) => void }): Promise<TranslatorInstance>;
}
declare global { interface Window { Translator?: TranslatorStatic } }

const key = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
const curated = new Map<string, string>();
const lines: Line[] = [...QUESTIONS, ...STARTERS, ...FOLLOW_GENERIC, ...FOLLOW_RULES, ...Object.values(ELDER_UI)];
for (const l of lines) {
  curated.set(`en>ko:${key(l.en)}`, l.ko);
  curated.set(`ko>en:${key(l.ko)}`, l.en);
}

const cache = new Map<string, string>();
const instances = new Map<string, Promise<TranslatorInstance>>();

export const apiPresent = () => typeof window !== 'undefined' && !!window.Translator;

export async function pairState(from: string, to: string): Promise<PairState> {
  if (from === to) return 'available';
  if (!apiPresent()) return 'unsupported';
  try {
    return await window.Translator!.availability({ sourceLanguage: from, targetLanguage: to });
  } catch {
    return 'unavailable';
  }
}

/** Creates (and if needed downloads) the model. Call from a click when the state is "downloadable". */
export function prepare(from: string, to: string, onProgress?: (fraction: number) => void): Promise<boolean> {
  if (from === to) return Promise.resolve(true);
  if (!apiPresent()) return Promise.resolve(false);
  const k = `${from}>${to}`;
  if (!instances.has(k)) {
    const p = window.Translator!.create({
      sourceLanguage: from,
      targetLanguage: to,
      monitor: (m) => m.addEventListener('downloadprogress', (e) => onProgress?.((e as unknown as { loaded: number }).loaded)),
    });
    instances.set(k, p);
    p.catch(() => instances.delete(k));
  }
  return instances.get(k)!.then(() => true, () => false);
}

export function curatedTranslation(text: string, from: string, to: string): string | undefined {
  return curated.get(`${from}>${to}:${key(text)}`);
}

export async function translate(text: string, from: string, to: string): Promise<string | null> {
  if (!text.trim()) return '';
  if (from === to) return text;
  const fixed = curatedTranslation(text, from, to);
  if (fixed) return fixed;
  const ck = `${from}>${to}:${text}`;
  if (cache.has(ck)) return cache.get(ck)!;
  const k = `${from}>${to}`;
  if (!instances.has(k)) {
    if ((await pairState(from, to)) !== 'available') return null;
    if (!(await prepare(from, to))) return null;
  }
  try {
    const out = await (await instances.get(k)!).translate(text);
    cache.set(ck, out);
    return out;
  } catch {
    return null;
  }
}
