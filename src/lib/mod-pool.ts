import type { ModsDB, BaseItemsDB, RePoEMod } from './repoe-loader';
import { getSpawnWeight, findBaseByName, getBasesByClass } from './repoe-loader';
import { GENESIS_TAG_TO_IMPLICIT_TAG } from '../data/tag-boost-map';
import type { NodeId } from '../data/types';
import { NODE_MAP } from '../data/genesis-tree';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PoolEntry {
  id: string;
  mod: RePoEMod;
  baseWeight: number;
  effectiveWeight: number;
}

export interface ModPool {
  prefixes: PoolEntry[];
  suffixes: PoolEntry[];
  /** Total effective weight across all prefixes */
  prefixTotal: number;
  /** Total effective weight across all suffixes */
  suffixTotal: number;
}

// ─── Tag multipliers from tree allocation ────────────────────────────────────

/**
 * Returns a map from internal implicit_tag (e.g. "life") to the cumulative multiplier
 * from all active modTag nodes in the allocation.
 *
 * Multiple nodes boosting the same tag stack MULTIPLICATIVELY.
 */
export function buildTagMultipliers(allocation: NodeId[]): Map<string, number> {
  const mults = new Map<string, number>();
  for (const id of allocation) {
    const node = NODE_MAP.get(id);
    if (!node) continue;
    for (const effect of node.effects) {
      if (effect.category !== 'modTag' || !effect.tag) continue;
      const internalTag = GENESIS_TAG_TO_IMPLICIT_TAG[effect.tag];
      if (!internalTag) continue;
      const current = mults.get(internalTag) ?? 1;
      mults.set(internalTag, current * effect.value);
    }
  }
  return mults;
}

// ─── Mod pool builder ─────────────────────────────────────────────────────────

/** Determine item base tags from base_items.json for the given base name + item class */
export function getItemTags(
  baseItems: BaseItemsDB,
  baseTypeName: string,
  itemClass: string,
): string[] {
  // Try exact name match first
  const exact = findBaseByName(baseItems, baseTypeName);
  if (exact?.item_class === itemClass) return exact.tags;

  // Fall back to representative base for the item class
  // (e.g. if base type not found, use any high-tier base of that class)
  const classItems = getBasesByClass(baseItems, itemClass);
  if (classItems.length === 0) return ['default'];

  // Pick the one with the most tags (usually a top-tier base)
  classItems.sort((a, b) => b.tags.length - a.tags.length);
  return classItems[0].tags;
}

/**
 * Builds the full prefix+suffix mod pool for a given item (identified by its tags),
 * applying Genesis Tree allocation multipliers to each mod's base weight.
 */
export function buildModPool(
  mods: ModsDB,
  itemTags: string[],
  allocation: NodeId[],
  maxItemLevel = 100,
): ModPool {
  const tagMults = buildTagMultipliers(allocation);

  const prefixes: PoolEntry[] = [];
  const suffixes: PoolEntry[] = [];

  for (const [id, mod] of Object.entries(mods)) {
    // Only standard item crafting mods
    if (mod.domain !== 'item') continue;
    if (mod.generation_type !== 'prefix' && mod.generation_type !== 'suffix') continue;
    if (mod.is_essence_only) continue;
    if (mod.required_level > maxItemLevel) continue;

    const baseWeight = getSpawnWeight(mod.spawn_weights, itemTags);
    if (baseWeight <= 0) continue;

    // Apply tag multipliers: multiply by all matching tag multipliers
    let multiplier = 1;
    for (const implicitTag of mod.implicit_tags ?? []) {
      const m = tagMults.get(implicitTag);
      if (m !== undefined) multiplier *= m;
    }

    const effectiveWeight = baseWeight * multiplier;

    const entry: PoolEntry = { id, mod, baseWeight, effectiveWeight };
    if (mod.generation_type === 'prefix') prefixes.push(entry);
    else suffixes.push(entry);
  }

  const prefixTotal = prefixes.reduce((s, e) => s + e.effectiveWeight, 0);
  const suffixTotal = suffixes.reduce((s, e) => s + e.effectiveWeight, 0);

  return { prefixes, suffixes, prefixTotal, suffixTotal };
}

// ─── Probability calculation ──────────────────────────────────────────────────

/**
 * Calculates the probability of rolling at least one mod matching any of the
 * target implicit_tags in a single affix draw from the given pool entries.
 */
function poolShareForTags(pool: PoolEntry[], total: number, targetTags: string[]): number {
  if (total === 0) return 0;
  const tagSet = new Set(targetTags);
  const matchWeight = pool
    .filter(e => e.mod.implicit_tags?.some(t => tagSet.has(t)))
    .reduce((s, e) => s + e.effectiveWeight, 0);
  return matchWeight / total;
}

export interface TagProbability {
  /** Display tag name e.g. "Life" */
  displayTag: string;
  /** Internal implicit tag e.g. "life" */
  implicitTag: string;
  /** Fraction of prefix or suffix pool occupied by mods with this tag */
  poolShare: number;
  /** Probability that at least one mod from this tag appears in 3 prefix or suffix rolls */
  prob3Rolls: number;
}

/**
 * For each target display tag, calculates the pool share and approximate probability
 * of landing at least one mod with that tag in 3 rolls (approximation — treats rolls as independent).
 */
export function calcTagProbabilities(
  pool: ModPool,
  desiredTags: string[],
): TagProbability[] {
  return desiredTags.map(displayTag => {
    const implicitTag = GENESIS_TAG_TO_IMPLICIT_TAG[displayTag];
    if (!implicitTag) return { displayTag, implicitTag: displayTag, poolShare: 0, prob3Rolls: 0 };

    // Try prefix pool first, then suffix — use whichever has higher share
    const prefixShare = poolShareForTags(pool.prefixes, pool.prefixTotal, [implicitTag]);
    const suffixShare = poolShareForTags(pool.suffixes, pool.suffixTotal, [implicitTag]);
    const share = Math.max(prefixShare, suffixShare);

    // P(at least 1 match in 3 independent draws) = 1 - (1 - share)^3
    const prob3Rolls = 1 - Math.pow(1 - share, 3);

    return { displayTag, implicitTag, poolShare: share, prob3Rolls };
  });
}
