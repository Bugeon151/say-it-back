const CJK = /^(ko|zh|ja|th)/;

/** Short sentences from the elder's own words that a grandchild could learn to echo back. */
export function herWords(text: string, lang: string, max = 6): string[] {
  const parts = text
    .split(/(?<=[.!?。！？…])\s*|\n+/u)
    .flatMap((s) => (s.length > 40 ? s.split(/(?<=[,，、])\s*/u) : [s]))
    .map((s) => s.trim().replace(/[,，、]$/u, ''))
    .filter(Boolean);
  const fits = (s: string) => {
    if (/\d/.test(s)) return false;
    if (CJK.test(lang)) {
      const n = s.replace(/[\s\p{P}]/gu, '').length;
      return n >= 2 && n <= 16;
    }
    const w = s.split(/\s+/).length;
    return w >= 1 && w <= 7;
  };
  const seen = new Set<string>();
  return parts
    .filter((s) => fits(s) && !seen.has(s) && seen.add(s))
    .sort((a, b) => a.length - b.length)
    .slice(0, max);
}
