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
  const { nodes, edges } = data;
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
  try {
    const msg = JSON.parse(e.data);
    if (msg.type === 'LOAD_GRAPH') loadGraph(msg);
  } catch(_) {}
});

document.addEventListener('DOMContentLoaded', () => postToRN({ type: 'GRAPH_READY' }));
<\/script>
</body>
</html>`;
