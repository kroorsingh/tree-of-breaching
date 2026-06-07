import { useState } from 'react';
import { TREE_NODES, NODE_MAP } from '../../data/genesis-tree';
import { getRequiredPath } from '../../lib/optimizer';
import { useAppStore } from '../../store/app-store';
import type { TreeNode, NodeId } from '../../data/types';

const VIEW_W = 920;
const VIEW_H = 730;

/** Node radius by type */
const R: Record<string, number> = { Notable: 14, Small: 9 };

/** Fill color per allocation state */
function nodeColor(_id: NodeId, state: 'required' | 'recommended' | 'pinned' | 'path' | 'none') {
  switch (state) {
    case 'required':    return '#1e4a78';
    case 'recommended': return '#4a3010';
    case 'pinned':      return '#2a1a4a';
    case 'path':        return '#1a2030';
    default:            return '#1a1828';
  }
}

function nodeBorder(state: ReturnType<typeof getAllocState>) {
  switch (state) {
    case 'required':    return '#4a9fe8';
    case 'recommended': return '#c8a048';
    case 'pinned':      return '#a070f0';
    case 'path':        return '#3a4060';
    default:            return '#2a2840';
  }
}

function getAllocState(
  id: NodeId,
  requiredSet: Set<NodeId>,
  recommendedSet: Set<NodeId>,
  pinnedSet: Set<NodeId>,
  pathSet: Set<NodeId>,
) {
  if (requiredSet.has(id)) return 'required';
  if (pinnedSet.has(id)) return 'pinned';
  if (recommendedSet.has(id)) return 'recommended';
  if (pathSet.has(id)) return 'path';
  return 'none';
}

