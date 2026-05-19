import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import { documentDirectory, getInfoAsync, makeDirectoryAsync, copyAsync } from 'expo-file-system/legacy';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

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

  _db = await SQLite.openDatabaseAsync(dbPath);
  return _db;
}
