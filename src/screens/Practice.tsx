import { useState } from 'react';
import { lastEnded, useElderUi, useStore } from '../state';
import { duePhrases, grade, gradedIn, supportFor } from '../core/fade';
import type { Box } from '../core/types';
import { Btn, go } from '../ui/kit';
import { PhraseAttempt } from '../ui/speech-ui';

const LEVEL = ['Reading it', 'With a hint', 'Almost there', 'From memory'];

export default function Practice() {
  const { data, update } = useStore();
  const ui = useElderUi(data?.family.elderLang);
  const s = data ? lastEnded(data) : undefined;
  const [queue] = useState<string[]>(() =>
    data && s ? duePhrases(data.phrases, s.index, 8).filter((p) => !gradedIn(p, s.index)).map((p) => p.id) : [],
  );
  const [at, setAt] = useState(0);
  const [moves, setMoves] = useState<{ id: string; from: Box; to: Box }[]>([]);
  const [lastMiss, setLastMiss] = useState(false);

  if (!data || !s) { go('/'); return null; }
  const { elderLang, elderName } = data.family;
  const id = queue[at];
  const p = id ? data.phrases.find((x) => x.id === id) : undefined;

  if (!p) {
    return (
      <main className="page practice-done">
        <h1>{queue.length ? 'Practice done' : 'Nothing to practise right now'}</h1>
        {moves.length > 0 && (
          <ul className="moves">
            {moves.map((m) => {
              const ph = data.phrases.find((x) => x.id === m.id)!;
              return (
                <li key={m.id}>
                  <span lang={elderLang}>{ph.elder}</span>
                  <span className={`move ${m.to > m.from ? 'up' : m.to < m.from ? 'down' : ''}`}>{LEVEL[m.from]} to {LEVEL[m.to]}</span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="lede">Next time, phrases that moved up come back with less help.</p>
        <div className="row">
          <Btn variant="kid" onClick={() => go('/progress')}>See progress</Btn>
        </div>
      </main>
    );
  }

  const judge = (ok: boolean) => {
    const before = p.box;
    const after = grade(p, ok, s.index);
    update((d) => ({ ...d, phrases: d.phrases.map((x) => (x.id === p.id ? after : x)) }));
    if (!gradedIn(p, s.index)) setMoves((m) => [...m, { id: p.id, from: before, to: after.box }]);
    if (ok) { setAt((i) => i + 1); setLastMiss(false); } else setLastMiss(true);
  };

  return (
    <main className="page practice">
      <p className="muted">Practice after talk {s.index}: {at + 1} of {queue.length}</p>
      <h1>{p.source === 'her-words' ? `Say ${elderName}’s words back` : 'Your line'}</h1>
      <PhraseAttempt
        key={p.id + p.history.length}
        phrase={p}
        support={supportFor(p.box)}
        lang={elderLang}
        elderName={elderName}
        ui={ui}
        onJudge={(ok) => judge(ok)}
      />
      {lastMiss && (
        <div className="row">
          <Btn variant="quiet" onClick={() => { setAt((i) => i + 1); setLastMiss(false); }}>Move on for now</Btn>
        </div>
      )}
    </main>
  );
}
