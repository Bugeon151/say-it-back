import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppData, Family, Phrase, Session } from './core/types';
import { clearAll, loadData, saveData } from './platform/store';
import { sampleData } from './data/sample';
import { ELDER_UI } from './data/content';
import { translate } from './platform/translator';
import { uid } from './core/util';

interface Store {
  data: AppData | null;
  ready: boolean;
  update(fn: (d: AppData) => AppData): void;
  begin(family: Family, phrases: Phrase[]): void;
  openSample(): void;
  reset(): Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [ready, setReady] = useState(false);
  const own = useRef<AppData | null>(null);

  useEffect(() => {
    loadData().then((d) => {
      own.current = d;
      setData(d);
      setReady(true);
    });
  }, []);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      if (!next.sample) { own.current = next; void saveData(next); }
      return next;
    });
  }, []);

  const begin = useCallback((family: Family, phrases: Phrase[]) => {
    const d: AppData = { family, sessions: [], phrases, listenMode: false };
    own.current = d;
    void saveData(d);
    setData(d);
  }, []);

  const openSample = useCallback(() => setData(sampleData()), []);

  const reset = useCallback(async () => {
    await clearAll();
    own.current = null;
    setData(null);
  }, []);

  const value = useMemo(() => ({ data, ready, update, begin, openSample, reset }), [data, ready, update, begin, openSample, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider missing');
  return s;
}

export const activeSession = (d: AppData): Session | undefined => {
  const last = d.sessions[d.sessions.length - 1];
  return last && !last.endedAt ? last : undefined;
};
export const lastSession = (d: AppData): Session | undefined => d.sessions[d.sessions.length - 1];
export const lastEnded = (d: AppData): Session | undefined => [...d.sessions].reverse().find((s) => s.endedAt);

export function withSession(d: AppData): AppData {
  if (activeSession(d)) return d;
  const s: Session = { id: uid(), index: d.sessions.length + 1, startedAt: Date.now(), turns: [] };
  return { ...d, sessions: [...d.sessions, s] };
}

export function patchSession(d: AppData, id: string, fn: (s: Session) => Session): AppData {
  return { ...d, sessions: d.sessions.map((s) => (s.id === id ? fn(s) : s)) };
}

/** Elder-facing button text: hand-written Korean, English as is, other languages translated on the device. */
export function useElderUi(elderLang: string | undefined) {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!elderLang || elderLang === 'en' || elderLang === 'ko') return;
    let alive = true;
    Promise.all(
      Object.entries(ELDER_UI).map(async ([k, l]) => [k, await translate(l.en, 'en', elderLang)] as const),
    ).then((pairs) => {
      if (alive) setMap(Object.fromEntries(pairs.filter(([, v]) => v)) as Record<string, string>);
    });
    return () => { alive = false; };
  }, [elderLang]);
  return useCallback(
    (k: keyof typeof ELDER_UI): { text: string; lang: string } => {
      const l = ELDER_UI[k];
      if (elderLang === 'ko') return { text: l.ko, lang: 'ko' };
      if (elderLang && map[k]) return { text: map[k], lang: elderLang };
      return { text: l.en, lang: 'en' };
    },
    [elderLang, map],
  );
}
