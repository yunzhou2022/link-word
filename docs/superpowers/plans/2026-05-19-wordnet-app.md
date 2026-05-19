# WordNet iPhone 单词知识图谱 App — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一款基于 WordNet 3.1 的 iOS 单词应用，核心功能为 D3 力导向知识图谱，支持词义探索、TTS、收藏与历史记录。

**Architecture:** Expo (managed workflow) + React Native。数据层为预处理成 SQLite 的完整 WordNet 数据集（bundled assets）。图谱渲染使用 react-native-webview 内嵌 D3.js force simulation，通过 postMessage 与 RN 层通信。持久化（收藏/历史/设置）使用 AsyncStorage。

**Tech Stack:** Expo SDK 52, React Native, TypeScript, expo-sqlite, expo-speech, react-native-webview, @react-navigation/native, @react-navigation/bottom-tabs, @gorhom/bottom-sheet, @react-native-async-storage/async-storage, D3.js v7 (CDN), Jest

---

## 文件结构

```
link-word/
├── scripts/
│   └── build-db.js              # WordNet 3.1 → SQLite 预处理（构建时运行）
├── assets/
│   └── wordnet.db                # 构建生成，加入 .gitignore
├── src/
│   ├── db/
│   │   ├── types.ts              # DB 查询结果 TypeScript 类型
│   │   ├── database.ts           # SQLite open/init 单例
│   │   └── queries.ts            # 所有 SQL 查询函数
│   ├── graph/
│   │   ├── graphTypes.ts         # Node / Edge / RN↔WebView 消息类型
│   │   ├── graphHtml.ts          # D3 force 模拟 HTML 字符串
│   │   └── ForceGraph.tsx        # WebView 封装组件
│   ├── screens/
│   │   ├── SearchScreen.tsx
│   │   ├── GraphScreen.tsx
│   │   ├── FavoritesScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   ├── SearchBar.tsx         # 搜索框 + 自动补全下拉
│   │   ├── WordDetail.tsx        # 底部抽屉内容
│   │   └── RelationTag.tsx       # 带颜色的关系标签 chip
│   ├── hooks/
│   │   ├── useWordGraph.ts       # 查询 + 格式化图谱数据
│   │   ├── useWordDetail.ts      # 查询完整词条详情
│   │   └── useSettings.ts        # AsyncStorage 设置读写
│   ├── storage/
│   │   └── storage.ts            # 收藏夹、浏览历史、设置
│   └── navigation/
│       └── AppNavigator.tsx      # Tab + Stack 导航
├── __tests__/
│   ├── storage.test.ts
│   └── graphFormat.test.ts
├── App.tsx
├── app.json
└── package.json
```

---

## Task 1: Expo 项目初始化 + 依赖安装

**Files:**
- Create: `package.json`, `App.tsx`, `app.json`, `tsconfig.json`
- Create: `.gitignore`

- [ ] **Step 1: 创建 Expo 项目**

```bash
cd /Users/lyz/fun/link-word
npx create-expo-app@latest . --template blank-typescript
```

预期输出：`✅ Your project is ready!`

- [ ] **Step 2: 安装运行时依赖**

```bash
pnpm add expo-sqlite expo-speech @react-native-async-storage/async-storage react-native-webview @gorhom/bottom-sheet react-native-gesture-handler react-native-reanimated
pnpm add @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npx expo install react-native-safe-area-context react-native-screens
```

- [ ] **Step 3: 安装构建脚本依赖（devDependencies）**

```bash
pnpm add -D wordnet-db better-sqlite3 @types/better-sqlite3 cmu-pronouncing-dictionary
```

- [ ] **Step 4: 更新 app.json，声明 SQLite asset**

将 `app.json` 中 `expo` 对象增加：
```json
{
  "expo": {
    "name": "LinkWord",
    "slug": "link-word",
    "version": "1.0.0",
    "platforms": ["ios"],
    "assetBundlePatterns": ["assets/**/*"],
    "plugins": [
      "expo-sqlite",
      [
        "react-native-reanimated/plugin",
        {}
      ]
    ]
  }
}
```

- [ ] **Step 5: 配置 babel（reanimated plugin 必须最后）**

`babel.config.js`：
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

- [ ] **Step 6: 更新 .gitignore**

在现有 `.gitignore` 末尾追加：
```
assets/wordnet.db
.superpowers/
```

- [ ] **Step 7: 验证项目启动**

```bash
npx expo start
```

预期：Metro bundler 启动，终端显示 QR code。按 `Ctrl+C` 停止。

- [ ] **Step 8: Commit**

```bash
git init
git add -A
git commit -m "feat: init expo project with deps"
```

---

## Task 2: 导航骨架

**Files:**
- Create: `src/navigation/AppNavigator.tsx`
- Create: `src/screens/SearchScreen.tsx`（占位）
- Create: `src/screens/GraphScreen.tsx`（占位）
- Create: `src/screens/FavoritesScreen.tsx`（占位）
- Create: `src/screens/SettingsScreen.tsx`（占位）
- Modify: `App.tsx`

- [ ] **Step 1: 创建占位 SearchScreen**

`src/screens/SearchScreen.tsx`：
```typescript
import { View, Text, StyleSheet } from 'react-native';

export function SearchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Search</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' },
  text: { color: 'white', fontSize: 18 },
});
```

- [ ] **Step 2: 创建占位 GraphScreen**

`src/screens/GraphScreen.tsx`：
```typescript
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Graph'>;

export function GraphScreen({ route }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Graph: {route.params.word}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' },
  text: { color: 'white', fontSize: 18 },
});
```

- [ ] **Step 3: 创建占位 FavoritesScreen 和 SettingsScreen**

`src/screens/FavoritesScreen.tsx`：
```typescript
import { View, Text, StyleSheet } from 'react-native';
export function FavoritesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Favorites</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' },
  text: { color: 'white', fontSize: 18 },
});
```

`src/screens/SettingsScreen.tsx`：
```typescript
import { View, Text, StyleSheet } from 'react-native';
export function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' },
  text: { color: 'white', fontSize: 18 },
});
```

- [ ] **Step 4: 创建 AppNavigator**

`src/navigation/AppNavigator.tsx`：
```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { SearchScreen } from '../screens/SearchScreen';
import { GraphScreen } from '../screens/GraphScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export type RootStackParamList = {
  Tabs: undefined;
  Graph: { word: string };
};

export type TabParamList = {
  Search: undefined;
  Favorites: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#16213e', borderTopColor: '#0f3460' },
        tabBarActiveTintColor: '#6c63ff',
        tabBarInactiveTintColor: '#555',
      }}
    >
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⌂</Text>, tabBarLabel: '' }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>☆</Text>, tabBarLabel: '' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚙</Text>, tabBarLabel: '' }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Graph" component={GraphScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

- [ ] **Step 5: 更新 App.tsx**

`App.tsx`：
```typescript
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 6: 验证导航渲染**

