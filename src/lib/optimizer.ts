import { TREE_NODES, NODE_MAP, SLOT_TO_NODE, SATELLITE_TO_HUB, EXCLUSIVE_CLUSTERS } from '../data/genesis-tree';
import { GENESIS_TAG_TO_IMPLICIT_TAG } from '../data/tag-boost-map';
import type { TargetItem, OptimizationResult, NodeId, TreeNode } from '../data/types';
import type { PoolContext } from './mod-pool';

// ─── Path resolution ────────────────────────────────────────────────────────

// Hub nodes are free — allocating a hub + one satellite costs 1 point total.
const HUB_SET = new Set(Object.keys(EXCLUSIVE_CLUSTERS));

/** Returns the full set of node IDs that must be allocated to reach `target`,
 *  including the target itself. Traverses parent chains to find all prerequisites. */
export function getRequiredPath(targetId: NodeId): NodeId[] {
  const visited = new Set<NodeId>();
  const stack = [targetId];
  while (stack.length) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = NODE_MAP.get(id);
    if (node) node.parents.forEach(p => stack.push(p));
  }
  return [...visited];
}

/** Total point cost to allocate a node including its prerequisite path,
 *  given already-allocated nodes (they don't need to be paid again).
 *  Hub nodes are free — they are allocated but cost 0 points. */
