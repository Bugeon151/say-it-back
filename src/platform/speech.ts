/**
 * Web Speech wrappers. Note: in Chrome, speech recognition is processed by the browser's speech service
 * (Google servers), unlike translation, which runs on the device. The app says so on screen.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type RecCtor = new () => any;
const Rec = (): RecCtor | undefined =>
  typeof window === 'undefined' ? undefined : (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

export const asrSupported = () => !!Rec();
export const ttsSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export interface Heard { text: string; alts: string[] }
export interface Listening { stop(): void; cancel(): void; result: Promise<Heard> }

/**
 * Listens in `locale`. `continuous` keeps listening (restarting after pauses) until stop() — for long answers.
 * Otherwise it returns after one utterance with up to 5 alternatives — for checking a phrase.
 */
export function listen(locale: string, opts: { continuous?: boolean; onInterim?: (t: string) => void } = {}): Listening {
  const Ctor = Rec();
  if (!Ctor) return { stop() {}, cancel() {}, result: Promise.reject(new Error('unsupported')) };
  const finals: string[] = [];
  let alts: string[] = [];
  let stopped = false;
  let fatal = '';
  let rec: any;
  let settle!: (h: Heard) => void;
  let fail!: (e: Error) => void;
  const result = new Promise<Heard>((res, rej) => { settle = res; fail = rej; });

  const begin = () => {
    rec = new Ctor();
    rec.lang = locale;
    rec.continuous = !!opts.continuous;
    rec.interimResults = true;
    rec.maxAlternatives = 5;
    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          finals.push(r[0].transcript.trim());
          if (!opts.continuous) alts = Array.from(r as ArrayLike<{ transcript: string }>, (a) => a.transcript.trim());
        } else interim += r[0].transcript;
      }
      opts.onInterim?.([...finals, interim.trim()].filter(Boolean).join(' '));
    };
    rec.onerror = (e: any) => { if (e.error !== 'no-speech' && e.error !== 'aborted') fatal = e.error; };
    rec.onend = () => {
      if (opts.continuous && !stopped && !fatal) { try { begin(); return; } catch { /* fall through */ } }
      if (fatal) fail(new Error(fatal));
      else {
        const text = finals.join(' ').trim();
        settle({ text, alts: alts.length ? alts : text ? [text] : [] });
      }
    };
    rec.start();
  };
  try { begin(); } catch (e) { fail(e as Error); }
  return {
    stop() { stopped = true; try { rec?.stop(); } catch { /* already stopped */ } },
    cancel() { stopped = true; fatal = 'aborted'; try { rec?.abort(); } catch { /* already stopped */ } },
    result,
  };
}

export function speak(text: string, locale: string, rate = 0.85): Promise<void> {
  if (!ttsSupported() || !text) return Promise.resolve();
  return new Promise((done) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale;
    u.rate = rate;
    const voices = speechSynthesis.getVoices();
    const lc = locale.toLowerCase();
    u.voice =
      voices.find((v) => v.lang.replace('_', '-').toLowerCase() === lc) ??
      voices.find((v) => v.lang.toLowerCase().startsWith(lc.slice(0, 2))) ??
      null;
    u.onend = u.onerror = () => done();
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
}

export const speechErrorText = (code: string) =>
  ({
    'not-allowed': 'The microphone is blocked. Allow it in the browser, or type instead.',
    'service-not-allowed': 'Speech recognition is turned off in this browser. You can type instead.',
    'audio-capture': 'No microphone was found. You can type instead.',
    network: 'Speech recognition needs an internet connection. You can type instead.',
    'language-not-supported': 'This browser cannot recognise speech in that language. You can type instead.',
    unsupported: 'This browser has no speech recognition. Try desktop Chrome, or type instead.',
  })[code] ?? 'Speech recognition stopped. You can try again or type instead.';