```bash
npx expo start
```

在模拟器或 Expo Go 中确认：底部三个 Tab 可切换，首页显示 "Search" 文字。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: navigation scaffold with placeholder screens"
```

---

## Task 3: WordNet 预处理脚本

**Files:**
- Create: `scripts/build-db.js`

> 此脚本在开发时本地运行一次，生成 `assets/wordnet.db`。不需要 Jest 测试，用行数验证结果。

- [ ] **Step 1: 创建构建脚本**

`scripts/build-db.js`：
```javascript
const WordNetDB = require('wordnet-db');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const cmu = require('cmu-pronouncing-dictionary');

const WN_DIR = path.join(WordNetDB.path, 'dict');
const OUT_PATH = path.join(__dirname, '../assets/wordnet.db');

if (fs.existsSync(OUT_PATH)) fs.unlinkSync(OUT_PATH);
const db = new Database(OUT_PATH);

// 关系符号 → 类型名映射
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
      type        TEXT NOT NULL
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

// ARPAbet → IPA 近似转换表
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

    // 解析 gloss：定义 + 例句（双引号内）
    const examples = [];
    const definition = glossPart
      .replace(/"([^"]+)"/g, (_, ex) => { examples.push(ex); return ''; })
      .replace(/;\s*$/, '').trim();

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

