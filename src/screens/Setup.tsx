import { useEffect, useState } from 'react';
import { useStore } from '../state';
import { KID_LANGS, LANGS, langOf } from '../data/languages';
import { FIRST_STARTERS, STARTERS } from '../data/content';
import { newPhrase } from '../core/fade';
import { uid } from '../core/util';
import { pairState, prepare, type PairState } from '../platform/translator';
import { asrSupported, ttsSupported } from '../platform/speech';
import { recorderSupported } from '../platform/recorder';
import { Btn, Notice, go, lineIn } from '../ui/kit';

type Check = 'ok' | 'warn' | 'no' | 'wait';
const PAIR_TEXT: Record<PairState, [Check, string]> = {
  available: ['ok', 'Ready on this device'],
  downloadable: ['warn', 'Needs a one-time download'],
  downloading: ['wait', 'Downloading…'],
  unavailable: ['no', 'Not available for this pair'],
  unsupported: ['no', 'This browser has no on-device translation (use desktop Chrome 138+ or Edge 148+)'],
};

export default function Setup() {
  const { begin } = useStore();
  const [kidName, setKidName] = useState('');
  const [elderName, setElderName] = useState('');
  const [kidLang, setKidLang] = useState('en');
  const [elderLang, setElderLang] = useState('ko');
  const [states, setStates] = useState<[PairState, PairState] | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [mic, setMic] = useState<Check | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const recheck = () => {
    setStates(null);
    Promise.all([pairState(kidLang, elderLang), pairState(elderLang, kidLang)]).then(([a, b]) => setStates([a, b]));
  };
  useEffect(recheck, [kidLang, elderLang]);

  const download = async () => {
    setProgress(0);
    const ok = (await prepare(kidLang, elderLang, setProgress)) && (await prepare(elderLang, kidLang, setProgress));
    setProgress(null);
    if (!ok) setErr('The language pack could not be downloaded. Check the connection and try again.');
    recheck();
  };

  const testMic = async () => {
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: true });
      st.getTracks().forEach((t) => t.stop());
      setMic('ok');
    } catch {
      setMic('no');
    }
  };

  const start = async () => {
    setBusy(true);
    const family = { id: uid(), kidName: kidName.trim(), elderName: elderName.trim(), kidLang, elderLang, createdAt: Date.now() };
    const firsts = STARTERS.filter((x) => FIRST_STARTERS.includes(x.id));
    const phrases = (
      await Promise.all(firsts.map(async (x) => {
        const [e, k] = await Promise.all([lineIn(x, elderLang), lineIn(x, kidLang)]);
        return e && k ? newPhrase(x.id, e, k, 'starter', 1) : null;
      }))
    ).filter((p): p is NonNullable<typeof p> => !!p);
    begin(family, phrases);
    go('/talk');
  };

  const pairReady = states?.every((s) => s === 'available');
  const canStart = kidName.trim() && elderName.trim() && kidLang !== elderLang && !busy;
  const rows: [string, Check, string][] = [
    [`Translate ${langOf(kidLang).name} to ${langOf(elderLang).name}`, ...(states ? PAIR_TEXT[states[0]] : (['wait', 'Checking…'] as [Check, string]))],
    [`Translate ${langOf(elderLang).name} to ${langOf(kidLang).name}`, ...(states ? PAIR_TEXT[states[1]] : (['wait', 'Checking…'] as [Check, string]))],
    ['Speech recognition', asrSupported() ? 'ok' : 'no', asrSupported() ? 'Available' : 'Not in this browser: you can type instead'],
    ['Voice recording', recorderSupported() ? 'ok' : 'no', recorderSupported() ? 'Available' : 'Not in this browser'],
    ['Reading lines aloud', ttsSupported() ? 'ok' : 'warn', ttsSupported() ? 'Available' : 'Not in this browser'],
    ['Microphone', mic ?? 'wait', mic === 'ok' ? 'Working' : mic === 'no' ? 'Blocked or missing: allow it in the browser settings' : 'Not tested yet'],
  ];

  return (
    <main className="page setup">
      <h1>Who is talking?</h1>
      <form className="setup-form" onSubmit={(e) => { e.preventDefault(); if (canStart) void start(); }}>
        <label>Your first name<input value={kidName} onChange={(e) => setKidName(e.target.value)} autoComplete="given-name" required /></label>
        <label>What you call them<input value={elderName} onChange={(e) => setElderName(e.target.value)} placeholder="Halmoni, Abuela, Nani, Bà…" required /></label>
        <label>The language they speak best
          <select value={elderLang} onChange={(e) => setElderLang(e.target.value)}>
            {LANGS.filter((l) => l.code !== kidLang).map((l) => <option key={l.code} value={l.code}>{l.name} ({l.native})</option>)}
          </select>
        </label>
        <label>Your language
          <select value={kidLang} onChange={(e) => setKidLang(e.target.value)}>
            {KID_LANGS.filter((c) => c !== elderLang).map((c) => <option key={c} value={c}>{langOf(c).name}</option>)}
          </select>
        </label>

        <section className="checks" aria-label="What this browser can do">
          <h2>Before you start</h2>
          <ul>
            {rows.map(([label, c, note]) => (
              <li key={label} className={`check check-${c}`}><span className="check-label">{label}</span><span className="check-note">{note}</span></li>
            ))}
          </ul>
          <div className="row">
            {states?.some((s) => s === 'downloadable') && (
              <Btn variant="ghost" onClick={download} disabled={progress !== null}>
                {progress !== null ? `Downloading ${Math.round(progress * 100)}%` : 'Download the language pack'}
              </Btn>
            )}
            <Btn variant="ghost" onClick={testMic}>Test the microphone</Btn>
          </div>
          {states && !pairReady && elderLang !== 'ko' && kidLang === 'en' && (
            <Notice tone="warn">Without on-device translation, questions and answers can’t be translated. You can still type meanings yourself.</Notice>
          )}
          {states && !pairReady && (elderLang === 'ko' || kidLang === 'ko') && (
            <Notice>Questions and short lines in Korean are built in. Translating free answers needs the language pack.</Notice>
          )}
          {err && <Notice tone="warn">{err}</Notice>}
        </section>

        <Btn type="submit" variant="kid" disabled={!canStart}>{busy ? 'Getting ready…' : 'Start the first talk'}</Btn>
      </form>
    </main>
  );
}
