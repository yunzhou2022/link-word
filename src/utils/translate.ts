const cache = new Map<string, string>();

const timeout = (ms: number) => new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error('timeout')), ms)
);

export async function translateToZh(text: string): Promise<string> {
  if (!text.trim()) return '';
  if (cache.has(text)) return cache.get(text)!;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;
    const res = await Promise.race([
      fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      timeout(6000),
    ]);
    const data = await res.json() as Array<unknown>;
    const segments = data[0] as Array<Array<string>>;
    const result = segments.map((s) => s[0]).join('');
    cache.set(text, result);
    return result;
  } catch {
    return '';
  }
}