// WordNet verb frames 模板（用于动词搭配展示）
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
  const frameMap = new Map(); // synset_id → frame number[]

  for (const line of lines) {
    if (line.startsWith('  ') || line.trim() === '') continue;
    const pipeIdx = line.indexOf(' | ');
    if (pipeIdx === -1) continue;

    const dataPart = line.slice(0, pipeIdx);
    const tokens = dataPart.split(' ');
    let i = 0;
    const offset = tokens[i++];
    i++; // lex_filenum
    const ssType = tokens[i++];
    i++; // w_cnt hex (skip)
    const wCnt = parseInt(tokens[i - 1], 16);

    for (let w = 0; w < wCnt; w++) { i++; i++; } // skip words

    const pCnt = parseInt(tokens[i++], 10);
    for (let p = 0; p < pCnt; p++) { i += 4; } // skip pointers

    if (tokens[i] === '+') { // has frames
      const fCnt = parseInt(tokens[i + 1] || '0', 10);
      const frames = [];
      let fi = i + 2;
      for (let f = 0; f < fCnt; f++) {
        fi++; // '+'
        const frameNum = parseInt(tokens[fi++], 10);
        fi++; // word idx
        if (VERB_FRAMES[frameNum]) frames.push(frameNum);
      }
      if (frames.length) frameMap.set(`${offset}-v`, [...new Set(frames)]);
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
  const insertRelation = db.prepare('INSERT INTO relations (from_synset, to_synset, type) VALUES (?, ?, ?)');
  const insertDerivation = db.prepare('INSERT OR IGNORE INTO derivations (from_word_id, to_word_id) VALUES (?, ?)');
  const insertPhonetic = db.prepare('INSERT OR IGNORE INTO phonetics (word_id, ipa) VALUES (?, ?)');
  const insertCollocation = db.prepare('INSERT INTO collocations (word_id, frame_text) VALUES (?, ?)');

  const getWordId = db.prepare('SELECT id FROM words WHERE lemma = ? AND pos = ?');

  // 解析 verb frames
  const verbFrameMap = parseVerbFrames(path.join(WN_DIR, 'data.verb'));

  // 先插入所有 words（两遍：先收集所有词，再批量插入）
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

  // 插入 senses + relations + derivations
  console.log('Inserting senses and relations...');
  const insertSensesAndRelations = db.transaction(() => {
    for (const s of allSynsets) {
      for (let wi = 0; wi < s.words.length; wi++) {
        const word = s.words[wi];
        const row = getWordId.get(word, s.pos);
        if (!row) continue;
        insertSense.run(row.id, s.id, wi);

        // verb frames as collocations
        const frames = verbFrameMap.get(s.id);
        if (frames) {
          for (const fn of frames) {
            insertCollocation.run(row.id, VERB_FRAMES[fn]);
          }
        }
      }

      for (const ptr of s.pointers) {
        if (ptr.type === 'derivation') {
          // word-level derivation
          if (ptr.srcIdx > 0 && ptr.tgtIdx > 0) {
            const srcWord = s.words[ptr.srcIdx - 1];
            const tgtSynsetParts = ptr.toSynset.split('-');
            const tgtPos = tgtSynsetParts[tgtSynsetParts.length - 1];
            const srcRow = getWordId.get(srcWord, s.pos);
            if (srcRow) {
              // 解析目标 synset 的对应词（在第二遍处理，先记录）
            }
          }
        } else {
          insertRelation.run(s.id, ptr.toSynset, ptr.type);
        }
      }
    }
  });
  insertSensesAndRelations();

  // 处理 derivation（需要目标 synset 已存在）
  console.log('Inserting derivations...');
  const getSynsetWords = db.prepare(`
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
        const tgtRow = getSynsetWords.get(ptr.toSynset, ptr.tgtIdx - 1);
        if (!tgtRow) continue;
        insertDerivation.run(srcRow.id, tgtRow.id);
      }
    }
  });
  insertDerivationsAll();

  // 插入音标（CMU Dict）
  console.log('Inserting phonetics...');
  const insertPhonetics = db.transaction(() => {
    for (const [word, phones] of Object.entries(cmu)) {
      // cmu 键为大写，phones 为 ARPAbet 数组
      const lemma = word.toLowerCase().replace(/_/g, ' ');
      const ipa = arpabetToIpa(phones[0] || phones); // 取第一个发音
      // 对所有词性插入（近似）
      for (const pos of ['n', 'v', 'a', 'r']) {
        const row = getWordId.get(lemma, pos);
        if (row) insertPhonetic.run(row.id, ipa);
      }
    }
  });
  insertPhonetics();

  // 统计
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
```

- [ ] **Step 2: 运行预处理脚本**

```bash
node scripts/build-db.js
```

预期输出（数值近似）：
```
Initializing schema...
Inserting words and synsets...
  noun: 82115 synsets
  verb: 13767 synsets
  adj: 18156 synsets
  adv: 3621 synsets
Inserting senses and relations...
Inserting derivations...
Inserting phonetics...
Done: { words: 155287, synsets: 117659, senses: 206941, relations: 524000+, ... }
```

- [ ] **Step 3: 验证 DB 内容**

```bash
node -e "
const Database = require('better-sqlite3');
const db = new Database('assets/wordnet.db');
console.log('happy:', db.prepare(\"SELECT * FROM words WHERE lemma='happy'\").all());
console.log('synsets:', db.prepare(\"SELECT COUNT(*) as n FROM synsets\").get());
db.close();
"
```

预期：找到 happy 的 adj 词条，synsets 数量 > 100000。

- [ ] **Step 4: Commit**

```bash
git add scripts/build-db.js
git commit -m "feat: wordnet sqlite preprocessor script"
```

---

## Task 4: 数据库查询层

**Files:**
- Create: `src/db/types.ts`
- Create: `src/db/database.ts`
- Create: `src/db/queries.ts`
- Create: `src/graph/graphTypes.ts`

- [ ] **Step 1: 定义类型**

`src/db/types.ts`：
```typescript
export interface WordRow {
  id: number;
  lemma: string;
  pos: string;
}

export interface SynsetRow {
  id: string;
  pos: string;
  definition: string;
  examples: string; // JSON 字符串
}

export interface SenseRow {
  word_id: number;
  synset_id: string;
  sense_num: number;
}

export interface WordDetailData {
  lemma: string;
  pos: string;
  phonetic: string;
  senses: Array<{
    synsetId: string;
    definition: string;
    examples: string[];
    senseNum: number;
  }>;
  wordFamily: Array<{ lemma: string; pos: string }>;
  collocations: string[];
}
```

`src/graph/graphTypes.ts`：
```typescript
export type RelationType =
  | 'center' | 'synonym' | 'hypernym' | 'hyponym'
  | 'antonym' | 'similar' | 'also' | 'derivation' | 'meronym' | 'holonym';

export interface GraphNode {
  id: string;
  label: string;
  pos: string;
  relation: RelationType;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// RN → WebView
export type ToWebViewMessage =
  | { type: 'LOAD_GRAPH'; word: string; nodes: GraphNode[]; edges: GraphEdge[]; mode: 'force' | 'tree' }
  | { type: 'SET_MODE'; mode: 'force' | 'tree' };

// WebView → RN
export type FromWebViewMessage =
  | { type: 'NODE_TAP'; word: string }
  | { type: 'GRAPH_READY' };
```

- [ ] **Step 2: 数据库单例**

`src/db/database.ts`：
```typescript
import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  const dbName = 'wordnet.db';
  const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
  const dbDir = `${FileSystem.documentDirectory}SQLite/`;

  const dirInfo = await FileSystem.getInfoAsync(dbDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
  }

  const fileInfo = await FileSystem.getInfoAsync(dbPath);
  if (!fileInfo.exists) {
    // 首次运行：从 assets 复制到可写目录
    const asset = Asset.fromModule(require('../../assets/wordnet.db'));
    await asset.downloadAsync();
    await FileSystem.copyAsync({ from: asset.localUri!, to: dbPath });
  }

  _db = await SQLite.openDatabaseAsync(dbName);
  return _db;
}
```

> 注意：`expo-asset` 和 `expo-file-system` 需安装：`npx expo install expo-asset expo-file-system`

- [ ] **Step 3: 安装 expo-asset 和 expo-file-system**

```bash
npx expo install expo-asset expo-file-system
```

- [ ] **Step 4: 编写查询函数**

`src/db/queries.ts`：
```typescript
import type { SQLiteDatabase } from 'expo-sqlite';
import type { WordDetailData } from './types';
import type { GraphData, GraphNode, GraphEdge } from '../graph/graphTypes';

export async function searchWords(
  db: SQLiteDatabase,
  query: string,
  limit = 10,
): Promise<Array<{ id: number; lemma: string; pos: string }>> {
  return db.getAllAsync(
    'SELECT id, lemma, pos FROM words WHERE lemma LIKE ? ORDER BY lemma LIMIT ?',
    [`${query}%`, limit],
  );
}

export async function getWordGraph(
  db: SQLiteDatabase,
  lemma: string,
  nodeLimit = 20,
): Promise<GraphData> {
  const words = await db.getAllAsync<{ id: number; pos: string }>(
    'SELECT id, pos FROM words WHERE lemma = ?',
    [lemma],
  );
  if (!words.length) return { nodes: [], edges: [] };

  const wordIds = words.map((w) => w.id);
  const ph = wordIds.map(() => '?').join(',');

  const synsets = await db.getAllAsync<{ synset_id: string }>(
    `SELECT DISTINCT synset_id FROM senses WHERE word_id IN (${ph})`,
    wordIds,
  );
  if (!synsets.length) {
    return {
      nodes: [{ id: lemma, label: lemma, pos: words[0].pos, relation: 'center' }],
      edges: [],
    };
  }

  const synsetIds = synsets.map((s) => s.synset_id);
  const synPh = synsetIds.map(() => '?').join(',');

  const relations = await db.getAllAsync<{
    from_synset: string;
    to_synset: string;
    type: string;
  }>(
    `SELECT from_synset, to_synset, type FROM relations
     WHERE from_synset IN (${synPh})
     AND type IN ('antonym','hypernym','hyponym','similar','also','meronym','holonym')
     LIMIT ?`,
    [...synsetIds, nodeLimit * 3],
  );

  const relatedSynsetIds = [...new Set(relations.map((r) => r.to_synset))];
  if (!relatedSynsetIds.length) {
    return {
      nodes: [{ id: lemma, label: lemma, pos: words[0].pos, relation: 'center' }],
      edges: [],
    };
  }

  const relPh = relatedSynsetIds.map(() => '?').join(',');
  const relatedWords = await db.getAllAsync<{
    synset_id: string;
    lemma: string;
    pos: string;
    sense_num: number;
  }>(
    `SELECT s.synset_id, w.lemma, w.pos, s.sense_num
     FROM senses s JOIN words w ON w.id = s.word_id
     WHERE s.synset_id IN (${relPh})
     ORDER BY s.sense_num ASC`,
    relatedSynsetIds,
  );

  // synset_id → 代表词（取 sense_num 最小的词）
  const synsetToWord = new Map<string, string>();
  for (const rw of relatedWords) {
    if (!synsetToWord.has(rw.synset_id)) synsetToWord.set(rw.synset_id, rw.lemma);
  }

  const nodes: GraphNode[] = [{ id: lemma, label: lemma, pos: words[0].pos, relation: 'center' }];
  const edges: GraphEdge[] = [];
  const seenNodes = new Set<string>([lemma]);

  // 按关系类型优先级排序（antonym 和 synonym 优先展示）
  const PRIORITY: Record<string, number> = { antonym: 0, similar: 1, hypernym: 2, hyponym: 3, meronym: 4, holonym: 5, also: 6 };
  const sortedRelations = [...relations].sort((a, b) => (PRIORITY[a.type] ?? 9) - (PRIORITY[b.type] ?? 9));

  for (const rel of sortedRelations) {
    if (nodes.length > nodeLimit) break;
    const targetWord = synsetToWord.get(rel.to_synset);
    if (!targetWord || targetWord === lemma) continue;
    if (!seenNodes.has(targetWord)) {
      seenNodes.add(targetWord);
      nodes.push({ id: targetWord, label: targetWord, pos: '', relation: rel.type as GraphNode['relation'] });
    }
    if (!edges.find((e) => e.source === lemma && e.target === targetWord)) {
      edges.push({ source: lemma, target: targetWord, type: rel.type });
    }
  }

  // 派生词（最多 5 个）
  const derivations = await db.getAllAsync<{ lemma: string; pos: string }>(
    `SELECT DISTINCT w.lemma, w.pos FROM derivations d
     JOIN words w ON w.id = d.to_word_id
     WHERE d.from_word_id IN (${ph}) AND w.lemma != ?
     LIMIT 5`,
    [...wordIds, lemma],
  );
  for (const d of derivations) {
    if (!seenNodes.has(d.lemma) && nodes.length <= nodeLimit + 5) {
      seenNodes.add(d.lemma);
      nodes.push({ id: d.lemma, label: d.lemma, pos: d.pos, relation: 'derivation' });
      edges.push({ source: lemma, target: d.lemma, type: 'derivation' });
    }
  }

  return { nodes, edges };
}

export async function getWordDetail(
  db: SQLiteDatabase,
  lemma: string,
): Promise<WordDetailData | null> {
  const words = await db.getAllAsync<{ id: number; pos: string }>(
    'SELECT id, pos FROM words WHERE lemma = ?',
    [lemma],
  );
  if (!words.length) return null;

  const wordId = words[0].id;
  const pos = words[0].pos;

  // 音标
  const phoneticRow = await db.getFirstAsync<{ ipa: string }>(
    'SELECT ipa FROM phonetics WHERE word_id = ?',
    [wordId],
  );

  // 词义（所有 synset）
  const senseRows = await db.getAllAsync<{
    synset_id: string;
    definition: string;
    examples: string;
    sense_num: number;
  }>(
    `SELECT s.synset_id, sy.definition, sy.examples, s.sense_num
     FROM senses s JOIN synsets sy ON sy.id = s.synset_id
     WHERE s.word_id = ?
     ORDER BY s.sense_num ASC`,
    [wordId],
  );

  const senses = senseRows.map((r) => ({
    synsetId: r.synset_id,
    definition: r.definition,
    examples: JSON.parse(r.examples || '[]') as string[],
    senseNum: r.sense_num,
  }));

  // 词族
  const wordFamilyRows = await db.getAllAsync<{ lemma: string; pos: string }>(
    `SELECT DISTINCT w.lemma, w.pos FROM derivations d
     JOIN words w ON w.id = d.to_word_id
     WHERE d.from_word_id = ? AND w.lemma != ?
     LIMIT 10`,
    [wordId, lemma],
  );

  // 搭配（仅动词）
  const collocationRows = await db.getAllAsync<{ frame_text: string }>(
    'SELECT DISTINCT frame_text FROM collocations WHERE word_id = ? LIMIT 8',
    [wordId],
  );

  return {
    lemma,
    pos,
    phonetic: phoneticRow?.ipa ?? '',
    senses,
    wordFamily: wordFamilyRows,
    collocations: collocationRows.map((r) => r.frame_text),
  };
}
```

- [ ] **Step 5: 编写纯函数测试**

`__tests__/graphFormat.test.ts`：
```typescript
import type { GraphNode, GraphEdge } from '../src/graph/graphTypes';

// 测试节点去重逻辑（从 getWordGraph 中提取的纯函数）
function deduplicateNodes(
  lemma: string,
  relations: Array<{ target: string; type: string }>,
  nodeLimit: number,
): GraphNode[] {
  const nodes: GraphNode[] = [{ id: lemma, label: lemma, pos: 'n', relation: 'center' }];
  const seen = new Set<string>([lemma]);
  for (const rel of relations) {
    if (nodes.length > nodeLimit) break;
    if (!seen.has(rel.target)) {
      seen.add(rel.target);
      nodes.push({ id: rel.target, label: rel.target, pos: '', relation: rel.type as GraphNode['relation'] });
    }
  }
  return nodes;
}

describe('deduplicateNodes', () => {
  it('中心词始终是第一个节点', () => {
    const nodes = deduplicateNodes('happy', [{ target: 'glad', type: 'synonym' }], 20);
    expect(nodes[0].id).toBe('happy');
    expect(nodes[0].relation).toBe('center');
  });

  it('重复的目标词只保留一个', () => {
    const nodes = deduplicateNodes('happy', [
      { target: 'glad', type: 'synonym' },
      { target: 'glad', type: 'similar' },
    ], 20);
    expect(nodes.filter((n) => n.id === 'glad')).toHaveLength(1);
  });

  it('超出 nodeLimit 后不再添加节点', () => {
    const relations = Array.from({ length: 10 }, (_, i) => ({ target: `word${i}`, type: 'hypernym' }));
    const nodes = deduplicateNodes('test', relations, 5);
    expect(nodes.length).toBeLessThanOrEqual(6); // center + 5
  });
});
```

- [ ] **Step 6: 运行测试**

```bash
pnpm jest __tests__/graphFormat.test.ts
```

预期：3 tests passed

- [ ] **Step 7: Commit**

```bash
git add src/db/ src/graph/graphTypes.ts __tests__/graphFormat.test.ts
git commit -m "feat: db types, queries, and graph format tests"
```

---

## Task 5: 存储层（收藏 / 历史 / 设置）

**Files:**
- Create: `src/storage/storage.ts`
- Create: `src/hooks/useSettings.ts`
- Create: `__tests__/storage.test.ts`

- [ ] **Step 1: 编写 storage.ts**

`src/storage/storage.ts`：
```typescript
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

const DEFAULT_SETTINGS: AppSettings = {
  graphMode: 'force',
  nodeLimit: 20,
  darkMode: true,
};

// 收藏夹
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
  return idx === -1; // true = 已添加
}

export async function isFavorited(lemma: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.includes(lemma);
}

// 搜索历史
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

// 设置
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
```

- [ ] **Step 2: 编写 useSettings hook**

`src/hooks/useSettings.ts`：
```typescript
import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings, type AppSettings } from '../storage/storage';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    graphMode: 'force',
    nodeLimit: 20,
    darkMode: true,
  });

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    const updated = await saveSettings(patch);
    setSettings(updated);
  }, []);

  return { settings, update };
}
```

- [ ] **Step 3: 编写 storage 测试**

`__tests__/storage.test.ts`：
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFavorites, toggleFavorite, isFavorited, getHistory, addToHistory, clearHistory, getSettings, saveSettings } from '../src/storage/storage';

// jest.config.js 中需配置 moduleNameMapper for @react-native-async-storage/async-storage
// 使用官方 mock: @react-native-async-storage/async-storage/jest/async-storage-mock

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
    expect(s.nodeLimit).toBe(20); // 其他字段不变
  });
});
```

- [ ] **Step 4: 配置 Jest mock**

在 `package.json` 中添加 jest 配置：
```json
{
  "jest": {
    "preset": "jest-expo",
    "moduleNameMapper": {
      "@react-native-async-storage/async-storage": "@react-native-async-storage/async-storage/jest/async-storage-mock"
    }
  }
}
```

```bash
pnpm add -D jest-expo
```

- [ ] **Step 5: 运行测试**

```bash
pnpm jest __tests__/storage.test.ts
```

预期：8 tests passed

- [ ] **Step 6: Commit**

```bash
git add src/storage/ src/hooks/useSettings.ts __tests__/storage.test.ts package.json
git commit -m "feat: storage layer with favorites, history, settings"
```

---

## Task 6: SearchScreen

**Files:**
- Create: `src/components/SearchBar.tsx`
- Create: `src/components/RelationTag.tsx`
- Modify: `src/screens/SearchScreen.tsx`

- [ ] **Step 1: 创建 RelationTag 组件**

`src/components/RelationTag.tsx`：
```typescript
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const RELATION_COLORS: Record<string, string> = {
  center: '#6c63ff',
  synonym: '#6c63ff',
  hypernym: '#f7971e',
  hyponym: '#f7971e',
  antonym: '#43e97b',
  similar: '#4fc3f7',
  derivation: '#fa709a',
  meronym: '#a78bfa',
  holonym: '#a78bfa',
  default: '#888',
};

