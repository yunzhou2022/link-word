import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as d3 from 'd3';
import type { GraphData, GraphNode, GraphEdge } from './graphTypes';
import { useTheme } from '../theme/ThemeContext';
import type { Theme } from '../theme/themes';

export interface ForceGraphHandle {
  loadGraph: (data: GraphData & { mode: 'force' | 'tree' }) => void;
}

interface Props {
  onNodeTap: (word: string) => void;
  onReady?: () => void;
}

const COLORS: Record<string, string> = {
  center: '#6c63ff', synonym: '#6c63ff', hypernym: '#f7971e', hyponym: '#f7971e',
  antonym: '#43e97b', similar: '#4fc3f7', derivation: '#fa709a',
  meronym: '#a78bfa', holonym: '#a78bfa', also: '#888', default: '#666',
};
const RADII: Record<string, number> = {
  center: 26, synonym: 15, hypernym: 14, hyponym: 13,
  antonym: 14, similar: 13, derivation: 13, default: 12,
};
const RELATION_ZH: Record<string, string> = {
  synonym: '同义词', hypernym: '上位词', hyponym: '下位词',
  antonym: '反义词', similar: '近义词', derivation: '派生词',
  meronym: '部分词', holonym: '整体词', also: '相关词',
};

const LEGEND_ITEMS = [
  { color: '#6c63ff', label: '同义词' },
  { color: '#f7971e', label: '上/下位词' },
  { color: '#43e97b', label: '反义词' },
  { color: '#4fc3f7', label: '近义词' },
  { color: '#fa709a', label: '派生词' },
  { color: '#a78bfa', label: '整体/部分' },
];

type SimNode = GraphNode & d3.SimulationNodeDatum;

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    legendWrap: { position: 'absolute', top: 12, right: 12, alignItems: 'flex-end' },
    legendBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: t.accent + 'b3', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    legendBtnText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
    legendPanel: { backgroundColor: t.card + 'eb', borderRadius: 10, padding: 10, gap: 6, borderWidth: 1, borderColor: t.accent + '4d' },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    legendLabel: { color: t.textSecondary, fontSize: 12 },
  });
}

