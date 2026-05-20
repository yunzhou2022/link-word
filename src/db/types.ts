// 统一的数据库适配器接口，native(expo-sqlite) 和 web(sql.js) 都实现此接口
export interface DatabaseAdapter {
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
}

export interface WordRow {
  id: number;
  lemma: string;
  pos: string;
}

export interface SynsetRow {
  id: string;
  pos: string;
  definition: string;
  examples: string; // JSON string
}

export interface SenseRow {
  word_id: number;
  synset_id: string;
  sense_num: number;
}

export interface ConceptNetItem {
  relation: string;
  target: string;
  weight: number;
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
  conceptnet: ConceptNetItem[];
}