export default function GenesisTree() {
  const { result, pinnedNodes, togglePin } = useAppStore();
  const [hoveredId, setHoveredId] = useState<NodeId | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Build the sets of node IDs for each state
  const requiredSet = new Set<NodeId>();
  const recommendedSet = new Set<NodeId>();
  const pathSet = new Set<NodeId>();   // prerequisite paths for recommended nodes

  if (result) {
    // Nodes from the optimizer breakdown are "recommended"
    result.breakdown.forEach(b => recommendedSet.add(b.nodeId));

    // All allocated nodes
    result.allocation.forEach(id => {
      const state = recommendedSet.has(id) ? 'recommended' : 'required';
      if (state === 'required') requiredSet.add(id);
    });

    // Prerequisites of recommended nodes that are not themselves recommended = path
    for (const id of recommendedSet) {
      getRequiredPath(id).forEach(p => {
        if (!recommendedSet.has(p) && !requiredSet.has(p)) pathSet.add(p);
      });
    }
  }

  const hoveredNode = hoveredId ? NODE_MAP.get(hoveredId) : null;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, padding: '0 0 8px', flexWrap: 'wrap' }}>
        {[
          { color: '#4a9fe8', label: 'Required' },
          { color: '#c8a048', label: 'Recommended' },
          { color: '#a070f0', label: 'Pinned' },
          { color: '#3a4060', label: 'Path node' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-dim)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            {label}
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden', position: 'relative' }}>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width="100%"
          style={{ display: 'block' }}
          onMouseMove={e => {
            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }}
        >
          {/* Background */}
          <rect width={VIEW_W} height={VIEW_H} fill="#0a0a12" />

          {/* Start node indicator — Wombgift activation point; connects to both 'a' and 'g' roots */}
          <g opacity={0.5}>
            <line x1={760} y1={572} x2={870} y2={648} stroke="#6040a0" strokeWidth={1.5} strokeDasharray="4 3" />
            <line x1={653} y1={613} x2={870} y2={648} stroke="#6040a0" strokeWidth={1.5} strokeDasharray="4 3" />
            <circle cx={870} cy={648} r={18} fill="#1a0a28" stroke="#6040a0" strokeWidth={1.5} />
            <text x={870} y={653} textAnchor="middle" fontSize={9} fill="#a070d0" style={{ pointerEvents: 'none', userSelect: 'none' }}>Start</text>
          </g>

          {/* Edges */}
          <g opacity={0.35}>
            {TREE_NODES.map(node =>
              node.parents.map(parentId => {
                const parent = NODE_MAP.get(parentId);
                if (!parent) return null;
                return (
                  <line
                    key={`${node.id}-${parentId}`}
                    x1={node.position.x} y1={node.position.y}
                    x2={parent.position.x} y2={parent.position.y}
                    stroke="#4040a0" strokeWidth={1.5}
                  />
                );
              })
            )}
          </g>

          {/* Highlighted edges for allocated nodes */}
          <g>
            {TREE_NODES.map(node => {
              const state = getAllocState(node.id, requiredSet, recommendedSet, pinnedNodes, pathSet);
              if (state === 'none') return null;
              return node.parents.map(parentId => {
                const parent = NODE_MAP.get(parentId);
                if (!parent) return null;
                return (
                  <line
                    key={`hl-${node.id}-${parentId}`}
                    x1={node.position.x} y1={node.position.y}
                    x2={parent.position.x} y2={parent.position.y}
                    stroke={nodeBorder(state)}
                    strokeWidth={2}
                    opacity={0.7}
                  />
                );
              });
            })}
          </g>

          {/* Nodes */}
          {TREE_NODES.map(node => {
            const state = getAllocState(node.id, requiredSet, recommendedSet, pinnedNodes, pathSet);
            const r = R[node.type] ?? 9;
            const fill = nodeColor(node.id, state);
            const stroke = hoveredId === node.id ? '#ffffff' : nodeBorder(state);
            const strokeW = hoveredId === node.id ? 2.5 : (state !== 'none' ? 2 : 1);

            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer' }}
                onClick={() => togglePin(node.id)}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <circle
                  cx={node.position.x} cy={node.position.y}
                  r={r}
                  fill={fill} stroke={stroke} strokeWidth={strokeW}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating tooltip — absolute inside the SVG wrapper so coords align */}
        {hoveredNode && tooltipPos && (() => {
          const state = getAllocState(hoveredNode.id, requiredSet, recommendedSet, pinnedNodes, pathSet);
          return (
            <NodeTooltip
              node={hoveredNode}
              state={state}
              x={tooltipPos.x}
              y={tooltipPos.y}
            />
          );
        })()}
      </div>
    </div>
  );
}

function NodeTooltip({ node, state, x, y }: { node: TreeNode; state: string; x: number; y: number }) {
  const tagEffect = node.effects.find(e => e.category === 'modTag');
  const gearEffect = node.effects.find(e => e.category === 'gearType');
  const reqEffect  = node.effects.find(e => e.category === 'statReq');

  const OFFSET = 14;
  const W = 220;

  // Flip left if too close to right edge (assume container ~900px rendered width)
  const flipX = x > 700;

  return (
    <div style={{
      position: 'absolute',
      top: y + OFFSET,
      left: flipX ? x - W - OFFSET : x + OFFSET,
      width: W,
      zIndex: 20,
      background: '#0e0e1a',
      border: `1px solid ${nodeBorder(state as any)}`,
      borderRadius: 5,
      padding: '8px 10px',
      pointerEvents: 'none',
      boxShadow: '0 4px 16px rgba(0,0,0,0.7)',
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--rare)', margin: '0 0 3px' }}>
        {node.name}
      </p>
      <p style={{ fontSize: 11, color: 'var(--text)', margin: '0 0 5px', lineHeight: 1.4 }}>
        {node.description}
      </p>
      {tagEffect && (
        <p style={{ fontSize: 11, margin: '0 0 2px', color: tagEffect.value > 1 ? '#86efac' : '#fca5a5' }}>
          {tagEffect.value > 1
            ? `+${Math.round((tagEffect.value - 1) * 100)}% ${tagEffect.tag} mod chance`
            : `−${Math.round((1 - tagEffect.value) * 100)}% ${tagEffect.tag} mod chance`
          }
        </p>
      )}
      {gearEffect && (
        <p style={{ fontSize: 11, margin: '0 0 2px', color: '#93c5fd' }}>
          +{Math.round((gearEffect.value - 1) * 100)}% {gearEffect.gear} chance
        </p>
      )}
      {reqEffect && (
        <p style={{ fontSize: 11, margin: '0 0 2px', color: '#fcd34d' }}>
          {reqEffect.value > 1
            ? `+${Math.round((reqEffect.value - 1) * 100)}% ${reqEffect.statReq?.toUpperCase()} req chance`
            : `−${Math.round((1 - reqEffect.value) * 100)}% ${reqEffect.statReq?.toUpperCase()} req chance`
          }
        </p>
      )}
      <p style={{ fontSize: 10, color: 'var(--text-dim)', margin: '5px 0 0', borderTop: '1px solid var(--border)', paddingTop: 4 }}>
        Click to pin · {node.id}
        {node.parents.length > 0 && ` · needs: ${node.parents.join(', ')}`}
      </p>
    </div>
  );
}
