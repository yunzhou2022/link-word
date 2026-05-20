const cache = new Map<string, string>();

export async function translateToZh(text: string): Promise<string> {
  if (!text.trim()) return '';
  if (cache.has(text)) return cache.get(text)!;

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json() as { responseData?: { translatedText?: string } };
    const result = data.responseData?.translatedText ?? text;
    cache.set(text, result);
    return result;
  } catch {
    return text;
  }
}
