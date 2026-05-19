import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  FAVORITES: 'favorites',
  HISTORY: 'history',
  SETTINGS: 'settings',
} as const;

export interface AppSettings {
  graphMode: 'force' | 'tree';
  nodeLimit: number;
  darkMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  graphMode: 'force',
  nodeLimit: 20,
  darkMode: true,
};

export async function getFavorites(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.FAVORITES);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export async function toggleFavorite(lemma: string): Promise<boolean> {
  const favorites = await getFavorites();
  const idx = favorites.indexOf(lemma);
  if (idx === -1) {
    favorites.unshift(lemma);
  } else {
    favorites.splice(idx, 1);
  }
  await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
  return idx === -1;
}

export async function isFavorited(lemma: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.includes(lemma);
}

export async function getHistory(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.HISTORY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export async function addToHistory(lemma: string): Promise<void> {
  const history = await getHistory();
  const filtered = history.filter((h) => h !== lemma);
  filtered.unshift(lemma);
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(filtered.slice(0, 20)));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.HISTORY);
}

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
  if (!raw) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated));
  return updated;
}
