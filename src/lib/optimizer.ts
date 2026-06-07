import { TREE_NODES, NODE_MAP, SLOT_TO_NODE, SATELLITE_TO_HUB, EXCLUSIVE_CLUSTERS } from '../data/genesis-tree';
import type { TargetItem, OptimizationResult, NodeId, TreeNode } from '../data/types';

// ─── Path resolution ────────────────────────────────────────────────────────

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
 *  given already-allocated nodes (they don't need to be paid again). */
function pathCost(targetId: NodeId, alreadyAllocated: Set<NodeId>): number {
  const path = getRequiredPath(targetId);
  return path.filter(id => !alreadyAllocated.has(id)).length;
}

// ─── Scoring ────────────────────────────────────────────────────────────────

/**
 * Score a single modTag node relative to the target item's desired tags.
 * Devoted nodes (multiplier > 1) that boost desired tags score positively.
 * Forsaken nodes (multiplier < 1) that reduce UNdesired tags also score positively
 * (they free up affix slots by reducing junk mods).
 */
function scoreNode(node: TreeNode, target: TargetItem): number {
  let score = 0;
  const desiredTags = new Set(target.targetTags.map(t => t.tag));

  for (const effect of node.effects) {
    if (effect.category !== 'modTag' || effect.tag === undefined) continue;
    const isDesired = desiredTags.has(effect.tag);
    if (effect.value > 1 && isDesired) {
      // Devoted boost to a desired tag: each required tag worth extra
      const isRequired = target.targetTags.find(t => t.tag === effect.tag)?.required ?? false;
      score += (effect.value - 1) * (isRequired ? 1.5 : 1.0);
    } else if (effect.value < 1 && !isDesired) {
      // Forsaken reduction of an undesired tag: small bonus for clearing pool
      score += (1 - effect.value) * 0.3;
    }
  }
  return score;
}

// ─── Required nodes ─────────────────────────────────────────────────────────

/** Returns node IDs that MUST be taken for the target item's slot + attribute type */
export function getLockedNodes(target: TargetItem): NodeId[] {
  const locked: NodeId[] = [];

  // Gear type node for the slot
  const slotNode = SLOT_TO_NODE[target.itemClass];
  if (slotNode) locked.push(slotNode);

  // Stat requirement nodes
  const { str, dex, int } = target.requirements;
  // "More X Items" nodes boost toward the desired attribute type(s)
  if (str && !dex && !int)  locked.push('g6');       // pure Str → Armour
  else if (dex && !str && !int) locked.push('g3');    // pure Dex → Evasion
  else if (int && !str && !dex) locked.push('g2');    // pure Int → ES
  else if (str && int && !dex)  { locked.push('g6'); locked.push('g2'); }  // Str/Int → Armour/ES
  else if (str && dex && !int)  { locked.push('g6'); locked.push('g3'); }  // Str/Dex → Armour/Eva
  else if (dex && int && !str)  { locked.push('g3'); locked.push('g2'); }  // Dex/Int → Eva/ES
  // tri-req: no stat filtering needed (Crusader-style)

  return locked;
}

// ─── Cluster exclusivity ────────────────────────────────────────────────────

/** Returns true if allocating nodeId would conflict with an already-allocated
 *  sibling in the same exclusive cluster (only one satellite per hub allowed). */
function clusterConflict(nodeId: NodeId, allocation: Set<NodeId>): boolean {
  const hubId = SATELLITE_TO_HUB[nodeId];
  if (!hubId) return false;
  return (EXCLUSIVE_CLUSTERS[hubId] ?? []).some(
    sibling => sibling !== nodeId && allocation.has(sibling)
  );
}

// ─── Main optimizer ─────────────────────────────────────────────────────────

export function optimize(target: TargetItem, pointBudget: number): OptimizationResult {
  const locked = getLockedNodes(target);

  // Build the set of nodes allocated by the locked path (with prerequisites)
  const lockedAllocation = new Set<NodeId>();
  for (const id of locked) {
    getRequiredPath(id).forEach(p => lockedAllocation.add(p));
  }

  const lockedCost = lockedAllocation.size;

  if (lockedCost > pointBudget) {
    // Can't even afford the required nodes
    return {
      allocation: [...lockedAllocation],
      score: 0,
      pointsUsed: lockedCost,
      breakdown: [],
    };
  }

  // Candidate nodes: modTag nodes not already locked
  const candidates = TREE_NODES.filter(
    n => n.category === 'modTag' && !lockedAllocation.has(n.id)
  );

  // Score each candidate
  const scored = candidates
    .map(node => ({ node, score: scoreNode(node, target), cost: pathCost(node.id, lockedAllocation) }))
    .filter(c => c.score > 0)
    .sort((a, b) => (b.score / b.cost) - (a.score / a.cost));

  // Greedy allocation: add highest score-per-point candidate
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
