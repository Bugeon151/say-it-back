/** A fictional sample family, labelled as such in the app, so anyone can explore without a partner or a microphone. */
import type { AppData, Phrase, Session, Turn } from '../core/types';

let n = 0;
const T0 = Date.UTC(2026, 9, 4, 17);
const kid = (orig: string, trans: string, support: 0 | 1 | 2, extra: Partial<Turn> = {}): Turn => ({
  id: `sk${++n}`, speaker: 'kid', at: T0 + n * 60000, orig, lang: 'ko', trans, support, inElderLang: true, ok: true, ...extra,
});
const elder = (orig: string, trans: string, extra: Partial<Turn> = {}): Turn => ({
  id: `se${++n}`, speaker: 'elder', at: T0 + n * 60000, orig, lang: 'ko', trans, ...extra,
});
const session = (index: number, turns: Turn[]): Session => ({
  id: `ss${index}`, index, startedAt: T0 + index * 7 * 86400000, endedAt: T0 + index * 7 * 86400000 + 1200000, turns,
});

const sessions: Session[] = [
  session(1, [
    kid('어렸을 때 무슨 놀이를 하셨어요?', 'What games did you play when you were little?', 2),
    elder('공기놀이를 제일 많이 했지. 돌멩이 다섯 개만 있으면 하루 종일 놀았어.', 'I played gonggi the most. With just five pebbles, we could play all day.'),
    kid('더 얘기해 주세요.', 'Tell me more.', 2, { phraseId: 'st1' }),
    elder('언니들이랑 마당에서 했는데, 내가 제일 잘했어.', 'I played in the yard with my big sisters, and I was the best at it.'),
    kid('얘기해 주셔서 고마워요.', 'Thank you for telling me.', 2, { phraseId: 'st3' }),
  ]),
  session(2, [
    kid('어머니는 어떤 분이셨어요?', 'What was your mother like?', 2),
    elder('우리 엄마는 손이 정말 빨랐어. 김치를 담그면 온 동네가 와서 먹었지.', 'My mom was really quick with her hands. When she made kimchi, the whole neighborhood came to eat.'),
    kid('더 얘기해 주세요.', 'Tell me more.', 1, { phraseId: 'st1' }),
    elder('겨울마다 배추를 백 포기씩 담갔어. 나는 옆에서 소금만 뿌렸지.', 'Every winter she made kimchi with a hundred heads of cabbage. I just sprinkled the salt next to her.'),
    kid('그거 만드는 법 가르쳐 주실래요?', 'Can you teach me how to make it?', 2),
    elder('그럼, 다음에 같이 담그자.', 'Sure, let’s make it together next time.'),
    kid('얘기해 주셔서 고마워요.', 'Thank you for telling me.', 2, { phraseId: 'st3' }),
  ]),
  session(3, [
    kid('왜 다른 나라로 오기로 하셨어요?', 'Why did you decide to move to a new country?', 2),
    elder('너희 엄마 공부시키려고 왔지. 1988년에 LA에 왔어.', 'I came so your mom could study. We came to LA in 1988.'),
    kid('정말요?', 'Really?', 1, { phraseId: 'st2' }),
    elder('비행기를 처음 타 봤는데, 너무 무서워서 한숨도 못 잤어.', 'It was my first time on a plane, and I was so scared I didn’t sleep a wink.', { hidden: true }),
    kid('그때 기분이 어떠셨어요?', 'How did you feel?', 2, { phraseId: 'st5' }),
    elder('무섭기도 하고 설레기도 했지.', 'I was scared and excited at the same time.', { hidden: true, revealed: true }),
    kid('더 얘기해 주세요.', 'Tell me more.', 1, { phraseId: 'st1' }),
    elder('공항에서 너희 할아버지가 짜장면을 사 줬어. 그 맛을 아직도 기억해.', 'At the airport, your grandpa bought me jajangmyeon. I still remember how it tasted.', { hidden: true, revealed: true }),
    kid('여기 처음 온 날은 어땠어요?', 'What was your first day here like?', 2),
    elder('집에 오자마자 김치부터 담갔지.', 'As soon as we got home, the first thing I did was make kimchi.', { hidden: true }),
  ]),
  session(4, [
    kid('식사하셨어요?', 'Have you eaten?', 1, { phraseId: 'st12' }),
    elder('그럼, 먹었지. 너는 밥 먹었어?', 'Of course I ate. Did you eat?', { hidden: true }),
    kid('살면서 언제 제일 행복하셨어요?', 'When were you happiest in your life?', 2),
    elder('너희 엄마가 대학 졸업하던 날. 그날 많이 울었어.', 'The day your mom graduated from college. I cried a lot that day.', { hidden: true, revealed: true }),
    kid('정말요?', 'Really?', 1, { phraseId: 'st2' }),
    elder('그럼. 그래서 여기 온 게 하나도 안 아까워.', 'Of course. That’s why I don’t regret coming here one bit.', { hidden: true }),
    kid('얘기해 주셔서 고마워요.', 'Thank you for telling me.', 0, { phraseId: 'st3' }),
    kid('저한테 해 주고 싶은 말이 있어요?', 'Is there anything you want to tell me?', 2),
    elder('천천히 해도 돼. 할머니 말 배우는 것도 천천히.', 'It’s okay to take it slow. Learning Grandma’s language, too — slowly.', { hidden: true }),
  ]),
];

const ph = (id: string, elder: string, kidText: string, source: Phrase['source'], box: Phrase['box'], due: number, created: number, oks: number[]): Phrase => ({
  id, elder, kid: kidText, source, box, due, createdSession: created, history: oks.map((s) => ({ session: s, ok: true })),
});

const phrases: Phrase[] = [
  ph('st1', '더 얘기해 주세요.', 'Tell me more.', 'starter', 3, 12, 1, [1, 2, 4]),
  ph('st3', '얘기해 주셔서 고마워요.', 'Thank you for telling me.', 'starter', 3, 12, 1, [1, 2, 4]),
  ph('st2', '정말요?', 'Really?', 'starter', 2, 8, 1, [1, 4]),
  ph('st12', '식사하셨어요?', 'Have you eaten?', 'starter', 2, 8, 2, [2, 4]),
  ph('st5', '그때 기분이 어떠셨어요?', 'How did you feel?', 'starter', 1, 5, 3, [3]),
  ph('hw1', '공기놀이', 'gonggi, the five-pebble game', 'her-words', 2, 7, 1, [1, 3]),
  ph('hw2', '다음에 같이 담그자.', 'Let’s make it together next time.', 'her-words', 1, 4, 2, [2]),
  ph('hw3', '천천히 해도 돼.', 'It’s okay to take it slow.', 'her-words', 0, 4, 4, []),
];

export const sampleData = (): AppData => ({
  family: { id: 'sample', kidName: 'Mina', elderName: 'Halmoni', kidLang: 'en', elderLang: 'ko', createdAt: T0 },
  sessions: structuredClone(sessions),
  phrases: structuredClone(phrases),
  listenMode: true,
  sample: true,
});