function renderForce(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodes: GraphNode[],
  edges: GraphEdge[],
  onNodeTap: (w: string) => void,
  simRef: React.MutableRefObject<d3.Simulation<SimNode, undefined> | null>,
) {
  if (simRef.current) { simRef.current.stop(); simRef.current = null; }
  svg.selectAll('*').remove();

  const w = (svg.node()!.parentElement!.clientWidth || 400);
  const h = (svg.node()!.parentElement!.clientHeight || 400);
  svg.attr('width', w).attr('height', h);

  const g = svg.append('g');
  svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.25, 4]).on('zoom', (e) => g.attr('transform', e.transform)) as any);

  const simNodes: SimNode[] = nodes.map((n) => ({ ...n }));
  const simEdges = edges.map((e) => ({ ...e }));

  const link = g.append('g').selectAll('line').data(simEdges).enter().append('line')
    .attr('stroke', (d) => COLORS[d.type] ?? COLORS.default)
    .attr('stroke-width', 1.5).attr('stroke-opacity', 0.4);

  const node = g.append('g').selectAll<SVGGElement, SimNode>('g').data(simNodes).enter().append('g')
    .style('cursor', 'pointer')
    .on('click', (_, d) => { if (d.relation !== 'center') onNodeTap(d.label); })
    .call(d3.drag<SVGGElement, SimNode>()
      .on('start', (e, d) => { if (!e.active) simRef.current?.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on('end', (e, d) => { if (!e.active) simRef.current?.alphaTarget(0); d.fx = null; d.fy = null; }) as any);

  node.append('circle')
    .attr('r', (d) => RADII[d.relation] ?? RADII.default)
    .attr('fill', (d) => COLORS[d.relation] ?? COLORS.default)
    .attr('stroke', (d) => d.relation === 'center' ? 'rgba(255,255,255,0.8)' : 'none')
    .attr('stroke-width', 2);

  node.append('text')
    .text((d) => d.label)
    .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
    .attr('fill', 'white').attr('font-family', '-apple-system, sans-serif')
    .attr('font-size', (d) => d.relation === 'center' ? 13 : 10)
    .attr('font-weight', (d) => d.relation === 'center' ? 'bold' : 'normal')
    .style('pointer-events', 'none');

  simRef.current = d3.forceSimulation<SimNode>(simNodes)
    .force('link', d3.forceLink<SimNode, typeof simEdges[0]>(simEdges).id((d) => d.id).distance(90).strength(0.4))
    .force('charge', d3.forceManyBody().strength(-280))
    .force('center', d3.forceCenter(w / 2, h / 2))
    .force('collision', d3.forceCollide<SimNode>((d) => (RADII[d.relation] ?? RADII.default) + 10))
    .on('tick', () => {
      link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });
}

function renderTree(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodes: GraphNode[],
  onNodeTap: (w: string) => void,
) {
  svg.selectAll('*').remove();
  const w = svg.node()!.parentElement!.clientWidth || 400;
  const h = svg.node()!.parentElement!.clientHeight || 400;
  svg.attr('width', w).attr('height', h);

  const cx = w / 2, cy = h / 2;
  const maxR = Math.min(w, h) / 2 - 60;

  const center = nodes.find((n) => n.relation === 'center') || nodes[0];
  const others = nodes.filter((n) => n.relation !== 'center');
  const ORDER = ['antonym', 'similar', 'synonym', 'hypernym', 'hyponym', 'derivation', 'meronym', 'holonym', 'also'];
  const groups: Record<string, GraphNode[]> = {};
  for (const n of others) (groups[n.relation] = groups[n.relation] || []).push(n);

  const hierarchyData = {
    id: 'root', label: center.label, nodeType: 'center', relation: 'center',
    children: ORDER.filter((r) => groups[r]).concat(Object.keys(groups).filter((r) => !ORDER.includes(r)))
      .map((rel) => ({
        id: `grp-${rel}`, label: RELATION_ZH[rel] || rel, nodeType: 'group', relation: rel,
        children: groups[rel].map((n) => ({ ...n, nodeType: 'word' })),
      })),
  };

  const root = d3.hierarchy(hierarchyData);
  (d3.cluster().size([2 * Math.PI, maxR]).separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth) as any)(root);

  const rxy = (d: any): [number, number] => [cx + d.y * Math.cos(d.x - Math.PI / 2), cy + d.y * Math.sin(d.x - Math.PI / 2)];

  const g = svg.append('g');
  svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.25, 4]).on('zoom', (e) => g.attr('transform', e.transform)) as any);

  g.append('g').selectAll('path').data(root.links()).enter().append('path')
    .attr('fill', 'none')
    .attr('stroke', (d: any) => COLORS[d.target.data.relation] ?? COLORS.default)
    .attr('stroke-width', (d: any) => d.source.depth === 0 ? 1.5 : 1)
    .attr('stroke-opacity', 0.4)
    .attr('d', (d3.linkRadial() as any).angle((d: any) => d.x).radius((d: any) => d.y))
    .attr('transform', `translate(${cx},${cy})`);

  const nodeEl = g.append('g').selectAll<SVGGElement, d3.HierarchyNode<typeof hierarchyData>>('g')
    .data(root.descendants()).enter().append('g')
    .attr('transform', (d: any) => { const [x, y] = rxy(d); return `translate(${x},${y})`; })
    .style('cursor', 'pointer')
    .on('click', (_, d: any) => { if (d.data.nodeType === 'word') onNodeTap(d.data.label); });

  nodeEl.filter((d: any) => d.data.nodeType === 'center').append('circle')
    .attr('r', 24).attr('fill', '#6c63ff').attr('stroke', 'rgba(255,255,255,0.8)').attr('stroke-width', 2);

  nodeEl.filter((d: any) => d.data.nodeType === 'group').each(function(d: any) {
    const color = COLORS[d.data.relation] ?? COLORS.default;
    const tw = d.data.label.length * 9 + 12;
    d3.select(this).append('rect')
      .attr('x', -tw / 2).attr('y', -11).attr('width', tw).attr('height', 22).attr('rx', 11)
      .attr('fill', color + '30').attr('stroke', color).attr('stroke-width', 1);
  });

  nodeEl.filter((d: any) => d.data.nodeType === 'word').append('circle')
    .attr('r', (d: any) => RADII[d.data.relation] ?? RADII.default)
    .attr('fill', (d: any) => COLORS[d.data.relation] ?? COLORS.default);

  nodeEl.append('text')
    .text((d: any) => d.data.label)
    .attr('fill', (d: any) => d.data.nodeType === 'group' ? (COLORS[d.data.relation] ?? COLORS.default) : 'white')
    .attr('font-size', (d: any) => d.depth === 0 ? 13 : 10)
    .attr('font-weight', (d: any) => d.depth === 0 ? 'bold' : 'normal')
    .attr('font-family', '-apple-system, sans-serif')
    .attr('dominant-baseline', 'central')
    .attr('text-anchor', (d: any) => {
      if (d.data.nodeType !== 'word') return 'middle';
      const angle = ((d.x - Math.PI / 2) * 180 / Math.PI + 360) % 360;
      return angle <= 90 || angle >= 270 ? 'start' : 'end';
    })
    .attr('dx', (d: any) => {
      if (d.data.nodeType !== 'word') return 0;
      const r = RADII[d.data.relation] ?? RADII.default;
      const angle = ((d.x - Math.PI / 2) * 180 / Math.PI + 360) % 360;
      return angle <= 90 || angle >= 270 ? r + 4 : -(r + 4);
    })
    .style('pointer-events', 'none');
}

export const ForceGraph = forwardRef<ForceGraphHandle, Props>(({ onNodeTap, onReady }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<SimNode, undefined> | null>(null);
  const [legendVisible, setLegendVisible] = useState(false);
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  useEffect(() => { onReady?.(); }, []);

  useImperativeHandle(ref, () => ({
    loadGraph(data) {
      if (!svgRef.current) return;
      const svg = d3.select(svgRef.current);
      if (data.mode === 'tree') {
        renderTree(svg, data.nodes, onNodeTap);
      } else {
        renderForce(svg, data.nodes, data.edges, onNodeTap, simRef);
      }
    },
  }));

  return (
    <View style={styles.container}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%', background: t.graphBg } as any} />

      {/* 图例 */}
      <View style={styles.legendWrap}>
        {legendVisible && (
          <View style={styles.legendPanel}>
            {LEGEND_ITEMS.map((item) => (
              <View key={item.label} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity style={styles.legendBtn} onPress={() => setLegendVisible((v) => !v)}>
          <Text style={styles.legendBtnText}>{legendVisible ? '×' : '?'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

ForceGraph.displayName = 'ForceGraph';
