# WordNet iPhone 单词知识图谱 App — 设计文档

**日期**：2026-05-19  
**平台**：iOS（React Native + Expo）  
**数据源**：WordNet 3.1 完整数据集（内置 SQLite，~28MB）

---

## 1. 整体架构

```
┌─────────────────────────────────────────┐
│              React Native App            │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Search  │  │  Graph   │  │Settings│ │
│  │  Screen  │  │  Screen  │  │ Screen │ │
│  └──────────┘  └────┬─────┘  └────────┘ │
│                     │                   │
│              ┌──────┴──────┐            │
│              │  WebView    │            │
│              │  (D3 Force  │            │
│              │   Graph)    │            │
│              └──────┬──────┘            │
│           postMessage│injectedJS        │
│                     │                   │
│  ┌──────────────────┴────────────────┐  │
│  │         Native Services           │  │
│  │  expo-sqlite | expo-speech        │  │
│  │  AsyncStorage | React Navigation  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         ↑
  assets/wordnet.db（构建时预处理生成）
```

**技术选型：**
- **脚手架**：Expo managed workflow
- **导航**：React Navigation（Tab + Stack）
- **数据库**：expo-sqlite，查询 bundled `assets/wordnet.db`
- **图谱渲染**：WebView 内嵌 D3.js force simulation
- **TTS**：expo-speech（调用系统语音引擎）
- **持久化**：AsyncStorage（收藏夹、浏览历史、设置项）

---

## 2. 页面结构

### 底部 Tab（3 个）
| Tab | 页面 | 说明 |
|-----|------|------|
| ⌂ | SearchScreen | 首页，搜索入口 |
| ☆ | FavoritesScreen | 收藏夹列表 |
| ⚙ | SettingsScreen | 设置 |

### Stack 层
- `SearchScreen` → `GraphScreen`（传参：`word`）

### SearchScreen
- 顶部搜索框，输入防抖 200ms 触发补全查询
- 补全下拉列表：词条 + 词性标签，最多 10 条
- 最近搜索标签（最多 20 条，AsyncStorage）
- 收藏夹预览列表（最多 5 条）

### GraphScreen
- 顶部导航栏：词语名称 + 词性 + 收藏按钮 + 回退按钮
- 上方：WebView 渲染 D3 力导向图谱（占屏幕上 60%）
- 下方：底部抽屉（初始折叠，上滑展开）
  - **折叠态**：词语、音标、TTS 按钮、定义摘要、关系标签
  - **展开态**：多词义切换标签、完整定义、例句、词族、搭配短语

**图谱内部导航栈**：GraphScreen 内维护 `historyStack: string[]`，点击节点 push 新词，回退 pop，不依赖路由栈。

### SettingsScreen
- **图谱模式**：力导向（默认）/ 层级树（切换后全局生效）
- **节点数量上限**：滑块，范围 10~50，默认 20
- **深色模式**：开关（跟随系统 or 强制深色）
- **清除历史**：清空 AsyncStorage 中的搜索历史
- **WordNet 版本**：只读展示 3.1

---

## 3. 数据模型

### SQLite 表结构

```sql
CREATE TABLE words (
  id    INTEGER PRIMARY KEY,
  lemma TEXT NOT NULL,
  pos   TEXT NOT NULL   -- n / v / a / r
);
CREATE INDEX idx_words_lemma ON words(lemma);

CREATE TABLE synsets (
  id         TEXT PRIMARY KEY,   -- WordNet offset, e.g. "05765562-n"
  pos        TEXT NOT NULL,
  definition TEXT NOT NULL,
  examples   TEXT                -- JSON 数组字符串
);

CREATE TABLE senses (
  word_id   INTEGER NOT NULL,
  synset_id TEXT NOT NULL,
  sense_num INTEGER NOT NULL,
  PRIMARY KEY (word_id, synset_id)
);

CREATE TABLE relations (
  from_synset TEXT NOT NULL,
  to_synset   TEXT NOT NULL,
  type        TEXT NOT NULL
  -- hypernym / hyponym / antonym / similar / also
  -- meronym / holonym / derivation
);
CREATE INDEX idx_relations_from ON relations(from_synset, type);

CREATE TABLE derivations (
  from_word_id INTEGER NOT NULL,
  to_word_id   INTEGER NOT NULL
);

CREATE TABLE phonetics (
  word_id  INTEGER PRIMARY KEY,
  ipa      TEXT NOT NULL   -- IPA 音标，来源：CMU Pronouncing Dictionary 转换
);

CREATE TABLE collocations (
  word_id    INTEGER NOT NULL,
  frame_text TEXT NOT NULL  -- WordNet verb frame 模板，e.g. "Somebody ----s something"
);
```

