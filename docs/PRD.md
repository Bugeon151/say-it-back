# Say It Back: product requirements

## Problem
Grandchildren in immigrant families often understand but cannot speak the grandparent's language, and grandparents may stop trying to talk with them. Translation apps make one conversation possible but leave the gap in place.

## Users
- Grandchild, 13–18, most comfortable in English (or Korean for families in Korea).
- Grandparent who speaks another language best. Needs large text, few buttons, and no reading in English.
- Both sit side by side at one computer.

## Goal
Each talk should need less translation than the one before, while the grandparent's stories are kept.

## Measures
- Direct speech per talk: grandchild lines said in the grandparent's language with a hint or from memory and confirmed by the grandparent, over all grandchild lines.
- Listening per talk: grandparent answers understood with the translation hidden, over all grandparent answers.
- Lines at level 3 ("from memory").

## Scope
| Priority | Feature | Status |
|---|---|---|
| P0 | Setup with language pair and browser checks (translation, speech, microphone) | Done |
| P0 | Talk: questions, follow-ups, typed questions, grandparent's talk button with transcription, translation and recording | Done |
| P0 | Keep their words: short lines from the answers, recorded in the grandparent's voice | Done |
| P0 | Practice and in-talk lines with fading help and the grandparent's verdict | Done |
| P0 | Progress: both measures per talk, lines by level | Done |
| P0 | Storybook with print | Done |
| P0 | Sample family and one-minute tour that work in any browser | Done |
| P1 | Listening mode (hide the translation until tapped) | Done |
| P1 | On-device translation benchmark page | Done |
| Later | Video-call mode for families far apart; sharing the storybook with relatives; hand-written content beyond Korean | Not started |

## Non-goals
Accounts, cloud sync, grading the grandparent's speech, replacing language classes.

## Risks
| Risk | Mitigation |
|---|---|
| Browser lacks on-device translation | Built-in Korean content, typed meanings, sample family and tour everywhere |
| Speech recognition errors with older voices | Editable typing path, original voice kept, the grandparent decides |
| Machine translation tone (e.g. Korean politeness) | Hand-written polite lines for everything the grandchild says by default |
| No real-family validation yet | Pilot protocol in `PILOT.md` |
