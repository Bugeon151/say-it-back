import { useEffect, useState } from 'react';
import { useStore } from '../state';
import { pairState, type PairState } from '../platform/translator';
import { asrSupported, ttsSupported } from '../platform/speech';
import { recorderSupported } from '../platform/recorder';
import { Btn, go } from '../ui/kit';
import { FadeDemo } from '../ui/fade-demo';
import { APP_NAME, REPO_URL } from '../config';

const EVIDENCE = [
  {
    fact: 'One in four children in the United States has at least one immigrant parent.',
    src: 'Migration Policy Institute (26% of children, 2017 data)',
    href: 'https://www.migrationpolicy.org/press-release/more-us-children-having-immigrant-parents-and-amid-rising-immigration-enforcement',
  },
  {
    fact: 'In home workshops with 28 grandparents and grandchildren from immigrant families, grandchildren often understood the family language but did not speak it, and some grandparents stopped listening when they answered only in English.',
    src: 'Liaqat, Axtell & Munteanu, CSCW 2021',
    href: 'https://www.cs.toronto.edu/~aliaqat/assets/img/papers/p7.pdf',
  },
  {
    fact: 'Older immigrants from countries with a different language and culture are significantly lonelier than those from similar ones.',
    src: 'De Jong Gierveld, Van der Pas & Keating, Journal of Cross-Cultural Gerontology, 2015',
    href: 'https://paperity.org/p/63313055/loneliness-of-older-immigrant-groups-in-canada-effects-of-ethnic-cultural-background',
  },
];

export default function Home() {
  const { data, openSample } = useStore();
  const own = data && !data.sample;
  const [tr, setTr] = useState<PairState | null>(null);
  useEffect(() => { void pairState('en', 'ko').then(setTr); }, []);
  const trText = tr === null ? 'checking…' : tr === 'available' ? 'ready here' : tr === 'downloadable' || tr === 'downloading' ? 'needs a one-time download' : 'not working in this browser';
  const caps: [string, boolean, string?][] = [
    ['On-device translation', tr === 'available' || tr === 'downloadable' || tr === 'downloading', trText],
    ['Speech recognition', asrSupported()],
    ['Voice recording', recorderSupported()],
    ['Reading aloud', ttsSupported()],
  ];
  return (
    <main className="home">
      <section className="hero">
        <div className="hero-text">
          <h1>A translator that wants to disappear.</h1>
          <p className="lede">
            {APP_NAME} helps you talk with a grandparent who speaks another language. It translates while you talk,
            keeps their words in their voice, and gives you a little less help each time, until you can say it yourself.
          </p>
          <div className="row">
            {own ? (
              <Btn variant="kid" onClick={() => go('/progress')}>Continue with {data.family.elderName}</Btn>
            ) : (
              <Btn variant="kid" onClick={() => go('/setup')}>Start with your grandparent</Btn>
            )}
            <Btn variant="ghost" onClick={() => go('/tour')}>Take the one-minute tour</Btn>
          </div>
          {!own && (
            <button type="button" className="link" onClick={() => { openSample(); go('/progress'); }}>
              Or explore a sample family, no microphone needed
            </button>
          )}
        </div>
        <FadeDemo />
      </section>

      <section className="how" aria-labelledby="how">
        <h2 id="how">How a talk works</h2>
        <ol className="steps">
          <li>
            <h3>Talk</h3>
            <p>Pick a question in your language and read it aloud in theirs. Their answer is written down and translated on this device.</p>
          </li>
          <li>
            <h3>Keep their words</h3>
            <p>Afterwards, choose a few short things they said. They say each one again so you have it in their voice.</p>
          </li>
          <li>
            <h3>Say it back</h3>
            <p>Practise with their voice. They decide if it sounded right. Every line you get right shows up with less help next time.</p>
          </li>
        </ol>
      </section>

      <section className="why" aria-labelledby="why">
        <h2 id="why">Why not just use a translation app?</h2>
        <p className="lede narrow">A translation app gets you through one conversation and leaves the gap exactly where it was. Good teaching works the other way: give help, then take it away as the learner needs it less. Teachers call this fading.</p>
        <ul className="evidence">
          {EVIDENCE.map((e) => (
            <li key={e.href}>
              <p>{e.fact}</p>
              <a href={e.href} target="_blank" rel="noreferrer">{e.src}</a>
            </li>
          ))}
        </ul>
      </section>

      <section className="measures" aria-labelledby="measures">
        <h2 id="measures">What it measures</h2>
        <dl>
          <div><dt>Direct speech</dt><dd>The share of your lines said in their language with only a hint or from memory, and confirmed by them.</dd></div>
          <div><dt>Listening</dt><dd>The share of their answers you understood with the translation hidden.</dd></div>
        </dl>
      </section>

      <section className="needs" aria-labelledby="needs">
        <h2 id="needs">What you need</h2>
        <p>Desktop Chrome 138 or later (or Edge 148 or later) and a microphone. The tour and the sample family work in any browser.</p>
        <ul className="caps">
          {caps.map(([label, ok, text]) => (
            <li key={label} className={ok ? 'cap-ok' : 'cap-no'}>{label}: {text ?? (ok ? 'available here' : 'not in this browser')}</li>
          ))}
        </ul>
        <p className="muted">Your talks, phrases and recordings stay in this browser. There is no account. Translation runs on your device; speech recognition uses your browser’s speech service, which in Chrome means Google’s servers.</p>
      </section>

      <footer className="foot">
        <p>Made for the CSC Winter Sparkathon 2026.{REPO_URL && <> <a href={REPO_URL}>Source code</a></>}</p>
      </footer>
    </main>
  );
}
