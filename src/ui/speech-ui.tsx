import { useEffect, useRef, useState } from 'react';
import type { Phrase, Support } from '../core/types';
import { hint } from '../core/fade';
import { bestScore } from '../core/match';
import { romanize } from '../core/romanize';
import { langOf } from '../data/languages';
import { asrSupported, listen, speechErrorText, type Listening } from '../platform/speech';
import { startRecording, type Recording } from '../platform/recorder';
import { Btn, ElderLine, Notice, Play, ScoreMeter } from './kit';
import type { ELDER_UI } from '../data/content';

type Ui = (k: keyof typeof ELDER_UI) => { text: string; lang: string };

/** Pronunciation hint for any language: Korean via romanisation, others by masking all but the first word/character. */
export function hintFor(text: string, lang: string): string {
  const r = romanize(text, lang);
  if (r) return hint(r);
  if (/^(zh|ja|th)/.test(lang)) return Array.from(text).map((c, i) => (i === 0 || /[\p{P}\s]/u.test(c) ? c : '_')).join('');
  return text.split(/\s+/).map((w, i) => (i === 0 ? w : w.replace(/\p{L}/gu, '_'))).join(' ');
}

const SUPPORT_LABEL: Record<Support, string> = { 2: 'Read from the card', 1: 'With a hint', 0: 'From memory' };
export const supportLabel = (s?: Support) => (s === undefined ? '' : SUPPORT_LABEL[s]);

/**
 * One attempt at saying a phrase in the elder's language. The help shown depends on the phrase's box;
 * the elder gives the verdict. Speech recognition only offers a score.
 */
export function PhraseAttempt({ phrase, support: given, lang, elderName, ui, onJudge, onCancel }: {
  phrase: Phrase;
  support: Support;
  lang: string;
  elderName: string;
  ui: Ui;
  onJudge(ok: boolean, support: Support, heard: string): void;
  onCancel?(): void;
}) {
  const [support, setSupport] = useState<Support>(given);
  const [state, setState] = useState<'idle' | 'listening' | 'heard'>('idle');
  const [heard, setHeard] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const l = useRef<Listening | null>(null);
  useEffect(() => () => l.current?.cancel(), []);

  const say = async () => {
    setErr('');
    setState('listening');
    l.current = listen(langOf(lang).speech);
    try {
      const h = await l.current.result;
      setHeard(h.alts.length ? h.alts : [h.text]);
      setState('heard');
    } catch (e) {
      setErr(speechErrorText((e as Error).message));
      setState('idle');
    }
  };
  const score = heard.length ? bestScore(phrase.elder, heard, lang) : 0;
  const correct = ui('correct');
  const again = ui('again');
  const judge = ui('judge');

  return (
    <div className="attempt" data-support={support}>
      <p className="attempt-meaning"><span className="muted">Say to {elderName}:</span> {phrase.kid}</p>
      <div className="attempt-help">
        {support === 2 && (
          <>
            <ElderLine text={phrase.elder} lang={lang} size="xl" />
            <Play text={phrase.elder} lang={lang} audioId={phrase.audioId} label="Hear it" />
          </>
        )}
        {support === 1 && (
          <>
            <p className="hint" aria-label="Pronunciation hint">{hintFor(phrase.elder, lang)}</p>
            <Play text={phrase.elder} lang={lang} audioId={phrase.audioId} label="Hear it" />
          </>
        )}
        {support === 0 && <p className="hint from-memory">From memory this time.</p>}
        {support > 0 && support < 2 && (
          <button type="button" className="link" onClick={() => setSupport(2)}>Show the whole line</button>
        )}
        {support === 0 && (
          <button type="button" className="link" onClick={() => setSupport(1)}>Give me a hint</button>
        )}
      </div>
      <div className="attempt-actions">
        {asrSupported() && (
          <Btn variant="kid" onClick={state === 'listening' ? () => l.current?.stop() : say} aria-pressed={state === 'listening'}>
            {state === 'listening' ? 'Listening… tap to stop' : state === 'heard' ? 'Say it again' : 'Say it'}
          </Btn>
        )}
        {onCancel && <Btn variant="quiet" onClick={onCancel}>Back</Btn>}
      </div>
      {err && <Notice tone="warn">{err}</Notice>}
      {state === 'heard' && (
        <div className="heard">
          <p className="muted">Heard: <span lang={lang}>{heard[0] || '(nothing)'}</span></p>
          <ScoreMeter score={score} />
        </div>
      )}
      <div className="judge" aria-label={`${elderName} decides`}>
        <p lang={judge.lang} className="judge-q">{judge.text}</p>
        <div className="judge-buttons">
          <Btn variant="elder" lang={correct.lang} onClick={() => onJudge(true, support, heard[0] ?? '')}>{correct.text}</Btn>
          <Btn variant="ghost" lang={again.lang} onClick={() => onJudge(false, support, heard[0] ?? '')}>{again.text}</Btn>
        </div>
      </div>
    </div>
  );
}

/** The elder's big talk button: transcribes in their language and records their voice at the same time. */
export function ElderMic({ lang, ui, onResult, disabled }: {
  lang: string;
  ui: Ui;
  disabled?: boolean;
  onResult(r: { text: string; audio: Blob | null }): void;
}) {
  const [on, setOn] = useState(false);
  const [interim, setInterim] = useState('');
  const [err, setErr] = useState('');
  const l = useRef<Listening | null>(null);
  const rec = useRef<Recording | null>(null);
  useEffect(() => () => { l.current?.cancel(); void rec.current?.stop(); }, []);

  const start = async () => {
    setErr('');
    setInterim('');
    rec.current = await startRecording();
    l.current = listen(langOf(lang).speech, { continuous: true, onInterim: setInterim });
    setOn(true);
    l.current.result
      .then(async (h) => {
        const audio = (await rec.current?.stop()) ?? null;
        setOn(false);
        if (!h.text) setErr('Nothing was heard. Try again, closer to the microphone, or type it.');
        else onResult({ text: h.text, audio });
        setInterim('');
      })
      .catch(async (e) => {
        await rec.current?.stop();
        setOn(false);
        setErr(speechErrorText((e as Error).message));
      });
  };
  const speakLabel = ui('speak');
  const doneLabel = ui('done');
  const listening = ui('listening');
  if (!asrSupported()) return <Notice tone="warn">{speechErrorText('unsupported')}</Notice>;
  return (
    <div className="elder-mic">
      <button
        type="button"
        className={`mic ${on ? 'on' : ''}`}
        onClick={on ? () => l.current?.stop() : start}
        disabled={disabled}
        aria-pressed={on}
        lang={(on ? doneLabel : speakLabel).lang}
      >
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
          <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" fill="currentColor" />
        </svg>
        <span>{on ? doneLabel.text : speakLabel.text}</span>
      </button>
      {on && (
        <p className="interim" lang={lang} aria-live="polite">
          {interim || <span className="muted" lang={listening.lang}>{listening.text}</span>}
        </p>
      )}
      {err && <Notice tone="warn">{err}</Notice>}
    </div>
  );
}
