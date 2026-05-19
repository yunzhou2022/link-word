const WordNetDB = require('wordnet-db');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const cmu = require('cmu-pronouncing-dictionary');

const WN_DIR = WordNetDB.path; // WordNetDB.path 已经指向 dict 目录
const OUT_PATH = path.join(__dirname, '../assets/wordnet.db');

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
if (fs.existsSync(OUT_PATH)) fs.unlinkSync(OUT_PATH);
const db = new Database(OUT_PATH);

const RELATION_MAP = {
  '!': 'antonym',
  '@': 'hypernym', '@i': 'hypernym',
  '~': 'hyponym', '~i': 'hyponym',
  '&': 'similar',
  '^': 'also',
  '#m': 'meronym', '#s': 'meronym', '#p': 'meronym',
  '%m': 'holonym', '%s': 'holonym', '%p': 'holonym',
};

function initSchema() {
  db.exec(`
    CREATE TABLE words (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      lemma TEXT NOT NULL,
      pos   TEXT NOT NULL
    );
    CREATE UNIQUE INDEX idx_words_lemma_pos ON words(lemma, pos);
    CREATE INDEX idx_words_lemma ON words(lemma);

    CREATE TABLE synsets (
      id         TEXT PRIMARY KEY,
      pos        TEXT NOT NULL,
      definition TEXT NOT NULL,
      examples   TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE senses (
      word_id   INTEGER NOT NULL,
      synset_id TEXT NOT NULL,
      sense_num INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (word_id, synset_id)
    );
    CREATE INDEX idx_senses_word ON senses(word_id);
    CREATE INDEX idx_senses_synset ON senses(synset_id);

    CREATE TABLE relations (
      from_synset TEXT NOT NULL,
      to_synset   TEXT NOT NULL,
      type        TEXT NOT NULL,
      UNIQUE (from_synset, to_synset, type)
    );
    CREATE INDEX idx_relations_from ON relations(from_synset, type);

    CREATE TABLE derivations (
      from_word_id INTEGER NOT NULL,
      to_word_id   INTEGER NOT NULL
    );
    CREATE INDEX idx_derivations_from ON derivations(from_word_id);

    CREATE TABLE phonetics (
      word_id INTEGER PRIMARY KEY,
      ipa     TEXT NOT NULL
    );

    CREATE TABLE collocations (
      word_id    INTEGER NOT NULL,
      frame_text TEXT NOT NULL
    );
    CREATE INDEX idx_collocations_word ON collocations(word_id);
  `);
}

const ARPABET_TO_IPA = {
  AA:'ɑ',AE:'æ',AH:'ʌ',AO:'ɔ',AW:'aʊ',AY:'aɪ',
  B:'b',CH:'tʃ',D:'d',DH:'ð',EH:'ɛ',ER:'ɜr',EY:'eɪ',
  F:'f',G:'ɡ',HH:'h',IH:'ɪ',IY:'iː',JH:'dʒ',K:'k',
  L:'l',M:'m',N:'n',NG:'ŋ',OW:'oʊ',OY:'ɔɪ',P:'p',
  R:'r',S:'s',SH:'ʃ',T:'t',TH:'θ',UH:'ʊ',UW:'uː',
  V:'v',W:'w',Y:'j',Z:'z',ZH:'ʒ',
};

function arpabetToIpa(phones) {
  return phones.map(p => {
    const base = p.replace(/[012]$/, '');
    const stress = p.match(/([012])$/)?.[1];
    const ipa = ARPABET_TO_IPA[base] || base.toLowerCase();
    return stress === '1' ? 'ˈ' + ipa : stress === '2' ? 'ˌ' + ipa : ipa;
  }).join('');
}

function parseDataFile(filePath, pos) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const synsets = [];

  for (const line of lines) {
    if (line.startsWith('  ') || line.trim() === '') continue;
    const pipeIdx = line.indexOf(' | ');
    if (pipeIdx === -1) continue;

    const dataPart = line.slice(0, pipeIdx);
    const glossPart = line.slice(pipeIdx + 3).trim();

    const tokens = dataPart.split(' ');
    let i = 0;

    const offset = tokens[i++];
    i++; // lex_filenum
    const ssType = tokens[i++];
    const actualPos = ssType === 's' ? 'a' : ssType;
    const wCnt = parseInt(tokens[i++], 16);

    const words = [];
    for (let w = 0; w < wCnt; w++) {
      const word = tokens[i++].replace(/_/g, ' ').toLowerCase();
      i++; // lex_id
      words.push(word);
    }

    const pCnt = parseInt(tokens[i++], 10);
    const pointers = [];
    for (let p = 0; p < pCnt; p++) {
      const sym = tokens[i++];
      const toOffset = tokens[i++];
      const toPos = tokens[i++];
      const srcTgt = tokens[i++];
      const srcIdx = parseInt(srcTgt.slice(0, 2), 16);
      const tgtIdx = parseInt(srcTgt.slice(2, 4), 16);
      const actualToPos = toPos === 's' ? 'a' : toPos;

      if (RELATION_MAP[sym]) {
        pointers.push({ type: RELATION_MAP[sym], toSynset: `${toOffset}-${actualToPos}`, srcIdx, tgtIdx });
      } else if (sym === '+') {
        pointers.push({ type: 'derivation', toSynset: `${toOffset}-${actualToPos}`, srcIdx, tgtIdx });
      }
    }

    const examples = [];
    const definition = glossPart
      .replace(/"([^"]+)"/g, (_, ex) => { examples.push(ex); return ''; })
      .replace(/(\s*;)+\s*$/, '').trim();

    synsets.push({
      id: `${offset}-${actualPos}`,
      pos: actualPos,
      words,
      pointers,
      definition,
      examples,
    });
  }
  return synsets;
}

