import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { langOf, isRtl } from '../data/languages';
import { romanize } from '../core/romanize';
import { speak } from '../platform/speech';
import { audioUrl } from '../platform/store';
import { translate } from '../platform/translator';
import type { Line } from '../data/content';
import type { SessionMetrics } from '../core/metrics';

type Variant = 'primary' | 'kid' | 'elder' | 'ghost' | 'quiet' | 'danger';
export function Btn({ variant = 'primary', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={`btn btn-${variant} ${className}`} {...p} />;
}

export const go = (path: string) => { window.location.hash = path; };

/** Text in the elder's language: large, with its own lang/dir, plus romanisation for Korean. */
export function ElderLine({ text, lang, size = 'l', roman = true, className = '' }: { text: string; lang: string; size?: 's' | 'm' | 'l' | 'xl'; roman?: boolean; className?: string }) {
  const r = roman ? romanize(text, lang) : undefined;
  return (
    <div className={`elder-line size-${size} ${className}`}>
      <p lang={lang} dir={isRtl(lang) ? 'rtl' : 'ltr'} className="elder-text">{text}</p>
      {r && <p className="roman" aria-label="Pronunciation">{r}</p>}
    </div>
  );
}

export function Play({ text, lang, audioId, label = 'Play' }: { text?: string; lang: string; audioId?: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const run = async () => {
    setBusy(true);
    try {
      const url = audioId ? await audioUrl(audioId) : null;
      if (url) {
        audio.current?.pause();
        audio.current = new Audio(url);
        await new Promise<void>((done) => {
          audio.current!.onended = audio.current!.onerror = () => done();
          audio.current!.play().catch(() => done());
        });
      } else if (text) await speak(text, langOf(lang).speech);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" className="play" onClick={run} disabled={busy} aria-label={`${label}${audioId ? ' (recorded voice)' : ''}`}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        {busy ? <rect x="7" y="6" width="10" height="12" rx="1" fill="currentColor" /> : <path d="M8 5v14l11-7z" fill="currentColor" />}
      </svg>
      <span>{audioId ? 'Recorded voice' : label}</span>
    </button>
  );
}

export function useLine(line: Line | null, lang: string): string | null | undefined {
  const [v, setV] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    if (!line) return setV(null);
    let alive = true;
    lineIn(line, lang).then((x) => alive && setV(x));
    return () => { alive = false; };
  }, [line, lang]);
  return v;
}

export async function lineIn(l: Pick<Line, 'en' | 'ko'>, lang: string): Promise<string | null> {
  if (lang === 'en') return l.en;
  if (lang === 'ko') return l.ko;
  return translate(l.en, 'en', lang);
}

export function Bars({ data, field, label }: { data: SessionMetrics[]; field: 'dsr' | 'lir'; label: string }) {
  const max = 1;
  return (
    <figure className="bars" aria-label={label}>
      <figcaption>{label}</figcaption>
      <div className="bars-row">
        {data.map((m) => (
          <div className="bar" key={m.index}>
            <span className="bar-val">{Math.round(m[field] * 100)}%</span>
            <span className={`bar-fill ${field}`} style={{ height: `${Math.max(2, (m[field] / max) * 100)}%` }} />
            <span className="bar-x">Talk {m.index}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn'; children: ReactNode }) {
  return <div className={`notice notice-${tone}`} role={tone === 'warn' ? 'alert' : 'status'}>{children}</div>;
}

export function ScoreMeter({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const word = score >= 0.8 ? 'Sounds right' : score >= 0.6 ? 'Close' : 'Not quite';
  return (
    <div className="meter" aria-label={`Match ${pct}%`}>
      <div className="meter-track"><div className={`meter-fill ${score >= 0.8 ? 'ok' : score >= 0.6 ? 'mid' : 'low'}`} style={{ width: `${pct}%` }} /></div>
      <span>{word} ({pct}% match)</span>
    </div>
  );
}
