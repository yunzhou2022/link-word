/**
 * 从 ConceptNet 5.7 assertions 文件中提取英文关系，合并进 wordnet.db
 * 用法：node scripts/build-conceptnet.js
 *
 * 首次运行会自动下载 conceptnet-assertions-5.7.0.csv.gz (~1.2GB)
 * 之后重跑会跳过下载，直接重新解析
 */
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');
const zlib = require('zlib');

const DB_PATH = path.join(__dirname, '../assets/wordnet.db');
const TMP_DIR = path.join(__dirname, '../tmp');
const GZ_PATH = path.join(TMP_DIR, 'conceptnet-assertions.csv.gz');

const ASSERTIONS_URL =
  'https://s3.amazonaws.com/conceptnet/downloads/2019/edges/conceptnet-assertions-5.7.0.csv.gz';

// 保留的关系类型
const KEEP_RELATIONS = new Map([
  ['/r/UsedFor',         'UsedFor'],
  ['/r/IsA',             'IsA'],
  ['/r/HasA',            'HasA'],
  ['/r/PartOf',          'PartOf'],
  ['/r/Causes',          'Causes'],
  ['/r/CapableOf',       'CapableOf'],
  ['/r/AtLocation',      'AtLocation'],
  ['/r/HasProperty',     'HasProperty'],
  ['/r/ReceivesAction',  'ReceivesAction'],
  ['/r/MotivatedByGoal', 'MotivatedByGoal'],
  ['/r/Desires',         'Desires'],
  ['/r/CausesDesire',    'CausesDesire'],
]);

// /c/en/word_text/n → 'word text'（最多 3 词，过滤垃圾条目）
function parseConcept(uri) {
  const parts = uri.split('/');
  if (parts[1] !== 'c' || parts[2] !== 'en' || !parts[3]) return null;
  const text = parts[3].replace(/_/g, ' ');
  if (text.split(' ').length > 3) return null; // 排除短语
  if (/[^a-z '-]/.test(text)) return null;     // 排除含特殊字符的
  return text;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
    const file = fs.createWriteStream(dest);
    let downloaded = 0;
    let total = 0;

    const req = https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      total = parseInt(res.headers['content-length'] || '0', 10);
      res.on('data', (chunk) => {
        downloaded += chunk.length;
        const pct = total ? ((downloaded / total) * 100).toFixed(1) : '?';
        process.stdout.write(`\r  下载中... ${(downloaded / 1e6).toFixed(0)}MB / ${(total / 1e6).toFixed(0)}MB  (${pct}%)`);
      });
      res.pipe(file);
      file.on('finish', () => { file.close(); console.log('\n  下载完成'); resolve(); });
    });
    req.on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error('找不到 assets/wordnet.db，请先运行 node scripts/build-db.js');
    process.exit(1);
  }

  // ── 下载 ──
  if (!fs.existsSync(GZ_PATH)) {
    console.log('下载 ConceptNet assertions (~1.2GB)...');
    await download(ASSERTIONS_URL, GZ_PATH);
  } else {
    console.log('已有 assertions 文件，跳过下载');
  }

  // ── 准备 DB ──
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS conceptnet (
      word_id  INTEGER NOT NULL,
      relation TEXT NOT NULL,
      target   TEXT NOT NULL,
      weight   REAL NOT NULL DEFAULT 1.0,
      UNIQUE(word_id, relation, target)
    );
    CREATE INDEX IF NOT EXISTS idx_cn_word ON conceptnet(word_id);
  `);
  db.exec('DELETE FROM conceptnet');

  // 构建 lemma → id 内存索引（155k 词）
  console.log('构建词表索引...');
  const lemmaToId = new Map();
  for (const row of db.prepare('SELECT id, lemma FROM words').all()) {
    lemmaToId.set(row.lemma, row.id);
  }
  console.log(`  词表大小: ${lemmaToId.size}`);

  const insert = db.prepare(
    'INSERT OR IGNORE INTO conceptnet (word_id, relation, target, weight) VALUES (?, ?, ?, ?)'
  );

  // ── 流式解析 ──
  console.log('解析 ConceptNet 数据...');
  let linesRead = 0;
  let inserted = 0;
  let batchCount = 0;

  const insertBatch = db.transaction((rows) => {
    for (const r of rows) insert.run(r.wordId, r.relation, r.target, r.weight);
  });

  let batch = [];

  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(GZ_PATH).pipe(zlib.createGunzip());
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    rl.on('line', (line) => {
      linesRead++;
      if (linesRead % 500000 === 0) {
        process.stdout.write(`\r  已读 ${(linesRead / 1e6).toFixed(1)}M 行，已插入 ${inserted} 条`);
      }

      const cols = line.split('\t');
      if (cols.length < 5) return;

      const relUri = cols[1];
      const relName = KEEP_RELATIONS.get(relUri);
      if (!relName) return;

      const subj = parseConcept(cols[2]);
      if (!subj) return;
      const wordId = lemmaToId.get(subj);
      if (!wordId) return;

      const obj = parseConcept(cols[3]);
      if (!obj || obj === subj) return;

      let weight = 1.0;
      try { weight = JSON.parse(cols[4]).weight ?? 1.0; } catch (_) {}
      if (weight < 1.0) return; // 过滤低置信度

      batch.push({ wordId, relation: relName, target: obj, weight });

      if (batch.length >= 5000) {
        insertBatch(batch);
        inserted += batch.length;
        batchCount++;
        batch = [];
      }
    });

    rl.on('close', () => {
      if (batch.length) { insertBatch(batch); inserted += batch.length; }
      resolve();
    });
    rl.on('error', reject);
  });

  console.log(`\n解析完成: 读取 ${(linesRead / 1e6).toFixed(1)}M 行，插入 ${inserted} 条`);

  const count = db.prepare('SELECT COUNT(*) as n FROM conceptnet').get().n;
  const words = db.prepare('SELECT COUNT(DISTINCT word_id) as n FROM conceptnet').get().n;
  console.log(`ConceptNet 表: ${count} 条关系，覆盖 ${words} 个词`);
  db.close();
}

main().catch(e => { console.error(e); process.exit(1); });