const VERB_FRAMES = {
  1: 'Something ----s',
  2: 'Somebody ----s',
  3: 'It is ----ing',
  4: 'Something is ----ing PP',
  5: 'Something ----s something',
  6: 'Something ----s PP',
  7: 'Somebody ----s PP',
  8: 'Somebody ----s something',
  9: 'Somebody ----s somebody',
  10: 'Something ----s somebody',
  11: 'Somebody ----s something PP',
  12: 'Somebody ----s somebody PP',
  13: 'Somebody ----s somebody something',
  14: 'Somebody ----s to somebody',
  15: 'Somebody ----s INFINITIVE',
  16: 'Somebody ----s VERB-ing',
  17: 'Somebody ----s that CLAUSE',
  18: 'Somebody ----s to INFINITIVE',
  19: 'Somebody ----s whether INFINITIVE',
  20: 'Somebody ----s at something',
  21: 'Somebody ----s for something',
  22: 'Somebody ----s on something',
  23: 'Somebody ----s out of somebody',
  24: 'Somebody ----s from something',
  25: 'Somebody ----s into something',
  26: 'Somebody ----s with something',
  27: 'Somebody ----s with somebody',
  28: 'Somebody ----s to somebody about something',
  29: 'Somebody ----s away from somebody',
  30: 'Somebody ----s somebody to INFINITIVE',
  31: 'Somebody ----s somebody into V-ing something',
  32: 'Somebody ----s something with something',
  33: 'Somebody ----s INFINITIVE',
  34: 'Somebody ----s VERB-ing',
  35: 'It ----s that CLAUSE',
  36: 'Something ----s INFINITIVE',
};

function parseVerbFrames(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const frameMap = new Map();

  for (const line of lines) {
    if (line.startsWith('  ') || line.trim() === '') continue;
    const pipeIdx = line.indexOf(' | ');
    if (pipeIdx === -1) continue;

    const dataPart = line.slice(0, pipeIdx);
    const tokens = dataPart.split(' ');
    let i = 0;
    const offset = tokens[i++];
    i++; // lex_filenum
    i++; // ss_type
    const wCnt = parseInt(tokens[i++], 16);

    for (let w = 0; w < wCnt; w++) { i++; i++; } // 跳过单词

    const pCnt = parseInt(tokens[i++], 10);
    for (let p = 0; p < pCnt; p++) { i += 4; } // 跳过指针

    // 动词框架格式: f_cnt { + f_num w_num }
    // tokens[i] 是十进制整数 f_cnt，不是 '+'
    if (i < tokens.length) {
      const fCnt = parseInt(tokens[i++], 10);
      if (!isNaN(fCnt) && fCnt > 0) {
        const frames = [];
        for (let f = 0; f < fCnt; f++) {
          i++; // 跳过 '+'
          const frameNum = parseInt(tokens[i++], 10);
          i++; // 跳过 w_num
          if (VERB_FRAMES[frameNum]) frames.push(frameNum);
        }
        if (frames.length) frameMap.set(`${offset}-v`, [...new Set(frames)]);
      }
    }
  }
  return frameMap;
}