### 图谱数据查询流程

```
输入 lemma
  → 查 words → 得到 word_id 列表（同词多词性）
  → 查 senses → 得到 synset_id 列表
  → 查 relations（LIMIT 按节点上限）→ 得到相邻 synset_id
  → 反查 senses + words → 得到相邻词条
  → 查 derivations → 得到派生词
  → 汇总返回 { nodes: [...], edges: [...] }
```

### WordNet 预处理脚本

构建时离线运行（`scripts/build-db.js`）：
- 解析 WordNet 3.1 原始格式文件（`data.noun`、`data.verb` 等）
- 按上述 schema 写入 SQLite
- 生成产物：`assets/wordnet.db`（~28MB）

---

## 4. WebView ↔ RN 通信协议

```
RN → WebView（via injectedJavaScript）:
  { type: "LOAD_GRAPH",  word: string, nodes: Node[], edges: Edge[], mode: "force"|"tree" }
  { type: "SET_MODE",    mode: "force"|"tree" }

WebView → RN（via postMessage）:
  { type: "NODE_TAP",    word: string }
  { type: "GRAPH_READY" }
```

```typescript
// Node
{ id: string, label: string, pos: string, relation: "center"|"synonym"|"hypernym"|"antonym"|"derivation" }

// Edge
{ source: string, target: string, type: string }
```

节点颜色按 `relation` 字段区分：
| relation | 颜色 |
|----------|------|
| center | #6c63ff（大节点）|
| synonym | #6c63ff（小节点）|
| hypernym / hyponym | #f7971e |
| antonym | #43e97b |
| derivation | #fa709a |

---

## 5. 词条详情页数据结构

```typescript
interface WordDetail {
  lemma: string
  pos: string
  phonetic: string          // 音标，WordNet 不含，使用 CMU Dict 补充
  senses: Sense[]
  wordFamily: WordFamilyItem[]
  collocations: string[]
  isFavorited: boolean
}

interface Sense {
  synsetId: string
  definition: string
  examples: string[]
  senseNum: number
}

interface WordFamilyItem {
  lemma: string
  pos: string
}
```

**音标来源**：CMU Pronouncing Dictionary（开源，预处理时转换为 IPA 写入 `phonetics` 表）。  
**搭配来源**：WordNet verb frames（动词句型模板，如 "Somebody ----s something"），存入 `collocations` 表；名词/形容词的搭配暂不展示（WordNet 原始数据不含）。

---

## 6. 性能边界

| 指标 | 目标 |
|------|------|
| 搜索补全延迟 | < 50ms（SQLite LIKE 查询 + 防抖 200ms）|
| 图谱数据查询 | < 30ms（索引覆盖）|
| WebView 图谱渲染 | < 100ms（节点 ≤ 50）|
| 单次图谱节点上限 | 默认 20，可调 10~50 |
| app 冷启动 | < 2s（SQLite 首次 open 在 splash 期间完成）|

---

## 7. 一期范围（v1.0）

**包含：**
- SearchScreen + GraphScreen + SettingsScreen
- D3 力导向图谱（风格 A），设置中可切换层级树（风格 B）
- 完整 WordNet 数据内置
- 词条详情：定义、例句、词性、音标 + TTS、词族、搭配
- 收藏 + 浏览历史

**不包含（后续迭代）：**
- 单词测验 / 记忆卡片功能
- iCloud 收藏同步
- 词源（etymology）信息
- 用户笔记
