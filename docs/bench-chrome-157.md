# On-device translation in desktop Chrome 157

Run on November 24, 2026 with `#/bench` on the live app, after the English and Korean language pack was downloaded. Chrome's built-in Translator API translated each sentence on the computer. The timings come from one run on one computer.

**26 sentences: median 10 ms, 90th percentile 17 ms, slowest 44 ms** (nearest-rank values, as the app reports them).

## What the machine translation got wrong

- **Politeness (English to Korean).** 10 of the 12 questions used 당신 for "you", and none used the honorific verb form (-시-). Korean speakers use that form when they talk to a grandparent, and 당신 sounds rude in that situation. This is why the questions and lines the grandchild says are written by hand, for example 어렸을 때 무슨 놀이를 하셨어요?
- **Meaning (Korean to English).** Most answers came out understandable, with some mistakes. 공기놀이 (a pebble game) became "played in the air". 담그자 (let's make it, about kimchi) became "let's soak it". In 김치를 담그면, the grandmother's mother became "I". The app always keeps the grandparent's own words and voice next to the translation, and the meaning can be corrected by typing.

## Results

| Direction | Source | Translation | ms |
|---|---|---|---|
| ko→en | 공기놀이를 제일 많이 했지. 돌멩이 다섯 개만 있으면 하루 종일 놀았어. | I played the most in the air. I played all day with only five stones. | 44 |
| ko→en | 언니들이랑 마당에서 했는데, 내가 제일 잘했어. | I did it in the yard with my sisters, and I did the best. | 12 |
| ko→en | 우리 엄마는 손이 정말 빨랐어. 김치를 담그면 온 동네가 와서 먹었지. | My mom's hands were really fast. When I made kimchi, the whole town came and ate it. | 17 |
| ko→en | 겨울마다 배추를 백 포기씩 담갔어. 나는 옆에서 소금만 뿌렸지. | Every winter, I made a hundred cabbage. I only sprinkled salt on the side. | 13 |
| ko→en | 그럼, 다음에 같이 담그자. | So, let's soak it together next time. | 16 |
| ko→en | 너희 엄마 공부시키려고 왔지. 1988년에 LA에 왔어. | I'm here to make your mom study. I came to LA in 1988. | 14 |
| ko→en | 비행기를 처음 타 봤는데, 너무 무서워서 한숨도 못 잤어. | It was the first time I rode a plane, and I couldn't sleep because I was so scared. | 15 |
| ko→en | 무섭기도 하고 설레기도 했지. | It was scary and exciting. | 7 |
| ko→en | 공항에서 너희 할아버지가 짜장면을 사 줬어. 그 맛을 아직도 기억해. | At the airport, your grandfather bought me jjajangmyeon. I still remember that taste. | 15 |
| ko→en | 집에 오자마자 김치부터 담갔지. | As soon as I got home, I started making kimchi. | 9 |
| ko→en | 그럼, 먹었지. 너는 밥 먹었어? | Well, I ate it. Have you eaten? | 9 |
| ko→en | 너희 엄마가 대학 졸업하던 날. 그날 많이 울었어. | The day your mom graduated from college. I cried a lot that day. | 10 |
| ko→en | 그럼. 그래서 여기 온 게 하나도 안 아까워. | Well then. That's why I don't mind coming here at all. | 12 |
| ko→en | 천천히 해도 돼. 할머니 말 배우는 것도 천천히. | You can do it slowly. Slowly learning to speak grandma. | 14 |
| en→ko | What games did you play when you were little? | 어렸을 때 어떤 게임을 했습니까? | 23 |
| en→ko | What did your house look like when you were my age? | 당신이 내 나이였을 때 당신의 집은 어떻게 생겼습니까? | 12 |
| en→ko | What were you afraid of as a child? | 당신은 어렸을 때 무엇을 두려워 했습니까? | 9 |
| en→ko | What was your mother like? | 당신의 어머니는 어땠나요? | 7 |
| en→ko | What was your father like? | 당신의 아버지는 어땠나요? | 7 |
| en→ko | What did your family do together on holidays? | 당신의 가족은 휴일에 함께 무엇을 했습니까? | 9 |
| en→ko | What was school like for you? | 당신에게 학교는 어땠나요? | 7 |
| en→ko | Who was your best friend? | 당신의 가장 친한 친구는 누구였습니까? | 8 |
| en→ko | What did you want to be when you grew up? | 당신은 커서 무엇이 되고 싶었습니까? | 9 |
| en→ko | What food reminds you of home? | 집이 생각나는 음식은? | 8 |
| en→ko | Who taught you to cook? | 누가 당신에게 요리를 가르쳤습니까? | 8 |
| en→ko | What is the best meal you ever had? | 당신이 가진 최고의 식사는 무엇입니까? | 7 |