function main() {
  console.log('Initializing schema...');
  initSchema();

  const POS_FILES = ['noun', 'verb', 'adj', 'adv'];
  const POS_MAP = { noun: 'n', verb: 'v', adj: 'a', adv: 'r' };

  const insertWord = db.prepare('INSERT OR IGNORE INTO words (lemma, pos) VALUES (?, ?)');
  const insertSynset = db.prepare('INSERT OR REPLACE INTO synsets (id, pos, definition, examples) VALUES (?, ?, ?, ?)');
  const insertSense = db.prepare('INSERT OR IGNORE INTO senses (word_id, synset_id, sense_num) VALUES (?, ?, ?)');
  const insertRelation = db.prepare('INSERT OR IGNORE INTO relations (from_synset, to_synset, type) VALUES (?, ?, ?)');
  const insertDerivation = db.prepare('INSERT OR IGNORE INTO derivations (from_word_id, to_word_id) VALUES (?, ?)');
  const insertPhonetic = db.prepare('INSERT OR IGNORE INTO phonetics (word_id, ipa) VALUES (?, ?)');
  const insertCollocation = db.prepare('INSERT INTO collocations (word_id, frame_text) VALUES (?, ?)');

  const getWordId = db.prepare('SELECT id FROM words WHERE lemma = ? AND pos = ?');

  const verbFrameMap = parseVerbFrames(path.join(WN_DIR, 'data.verb'));
  console.log(`Parsed ${verbFrameMap.size} verb synsets with frames`);

  console.log('Inserting words and synsets...');
  const allSynsets = [];

  for (const posFile of POS_FILES) {
    const pos = POS_MAP[posFile];
    const filePath = path.join(WN_DIR, `data.${posFile}`);
    if (!fs.existsSync(filePath)) { console.warn(`Missing: ${filePath}`); continue; }

    const synsets = parseDataFile(filePath, pos);
    allSynsets.push(...synsets);

    const insertAll = db.transaction(() => {
      for (const s of synsets) {
        insertSynset.run(s.id, s.pos, s.definition, JSON.stringify(s.examples));
        for (const w of s.words) {
          insertWord.run(w, s.pos);
        }
      }
    });
    insertAll();
    console.log(`  ${posFile}: ${synsets.length} synsets`);
  }

  console.log('Inserting senses and relations...');
  const insertSensesAndRelations = db.transaction(() => {
    for (const s of allSynsets) {
      for (let wi = 0; wi < s.words.length; wi++) {
        const word = s.words[wi];
        const row = getWordId.get(word, s.pos);
        if (!row) continue;
        insertSense.run(row.id, s.id, wi);

        const frames = verbFrameMap.get(s.id);
        if (frames) {
          for (const fn of frames) {
            insertCollocation.run(row.id, VERB_FRAMES[fn]);
          }
        }
      }

      for (const ptr of s.pointers) {
        if (ptr.type !== 'derivation') {
          insertRelation.run(s.id, ptr.toSynset, ptr.type);
        }
      }
    }
  });
  insertSensesAndRelations();

  console.log('Inserting derivations...');
  const getSynsetWordByIdx = db.prepare(`
    SELECT w.id, w.lemma, w.pos FROM senses s
    JOIN words w ON w.id = s.word_id
    WHERE s.synset_id = ? AND s.sense_num = ?
  `);

  const insertDerivationsAll = db.transaction(() => {
    for (const s of allSynsets) {
      for (const ptr of s.pointers) {
        if (ptr.type !== 'derivation') continue;
        if (ptr.srcIdx === 0 || ptr.tgtIdx === 0) continue;
        const srcWord = s.words[ptr.srcIdx - 1];
        if (!srcWord) continue;
        const srcRow = getWordId.get(srcWord, s.pos);
        if (!srcRow) continue;
        const tgtRow = getSynsetWordByIdx.get(ptr.toSynset, ptr.tgtIdx - 1);
        if (!tgtRow) continue;
        insertDerivation.run(srcRow.id, tgtRow.id);
      }
    }
  });
  insertDerivationsAll();

  console.log('Inserting phonetics...');
  // cmu-pronouncing-dictionary 导出 { dictionary: { word: 'phoneme string', ... } }
  // 音素值为空格分隔的字符串，可能包含 # 注释
  const cmuDict = cmu.dictionary;
  const insertPhonetics = db.transaction(() => {
    for (const [word, phonesStr] of Object.entries(cmuDict)) {
      // 跳过带 (2) 等变体后缀的词条（取第一个）
      if (/\(\d+\)$/.test(word)) continue;
      const lemma = word.toLowerCase().replace(/_/g, ' ');
      // 去掉注释部分 (# ...)，按空格分割
      const cleanStr = phonesStr.replace(/#.*$/, '').trim();
      if (!cleanStr) continue;
      const phones = cleanStr.split(/\s+/);
      const ipa = arpabetToIpa(phones);
      for (const pos of ['n', 'v', 'a', 'r']) {
        const row = getWordId.get(lemma, pos);
        if (row) insertPhonetic.run(row.id, ipa);
      }
    }
  });
  insertPhonetics();

  const counts = {
    words: db.prepare('SELECT COUNT(*) as n FROM words').get().n,
    synsets: db.prepare('SELECT COUNT(*) as n FROM synsets').get().n,
    senses: db.prepare('SELECT COUNT(*) as n FROM senses').get().n,
    relations: db.prepare('SELECT COUNT(*) as n FROM relations').get().n,
    derivations: db.prepare('SELECT COUNT(*) as n FROM derivations').get().n,
    phonetics: db.prepare('SELECT COUNT(*) as n FROM phonetics').get().n,
    collocations: db.prepare('SELECT COUNT(*) as n FROM collocations').get().n,
  };
  console.log('Done:', counts);
  db.close();
}

main();
