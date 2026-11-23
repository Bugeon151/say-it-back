/**
 * Hand-written English ↔ Korean content. Korean lines a grandchild says are in the polite form (존댓말);
 * elder-facing buttons are in the casual voice a grandparent uses with a grandchild.
 * Other languages are translated on the device at run time.
 */
export interface Line { id: string; en: string; ko: string }

export const TOPICS: { id: string; en: string; questions: Line[] }[] = [
  { id: 'childhood', en: 'Childhood', questions: [
    { id: 'c1', en: 'What games did you play when you were little?', ko: '어렸을 때 무슨 놀이를 하셨어요?' },
    { id: 'c2', en: 'What did your house look like when you were my age?', ko: '제 나이였을 때 집은 어떻게 생겼어요?' },
    { id: 'c3', en: 'What were you afraid of as a child?', ko: '어렸을 때 뭐가 제일 무서웠어요?' },
  ] },
  { id: 'family', en: 'Family', questions: [
    { id: 'f1', en: 'What was your mother like?', ko: '어머니는 어떤 분이셨어요?' },
    { id: 'f2', en: 'What was your father like?', ko: '아버지는 어떤 분이셨어요?' },
    { id: 'f3', en: 'What did your family do together on holidays?', ko: '명절에 가족이랑 같이 뭐 하셨어요?' },
  ] },
  { id: 'school', en: 'School', questions: [
    { id: 's1', en: 'What was school like for you?', ko: '학교 다닐 때 어떠셨어요?' },
    { id: 's2', en: 'Who was your best friend?', ko: '제일 친한 친구는 누구였어요?' },
    { id: 's3', en: 'What did you want to be when you grew up?', ko: '어렸을 때 꿈이 뭐였어요?' },
  ] },
  { id: 'food', en: 'Food', questions: [
    { id: 'd1', en: 'What food reminds you of home?', ko: '어떤 음식을 먹으면 고향 생각이 나세요?' },
    { id: 'd2', en: 'Who taught you to cook?', ko: '요리는 누구한테 배우셨어요?' },
    { id: 'd3', en: 'What is the best meal you ever had?', ko: '지금까지 먹은 것 중에 제일 맛있었던 건 뭐예요?' },
  ] },
  { id: 'love', en: 'Love', questions: [
    { id: 'l1', en: 'Who was your first love?', ko: '첫사랑은 누구였어요?' },
    { id: 'l2', en: 'What was your wedding day like?', ko: '결혼식 날은 어땠어요?' },
    { id: 'l3', en: 'What makes a good marriage?', ko: '좋은 부부가 되려면 뭐가 제일 중요해요?' },
  ] },
  { id: 'work', en: 'Work', questions: [
    { id: 'w1', en: 'What was your first job?', ko: '처음 하신 일은 뭐였어요?' },
    { id: 'w2', en: 'What was the hardest work you ever did?', ko: '지금까지 하신 일 중에 제일 힘들었던 건 뭐예요?' },
    { id: 'w3', en: 'What are you most proud of?', ko: '살면서 제일 자랑스러운 일은 뭐예요?' },
  ] },
  { id: 'moving', en: 'Moving here', questions: [
    { id: 'm1', en: 'Why did you decide to move to a new country?', ko: '왜 다른 나라로 오기로 하셨어요?' },
    { id: 'm2', en: 'What did you miss most after you moved?', ko: '외국에 와서 뭐가 제일 그리웠어요?' },
    { id: 'm3', en: 'What was your first day here like?', ko: '여기 처음 온 날은 어땠어요?' },
  ] },
  { id: 'wisdom', en: 'Wisdom', questions: [
    { id: 'a1', en: 'Is there anything you want to tell me?', ko: '저한테 해 주고 싶은 말이 있어요?' },
    { id: 'a2', en: 'What do you want our family to remember?', ko: '우리 가족이 꼭 기억했으면 하는 게 있어요?' },
    { id: 'a3', en: 'When were you happiest in your life?', ko: '살면서 언제 제일 행복하셨어요?' },
  ] },
];

export const QUESTIONS: Line[] = TOPICS.flatMap((t) => t.questions);

