# Say It Back

**A translator that wants to disappear.**

Say It Back helps a grandchild talk with a grandparent who speaks another language. It translates while they talk, keeps the grandparent's words in the grandparent's own voice, and shows the grandchild a little less help each time, until the grandchild can say it without the app.

Built for the CSC Winter Sparkathon 2026 (theme: technology that brings people together or helps people support one another).

## The problem

- One in four children in the United States has at least one immigrant parent (Migration Policy Institute, 26% of children, 2017 data).
- In home workshops with 28 grandparents and grandchildren from immigrant families, grandchildren often understood the family language but did not speak it, and some grandparents stopped listening when they answered only in English (Liaqat, Axtell & Munteanu, CSCW 2021).
- Older immigrants from countries with a different language and culture are significantly lonelier than those from similar ones (De Jong Gierveld, Van der Pas & Keating, 2015).

A translation app gets a family through one conversation and leaves the gap where it was. Good teaching does the opposite: it gives help and then takes it away as the learner needs it less ("fading", Wood, Bruner & Ross, 1976). Say It Back applies that to a real conversation with a real grandparent.

## What it does

1. **Talk.** The grandchild picks a question (24 built in, plus follow-ups suggested from the last answer) or types one. It appears in the grandparent's language with pronunciation, and the grandchild reads it aloud. The grandparent answers with one big button; the answer is transcribed, translated on the device and recorded.
2. **Keep their words.** After the talk, the app offers short lines the grandparent actually said. The grandchild keeps up to three, and the grandparent says each one again so practice uses their voice.
3. **Say it back.** The grandchild practises. Speech recognition suggests a score; **the grandparent decides** with "Got it!" or "Try again". Every line that is right comes back next time with less help.

| Level | What the grandchild sees | Comes back after |
|---|---|---|
| 0 Reading it | Full line, pronunciation, meaning | next talk |
| 1 With a hint | First sound of each word, meaning | 2 talks |
| 2 Almost there | First sound of each word, meaning | 4 talks |
| 3 From memory | Meaning only | 8 talks |

Only the first verdict in a talk moves a line, so nothing jumps from "new" to "from memory" in one sitting.

Two measures show whether the gap is closing:

- **Direct speech**: the share of the grandchild's lines said in the grandparent's language with only a hint or from memory, and confirmed by the grandparent.
- **Listening**: the share of the grandparent's answers understood while the translation was hidden ("Hide the English until I tap").

There is also a storybook of every answer, with the original words, the translation and the recorded voice, ready to print.

## How it is built

- React, TypeScript and Vite; a static site with no server.
- **Translation:** Chrome's built-in Translator API (on device, Chrome 138+ / Edge 148+ desktop). Questions, starter lines, follow-ups and grandparent-facing buttons are hand-written in English and Korean; other languages are translated on the device.
- **Speech:** Web Speech API for recognition (continuous for answers, five alternatives for practice) and for reading lines aloud; MediaRecorder for the grandparent's voice.
- **Pronunciation score:** edit distance at the level of Korean letters (jamo), with extra words around the phrase allowed. See the evaluation below.
- **Korean pronunciation guide:** Revised Romanization with the sound changes a learner hears (linking, nasalisation, ㄹ assimilation, ㅎ aspiration, palatalisation), split into syllables.
- **Storage:** IndexedDB in the browser. No account.

## Evaluation

- `npm test`: 43 unit tests (scoring, fading schedule, romanisation, measures, follow-ups, line extraction).
- `npm run e2e`: 40 checks in real Chrome covering the tour, the sample family, a full first and second talk, keeping words with a recorded voice, practice, listening mode, persistence after reload, the phone layout and a browser without the fakes. Translation and speech recognition are replaced by scripted fakes because the real ones need Google's model download and speech servers.
- `npx vite-node scripts/eval-match.ts`: the pronunciation score on 664 synthetic Korean text pairs (results in `docs/eval-match.json`). These are text pairs, not recordings, so they test the scoring, not speech recognition.

| Pairs | n | Accepted (letter level) | Accepted (syllable level) |
|---|---|---|---|
| Same line, reformatted | 36 | 36 | 36 |
| One learner-style slip (e.g. ㅓ/ㅗ, ㄱ/ㅋ) | 125 | 125 | 113 |
| Two slips | 72 | 60 | 25 |
| A different line | 420 | 0 | 0 |
| Only the first half | 11 | 0 | 0 |

- `#/bench` in the app times Chrome's on-device translation on 26 sentences on your own computer and lets you copy the results.

## Privacy

Talks, phrases and recordings stay in the browser (IndexedDB). Translation runs on the device. Speech recognition uses the browser's speech service, which in Chrome means Google's servers; the app says so on screen. "Delete everything on this device" removes all data.

## Limits

- The sample family is fictional and labelled as such.
- Real-family testing has not been done yet.
- Machine translation and speech recognition make mistakes, especially with older voices and dialects. Answers can be corrected by typing, and the original voice is always kept.
- Hand-written content exists for English and Korean only.

## Run it

```bash
npm ci
npm run dev        # http://localhost:5173
npm test
npm run build && npm run e2e   # needs Google Chrome at /usr/bin/google-chrome
```

## Sources

- Migration Policy Institute, press release on children with immigrant parents (2017 data): https://www.migrationpolicy.org/press-release/more-us-children-having-immigrant-parents-and-amid-rising-immigration-enforcement
- Liaqat, A., Axtell, B., & Munteanu, C. (2021). Participatory Design for Intergenerational Culture Exchange in Immigrant Families. *Proc. ACM HCI* 5 (CSCW1), Article 98. https://www.cs.toronto.edu/~aliaqat/assets/img/papers/p7.pdf
- De Jong Gierveld, J., Van der Pas, S., & Keating, N. (2015). Loneliness of Older Immigrant Groups in Canada. *Journal of Cross-Cultural Gerontology* 30(3), 251–268.
- Wood, D., Bruner, J. S., & Ross, G. (1976). The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry* 17(2), 89–100. https://doi.org/10.1111/j.1469-7610.1976.tb00381.x
- Chrome Translator API: https://developer.chrome.com/docs/ai/translator-api

## License

MIT
