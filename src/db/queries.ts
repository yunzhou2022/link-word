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

  const synsetToWord = new Map<string, string>();
  for (const rw of relatedWords) {
    if (!synsetToWord.has(rw.synset_id)) synsetToWord.set(rw.synset_id, rw.lemma);
  }

  const nodes: GraphNode[] = [{ id: lemma, label: lemma, pos: words[0].pos, relation: 'center' }];
  const edges: GraphEdge[] = [];
  const seenNodes = new Set<string>([lemma]);

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

  const phoneticRow = await db.getFirstAsync<{ ipa: string }>(
    'SELECT ipa FROM phonetics WHERE word_id = ?',
    [wordId],
  );

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

  const wordFamilyRows = await db.getAllAsync<{ lemma: string; pos: string }>(
    `SELECT DISTINCT w.lemma, w.pos FROM derivations d
     JOIN words w ON w.id = d.to_word_id
     WHERE d.from_word_id = ? AND w.lemma != ?
     LIMIT 10`,
    [wordId, lemma],
  );

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
