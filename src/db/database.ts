import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import { documentDirectory, getInfoAsync, makeDirectoryAsync, copyAsync } from 'expo-file-system/legacy';
import type { DatabaseAdapter } from './types';

let _initPromise: Promise<DatabaseAdapter> | null = null;

async function initDatabase(): Promise<DatabaseAdapter> {
  const dbName = 'wordnet.db';
  const dbPath = `${documentDirectory}SQLite/${dbName}`;
  const dbDir = `${documentDirectory}SQLite/`;

  const dirInfo = await getInfoAsync(dbDir);
  if (!dirInfo.exists) {
    await makeDirectoryAsync(dbDir, { intermediates: true });
  }

  const fileInfo = await getInfoAsync(dbPath);
  if (!fileInfo.exists) {
    const asset = Asset.fromModule(require('../../assets/wordnet.db'));
    await asset.downloadAsync();
    await copyAsync({ from: asset.localUri!, to: dbPath });
  }

  const sqliteDb = await SQLite.openDatabaseAsync(dbName);
  // 包装成 DatabaseAdapter，抹平 expo-sqlite 的严格参数类型
  return {
    getAllAsync: <T>(sql: string, params: unknown[] = []) =>
      sqliteDb.getAllAsync<T>(sql, params as SQLite.SQLiteBindParams),
    getFirstAsync: <T>(sql: string, params: unknown[] = []) =>
      sqliteDb.getFirstAsync<T>(sql, params as SQLite.SQLiteBindParams),
  };
}

export function getDatabase(): Promise<DatabaseAdapter> {
  if (!_initPromise) _initPromise = initDatabase();
  return _initPromise;
}
