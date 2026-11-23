import { useEffect, useMemo, useRef, useState } from 'react';
import { lastEnded, useElderUi, useStore } from '../state';
import { herWords } from '../core/candidates';
import { newPhrase } from '../core/fade';
import { uid } from '../core/util';
import { STARTERS } from '../data/content';
import { translate } from '../platform/translator';
import { putAudio } from '../platform/store';
import { startRecording, recorderSupported, type Recording } from '../platform/recorder';
import { Btn, ElderLine, Play, go, lineIn } from '../ui/kit';

const MAX_HER = 3;
const MAX_LINES = 2;

interface Cand { id: string; elder: string; kid: string | null; source: 'her-words' | 'starter'; audioId?: string }

export default function Words() {
  const { data, update } = useStore();
  const ui = useElderUi(data?.family.elderLang);
  const s = data ? lastEnded(data) : undefined;
  const [cands, setCands] = useState<Cand[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);

  const known = useMemo(() => new Set((data?.phrases ?? []).map((p) => p.elder)), [data?.phrases]);
  useEffect(() => {
    if (!data || !s) return;
    const { elderLang, kidLang } = data.family;
    let alive = true;
    (async () => {
      const texts = [...new Set(s.turns.filter((t) => t.speaker === 'elder').flatMap((t) => herWords(t.orig, elderLang)))]
        .filter((t) => !known.has(t))
        .slice(0, 8);
      const her = await Promise.all(texts.map(async (t) => ({ id: uid(), elder: t, kid: await translate(t, elderLang, kidLang), source: 'her-words' as const })));
      const have = new Set(data.phrases.map((p) => p.id));
      const next = STARTERS.filter((x) => !have.has(x.id)).slice(0, 3);
      const lines = await Promise.all(next.map(async (x) => ({ id: x.id, elder: (await lineIn(x, elderLang)) ?? '', kid: await lineIn(x, kidLang), source: 'starter' as const })));
      if (alive) setCands([...her, ...lines.filter((l) => l.elder)]);
    })();
    return () => { alive = false; };
    // Candidates are computed once for the finished talk.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.id]);

  if (!data || !s) { go('/'); return null; }
  const { elderLang, elderName } = data.family;
  const her = (cands ?? []).filter((c) => c.source === 'her-words');
  const lines = (cands ?? []).filter((c) => c.source === 'starter');
  const count = (src: Cand['source']) => picked.filter((id) => cands?.find((c) => c.id === id)?.source === src).length;
  const toggle = (c: Cand) =>
    setPicked((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : count(c.source) < (c.source === 'her-words' ? MAX_HER : MAX_LINES) ? [...p, c.id] : p));
  const setAudio = (id: string, audioId: string) => setCands((cs) => cs!.map((c) => (c.id === id ? { ...c, audioId } : c)));

  const save = () => {
    const chosen = (cands ?? []).filter((c) => picked.includes(c.id));
    update((d) => ({
      ...d,
      phrases: [
        ...d.phrases,
        ...chosen.map((c) => ({ ...newPhrase(c.id, c.elder, c.kid ?? '', c.source, s.index), audioId: c.audioId })),
      ],
    }));
    go('/practice');
  };

  return (
    <main className="page words">
      <h1>Keep {elderName}’s words</h1>
      <p className="lede">Pick up to {MAX_HER} short things {elderName} said today. Ask {elderName} to say each one again so you can practise with {elderName}’s own voice.</p>
      {!cands && <p className="muted">Finding short lines in today’s talk…</p>}
      {cands && !her.length && <p className="muted">No short lines this time. Longer answers are kept in the storybook.</p>}
      <ul className="pick-list">
        {her.map((c) => (
          <li key={c.id} className={picked.includes(c.id) ? 'picked' : ''}>
            <label className="pick">
              <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(c)} />
              <span>
                <ElderLine text={c.elder} lang={elderLang} size="m" />
                <span className="meaning">{c.kid ?? 'No translation in this browser'}</span>
              </span>
            </label>
            {picked.includes(c.id) && (
              <VoiceRecorder elderLang={elderLang} prompt={ui('readThis')} rec={ui('record')} stop={ui('stop')} audioId={c.audioId} onSaved={(a) => setAudio(c.id, a)} />
            )}
          </li>
        ))}
      </ul>
      {lines.length > 0 && (
        <>
          <h2>New lines for you</h2>
          <p className="muted">Short polite phrases that keep a conversation going. Choose up to {MAX_LINES}.</p>
          <ul className="pick-list">
            {lines.map((c) => (
              <li key={c.id} className={picked.includes(c.id) ? 'picked' : ''}>
                <label className="pick">
                  <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(c)} />
                  <span>
                    <ElderLine text={c.elder} lang={elderLang} size="m" />
                    <span className="meaning">{c.kid}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="row sticky-actions">
        <Btn variant="kid" onClick={save} disabled={!cands}>{picked.length ? `Keep ${picked.length} and practise` : 'Practise without new words'}</Btn>
      </div>
    </main>
  );
}

function VoiceRecorder({ elderLang, prompt, rec, stop, audioId, onSaved }: {
  elderLang: string;
  prompt: { text: string; lang: string };
  rec: { text: string; lang: string };
  stop: { text: string; lang: string };
  audioId?: string;
  onSaved(id: string): void;
}) {
  const [on, setOn] = useState(false);
  const r = useRef<Recording | null>(null);
  useEffect(() => () => { void r.current?.stop(); }, []);
  if (!recorderSupported()) return null;
  const toggle = async () => {
    if (!on) { r.current = await startRecording(); setOn(true); return; }
    const blob = await r.current?.stop();
    setOn(false);
    if (blob) { const id = uid(); await putAudio(id, blob); onSaved(id); }
  };
  return (
    <div className="voice-rec">
      <p lang={prompt.lang} className="elder-prompt">{prompt.text}</p>
      <Btn variant="elder" onClick={toggle} aria-pressed={on} lang={(on ? stop : rec).lang}>{on ? stop.text : rec.text}</Btn>
      {audioId && !on && <Play lang={elderLang} audioId={audioId} />}
      {audioId && <span className="muted small">Saved. Practice will use this recording.</span>}
    </div>
  );
}
