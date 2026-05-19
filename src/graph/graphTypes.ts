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
