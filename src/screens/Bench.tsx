import { useState } from 'react';
import { sampleData } from '../data/sample';
import { QUESTIONS } from '../data/content';
import { apiPresent } from '../platform/translator';
import { Btn, Notice } from '../ui/kit';

interface Row { dir: string; src: string; out: string; ms: number }
const q = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))] ?? 0; };

/** Measures Chrome's on-device translation on this computer (bypasses the built-in phrase list). */
export default function Bench() {
  const [rows, setRows] = useState<Row[]>([]);
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const run = async () => {
    setState('running');
    setRows([]);
    try {
      const T = window.Translator!;
      const koEn = await T.create({ sourceLanguage: 'ko', targetLanguage: 'en' });
      const enKo = await T.create({ sourceLanguage: 'en', targetLanguage: 'ko' });
      const ko = sampleData().sessions.flatMap((s) => s.turns.filter((t) => t.speaker === 'elder').map((t) => t.orig));
      const en = QUESTIONS.slice(0, 12).map((x) => x.en);
      const out: Row[] = [];
      for (const [dir, tr, list] of [['ko→en', koEn, ko], ['en→ko', enKo, en]] as const) {
        for (const src of list) {
          const t0 = performance.now();
          const res = await tr.translate(src);
          out.push({ dir, src, out: res, ms: Math.round(performance.now() - t0) });
          setRows([...out]);
        }
      }
      setState('done');
    } catch (e) {
      setMsg((e as Error).message);
      setState('error');
    }
  };

  const ms = rows.map((r) => r.ms);
  const summary = rows.length
    ? { sentences: rows.length, medianMs: q(ms, 0.5), p90Ms: q(ms, 0.9), maxMs: Math.max(...ms), userAgent: navigator.userAgent }
    : null;

  return (
    <main className="page bench">
      <h1>On-device translation check</h1>
      <p className="lede">Translates 14 Korean answers into English and 12 English questions into Korean with Chrome’s built-in model, and times each one. Nothing leaves this computer.</p>
      {!apiPresent() && <Notice tone="warn">This browser has no on-device translation. Use desktop Chrome 138 or later.</Notice>}
      <div className="row">
        <Btn variant="kid" onClick={run} disabled={!apiPresent() || state === 'running'}>{state === 'running' ? 'Running…' : 'Run the check'}</Btn>
        {summary && <Btn variant="ghost" onClick={() => navigator.clipboard?.writeText(JSON.stringify({ summary, rows }, null, 2))}>Copy results</Btn>}
      </div>
      {state === 'error' && <Notice tone="warn">{msg}</Notice>}
      {summary && <p><strong>{summary.sentences} sentences:</strong> median {summary.medianMs} ms, 90th percentile {summary.p90Ms} ms, slowest {summary.maxMs} ms.</p>}
      <table className="bench-table">
        <thead><tr><th>Direction</th><th>Source</th><th>Translation</th><th>ms</th></tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}><td>{r.dir}</td><td>{r.src}</td><td>{r.out}</td><td>{r.ms}</td></tr>)}</tbody>
      </table>
    </main>
  );
}
