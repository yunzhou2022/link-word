import initSqlJs, { type Database as SqlJsDb } from 'sql.js';
import { Asset } from 'expo-asset';
import type { DatabaseAdapter } from './types';

// ── IndexedDB 工具 ──────────────────────────────────────────

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('linkword', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('cache');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getFromIDB(): Promise<ArrayBuffer | null> {
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const req = idb.transaction('cache').objectStore('cache').get('wordnet');
    req.onsuccess = () => resolve((req.result as ArrayBuffer) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function saveToIDB(data: ArrayBuffer): Promise<void> {
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction('cache', 'readwrite');
    tx.objectStore('cache').put(data, 'wordnet');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── sql.js 适配器 ────────────────────────────────────────────

class WebDatabase implements DatabaseAdapter {
  constructor(private db: SqlJsDb) {}

  async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    stmt.bind(params as (string | number | null | Uint8Array)[]);
    const rows: T[] = [];
    while (stmt.step()) rows.push(stmt.getAsObject() as T);
    stmt.free();
    return rows;
  }

  async getFirstAsync<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    const rows = await this.getAllAsync<T>(sql, params);
    return rows[0] ?? null;
  }
}

// ── 下载进度回调（供加载屏幕使用）──────────────────────────────

export type ProgressCallback = (opts: {
  status: 'checking' | 'downloading' | 'extracting' | 'ready' | 'error';
  progress: number;   // 0-100
  loadedMB: number;
  totalMB: number;
  error?: string;
}) => void;

async function downloadWithProgress(
  url: string,
  onProgress: ProgressCallback,
): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const contentLength = res.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  const totalMB = total / 1e6;

  const reader = res.body!.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress({
      status: 'downloading',
      progress: total ? (loaded / total) * 100 : 0,
      loadedMB: loaded / 1e6,
      totalMB,
    });
  }

  // 合并 chunks
  const buf = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) { buf.set(chunk, offset); offset += chunk.length; }
  return buf.buffer;
}

// ── 主入口 ────────────────────────────────────────────────────

let _db: WebDatabase | null = null;
let _initPromise: Promise<WebDatabase> | null = null;

export async function initDatabaseWithProgress(
  onProgress: ProgressCallback,
): Promise<void> {
  if (_db) { onProgress({ status: 'ready', progress: 100, loadedMB: 0, totalMB: 0 }); return; }
  if (_initPromise) { await _initPromise; return; }

  _initPromise = (async () => {
    // 1. 检查 IndexedDB 缓存
    onProgress({ status: 'checking', progress: 0, loadedMB: 0, totalMB: 0 });
    let buffer = await getFromIDB();

    if (!buffer) {
      // 2. 获取资产 URL
      const asset = Asset.fromModule(
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('../../assets/wordnet.db') as number
      );
      if (!asset.downloaded) await asset.downloadAsync();
      const dbUrl = asset.uri;

      // 3. 下载
      buffer = await downloadWithProgress(dbUrl, onProgress);

      // 4. 存入 IndexedDB
      await saveToIDB(buffer);
    }

    // 5. 初始化 sql.js
    onProgress({ status: 'extracting', progress: 99, loadedMB: 0, totalMB: 0 });
    const SQL = await initSqlJs({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/${file}`,
    });
    const db = new SQL.Database(new Uint8Array(buffer));
    _db = new WebDatabase(db);

    onProgress({ status: 'ready', progress: 100, loadedMB: 0, totalMB: 0 });
    return _db;
  })();

  await _initPromise;
}

export function getDatabase(): Promise<DatabaseAdapter> {
  if (_db) return Promise.resolve(_db);
  return Promise.reject(new Error('Database not initialized. Call initDatabaseWithProgress first.'));
}