interface Props {
  label: string;
  type?: string;
  onPress?: () => void;
}

export function RelationTag({ label, type = 'default', onPress }: Props) {
  const color = RELATION_COLORS[type] ?? RELATION_COLORS.default;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tag, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}
    >
      <Text style={[styles.text, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tag: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginBottom: 6 },
  text: { fontSize: 13, fontWeight: '500' },
});
```

- [ ] **Step 2: 创建 SearchBar 组件**

`src/components/SearchBar.tsx`：
```typescript
import { useState, useEffect, useRef } from 'react';
import {
  View, TextInput, Text, FlatList, TouchableOpacity, StyleSheet, Keyboard,
} from 'react-native';
import { getDatabase } from '../db/database';
import { searchWords } from '../db/queries';

const POS_LABEL: Record<string, string> = { n: 'n', v: 'v', a: 'adj', r: 'adv' };

interface Props {
  onSelectWord: (word: string) => void;
}

export function SearchBar({ onSelectWord }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: number; lemma: string; pos: string }>>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const db = await getDatabase();
      const rows = await searchWords(db, query.trim().toLowerCase(), 10);
      setResults(rows);
    }, 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelect = (word: string) => {
    setQuery('');
    setResults([]);
    Keyboard.dismiss();
    onSelectWord(word);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Text style={styles.icon}>🔍</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="搜索单词..."
          placeholderTextColor="#555"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
            <Text style={styles.clear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {results.length > 0 && (
        <FlatList
          style={styles.dropdown}
          data={results}
          keyExtractor={(item) => `${item.id}`}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultRow} onPress={() => handleSelect(item.lemma)}>
              <Text style={styles.lemma}>{item.lemma}</Text>
              <View style={styles.posBadge}>
                <Text style={styles.posText}>{POS_LABEL[item.pos] ?? item.pos}</Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 10 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0f3460', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
  },
  icon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, color: 'white', fontSize: 16 },
  clear: { color: '#6c63ff', fontSize: 16 },
  dropdown: {
    backgroundColor: '#16213e', borderRadius: 12, marginTop: 4,
    maxHeight: 280, borderWidth: 1, borderColor: '#0f3460',
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  lemma: { flex: 1, color: 'white', fontSize: 15 },
  posBadge: { backgroundColor: '#6c63ff33', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  posText: { color: '#6c63ff', fontSize: 12 },
  separator: { height: 1, backgroundColor: '#0f3460' },
});
```

- [ ] **Step 3: 实现 SearchScreen**

`src/screens/SearchScreen.tsx`：
```typescript
import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { SearchBar } from '../components/SearchBar';
import { getHistory, addToHistory, getFavorites } from '../storage/storage';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const [history, setHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setHistory(await getHistory());
    setFavorites((await getFavorites()).slice(0, 5));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const navigateToWord = useCallback(
    async (word: string) => {
      await addToHistory(word);
      navigation.navigate('Graph', { word });
      refresh();
    },
    [navigation, refresh],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>WordNet</Text>
        <SearchBar onSelectWord={navigateToWord} />

        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>最近搜索</Text>
            <View style={styles.tagRow}>
              {history.slice(0, 8).map((w) => (
                <TouchableOpacity key={w} style={styles.histTag} onPress={() => navigateToWord(w)}>
                  <Text style={styles.histText}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {favorites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>收藏夹</Text>
            {favorites.map((w) => (
              <TouchableOpacity key={w} style={styles.favRow} onPress={() => navigateToWord(w)}>
                <Text style={styles.favText}>{w}</Text>
                <Text style={styles.star}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },
  scroll: { flex: 1, padding: 16 },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  section: { marginTop: 24 },
  sectionTitle: { color: '#888', fontSize: 13, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  histTag: { backgroundColor: '#0f3460', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  histText: { color: '#6c63ff', fontSize: 14 },
  favRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', borderRadius: 12, padding: 14, marginBottom: 8 },
  favText: { flex: 1, color: 'white', fontSize: 15 },
  star: { color: '#f7971e', fontSize: 16 },
});
```

- [ ] **Step 4: 模拟器验证**

```bash
npx expo start
```

在 iPhone 模拟器中：
- 输入 "hap" → 确认下拉列表出现 happy / happily 等词
- 点击词 → 跳转到 GraphScreen（仍显示 "Graph: happy"）
- 返回 → 最近搜索标签中出现该词

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchBar.tsx src/components/RelationTag.tsx src/screens/SearchScreen.tsx
git commit -m "feat: search screen with autocomplete and history"
```

---

## Task 7: D3 力导向图谱 WebView

**Files:**
- Create: `src/graph/graphHtml.ts`
- Create: `src/graph/ForceGraph.tsx`

> **注意（树状模式）：** `graphHtml.ts` 目前只实现力导向（风格 A）。设置页存储 `graphMode: 'tree'` 但 v1.0 渲染时仍使用力导向布局。风格 B（层级树）在后续迭代中通过扩展 `LOAD_GRAPH` handler 实现，现有通信协议和设置存储已为此预留接口。

- [ ] **Step 1: 创建 D3 图谱 HTML**

`src/graph/graphHtml.ts`：
```typescript
export const GRAPH_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0f0f1a; overflow: hidden; touch-action: none; }
    svg { width: 100vw; height: 100vh; }
    .node { cursor: pointer; }
    .node text { pointer-events: none; fill: white; font-family: -apple-system, sans-serif; }
    .link { stroke-opacity: 0.4; fill: none; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"><\/script>
</head>
<body>
<svg id="graph"></svg>
<script>
const COLORS = {
  center:'#6c63ff', synonym:'#6c63ff', hypernym:'#f7971e', hyponym:'#f7971e',
  antonym:'#43e97b', similar:'#4fc3f7', derivation:'#fa709a',
  meronym:'#a78bfa', holonym:'#a78bfa', also:'#888', default:'#666'
};
const RADII = { center:26, synonym:15, hypernym:14, hyponym:13, antonym:14, similar:13, derivation:13, default:12 };

let simulation = null;
const svg = d3.select('#graph');
const g = svg.append('g');
const linkG = g.append('g');
const nodeG = g.append('g');

svg.call(
  d3.zoom().scaleExtent([0.25, 4])
    .on('zoom', e => g.attr('transform', e.transform))
);

function postToRN(msg) {
  try { window.ReactNativeWebView?.postMessage(JSON.stringify(msg)); } catch(_) {}
}

function loadGraph(data) {
  const { nodes, edges, mode } = data;
  linkG.selectAll('*').remove();
  nodeG.selectAll('*').remove();
  if (simulation) { simulation.stop(); simulation = null; }

  const w = window.innerWidth, h = window.innerHeight;

  const link = linkG.selectAll('line').data(edges).enter().append('line')
    .attr('class', 'link')
    .attr('stroke', d => COLORS[d.type] || COLORS.default)
    .attr('stroke-width', 1.5);

  const node = nodeG.selectAll('g').data(nodes).enter().append('g')
    .attr('class', 'node')
    .on('click', (_, d) => { if (d.relation !== 'center') postToRN({ type: 'NODE_TAP', word: d.label }); })
    .call(
      d3.drag()
        .on('start', (e, d) => { if (!e.active) simulation?.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) simulation?.alphaTarget(0); d.fx = null; d.fy = null; })
    );

  node.append('circle')
    .attr('r', d => RADII[d.relation] || RADII.default)
    .attr('fill', d => COLORS[d.relation] || COLORS.default)
    .attr('stroke', d => d.relation === 'center' ? 'rgba(255,255,255,0.8)' : 'none')
    .attr('stroke-width', 2);

  node.append('text')
    .text(d => d.label)
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('font-size', d => d.relation === 'center' ? 13 : 10)
    .attr('font-weight', d => d.relation === 'center' ? 'bold' : 'normal');

  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(edges).id(d => d.id).distance(90).strength(0.4))
    .force('charge', d3.forceManyBody().strength(-280))
    .force('center', d3.forceCenter(w / 2, h / 2))
    .force('collision', d3.forceCollide(d => (RADII[d.relation] || RADII.default) + 10))
    .on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => \`translate(\${d.x},\${d.y})\`);
    });
}

window.addEventListener('message', e => {
  const msg = JSON.parse(e.data);
  if (msg.type === 'LOAD_GRAPH') loadGraph(msg);
});

document.addEventListener('DOMContentLoaded', () => postToRN({ type: 'GRAPH_READY' }));
<\/script>
</body>
</html>`;
```

- [ ] **Step 2: 创建 ForceGraph 组件**

`src/graph/ForceGraph.tsx`：
```typescript
import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import { GRAPH_HTML } from './graphHtml';
import type { GraphData, ToWebViewMessage, FromWebViewMessage } from './graphTypes';

export interface ForceGraphHandle {
  loadGraph: (data: GraphData & { mode: 'force' | 'tree' }) => void;
}

interface Props {
  onNodeTap: (word: string) => void;
  onReady?: () => void;
}

export const ForceGraph = forwardRef<ForceGraphHandle, Props>(({ onNodeTap, onReady }, ref) => {
  const webViewRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    loadGraph(data) {
      const msg: ToWebViewMessage = { type: 'LOAD_GRAPH', word: '', ...data };
      webViewRef.current?.injectJavaScript(
        `window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(JSON.stringify(msg))} })); true;`
      );
    },
  }));

  const handleMessage = useCallback((e: WebViewMessageEvent) => {
    const msg = JSON.parse(e.nativeEvent.data) as FromWebViewMessage;
    if (msg.type === 'NODE_TAP') onNodeTap(msg.word);
    if (msg.type === 'GRAPH_READY') onReady?.();
  }, [onNodeTap, onReady]);

  return (
    <WebView
      ref={webViewRef}
      style={styles.webview}
      source={{ html: GRAPH_HTML }}
      onMessage={handleMessage}
      originWhitelist={['*']}
      javaScriptEnabled
      scrollEnabled={false}
      overScrollMode="never"
    />
  );
});

ForceGraph.displayName = 'ForceGraph';

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: '#0f0f1a' },
});
```

- [ ] **Step 3: 创建 useWordGraph hook**

`src/hooks/useWordGraph.ts`：
```typescript
import { useState, useEffect } from 'react';
import { getDatabase } from '../db/database';
import { getWordGraph } from '../db/queries';
import type { GraphData } from '../graph/graphTypes';
import type { AppSettings } from '../storage/storage';

export function useWordGraph(lemma: string, settings: AppSettings) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lemma) return;
    setLoading(true);
    getDatabase()
      .then((db) => getWordGraph(db, lemma, settings.nodeLimit))
      .then(setGraphData)
      .finally(() => setLoading(false));
  }, [lemma, settings.nodeLimit]);

  return { graphData, loading };
}
```

- [ ] **Step 4: 模拟器验证（临时测试）**

在 `GraphScreen.tsx` 临时添加 ForceGraph 验证：

```typescript
// 临时：在 GraphScreen 中渲染 ForceGraph 验证图谱显示
import { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ForceGraph, type ForceGraphHandle } from '../graph/ForceGraph';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useWordGraph } from '../hooks/useWordGraph';
import { useSettings } from '../hooks/useSettings';

