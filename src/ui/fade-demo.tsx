import { useEffect, useState } from 'react';
import { romanizeKo } from '../core/romanize';
import { hint } from '../core/fade';

const LINE = '더 얘기해 주세요.';
const ROMAN = romanizeKo(LINE);
export const STAGES = [
  { talk: 1, caption: 'Read it off the screen', script: 1, roman: ROMAN },
  { talk: 2, caption: 'Only a hint', script: 0, roman: hint(ROMAN) },
  { talk: 3, caption: 'Only a hint', script: 0, roman: hint(ROMAN) },
  { talk: 4, caption: 'From memory', script: 0, roman: '' },
];

/** What the grandchild sees when they want to say "Tell me more", talk after talk. */
export function FadeCard({ stage }: { stage: number }) {
  const st = STAGES[stage];
  const last = stage === STAGES.length - 1;
  return (
    <div className={`fade-card stage-${stage}`}>
      <p className="fade-prompt">Say: Tell me more.</p>
      <div className="fade-help" aria-hidden={last}>
        <p lang="ko" className="fade-script" style={{ opacity: st.script }}>{LINE}</p>
        <p className="fade-roman">{st.roman || ' '}</p>
      </div>
      <p className={`fade-said ${last ? 'show' : ''}`} lang="ko" aria-hidden={!last}>
        <span className="said-label">Said from memory:</span> {LINE}
      </p>
      <p className="fade-caption">Talk {st.talk}: {st.caption}</p>
    </div>
  );
}

export function FadeDemo({ auto = true }: { auto?: boolean }) {
  const [stage, setStage] = useState(0);
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!auto || touched || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (stage >= STAGES.length - 1) return;
    const t = setTimeout(() => setStage((s) => s + 1), 1700);
    return () => clearTimeout(t);
  }, [stage, auto, touched]);
  return (
    <figure className="fade-demo">
      <FadeCard stage={stage} />
      <div className="fade-tabs" role="tablist" aria-label="Talks">
        {STAGES.map((s, i) => (
          <button key={s.talk} role="tab" aria-selected={i === stage} onClick={() => { setTouched(true); setStage(i); }}>
            Talk {s.talk}
          </button>
        ))}
      </div>
      <figcaption>The help fades. The words stay.</figcaption>
    </figure>
  );
}
