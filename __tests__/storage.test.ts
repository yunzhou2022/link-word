import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFavorites, toggleFavorite, isFavorited,
  getHistory, addToHistory, clearHistory,
  getSettings, saveSettings,
} from '../src/storage/storage';

beforeEach(() => AsyncStorage.clear());

describe('favorites', () => {
  it('初始为空数组', async () => {
    expect(await getFavorites()).toEqual([]);
  });

  it('toggleFavorite 添加词', async () => {
    const added = await toggleFavorite('happy');
    expect(added).toBe(true);
    expect(await isFavorited('happy')).toBe(true);
  });

  it('toggleFavorite 移除已收藏词', async () => {
    await toggleFavorite('happy');
    const added = await toggleFavorite('happy');
    expect(added).toBe(false);
    expect(await isFavorited('happy')).toBe(false);
  });
});

describe('history', () => {
  it('addToHistory 保持最新词在前', async () => {
    await addToHistory('apple');
    await addToHistory('banana');
    const history = await getHistory();
    expect(history[0]).toBe('banana');
    expect(history[1]).toBe('apple');
  });

  it('addToHistory 去重', async () => {
    await addToHistory('apple');
    await addToHistory('apple');
    expect(await getHistory()).toHaveLength(1);
  });

  it('clearHistory 清空', async () => {
    await addToHistory('apple');
    await clearHistory();
    expect(await getHistory()).toEqual([]);
  });
});

describe('settings', () => {
  it('默认设置', async () => {
    const s = await getSettings();
    expect(s.graphMode).toBe('force');
    expect(s.nodeLimit).toBe(20);
  });

  it('saveSettings 更新单个字段', async () => {
    await saveSettings({ graphMode: 'tree' });
    const s = await getSettings();
    expect(s.graphMode).toBe('tree');
    expect(s.nodeLimit).toBe(20);
  });
});
