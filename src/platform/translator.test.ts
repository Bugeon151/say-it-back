import { LIMITS, pairState, translate } from './translator';

describe('translator fallbacks', () => {
  afterEach(() => { delete (window as { Translator?: unknown }).Translator; });

  it('reports an API that never answers as unresponsive instead of waiting forever', async () => {
    LIMITS.check = 50;
    (window as { Translator?: unknown }).Translator = { availability: () => new Promise(() => {}), create: () => new Promise(() => {}) };
    await expect(pairState('ko', 'en')).resolves.toBe('unresponsive');
    await expect(translate('안녕하세요 할머니', 'ko', 'en')).resolves.toBeNull();
  });

  it('times out a translation that never finishes', async () => {
    LIMITS.check = 50; LIMITS.ready = 50; LIMITS.translate = 50;
    (window as { Translator?: unknown }).Translator = {
      availability: async () => 'available',
      create: async () => ({ translate: () => new Promise(() => {}) }),
    };
    await expect(translate('오늘 날씨가 좋네', 'ko', 'en')).resolves.toBeNull();
  });

  it('still uses hand-written lines with no API at all', async () => {
    await expect(pairState('en', 'ko')).resolves.toBe('unsupported');
    await expect(translate('Tell me more.', 'en', 'ko')).resolves.toBe('더 얘기해 주세요.');
    await expect(translate('더 얘기해 주세요.', 'ko', 'en')).resolves.toBe('Tell me more.');
  });

  it('translates through the API and caches the result', async () => {
    let calls = 0;
    (window as { Translator?: unknown }).Translator = {
      availability: async () => 'available',
      create: async () => ({ translate: async (t: string) => { calls++; return `EN:${t}`; } }),
    };
    await expect(translate('강아지 이름이 뭐였어요', 'ko', 'en')).resolves.toBe('EN:강아지 이름이 뭐였어요');
    await translate('강아지 이름이 뭐였어요', 'ko', 'en');
    expect(calls).toBe(1);
  });
});