/** "Your lines": short polite phrases that keep a conversation going. */
export const STARTERS: Line[] = [
  { id: 'st1', en: 'Tell me more.', ko: '더 얘기해 주세요.' },
  { id: 'st2', en: 'Really?', ko: '정말요?' },
  { id: 'st3', en: 'Thank you for telling me.', ko: '얘기해 주셔서 고마워요.' },
  { id: 'st4', en: 'What happened next?', ko: '그다음엔 어떻게 됐어요?' },
  { id: 'st5', en: 'How did you feel?', ko: '그때 기분이 어떠셨어요?' },
  { id: 'st6', en: 'Please say it slowly.', ko: '천천히 말씀해 주세요.' },
  { id: 'st7', en: 'One more time, please.', ko: '한 번만 더 말씀해 주세요.' },
  { id: 'st8', en: 'I understand.', ko: '알겠어요.' },
  { id: 'st9', en: 'That is amazing!', ko: '대단하세요!' },
  { id: 'st10', en: 'I love you.', ko: '사랑해요.' },
  { id: 'st11', en: 'I missed you.', ko: '보고 싶었어요.' },
  { id: 'st12', en: 'Have you eaten?', ko: '식사하셨어요?' },
];
export const FIRST_STARTERS = ['st1', 'st2', 'st3'];

/** Follow-up questions, chosen from keywords in the English translation of the elder's answer. */
export interface FollowRule { id: string; re: RegExp; en: string; ko: string }
export const FOLLOW_RULES: FollowRule[] = [
  { id: 'fu-move', re: /\b(moved?|came (here|to)|left|ship|plane|airport|immigra\w*)\b/i, en: 'What did you bring with you?', ko: '그때 뭘 가지고 오셨어요?' },
  { id: 'fu-hard', re: /\b(war|hungry|hunger|poor|hard|difficult|sick|tired)\b/i, en: 'How did you get through that?', ko: '그때 어떻게 견디셨어요?' },
  { id: 'fu-food', re: /\b(food|ate|eat|cook\w*|kimchi|rice|soup|dish|meal|noodles?|jajangmyeon)\b/i, en: 'Can you teach me how to make it?', ko: '그거 만드는 법 가르쳐 주실래요?' },
  { id: 'fu-love', re: /\b(married|wedding|met|love)\b/i, en: 'How did you two meet?', ko: '두 분은 어떻게 만나셨어요?' },
  { id: 'fu-work', re: /\b(work\w*|job|factory|farm|shop|store|business)\b/i, en: 'What was a normal day at work like?', ko: '일할 때 하루가 보통 어땠어요?' },
  { id: 'fu-sad', re: /\b(sad|cried|cry|miss\w*|lonely|scared|afraid)\b/i, en: 'Who helped you then?', ko: '그때 누가 도와줬어요?' },
  { id: 'fu-happy', re: /\b(happy|happiest|laugh\w*|fun|best|proud)\b/i, en: 'What made it so special?', ko: '그게 왜 그렇게 특별했어요?' },
  { id: 'fu-age', re: /\b(\d{4}|years? old|when i was|young)\b/i, en: 'How old were you then?', ko: '그때 몇 살이셨어요?' },
  { id: 'fu-place', re: /\b(village|town|city|river|mountain|sea|yard|house|home)\b/i, en: 'What was that place like?', ko: '거기는 어떤 곳이었어요?' },
];
export const FOLLOW_GENERIC: Line[] = [
  { id: 'st4', en: 'What happened next?', ko: '그다음엔 어떻게 됐어요?' },
  { id: 'fu-who', en: 'Who was with you?', ko: '그때 누구랑 같이 있었어요?' },
  { id: 'st5', en: 'How did you feel?', ko: '그때 기분이 어떠셨어요?' },
];
export const KIN: Record<string, string> = {
  mother: '어머니', mom: '어머니', father: '아버지', dad: '아버지', brother: '형제분', brothers: '형제분',
  sister: '자매분', sisters: '자매분', grandmother: '할머니', grandfather: '할아버지', friend: '친구', teacher: '선생님',
  husband: '남편분', wife: '아내분', aunt: '이모나 고모', uncle: '삼촌',
};

/** Buttons and prompts the elder reads. Korean is hand-written; other languages are translated on the device. */
export const ELDER_UI: Record<string, Line> = {
  speak: { id: 'speak', en: 'Tap and talk', ko: '눌러서 말씀하세요' },
  done: { id: 'done', en: 'Done', ko: '다 했어요' },
  listening: { id: 'listening', en: 'Listening…', ko: '듣고 있어요…' },
  correct: { id: 'correct', en: 'Got it!', ko: '맞았어!' },
  again: { id: 'again', en: 'Try again', ko: '다시 해 보자' },
  judge: { id: 'judge', en: 'Did it sound right?', ko: '제대로 들렸어요?' },
  readThis: { id: 'readThis', en: 'Please read this aloud', ko: '이 말을 소리 내어 읽어 주세요' },
  record: { id: 'record', en: 'Record', ko: '녹음' },
  stop: { id: 'stop', en: 'Stop', ko: '멈춤' },
  yourTurn: { id: 'yourTurn', en: 'Your turn to talk', ko: '말씀하실 차례예요' },
  trying: { id: 'trying', en: 'Your grandchild is saying:', ko: '손주가 이렇게 말하고 있어요:' },
};
