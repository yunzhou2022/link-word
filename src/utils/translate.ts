import AsyncStorage from '@react-native-async-storage/async-storage';

const memCache = new Map<string, string>();
const STORAGE_PREFIX = 'tr:';

const timeout = (ms: number) => new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error('timeout')), ms)
);

export async function translateToZh(text: string): Promise<string> {
  if (!text.trim()) return '';

  // 1. 内存命中
  if (memCache.has(text)) return memCache.get(text)!;

  // 2. 磁盘命中
  const stored = await AsyncStorage.getItem(STORAGE_PREFIX + text);
  if (stored) { memCache.set(text, stored); return stored; }

  // 3. 网络请求
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;
    const res = await Promise.race([
      fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      timeout(6000),
    ]);
    const data = await res.json() as Array<unknown>;
    const segments = data[0] as Array<Array<string>>;
    const result = segments.map((s) => s[0]).join('');

    memCache.set(text, result);
    AsyncStorage.setItem(STORAGE_PREFIX + text, result); // 异步写盘，不阻塞
    return result;
  } catch {
    return '';
  }
}
