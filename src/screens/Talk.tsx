import { useEffect, useMemo, useRef, useState } from 'react';
import { activeSession, patchSession, useElderUi, useStore, withSession } from '../state';
import type { Phrase, Support, Turn } from '../core/types';
import { grade, supportFor } from '../core/fade';
import { followUps, type Suggestion } from '../core/followup';
import { TOPICS, type Line } from '../data/content';
import { langOf } from '../data/languages';
import { translate } from '../platform/translator';
import { putAudio } from '../platform/store';
import { uid } from '../core/util';
import { Btn, ElderLine, Notice, Play, go, lineIn } from '../ui/kit';
import { ElderMic, PhraseAttempt, supportLabel } from '../ui/speech-ui';

interface Card { kid: string; elder: string | null; qid?: string }

export default function Talk() {
  const { data, update } = useStore();
  const ui = useElderUi(data?.family.elderLang);
  const [mode, setMode] = useState<'ask' | 'say' | 'type'>('ask');
  const [topic, setTopic] = useState(TOPICS[0].id);
  const [card, setCard] = useState<Card | null>(null);
  const [cardBusy, setCardBusy] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [elderTyped, setElderTyped] = useState('');
  const [showElderType, setShowElderType] = useState(false);
  const [pending, setPending] = useState<{ text: string; audioId?: string } | null>(null);
  const [manualTrans, setManualTrans] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Open a session once when the screen mounts (not on every change, or finishing would start a new one).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (data && !activeSession(data)) update(withSession); }, []);
  const s = data ? activeSession(data) : undefined;
  useEffect(() => { endRef.current?.scrollIntoView?.({ block: 'end' }); }, [s?.turns.length]);

  const fam = data?.family;
  const asked = useMemo(() => new Set((s?.turns ?? []).map((t) => t.qid).filter(Boolean) as string[]), [s?.turns]);
  const lastElder = [...(s?.turns ?? [])].reverse().find((t) => t.speaker === 'elder');
  const englishOfLast = lastElder ? (fam?.kidLang === 'en' ? lastElder.trans : fam?.elderLang === 'en' ? lastElder.orig : undefined) : undefined;
  const suggestions = useMemo(() => (englishOfLast ? followUps(englishOfLast, asked) : []), [englishOfLast, asked]);

  if (!data || !fam) { go('/'); return null; }
  if (!s) return null;
  const { elderLang, kidLang, elderName } = fam;

  const addTurn = (t: Omit<Turn, 'id' | 'at'>) =>
    update((d) => patchSession(d, s.id, (ss) => ({ ...ss, turns: [...ss.turns, { ...t, id: uid(), at: Date.now() }] })));

  const openLine = async (l: Pick<Line, 'en' | 'ko'>, qid?: string) => {
    setCardBusy(true);
    const [kid, elder] = await Promise.all([lineIn(l, kidLang), lineIn(l, elderLang)]);
    setCard({ kid: kid ?? l.en, elder, qid });
    setCardBusy(false);
  };
  const openSuggestion = (x: Suggestion) => openLine({ en: x.en, ko: x.ko ?? x.en }, x.id);

  const openTyped = async () => {
    const text = typed.trim();
    if (!text) return;
    setCardBusy(true);
    setCard({ kid: text, elder: await translate(text, kidLang, elderLang) });
    setCardBusy(false);
    setTyped('');
  };

  const askedIt = () => {
    if (!card) return;
    addTurn({
      speaker: 'kid', orig: card.elder ?? card.kid, lang: card.elder ? elderLang : kidLang,
      trans: card.elder ? card.kid : undefined, support: 2, inElderLang: !!card.elder, qid: card.qid,
    });
    setCard(null);
  };

  const judged = (p: Phrase, ok: boolean, support: Support) => {
    update((d) => {
      const withTurn = patchSession(d, s.id, (ss) => ({
        ...ss,
        turns: [...ss.turns, { id: uid(), at: Date.now(), speaker: 'kid', orig: p.elder, lang: elderLang, trans: p.kid, support, inElderLang: true, phraseId: p.id, ok, qid: p.id }],
      }));
      return { ...withTurn, phrases: withTurn.phrases.map((x) => (x.id === p.id ? grade(x, ok, s.index) : x)) };
    });
    if (ok) setAttemptId(null);
  };

  const elderSaid = async (text: string, audio: Blob | null) => {
    let audioId: string | undefined;
    if (audio) { audioId = uid(); await putAudio(audioId, audio); }
    const trans = await translate(text, elderLang, kidLang);
    if (trans === null) { setPending({ text, audioId }); return; }
    addTurn({ speaker: 'elder', orig: text, lang: elderLang, trans, audioId, hidden: data.listenMode });
  };

  const finish = () => {
    if (!s.turns.length) {
      update((d) => ({ ...d, sessions: d.sessions.filter((x) => x.id !== s.id) }));
      go('/progress');
      return;
    }
    update((d) => patchSession(d, s.id, (ss) => ({ ...ss, endedAt: Date.now() })));
    go('/words');
  };

  const lines = data.phrases.filter((p) => p.source === 'starter');
  const attempt = attemptId ? data.phrases.find((p) => p.id === attemptId) ?? null : null;
  const topicQs = TOPICS.find((t) => t.id === topic)!.questions;
  const yourTurn = ui('yourTurn');

  return (
    <main className="talk">
      <header className="talk-head">
        <div>
          <h1>Talk {s.index} with {elderName}</h1>
          <p className="muted">{langOf(kidLang).name} and {langOf(elderLang).name}. Sit side by side; one screen is enough.</p>
        </div>
        <div className="talk-tools">
          <label className="switch">
            <input type="checkbox" checked={data.listenMode} onChange={(e) => update((d) => ({ ...d, listenMode: e.target.checked }))} />
            <span>Hide the {langOf(kidLang).name} under {elderName}’s words until I tap</span>
          </label>
          <Btn variant="ghost" onClick={finish}>Finish talk</Btn>
        </div>
      </header>

      <section className="transcript" aria-label="Conversation" aria-live="polite">
        {!s.turns.length && (
          <p className="empty">Start with a question from the left. Read it aloud to {elderName}, then let {elderName} answer with the big button.</p>
        )}
        {s.turns.map((t) => (
          <TurnBubble key={t.id} t={t} onReveal={() => update((d) => patchSession(d, s.id, (ss) => ({ ...ss, turns: ss.turns.map((x) => (x.id === t.id ? { ...x, revealed: true } : x)) })))} />
        ))}
        <div ref={endRef} />
      </section>

      <section className="side kid-side" aria-label="Your side">
        <div className="tabs" role="tablist">
          {(['ask', 'say', 'type'] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} className="tab" onClick={() => { setMode(m); setCard(null); setAttemptId(null); }}>
              {m === 'ask' ? 'Ask' : m === 'say' ? 'Say it yourself' : 'Type'}
            </button>
          ))}
        </div>

        {card ? (
          <div className="card">
            <p className="muted">Read this aloud to {elderName}:</p>
            {card.elder ? (
              <>
                <ElderLine text={card.elder} lang={elderLang} size="xl" />
                <Play text={card.elder} lang={elderLang} label="Hear it first" />
              </>
            ) : (
              <Notice tone="warn">This browser cannot translate into {langOf(elderLang).name}. Ask in {langOf(kidLang).name}, or open Say It Back in desktop Chrome.</Notice>
            )}
            <p className="meaning">{card.kid}</p>
            <div className="row">
              <Btn variant="kid" onClick={askedIt}>I asked it</Btn>
              <Btn variant="quiet" onClick={() => setCard(null)}>Back</Btn>
            </div>
          </div>
        ) : attempt ? (
          <PhraseAttempt
            key={attempt.id + attempt.history.length}
            phrase={attempt}
            support={supportFor(attempt.box)}
            lang={elderLang}
            elderName={elderName}
            ui={ui}
            onJudge={(ok, sup) => judged(attempt, ok, sup)}
            onCancel={() => setAttemptId(null)}
          />
        ) : mode === 'ask' ? (
          <div className="ask">
            {suggestions.length > 0 && (
              <div className="follow">
                <h2>Follow up on what {elderName} just said</h2>
                {suggestions.map((x) => (
                  <button key={x.id} className="q q-follow" disabled={cardBusy} onClick={() => openSuggestion(x)}>{x.en}</button>
                ))}
              </div>
            )}
            <div className="topics" role="tablist" aria-label="Topics">
              {TOPICS.map((t) => (
                <button key={t.id} role="tab" aria-selected={topic === t.id} className="chip" onClick={() => setTopic(t.id)}>{t.en}</button>
              ))}
            </div>
            {topicQs.map((q) => (
              <button key={q.id} className={`q ${asked.has(q.id) ? 'done' : ''}`} disabled={cardBusy} onClick={() => openLine(q, q.id)}>
                {kidLang === 'ko' ? q.ko : q.en}
              </button>
            ))}
          </div>
        ) : mode === 'say' ? (
          <div className="say">
            <p className="muted">Your lines, in {langOf(elderLang).name}. The more you know one, the less help you get.</p>
            {lines.map((p) => (
              <button key={p.id} className="line" onClick={() => setAttemptId(p.id)}>
                <span>{p.kid}</span>
                <span className={`level level-${p.box}`}>{supportLabel(supportFor(p.box))}</span>
              </button>
            ))}
          </div>
        ) : (
          <form className="type" onSubmit={(e) => { e.preventDefault(); void openTyped(); }}>
            <label htmlFor="typed">Write what you want to say in {langOf(kidLang).name}</label>
            <textarea id="typed" rows={3} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Did you have a dog when you were little?" />
            <Btn type="submit" variant="kid" disabled={!typed.trim() || cardBusy}>Show it in {langOf(elderLang).name}</Btn>
            <p className="muted small">Translated on this device. Machine translation can be rough; {elderName} will tell you.</p>
          </form>
        )}
      </section>

      <section className="side elder-side" aria-label={`${elderName}’s side`}>
        <p className="your-turn" lang={yourTurn.lang}>{yourTurn.text}</p>
        {pending ? (
          <form className="type" onSubmit={(e) => {
            e.preventDefault();
            addTurn({ speaker: 'elder', orig: pending.text, lang: elderLang, trans: manualTrans.trim() || undefined, audioId: pending.audioId });
            setPending(null); setManualTrans('');
          }}>
            <ElderLine text={pending.text} lang={elderLang} size="m" roman={false} />
            <Notice tone="warn">No translation is available in this browser. Add the meaning if someone knows it, or keep the words as they are.</Notice>
            <label htmlFor="mt">Meaning (optional)</label>
            <input id="mt" value={manualTrans} onChange={(e) => setManualTrans(e.target.value)} />
            <Btn type="submit" variant="elder">Keep it</Btn>
          </form>
        ) : (
          <>
            <ElderMic lang={elderLang} ui={ui} onResult={({ text, audio }) => void elderSaid(text, audio)} />
            <button type="button" className="link" onClick={() => setShowElderType((v) => !v)}>
              {showElderType ? 'Hide typing' : `Type what ${elderName} said instead`}
            </button>
            {showElderType && (
              <form className="type" onSubmit={(e) => { e.preventDefault(); const t = elderTyped.trim(); if (t) { void elderSaid(t, null); setElderTyped(''); } }}>
                <label htmlFor="et">{elderName}’s words, in {langOf(elderLang).name}</label>
                <textarea id="et" rows={2} lang={elderLang} value={elderTyped} onChange={(e) => setElderTyped(e.target.value)} />
                <Btn type="submit" variant="elder" disabled={!elderTyped.trim()}>Add</Btn>
              </form>
            )}
          </>
        )}
        <p className="muted small privacy-line">Speech is recognised by your browser’s speech service. Translation runs on this device.</p>
      </section>
    </main>
  );
}

export function TurnBubble({ t, onReveal }: { t: Turn; onReveal?: () => void }) {
  if (t.speaker === 'elder') {
    const hidden = t.hidden && !t.revealed;
    return (
      <article className="bubble elder">
        <ElderLine text={t.orig} lang={t.lang} size="m" roman={false} />
        {t.trans && (hidden ? (
          <button type="button" className="reveal" onClick={onReveal}>Show what it means</button>
        ) : (
          <p className={`trans ${t.hidden ? 'was-hidden' : ''}`}>{t.trans}</p>
        ))}
        {t.audioId && <Play lang={t.lang} audioId={t.audioId} />}
      </article>
    );
  }
  return (
    <article className={`bubble kid ${t.ok === false ? 'missed' : ''}`}>
      <p lang={t.lang} className="kid-said">{t.orig}</p>
      {t.trans && <p className="trans">{t.trans}</p>}
      <p className="tags">
        <span className={`tag s${t.support}`}>{supportLabel(t.support)}</span>
        {t.ok === true && t.phraseId && <span className="tag ok">Understood</span>}
        {t.ok === false && <span className="tag no">Try again</span>}
      </p>
    </article>
  );
}
