import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useStore } from '../state';
import { sampleData } from '../data/sample';
import { seriesMetrics, pct } from '../core/metrics';
import { followUps } from '../core/followup';
import { ELDER_UI } from '../data/content';
import { Bars, Btn, ElderLine, ScoreMeter, go } from '../ui/kit';
import { FadeCard, STAGES } from '../ui/fade-demo';
import { TurnBubble } from './Talk';

export default function Tour() {
  const { openSample } = useStore();
  const sample = useMemo(sampleData, []);
  const s2 = sample.sessions[1];
  const answer = s2.turns[1];
  const series = seriesMetrics(sample.sessions);
  const fu = followUps(answer.trans!, new Set());
  const her = sample.phrases.filter((p) => p.source === 'her-words').slice(0, 2);

  const steps: { title: string; body: ReactNode }[] = [
    {
      title: 'Mina asks in English. She reads it aloud in Korean.',
      body: (
        <div className="card">
          <p className="muted">Read this aloud to Halmoni:</p>
          <ElderLine text={s2.turns[0].orig} lang="ko" size="xl" />
          <p className="meaning">{s2.turns[0].trans}</p>
        </div>
      ),
    },
    {
      title: 'Halmoni answers in Korean. It is written down and translated on the device.',
      body: <div className="transcript solo"><TurnBubble t={{ ...answer, hidden: false }} /></div>,
    },
    {
      title: 'A follow-up question comes from what she just said.',
      body: (
        <div className="follow">
          {fu.map((x) => <p key={x.id} className="q q-follow static">{x.en}</p>)}
        </div>
      ),
    },
    {
      title: 'After the talk, Mina keeps a few of Halmoni’s own words. Halmoni says them again so Mina can practise with her voice.',
      body: (
        <div className="tour-phrases">
          {her.map((p) => (
            <div className="phrase her-words" key={p.id}>
              <ElderLine text={p.elder} lang="ko" size="m" />
              <p className="meaning">{p.kid}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Every line she gets right comes back with less help.',
      body: <div className="tour-fade">{STAGES.map((_, i) => <FadeCard key={i} stage={i} />)}</div>,
    },
    {
      title: 'Halmoni, not the computer, decides if it sounded right.',
      body: (
        <div className="judge tour-judge">
          <ScoreMeter score={0.92} />
          <p lang="ko" className="judge-q">{ELDER_UI.judge.ko}</p>
          <div className="judge-buttons">
            <span className="btn btn-elder static" lang="ko">{ELDER_UI.correct.ko}</span>
            <span className="btn btn-ghost static" lang="ko">{ELDER_UI.again.ko}</span>
          </div>
          <p className="muted small">Speech recognition only suggests a score. Grandparents hear things a computer misses.</p>
        </div>
      ),
    },
    {
      title: `Four talks later, Mina says ${pct(series[3].dsr)} of her lines without reading them.`,
      body: (
        <div>
          <div className="charts">
            <Bars data={series} field="dsr" label="Said without reading" />
            <Bars data={series} field="lir" label="Understood Halmoni without the translation" />
          </div>
          <p className="muted small">Sample family. Mina and Halmoni are made up; the numbers show how the measures work.</p>
        </div>
      ),
    },
  ];

  const [i, setI] = useState(0);
  const last = i === steps.length - 1;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setI((x) => Math.min(steps.length - 1, x + 1));
      if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [steps.length]);

  return (
    <main className="page tour">
      <p className="muted">Step {i + 1} of {steps.length}</p>
      <h1 aria-live="polite">{steps[i].title}</h1>
      <div className="tour-body">{steps[i].body}</div>
      <div className="row tour-nav">
        <Btn variant="quiet" onClick={() => setI((x) => x - 1)} disabled={i === 0}>Back</Btn>
        {last ? (
          <>
            <Btn variant="kid" onClick={() => { openSample(); go('/progress'); }}>Explore the sample family</Btn>
            <Btn variant="ghost" onClick={() => go('/setup')}>Start with your grandparent</Btn>
          </>
        ) : (
          <Btn variant="kid" onClick={() => setI((x) => x + 1)}>Next</Btn>
        )}
      </div>
      <div className="dots" aria-hidden="true">{steps.map((_, k) => <span key={k} className={k === i ? 'on' : ''} />)}</div>
    </main>
  );
}