type Props = NativeStackScreenProps<RootStackParamList, 'Graph'>;

export function GraphScreen({ route }: Props) {
  const { word } = route.params;
  const graphRef = useRef<ForceGraphHandle>(null);
  const { settings } = useSettings();
  const { graphData } = useWordGraph(word, settings);

  useEffect(() => {
    if (graphData) {
      graphRef.current?.loadGraph({ ...graphData, mode: settings.graphMode });
    }
  }, [graphData, settings.graphMode]);

  return (
    <View style={{ flex: 1 }}>
      <ForceGraph
        ref={graphRef}
        onNodeTap={(w) => console.log('tapped:', w)}
      />
    </View>
  );
}
```

在模拟器中搜索 "happy"，确认：
- 力导向图谱显示，中心节点 "happy" 可见
- 周围节点连接展开
- 可拖拽节点

- [ ] **Step 5: Commit**

```bash
git add src/graph/ src/hooks/useWordGraph.ts
git commit -m "feat: D3 force graph WebView with RN bridge"
```

---

## Task 8: GraphScreen + 底部抽屉词条详情

**Files:**
- Create: `src/components/WordDetail.tsx`
- Create: `src/hooks/useWordDetail.ts`
- Modify: `src/screens/GraphScreen.tsx`

- [ ] **Step 1: 创建 useWordDetail hook**

`src/hooks/useWordDetail.ts`：
```typescript
import { useState, useEffect } from 'react';
import { getDatabase } from '../db/database';
import { getWordDetail } from '../db/queries';
import type { WordDetailData } from '../db/types';

