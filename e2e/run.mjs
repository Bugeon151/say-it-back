// End-to-end test in real Chrome. Translator and speech recognition are replaced by scripted fakes
// (the real ones need Google's model downloads / speech servers); the microphone is Chrome's fake device.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
const SHOTS = new URL('./shots/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'} ${msg}`); if (!cond) failures++; };

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((res, rej) => {
  server.stdout.on('data', (d) => d.toString().includes(String(PORT)) && res());
  server.on('exit', () => rej(new Error('preview server exited')));
  setTimeout(() => rej(new Error('preview server timeout')), 20000);
});

const FAKES = () => {
  const dict = {
    '공기놀이를 제일 많이 했지. 돌멩이 다섯 개만 있으면 하루 종일 놀았어.': 'I played gonggi the most. With just five pebbles, we could play all day.',
    '공기놀이를 제일 많이 했지.': 'I played gonggi the most.',
    '우리 엄마는 손이 정말 빨랐어. 김치를 담그면 온 동네가 와서 먹었지.': 'My mom was really quick with her hands. When she made kimchi, the whole neighborhood came to eat.',
    'Did you have a dog?': '강아지 키우셨어요?',
  };
  window.__translated = [];
  window.Translator = {
    availability: async () => 'available',
    create: async ({ targetLanguage }) => ({
      translate: async (t) => { window.__translated.push(t); return dict[t] ?? `[${targetLanguage}] ${t}`; },
    }),
  };
  window.__asrQueue = [];
  const ev = (text, isFinal) => {
    const r = [{ transcript: text, confidence: 0.9 }, { transcript: `${text} 음`, confidence: 0.4 }];
    r.isFinal = isFinal;
    return { resultIndex: 0, results: [r] };
  };
  class FakeRec {
    start() {
      const text = window.__asrQueue.shift() ?? '';
      window.__lastLang = this.lang;
      setTimeout(() => {
        if (text) this.onresult?.(ev(text.slice(0, Math.ceil(text.length / 2)), false));
        if (!this.continuous) setTimeout(() => { if (text) this.onresult?.(ev(text, true)); this.onend?.(); }, 40);
        else this.pending = text;
      }, 30);
    }
    stop() {
      if (this.continuous) setTimeout(() => { if (this.pending) this.onresult?.(ev(this.pending, true)); this.pending = ''; this.onend?.(); }, 20);
    }
    abort() { this.onend?.(); }
  }
  window.SpeechRecognition = FakeRec;
  window.webkitSpeechRecognition = FakeRec;
};

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
});

async function newPage(fakes, viewport = { width: 1360, height: 900 }) {
  const ctx = await browser.newContext({ viewport, permissions: ['microphone'] });
  if (fakes) await ctx.addInitScript(FAKES);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
  return { ctx, page, errors };
}
const asr = (page, ...texts) => page.evaluate((t) => window.__asrQueue.push(...t), texts);
const shot = (page, name) => page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: true });

// 1. Home and tour
{
  const { ctx, page, errors } = await newPage(false);
  await page.goto(BASE);
  await page.getByRole('heading', { name: 'A translator that wants to disappear.' }).waitFor();
  ok(true, 'home hero renders');
  await page.waitForTimeout(5600);
  ok(await page.locator('.fade-said.show').isVisible(), 'hero fade demo reaches "from memory" stage');
  await shot(page, '01-home');
  await page.getByRole('button', { name: 'Take the one-minute tour' }).click();
  for (let i = 0; i < 6; i++) {
    if (i === 4) await shot(page, '02-tour-fade');
    await page.getByRole('button', { name: 'Next' }).click();
  }
  ok(await page.getByText('Four talks later, Mina says 60% of her lines without reading them.').isVisible(), 'tour ends on computed sample metric (60%)');
  await shot(page, '03-tour-end');
  await page.getByRole('button', { name: 'Explore the sample family' }).click();
  await page.getByText('This is a sample family.').waitFor();
  ok(true, 'sample family banner shown');
  ok(await page.locator('.headline-stat').innerText().then((t) => t.includes('60%') && t.includes('0%')), 'progress headline: 60% up from 0%');
  const bars = await page.locator('.bar-val').allInnerTexts();
  ok(JSON.stringify(bars) === JSON.stringify(['0%', '25%', '40%', '60%', '0%', '0%', '40%', '75%']), `sample bars ${bars.join(',')}`);
  await shot(page, '04-progress-sample');
  await page.getByRole('link', { name: 'Storybook' }).click();
  await page.locator('.entry').first().waitFor();
  ok((await page.locator('.entry').count()) === 14, 'storybook lists all 14 sample answers');
  await shot(page, '05-book');
  ok(errors.length === 0, `no console errors on home/tour/sample (${errors.join(' | ')})`);
  await ctx.close();
}

// 2. Live flow with fakes: setup → talk → keep words → practise → second talk → persistence
{
  const { ctx, page, errors } = await newPage(true);
  await page.goto(BASE + '#/setup');
  await page.getByLabel('Your first name').fill('Jun');
  await page.getByLabel('What you call them').fill('Halmoni');
  await page.getByLabel('The language they speak best').selectOption('ko');
  await page.getByText('Ready on this device').first().waitFor();
  ok((await page.getByText('Ready on this device').count()) === 2, 'both translation directions report ready');
  await page.getByRole('button', { name: 'Test the microphone' }).click();
  await page.getByText('Working').waitFor();
  ok(true, 'fake microphone works');
  await shot(page, '06-setup');
  await page.getByRole('button', { name: 'Start the first talk' }).click();
  await page.getByRole('heading', { name: 'Talk 1 with Halmoni' }).waitFor();

  // Ask a curated question
  await page.getByRole('button', { name: 'What games did you play when you were little?' }).click();
  ok(await page.locator('.card .elder-text').innerText() === '어렸을 때 무슨 놀이를 하셨어요?', 'question card shows curated Korean');
  ok((await page.locator('.card .roman').innerText()).startsWith('eo·ryeo·sseul'), 'question card shows romanisation');
  await page.getByRole('button', { name: 'I asked it' }).click();

  // Elder answers by voice (continuous recognition + recording)
  await asr(page, '공기놀이를 제일 많이 했지. 돌멩이 다섯 개만 있으면 하루 종일 놀았어.');
  await page.getByRole('button', { name: '눌러서 말씀하세요' }).click();
  await page.locator('.interim').waitFor();
  ok(await page.evaluate(() => window.__lastLang) === 'ko-KR', 'elder speech recognised in ko-KR');
  await page.getByRole('button', { name: '다 했어요' }).click();
  await page.locator('.bubble.elder').waitFor();
  ok((await page.locator('.bubble.elder .trans').innerText()).startsWith('I played gonggi'), 'elder answer translated on device');
  ok((await page.locator('.bubble.elder .play').count()) === 1, 'elder voice recorded and playable');
  ok((await page.locator('.q-follow').count()) > 0, 'follow-up suggestions appear');

  // Say a line with full help
  await page.getByRole('tab', { name: 'Say it yourself' }).click();
  await page.getByRole('button', { name: /Tell me more\./ }).click();
  ok(await page.locator('.attempt .elder-text').innerText() === '더 얘기해 주세요.', 'new line shows the full Korean (box 0)');
  await asr(page, '더 얘기해 주세요');
  await page.getByRole('button', { name: 'Say it', exact: true }).click();
  await page.locator('.meter').waitFor();
  ok((await page.locator('.meter span').innerText()).includes('100% match'), 'pronunciation check scores 100%');
  await shot(page, '07-talk-attempt');
  await page.getByRole('button', { name: '맞았어!' }).click();
  ok(await page.locator('.bubble.kid .tag.ok').count() === 1, 'confirmed line added to the talk');
  await shot(page, '08-talk');

  // Typed question via on-device translation
  await page.getByRole('tab', { name: 'Type', exact: true }).click();
  await page.getByLabel('Write what you want to say in English').fill('Did you have a dog?');
  await page.getByRole('button', { name: 'Show it in Korean' }).click();
  ok(await page.locator('.card .elder-text').innerText() === '강아지 키우셨어요?', 'typed English translated to Korean');
  await page.getByRole('button', { name: 'I asked it' }).click();

  // Finish → keep her words (with her voice)
  await page.getByRole('button', { name: 'Finish talk' }).click();
  await page.getByRole('heading', { name: 'Keep Halmoni’s words' }).waitFor();
  await page.locator('.pick-list li').first().waitFor();
  ok(await page.locator('.pick-list').first().innerText().then((t) => t.includes('공기놀이를 제일 많이 했지.')), 'short line from her answer offered');
  await page.locator('.pick-list').first().locator('input[type=checkbox]').first().check();
  await page.getByRole('button', { name: '녹음' }).click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: '멈춤' }).click();
  await page.getByText('Saved. Practice will use this recording.').waitFor();
  ok(true, 'her voice recorded for the phrase');
  await shot(page, '09-words');
  await page.getByRole('button', { name: /Keep 1 and practise/ }).click();

  // Practise: due phrases except the one already graded in this talk
  await page.getByText(/Practice after talk 1: 1 of/).waitFor();
  const total = Number((await page.getByText(/Practice after talk 1:/).innerText()).match(/of (\d+)/)[1]);
  ok(total === 3, `3 phrases to practise (got ${total})`);
  for (let i = 0; i < total; i++) {
    const target = await page.locator('.attempt .elder-text').innerText();
    await asr(page, target);
    await page.getByRole('button', { name: 'Say it', exact: true }).click();
    await page.locator('.meter').waitFor();
    await page.getByRole('button', { name: '맞았어!' }).click();
  }
  await page.getByRole('heading', { name: 'Practice done' }).waitFor();
  ok((await page.locator('.move.up').count()) === 3, 'all three phrases moved up a level');
  await page.getByRole('button', { name: 'See progress' }).click();
  ok((await page.locator('.bar-val').first().innerText()) === '0%', 'talk 1 direct speech is 0% (everything was read)');

  // Talk 2: hint only, listening mode
  await page.getByRole('button', { name: 'Start talk 2' }).click();
  await page.getByRole('heading', { name: 'Talk 2 with Halmoni' }).waitFor();
  await page.getByRole('checkbox').check();
  await asr(page, '우리 엄마는 손이 정말 빨랐어. 김치를 담그면 온 동네가 와서 먹었지.');
  await page.getByRole('button', { name: '눌러서 말씀하세요' }).click();
  await page.locator('.interim').waitFor();
  await page.getByRole('button', { name: '다 했어요' }).click();
  await page.getByRole('button', { name: 'Show what it means' }).waitFor();
  ok(true, 'listening mode hides the translation');
  ok(await page.getByRole('button', { name: 'What was your mom like?' }).isVisible(), 'kin follow-up: "What was your mom like?"');
  await page.getByRole('button', { name: 'Show what it means' }).click();
  ok((await page.locator('.bubble.elder .trans').innerText()).startsWith('My mom'), 'tap reveals the translation');
  await page.getByRole('tab', { name: 'Say it yourself' }).click();
  await page.getByRole('button', { name: /Tell me more\./ }).click();
  ok(await page.locator('.attempt .hint').innerText() === 'deo yae·__·___ ju·__·__.', 'box 1 shows only a pronunciation hint');
  ok((await page.locator('.attempt .elder-text').count()) === 0, 'box 1 hides the Korean line');
  await asr(page, '더 얘기해 주세여');
  await page.getByRole('button', { name: 'Say it', exact: true }).click();
  await page.locator('.meter').waitFor();
  const near = await page.locator('.meter span').innerText();
  ok(/Sounds right/.test(near), `near-miss pronunciation still passes (${near})`);
  await page.getByRole('button', { name: '맞았어!' }).click();
  await shot(page, '10-talk2');
  await page.getByRole('button', { name: 'Finish talk' }).click();
  await page.getByRole('heading', { name: 'Keep Halmoni’s words' }).waitFor();
  await page.getByRole('button', { name: 'Practise without new words' }).click();
  await page.goto(BASE + '#/progress');
  const vals = await page.locator('.bar-val').allInnerTexts();
  ok(vals[1] === '100%', `talk 2 direct speech 100% (${vals.join(',')})`);
  ok(vals[3] === '0%', 'talk 2 listening 0% after revealing');

  // Persistence across reload
  await page.reload();
  await page.locator('.headline-stat').waitFor();
  ok((await page.locator('h1').innerText()) === 'Jun and Halmoni', 'data survives a reload (IndexedDB)');
  await shot(page, '11-progress-live');
  await page.goto(BASE + '#/book');
  await page.locator('.entry').first().waitFor();
  ok((await page.locator('.entry').count()) === 2, 'storybook has both answers');
  await page.goto(BASE + '#/bench');
  await page.getByRole('button', { name: 'Run the check' }).click();
  await page.getByText(/26 sentences:/).waitFor();
  ok((await page.locator('.bench-table tbody tr').count()) === 26, 'translation benchmark runs 26 sentences');
  ok(errors.length === 0, `no console errors in live flow (${errors.join(' | ')})`);
  await ctx.close();
}

// 2b. A browser whose Translator API exists but never answers (seen in an embedded Chromium)
{
  const { ctx, page, errors } = await newPage(false);
  await ctx.addInitScript(() => {
    window.Translator = { availability: () => new Promise(() => {}), create: () => new Promise(() => {}) };
  });
  await page.goto(BASE);
  await page.getByText('On-device translation: not working in this browser').waitFor({ timeout: 10000 });
  ok(true, 'home reports a silent translation API as not working');
  await page.goto(BASE + '#/setup');
  await page.getByText(/not responding in this browser/).first().waitFor({ timeout: 10000 });
  ok(true, 'setup reports the silent API instead of hanging');
  await page.getByLabel('Your first name').fill('Jun');
  await page.getByLabel('What you call them').fill('Halmoni');
  await page.getByRole('button', { name: 'Start the first talk' }).click();
  await page.getByRole('button', { name: 'What games did you play when you were little?' }).click();
  ok(await page.locator('.card .elder-text').innerText() === '어렸을 때 무슨 놀이를 하셨어요?', 'built-in Korean still works without translation');
  await page.getByRole('button', { name: 'I asked it' }).click();
  await page.getByRole('button', { name: /Type what Halmoni said instead/ }).click();
  await page.getByLabel('Halmoni’s words, in Korean').fill('강아지를 키웠지.');
  const t0 = Date.now();
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByText('No translation is available in this browser.', { exact: false }).waitFor({ timeout: 15000 });
  ok(Date.now() - t0 < 12000, `falls back to typing the meaning within ${Date.now() - t0} ms`);
  await page.getByLabel('Meaning (optional)').fill('I had a dog.');
  await page.getByRole('button', { name: 'Keep it' }).click();
  ok((await page.locator('.bubble.elder .trans').innerText()) === 'I had a dog.', 'answer kept with the typed meaning');
  ok(errors.length === 0, `no console errors with a silent API (${errors.join(' | ')})`);
  await ctx.close();
}

// 3. Mobile layout and a browser without the fakes
{
  const { ctx, page, errors } = await newPage(false, { width: 390, height: 844 });
  await page.goto(BASE);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!overflow, 'no horizontal overflow on a phone');
  await shot(page, '12-mobile-home');
  await page.goto(BASE + '#/setup');
  await page.locator('.check').first().waitFor();
  await page.waitForFunction(() => !document.body.innerText.includes('Checking…'));
  const note = await page.locator('.check-note').first().innerText();
  console.log(`INFO real browser translation state: ${note}`);
  ok(note.length > 0, 'setup reports translation state in a browser without fakes');
  await shot(page, '13-mobile-setup');
  ok(errors.length === 0, `no console errors on mobile (${errors.join(' | ')})`);
  await ctx.close();
}

await browser.close();
server.kill();
console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
