/** Languages that both Chrome's on-device Translator API and Web Speech recognition cover. */
export interface Lang {
  code: string; // Translator API code
  name: string;
  native: string;
  speech: string; // SpeechRecognition / speechSynthesis locale
}

export const LANGS: Lang[] = [
  { code: 'ko', name: 'Korean', native: '한국어', speech: 'ko-KR' },
  { code: 'es', name: 'Spanish', native: 'Español', speech: 'es-US' },
  { code: 'zh', name: 'Chinese (Simplified)', native: '中文（简体）', speech: 'zh-CN' },
  { code: 'zh-Hant', name: 'Chinese (Traditional)', native: '中文（繁體）', speech: 'zh-TW' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', speech: 'vi-VN' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', speech: 'hi-IN' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', speech: 'ta-IN' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', speech: 'te-IN' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', speech: 'bn-IN' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', speech: 'mr-IN' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', speech: 'kn-IN' },
  { code: 'ja', name: 'Japanese', native: '日本語', speech: 'ja-JP' },
  { code: 'ar', name: 'Arabic', native: 'العربية', speech: 'ar-SA' },
  { code: 'ru', name: 'Russian', native: 'Русский', speech: 'ru-RU' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська', speech: 'uk-UA' },
  { code: 'pt', name: 'Portuguese', native: 'Português', speech: 'pt-BR' },
  { code: 'fr', name: 'French', native: 'Français', speech: 'fr-FR' },
  { code: 'it', name: 'Italian', native: 'Italiano', speech: 'it-IT' },
  { code: 'de', name: 'German', native: 'Deutsch', speech: 'de-DE' },
  { code: 'pl', name: 'Polish', native: 'Polski', speech: 'pl-PL' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', speech: 'tr-TR' },
  { code: 'th', name: 'Thai', native: 'ไทย', speech: 'th-TH' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', speech: 'id-ID' },
  { code: 'he', name: 'Hebrew', native: 'עברית', speech: 'he-IL' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά', speech: 'el-GR' },
  { code: 'en', name: 'English', native: 'English', speech: 'en-US' },
];

export const KID_LANGS = ['en', 'ko'];

export const langOf = (code: string): Lang => LANGS.find((l) => l.code === code) ?? LANGS[LANGS.length - 1];
export const isRtl = (code: string) => code === 'ar' || code === 'he';
