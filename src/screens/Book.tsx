import { useStore } from '../state';
import { langOf } from '../data/languages';
import { Btn, ElderLine, Play, go } from '../ui/kit';

const date = (t: number) => new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

export default function Book() {
  const { data } = useStore();
  if (!data) { go('/'); return null; }
  const { family: f, sessions } = data;
  const done = sessions.filter((s) => s.endedAt && s.turns.some((t) => t.speaker === 'elder'));

  return (
    <main className="page book">
      <header className="book-head">
        <h1>{f.elderName}, in {f.elderName}’s own words</h1>
        <p className="lede">Kept by {f.kidName}. Every answer is here in {langOf(f.elderLang).name}, with what it means in {langOf(f.kidLang).name}{data.sample ? '.' : ', and with the recorded voice where there is one.'}</p>
        <div className="row no-print">
          <Btn variant="ghost" onClick={() => window.print()}>Print or save as PDF</Btn>
          <Btn variant="quiet" onClick={() => go('/progress')}>Back to progress</Btn>
        </div>
      </header>
      {!done.length && <p className="muted">The storybook fills up as you talk.</p>}
      {done.map((s) => (
        <section className="chapter" key={s.id}>
          <h2>Talk {s.index} <span className="muted">{date(s.startedAt)}</span></h2>
          {s.turns.map((t, i) => {
            if (t.speaker !== 'elder') return null;
            const q = [...s.turns.slice(0, i)].reverse().find((x) => x.speaker === 'kid');
            return (
              <figure className="entry" key={t.id}>
                {q && <p className="entry-q">{q.trans ?? q.orig}</p>}
                <blockquote><ElderLine text={t.orig} lang={t.lang} size="m" roman={false} /></blockquote>
                {t.trans && <figcaption>{t.trans}</figcaption>}
                <div className="no-print"><Play text={t.orig} lang={t.lang} audioId={t.audioId} label="Read aloud" /></div>
              </figure>
            );
          })}
        </section>
      ))}
    </main>
  );
}
