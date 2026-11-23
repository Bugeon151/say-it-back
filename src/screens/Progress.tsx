import { useStore, lastSession } from '../state';
import { boxCounts, pct, seriesMetrics } from '../core/metrics';
import { duePhrases, gradedIn } from '../core/fade';
import type { Box } from '../core/types';
import { langOf } from '../data/languages';
import { Bars, Btn, ElderLine, Play, go } from '../ui/kit';

const BOXES: { box: Box; title: string; note: string }[] = [
  { box: 0, title: 'Reading it', note: 'Full line and pronunciation on screen' },
  { box: 1, title: 'With a hint', note: 'Only the first sound shown' },
  { box: 2, title: 'Almost there', note: 'Only the first sound shown' },
  { box: 3, title: 'From memory', note: 'Nothing on screen' },
];

export default function Progress() {
  const { data, reset } = useStore();
  if (!data) { go('/'); return null; }
  const { family: f, sessions, phrases } = data;
  const done = sessions.filter((s) => s.endedAt);
  const series = seriesMetrics(done);
  const first = series[0];
  const last = series[series.length - 1];
  const counts = boxCounts(phrases);
  const ls = lastSession(data);
  const due = ls ? duePhrases(phrases, ls.index).filter((p) => !gradedIn(p, ls.index)) : [];

  return (
    <main className="page progress">
      {data.sample && (
        <div className="sample-banner">
          <p><strong>This is a sample family.</strong> Mina and her grandmother are made up, so you can look around without a partner or a microphone. Nothing here is real data.</p>
          <Btn variant="kid" onClick={async () => { await reset(); go('/setup'); }}>Start your own</Btn>
        </div>
      )}
      <h1>{f.kidName} and {f.elderName}</h1>
      <p className="muted">{done.length} {done.length === 1 ? 'talk' : 'talks'} in {langOf(f.kidLang).name} and {langOf(f.elderLang).name}</p>

      {series.length > 0 ? (
        <section className="fade-summary">
          <p className="headline-stat">
            In talk {last.index}, {f.kidName} said <strong>{pct(last.dsr)}</strong> of the lines to {f.elderName} without reading them
            {series.length > 1 ? `, up from ${pct(first.dsr)} in talk ${first.index}.` : '.'}
          </p>
          <div className="charts">
            <Bars data={series} field="dsr" label="Said without reading (direct speech)" />
            <Bars data={series} field="lir" label={`Understood ${f.elderName} without the translation`} />
          </div>
          <p className="muted small">Direct speech counts lines said in {langOf(f.elderLang).name} with only a hint or from memory, and confirmed by {f.elderName}. Listening counts {f.elderName}’s answers understood while the translation was hidden.</p>
        </section>
      ) : (
        <p className="lede">No finished talks yet. Your first one starts with a single question.</p>
      )}

      <div className="row">
        <Btn variant="kid" onClick={() => go('/talk')}>{ls && !ls.endedAt ? `Continue talk ${ls.index}` : `Start talk ${(ls?.index ?? 0) + 1}`}</Btn>
        {due.length > 0 && <Btn variant="ghost" onClick={() => go('/practice')}>Practise {due.length} {due.length === 1 ? 'phrase' : 'phrases'}</Btn>}
        {done.length > 0 && <Btn variant="ghost" onClick={() => go('/book')}>Open the storybook</Btn>}
      </div>

      <section className="deck" aria-label="Phrases">
        <h2>Your phrases, by how much help they still need</h2>
        <div className="deck-cols">
          {BOXES.map((b) => (
            <div className={`deck-col box-${b.box}`} key={b.box}>
              <h3>{b.title} <span className="count">{counts[b.box]}</span></h3>
              <p className="muted small">{b.note}</p>
              {phrases.filter((p) => p.box === b.box).map((p) => (
                <div className={`phrase ${p.source}`} key={p.id}>
                  <ElderLine text={p.elder} lang={f.elderLang} size="s" />
                  <p className="meaning">{p.kid}</p>
                  <div className="phrase-foot">
                    <span className="src">{p.source === 'her-words' ? `${f.elderName}’s words` : 'Your line'}</span>
                    <Play text={p.elder} lang={f.elderLang} audioId={p.audioId} label="Hear" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {!data.sample && (
        <section className="danger-zone">
          <h2>Your data</h2>
          <p className="muted">Everything is stored in this browser only. Deleting it cannot be undone.</p>
          <Btn variant="danger" onClick={async () => { if (window.confirm('Delete every talk, phrase and recording on this device?')) { await reset(); go('/'); } }}>Delete everything on this device</Btn>
        </section>
      )}
    </main>
  );
}
