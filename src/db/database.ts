import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import { documentDirectory, getInfoAsync, makeDirectoryAsync, copyAsync } from 'expo-file-system/legacy';

let _initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
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

  // Pass only the filename — expo-sqlite resolves it relative to documentDirectory/SQLite/
  return SQLite.openDatabaseAsync(dbName);
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!_initPromise) _initPromise = initDatabase();
  return _initPromise;
}