export function useWordDetail(lemma: string) {
  const [detail, setDetail] = useState<WordDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lemma) return;
    setLoading(true);
    getDatabase()
      .then((db) => getWordDetail(db, lemma))
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [lemma]);

  return { detail, loading };
}
```

- [ ] **Step 2: 创建 WordDetail 组件**

`src/components/WordDetail.tsx`：
```typescript
import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import type { WordDetailData } from '../db/types';

const POS_LABEL: Record<string, string> = { n: 'noun', v: 'verb', a: 'adj', r: 'adv' };

interface Props {
  detail: WordDetailData;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

export function WordDetail({ detail, isFavorited, onToggleFavorite }: Props) {
  const [senseIdx, setSenseIdx] = useState(0);

  const speak = useCallback(() => {
    Speech.speak(detail.lemma, { language: 'en-US', rate: 0.9 });
  }, [detail.lemma]);

  const sense = detail.senses[senseIdx];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 词头行 */}
      <View style={styles.headerRow}>
        <View style={styles.lemmaGroup}>
          <Text style={styles.lemma}>{detail.lemma}</Text>
          <Text style={styles.pos}>{POS_LABEL[detail.pos] ?? detail.pos}</Text>
          {detail.phonetic ? <Text style={styles.phonetic}>/{detail.phonetic}/</Text> : null}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={speak} style={styles.iconBtn}>
            <Text style={styles.iconText}>🔊</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onToggleFavorite} style={styles.iconBtn}>
            <Text style={styles.iconText}>{isFavorited ? '★' : '☆'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 词义切换标签 */}
      {detail.senses.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.senseTabs}>
          {detail.senses.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setSenseIdx(i)}
              style={[styles.senseTab, senseIdx === i && styles.senseTabActive]}
            >
              <Text style={[styles.senseTabText, senseIdx === i && styles.senseTabTextActive]}>
                {i + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* 定义 */}
      {sense && (
        <>
          <Text style={styles.definition}>{sense.definition}</Text>
          {sense.examples.map((ex, i) => (
            <View key={i} style={styles.exampleBox}>
              <Text style={styles.exampleText}>"{ex}"</Text>
            </View>
          ))}
        </>
      )}

      {/* 词族 */}
      {detail.wordFamily.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>词族</Text>
          <View style={styles.tagRow}>
            {detail.wordFamily.map((w, i) => (
              <View key={i} style={styles.familyTag}>
                <Text style={styles.familyText}>{w.lemma}</Text>
                <Text style={styles.familyPos}> {POS_LABEL[w.pos] ?? w.pos}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 搭配（动词 frames） */}
      {detail.collocations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>搭配句型</Text>
          {detail.collocations.map((c, i) => (
            <Text key={i} style={styles.collocation}>• {c}</Text>
          ))}
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  lemmaGroup: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  lemma: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  pos: { color: '#888', fontSize: 14 },
  phonetic: { color: '#6c63ff', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 4 },
  iconText: { fontSize: 20 },
  senseTabs: { flexDirection: 'row', marginBottom: 10 },
  senseTab: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#0f3460',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  senseTabActive: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  senseTabText: { color: '#888', fontSize: 14 },
  senseTabTextActive: { color: 'white' },
  definition: { color: '#ddd', fontSize: 15, lineHeight: 22, marginBottom: 10 },
  exampleBox: { backgroundColor: '#0f3460', borderRadius: 8, padding: 10, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#6c63ff' },
  exampleText: { color: '#aaa', fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  section: { marginTop: 16 },
  sectionLabel: { color: '#555', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  familyTag: { flexDirection: 'row', backgroundColor: '#fa709a22', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  familyText: { color: '#fa709a', fontSize: 13 },
  familyPos: { color: '#fa709a88', fontSize: 11 },
  collocation: { color: '#aaa', fontSize: 13, lineHeight: 22 },
});
```

- [ ] **Step 3: 实现完整 GraphScreen**

`src/screens/GraphScreen.tsx`：
```typescript
import { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { ForceGraph, type ForceGraphHandle } from '../graph/ForceGraph';
import { WordDetail } from '../components/WordDetail';
import { useWordGraph } from '../hooks/useWordGraph';
import { useWordDetail } from '../hooks/useWordDetail';
import { useSettings } from '../hooks/useSettings';
import { toggleFavorite, isFavorited } from '../storage/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Graph'>;

export function GraphScreen({ route, navigation }: Props) {
  const { word: initialWord } = route.params;
  const [currentWord, setCurrentWord] = useState(initialWord);
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [favorited, setFavorited] = useState(false);

  const graphRef = useRef<ForceGraphHandle>(null);
  const sheetRef = useRef<BottomSheet>(null);
  const { settings } = useSettings();
  const { graphData, loading: graphLoading } = useWordGraph(currentWord, settings);
  const { detail } = useWordDetail(currentWord);

  useEffect(() => {
    isFavorited(currentWord).then(setFavorited);
  }, [currentWord]);

  useEffect(() => {
    if (graphData) {
      graphRef.current?.loadGraph({ ...graphData, mode: settings.graphMode });
    }
  }, [graphData, settings.graphMode]);

  const handleNodeTap = useCallback((word: string) => {
    setHistoryStack((prev) => [...prev, currentWord]);
    setCurrentWord(word);
    sheetRef.current?.snapToIndex(0); // 折叠抽屉
  }, [currentWord]);

  const handleBack = useCallback(() => {
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1];
      setHistoryStack((s) => s.slice(0, -1));
      setCurrentWord(prev);
    } else {
      navigation.goBack();
    }
  }, [historyStack, navigation]);

  const handleToggleFavorite = useCallback(async () => {
    const isNowFavorited = await toggleFavorite(currentWord);
    setFavorited(isNowFavorited);
  }, [currentWord]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navWord}>{currentWord}</Text>
        {detail && <Text style={styles.navPos}>{detail.pos}</Text>}
      </View>

      {/* 图谱区 */}
      <View style={styles.graphArea}>
        {graphLoading && (
          <ActivityIndicator style={StyleSheet.absoluteFill} color="#6c63ff" />
        )}
        <ForceGraph ref={graphRef} onNodeTap={handleNodeTap} />
      </View>

      {/* 底部抽屉 */}
      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={['30%', '85%']}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <BottomSheetScrollView>
          {detail ? (
            <WordDetail
              detail={detail}
              isFavorited={favorited}
              onToggleFavorite={handleToggleFavorite}
            />
          ) : (
            <ActivityIndicator style={{ margin: 32 }} color="#6c63ff" />
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  navbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn: { padding: 4 },
  backText: { color: '#6c63ff', fontSize: 22 },
  navWord: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  navPos: { color: '#888', fontSize: 14 },
  graphArea: { flex: 1 },
  sheetBg: { backgroundColor: '#16213e' },
  sheetHandle: { backgroundColor: '#6c63ff' },
});
```

- [ ] **Step 4: 模拟器全流程验证**

在模拟器中：
1. 搜索 "happy" → 图谱出现，中心节点紫色
2. 上滑底部抽屉 → 展示定义、例句、词族
3. 点击图谱中任意节点（如 "glad"）→ 图谱重新以 "glad" 为中心
4. 点击 "←" 返回 → 回到 "happy"
5. 点击 ☆ 收藏

- [ ] **Step 5: Commit**

```bash
git add src/components/WordDetail.tsx src/hooks/useWordDetail.ts src/screens/GraphScreen.tsx
git commit -m "feat: graph screen with bottom sheet word detail"
```

---

## Task 9: FavoritesScreen + SettingsScreen

**Files:**
- Modify: `src/screens/FavoritesScreen.tsx`
- Modify: `src/screens/SettingsScreen.tsx`

- [ ] **Step 1: 实现 FavoritesScreen**

`src/screens/FavoritesScreen.tsx`：
```typescript
import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getFavorites, toggleFavorite } from '../storage/storage';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

export function FavoritesScreen() {
  const navigation = useNavigation<Nav>();
  const [favorites, setFavorites] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setFavorites(await getFavorites());
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const handleRemove = useCallback(async (word: string) => {
    await toggleFavorite(word);
    refresh();
  }, [refresh]);

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>收藏夹</Text>
      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>暂无收藏</Text>
          <Text style={styles.emptyHint}>在图谱页点击 ☆ 收藏单词</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.wordBtn}
                onPress={() => navigation.navigate('Graph', { word: item })}
              >
                <Text style={styles.word}>{item}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRemove(item)} style={styles.removeBtn}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold', padding: 16 },
  list: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', borderRadius: 12, padding: 14, marginBottom: 8 },
  wordBtn: { flex: 1 },
  word: { color: 'white', fontSize: 16 },
  removeBtn: { padding: 4 },
  removeText: { color: '#555', fontSize: 16 },
  separator: { height: 0 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#888', fontSize: 18, marginBottom: 8 },
  emptyHint: { color: '#555', fontSize: 14 },
});
```

- [ ] **Step 2: 实现 SettingsScreen**

`src/screens/SettingsScreen.tsx`：
```typescript
import { View, Text, Switch, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSettings } from '../hooks/useSettings';
import { clearHistory } from '../storage/storage';

export function SettingsScreen() {
  const { settings, update } = useSettings();

  const handleClearHistory = () => {
    Alert.alert('清除历史', '确认清空所有搜索历史？', [
      { text: '取消', style: 'cancel' },
      { text: '清除', style: 'destructive', onPress: clearHistory },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>
        <Text style={styles.title}>设置</Text>

        {/* 图谱模式 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>图谱模式</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, settings.graphMode === 'force' && styles.modeBtnActive]}
              onPress={() => update({ graphMode: 'force' })}
            >
              <Text style={styles.modeIcon}>◉</Text>
              <Text style={[styles.modeText, settings.graphMode === 'force' && styles.modeTextActive]}>力导向</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, settings.graphMode === 'tree' && styles.modeBtnActive]}
              onPress={() => update({ graphMode: 'tree' })}
            >
              <Text style={styles.modeIcon}>🌿</Text>
              <Text style={[styles.modeText, settings.graphMode === 'tree' && styles.modeTextActive]}>层级树</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 节点数量 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>外观</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>节点数量上限</Text>
              <Text style={styles.rowValue}>{settings.nodeLimit}</Text>
            </View>
            <Slider
              minimumValue={10}
              maximumValue={50}
              step={5}
              value={settings.nodeLimit}
              onSlidingComplete={(v) => update({ nodeLimit: v })}
              minimumTrackTintColor="#6c63ff"
              maximumTrackTintColor="#0f3460"
              thumbTintColor="#6c63ff"
            />
            <View style={styles.row}>
              <Switch
                value={settings.darkMode}
                onValueChange={(v) => update({ darkMode: v })}
                trackColor={{ true: '#6c63ff' }}
              />
              <Text style={styles.rowLabel}>深色模式</Text>
            </View>
          </View>
        </View>

        {/* 数据 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>数据</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>WordNet 版本</Text>
              <Text style={styles.rowValue}>3.1</Text>
            </View>
            <TouchableOpacity style={styles.row} onPress={handleClearHistory}>
              <Text style={[styles.rowLabel, { color: '#fa709a' }]}>清除搜索历史</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold', padding: 16 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionLabel: { color: '#555', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  card: { backgroundColor: '#16213e', borderRadius: 14, padding: 14 },
  modeRow: { flexDirection: 'row', gap: 12 },
  modeBtn: { flex: 1, backgroundColor: '#16213e', borderRadius: 12, padding: 14, alignItems: 'center', gap: 4 },
  modeBtnActive: { backgroundColor: '#6c63ff' },
  modeIcon: { fontSize: 22 },
  modeText: { color: '#888', fontSize: 13 },
  modeTextActive: { color: 'white', fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { color: 'white', fontSize: 15 },
  rowValue: { color: '#6c63ff', fontSize: 15 },
});
```

- [ ] **Step 3: 安装 Slider 组件**

```bash
npx expo install @react-native-community/slider
```

- [ ] **Step 4: 全流程验证**

在模拟器中完整测试：
1. 搜索单词并浏览图谱 → 收藏 → 进入收藏夹确认显示
2. 设置页切换图谱模式（force/tree）→ 回到图谱页确认样式切换
3. 调整节点数量 → 重新进入图谱确认节点数变化
4. 清除历史 → 首页历史标签消失

- [ ] **Step 5: Commit**

```bash
git add src/screens/FavoritesScreen.tsx src/screens/SettingsScreen.tsx
git commit -m "feat: favorites and settings screens complete"
```

---

## 完成标志

- `assets/wordnet.db` 构建成功，词条 > 150,000
- 搜索补全 < 200ms（含防抖）
- 图谱页：力导向图谱渲染，节点可点击导航，支持拖拽
- 底部抽屉：定义、例句、词族、搭配、TTS 全部可用
- 收藏 / 历史持久化正常
- 设置页：图谱模式切换生效