function pathCost(targetId: NodeId, alreadyAllocated: Set<NodeId>): number {
  const path = getRequiredPath(targetId);
  return path.filter(id => !alreadyAllocated.has(id) && !HUB_SET.has(id)).length;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

/**
 * Score a node using actual pool probability mathematics when pool context is available.
 *
 * The marginal probability improvement from allocating a node with tag T (internal) and
 * multiplier M on pool P (prefix or suffix) is:
 *   ΔP = (M-1) * (desiredByTag[T] * total - desiredTotal * tagWeight[T]) / total²
 *
 * This is derived from d/dM [ desiredWeight(M) / totalWeight(M) ].
 *
 * Positive cases:
 *   - Devoted (M>1) when desired mods are over-represented in tag T vs overall pool
 *   - Forsaken (M<1) when desired mods are UNDER-represented in tag T (including zero, e.g. spell suppression)
 *
 * Falls back to the heuristic model when no pool context is available.
 */
function scoreNode(node: TreeNode, target: TargetItem, ctx?: PoolContext): number {
  if (!ctx) return scoreNodeHeuristic(node, target);

  const { prefixTagWeights, suffixTagWeights,
          desiredPrefixCountByTag, desiredSuffixCountByTag,
          desiredPrefixCountTotal, desiredSuffixCountTotal,
          totalPrefix, totalSuffix } = ctx;

  let score = 0;

  for (const effect of node.effects) {
    if (effect.category !== 'modTag' || effect.tag === undefined) continue;
    const internalTag = GENESIS_TAG_TO_IMPLICIT_TAG[effect.tag];
    if (!internalTag) continue;
    const M = effect.value;

    // Score = (M-1) * (nDesiredWithTag - nDesiredTotal * tagPoolShare)
    //
    // Derived from d/dM Σ log(pool_share_i) for all desired mods i — the gradient of the
    // log-product objective (maximise joint probability of all desired mods landing).
    // Each distinct desired mod contributes equally (1 count); the tag's pool share term
    // (W_T/W) naturally encodes rarity, so per-mod weight would double-count it incorrectly.
    // Positive when desired mods are over-represented in this tag vs the overall pool.

    if (totalPrefix > 0) {
      const pT = prefixTagWeights.get(internalTag) ?? 0;
      const nP = desiredPrefixCountByTag.get(internalTag) ?? 0;
      if (pT > 0 || nP > 0) {
        score += (M - 1) * (nP - desiredPrefixCountTotal * pT / totalPrefix);
      }
    }

    if (totalSuffix > 0) {
      const sT = suffixTagWeights.get(internalTag) ?? 0;
      const nS = desiredSuffixCountByTag.get(internalTag) ?? 0;
      if (sT > 0 || nS > 0) {
        score += (M - 1) * (nS - desiredSuffixCountTotal * sT / totalSuffix);
      }
    }
  }

  return score;
}

/** Heuristic fallback used before mod pool data is loaded. */
function scoreNodeHeuristic(node: TreeNode, target: TargetItem): number {
  let score = 0;
  const desiredTags = new Set(target.targetTags.map(t => t.tag));
  const hasAnyTarget = target.targetTags.length > 0 || target.noTagMods?.prefix || target.noTagMods?.suffix;

  for (const effect of node.effects) {
    if (effect.category !== 'modTag' || effect.tag === undefined) continue;
    const isDesired = desiredTags.has(effect.tag);
    if (effect.value > 1 && isDesired) {
      const isRequired = target.targetTags.find(t => t.tag === effect.tag)?.required ?? false;
      score += (effect.value - 1) * (isRequired ? 1.5 : 1.0);
    } else if (effect.value < 1 && !isDesired) {
      // For no-tag targets, forsaking any tag is helpful — weight it more
      const bonus = hasAnyTarget && target.targetTags.length === 0 ? 0.6 : 0.3;
      score += (1 - effect.value) * bonus;
    }
  }
  return score;
}

// ─── Required nodes ─────────────────────────────────────────────────────────

/** Returns node IDs that MUST be taken for the target item's slot + attribute type */
export function getLockedNodes(target: TargetItem): NodeId[] {
  const locked: NodeId[] = [];

  const slotNode = SLOT_TO_NODE[target.itemClass];
  if (slotNode) locked.push(slotNode);

  const { str, dex, int } = target.requirements;
  if (str && !dex && !int)       locked.push('g6');
  else if (dex && !str && !int)  locked.push('g3');
  else if (int && !str && !dex)  locked.push('g2');
  else if (str && int && !dex)  { locked.push('g6'); locked.push('g2'); }
  else if (str && dex && !int)  { locked.push('g6'); locked.push('g3'); }
  else if (dex && int && !str)  { locked.push('g3'); locked.push('g2'); }

  return locked;
}

// ─── Cluster exclusivity ────────────────────────────────────────────────────

function clusterConflict(nodeId: NodeId, allocation: Set<NodeId>): boolean {
  const hubId = SATELLITE_TO_HUB[nodeId];
  if (!hubId) return false;
  return (EXCLUSIVE_CLUSTERS[hubId] ?? []).some(
    sibling => sibling !== nodeId && allocation.has(sibling)
  );
}

// ─── Main optimizer ─────────────────────────────────────────────────────────

export function optimize(
  target: TargetItem,
  pointBudget: number,
  ctx?: PoolContext,
): OptimizationResult {
  const locked = getLockedNodes(target);

  const lockedAllocation = new Set<NodeId>();
  for (const id of locked) {
    getRequiredPath(id).forEach(p => lockedAllocation.add(p));
  }

  const lockedCost = [...lockedAllocation].filter(id => !HUB_SET.has(id)).length;

  if (lockedCost > pointBudget) {
    return {
      allocation: [...lockedAllocation],
      score: 0,
      pointsUsed: lockedCost,
      breakdown: [],
    };
  }

  const candidates = TREE_NODES.filter(
    n => n.category === 'modTag' && !lockedAllocation.has(n.id)
  );

  const scored = candidates
    .map(node => ({ node, score: scoreNode(node, target, ctx), cost: pathCost(node.id, lockedAllocation) }))
    .filter(c => c.score > 0)
    .sort((a, b) => (b.score / b.cost) - (a.score / a.cost));

  const allocation = new Set<NodeId>(lockedAllocation);
  const breakdown: OptimizationResult['breakdown'] = [];
  let remaining = pointBudget - lockedCost;
  let totalScore = 0;

  for (const { node, score } of scored) {
    if (clusterConflict(node.id, allocation)) continue;
    const actualCost = pathCost(node.id, allocation);
    if (actualCost <= remaining) {
      getRequiredPath(node.id).forEach(p => allocation.add(p));
      remaining -= actualCost;
      totalScore += score;
      breakdown.push({ nodeId: node.id, nodeName: node.name, contribution: score });
    }
  }

  return {
    allocation: [...allocation],
    score: totalScore,
    pointsUsed: pointBudget - remaining,
    breakdown,
  };
}

/** Returns a human-readable summary of what an allocation achieves */
export function describeAllocation(allocation: NodeId[], target: TargetItem): string {
  const lines: string[] = [];
  const desiredTags = new Set(target.targetTags.map(t => t.tag));

  for (const id of allocation) {
    const node = NODE_MAP.get(id);
    if (!node) continue;
    for (const effect of node.effects) {
      if (effect.category === 'modTag' && effect.tag) {
        const dir = effect.value > 1 ? `+${Math.round((effect.value - 1) * 100)}%` : `-${Math.round((1 - effect.value) * 100)}%`;
        const relevant = desiredTags.has(effect.tag) ? '✓' : '';
        lines.push(`${dir} ${effect.tag} ${relevant}`);
      }
    }
  }
  return lines.join('\n');
}
