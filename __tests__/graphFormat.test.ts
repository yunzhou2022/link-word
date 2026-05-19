import type { GraphNode } from '../src/graph/graphTypes';

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
    expect(nodes.length).toBeLessThanOrEqual(6);
  });
});
