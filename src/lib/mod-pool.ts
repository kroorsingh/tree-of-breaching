import type { ModsDB, BaseItemsDB, RePoEMod } from './repoe-loader';
import { getSpawnWeight, findBaseByName, getBasesByClass } from './repoe-loader';
import { GENESIS_TAG_TO_IMPLICIT_TAG } from '../data/tag-boost-map';
import type { NodeId, TargetItem, TargetTag } from '../data/types';
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
    // Only standard item crafting mods (exclude Path of Exile Royale variants)
    if (id.includes('Royale')) continue;
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

// ─── Pool Context (for probability-based optimizer scoring) ──────────────────

/**
 * Pre-computed pool statistics used by the optimizer's probability scoring model.
 *
 * For each Genesis internal implicit tag, we track:
 *   - total base weight of prefix/suffix mods on this item with that tag
 *   - base weight of desired prefix/suffix mods (those matching the target) with that tag
 *
 * The optimizer uses these to compute the marginal probability improvement of
 * devoting or forsaking each tag, via the formula:
 *   ΔP = (M-1) * (desiredByTag * total - desiredTotal * tagTotal) / total²
 *
 * where M is the node's multiplier (>1 for devoted, <1 for forsaken).
 * Positive ΔP means the node improves probability of hitting the target.
 */
export interface BaseTypeStat {
  /** Count of all bases for this item class that have this stat requirement */
  total: number;
  /** Count of bases that are both "desired" AND have this stat requirement */
  desired: number;
}

export interface BaseTypeContext {
  /** Total count of armour-typed bases for this item class */
  total: number;
  /** Count of bases that exactly match the desired requirement combination */
  desired: number;
  /** Per-stat breakdown for statReq node scoring */
  byStatReq: { str: BaseTypeStat; dex: BaseTypeStat; int: BaseTypeStat };
}

export interface PoolContext {
  prefixTagWeights: Map<string, number>;
  suffixTagWeights: Map<string, number>;
  totalPrefix: number;
  totalSuffix: number;
  /**
   * For each tag, the sum of reqFactors (1.5 if required, 1.0 otherwise) across all distinct
   * desired prefix/suffix mods that carry that tag. Each mod is counted once regardless of its
   * base weight — the tag's pool share (W_T/W) in the scoring formula already encodes rarity,
   * so per-mod weight would double-count it in the wrong direction.
   */
  desiredPrefixCountByTag: Map<string, number>;
  desiredSuffixCountByTag: Map<string, number>;
  /** Sum of reqFactors across all distinct desired prefix mods */
  desiredPrefixCountTotal: number;
  /** Sum of reqFactors across all distinct desired suffix mods */
  desiredSuffixCountTotal: number;
  /** Base weight of all desired suffix mods with no implicit_tags (unaffected by any tree node) */
  untaggedDesiredSuffixBase: number;
  /** Base weight of all desired prefix mods with no implicit_tags */
  untaggedDesiredPrefixBase: number;
  /** Base type distribution for statReq node scoring. null if not applicable (non-armour or no specific req). */
  baseType: BaseTypeContext | null;
  /** Global gear type distribution for gearType node scoring. */
  gearType: { classCounts: Map<string, number>; total: number } | null;
}

// Maps armour type tag to its attribute requirement flags
const ARMOUR_TYPE_REQS: Record<string, { str: boolean; dex: boolean; int: boolean }> = {
  str_armour:         { str: true,  dex: false, int: false },
  dex_armour:         { str: false, dex: true,  int: false },
  int_armour:         { str: false, dex: false, int: true  },
  str_dex_armour:     { str: true,  dex: true,  int: false },
  str_int_armour:     { str: true,  dex: false, int: true  },
  dex_int_armour:     { str: false, dex: true,  int: true  },
  str_dex_int_armour: { str: true,  dex: true,  int: true  },
};

// Item classes that Genesis can birth (based on gearType tree nodes)
const GENESIS_ITEM_CLASSES = new Set([
  'Shield', 'Helmet', 'Body Armour', 'Gloves', 'Boots',
  'Amulet', 'Ring', 'Belt', 'Jewel',
]);

function computeBaseTypeContext(
  baseItems: BaseItemsDB,
  itemClass: string,
  requirements: { str: boolean; dex: boolean; int: boolean }[],
): BaseTypeContext | null {
  // Determine if any acceptable combo has a stat requirement (= armour slot)
  const hasAnyReq = requirements.some(r => r.str || r.dex || r.int);

  if (hasAnyReq) {
    // Armour slot: statReq nodes affect which base type within this item class you get.
    // Use the local pool (bases of this class only).
    // "Desired" = bases matching ANY of the acceptable requirement combos.
    const bases = Object.values(baseItems).filter(b => b.item_class === itemClass);
    let total = 0, desired = 0;
    const byStatReq = {
      str: { total: 0, desired: 0 },
      dex: { total: 0, desired: 0 },
      int: { total: 0, desired: 0 },
    };

    for (const base of bases) {
      const tags = base.tags ?? [];
      const typeTag = Object.keys(ARMOUR_TYPE_REQS).find(t => tags.includes(t));
      if (!typeTag) continue;

      const reqs = ARMOUR_TYPE_REQS[typeTag];
      total++;

      const isDesired = requirements.some(r => r.str === reqs.str && r.dex === reqs.dex && r.int === reqs.int);
      if (isDesired) desired++;

      for (const stat of ['str', 'dex', 'int'] as const) {
        if (reqs[stat]) {
          byStatReq[stat].total++;
          if (isDesired) byStatReq[stat].desired++;
        }
      }
    }

    if (total === 0 || desired === 0) return null;
    return { total, desired, byStatReq };
  } else {
    // Non-armour slot (Ring/Amulet/Belt/Jewel): statReq nodes affect the probability that Genesis
    // births the right item class at all. All desired bases have no attribute requirements, so
    // "Less X Items" always helps by shrinking the attribute-requiring competition.
    // Use the global Genesis pool so scores reflect actual pool percentages.
    const allBases = Object.values(baseItems).filter(b => GENESIS_ITEM_CLASSES.has(b.item_class));
    let total = 0, desired = 0;
    const byStatReq = {
      str: { total: 0, desired: 0 },
      dex: { total: 0, desired: 0 },
      int: { total: 0, desired: 0 },
    };

    for (const base of allBases) {
      const tags = base.tags ?? [];
      const typeTag = Object.keys(ARMOUR_TYPE_REQS).find(t => tags.includes(t));
      // Non-armour bases (rings, amulets, etc.) have no armour type tag → no attribute requirement
      const reqs = typeTag ? ARMOUR_TYPE_REQS[typeTag] : { str: false, dex: false, int: false };

      total++;
      const isDesired = base.item_class === itemClass;
      if (isDesired) desired++;

      for (const stat of ['str', 'dex', 'int'] as const) {
        if (reqs[stat]) {
          byStatReq[stat].total++;
          if (isDesired) byStatReq[stat].desired++;
        }
      }
    }

    if (total === 0 || desired === 0) return null;
    return { total, desired, byStatReq };
  }
}

/**
 * Builds a PoolContext for use in probability-based optimizer scoring.
 * Must be called with the base item's mods (no allocation multipliers applied).
 */
export function computePoolContext(
  mods: ModsDB,
  itemTags: string[],
  target: TargetItem,
  maxItemLevel = 100,
  baseItems?: BaseItemsDB,
): PoolContext {
  // Use pool-specific tag sets when available so that suffix-only tags (e.g. "Attack" from
  // Attack Speed) don't inflate the desired prefix mod count, and vice versa.
  const buildInternalTagMap = (tags: TargetTag[]): Map<string, number> => {
    const m = new Map<string, number>();
    for (const { tag, required } of tags) {
      const internal = GENESIS_TAG_TO_IMPLICIT_TAG[tag];
      if (internal) m.set(internal, required ? 1.5 : 1.0);
    }
    return m;
  };

  const desiredPrefixInternalTags = buildInternalTagMap(target.prefixTargetTags ?? target.targetTags);
  const desiredSuffixInternalTags = buildInternalTagMap(target.suffixTargetTags ?? target.targetTags);

  const prefixTagWeights = new Map<string, number>();
  const suffixTagWeights = new Map<string, number>();
  const desiredPrefixCountByTag = new Map<string, number>();
  const desiredSuffixCountByTag = new Map<string, number>();
  let totalPrefix = 0;
  let totalSuffix = 0;
  let desiredPrefixCountTotal = 0;
  let desiredSuffixCountTotal = 0;

  const countedDesiredPrefix = new Set<string>();
  const countedDesiredSuffix = new Set<string>();

  for (const [id, mod] of Object.entries(mods)) {
    if (id.includes('Royale')) continue;
    if (mod.domain !== 'item') continue;
    if (mod.generation_type !== 'prefix' && mod.generation_type !== 'suffix') continue;
    if (mod.is_essence_only) continue;
    if (mod.required_level > maxItemLevel) continue;

    const baseWeight = getSpawnWeight(mod.spawn_weights, itemTags);
    if (baseWeight <= 0) continue;

    const isPrefix = mod.generation_type === 'prefix';
    if (isPrefix) totalPrefix += baseWeight;
    else totalSuffix += baseWeight;

    const tagWeights = isPrefix ? prefixTagWeights : suffixTagWeights;
    for (const t of mod.implicit_tags ?? []) {
      tagWeights.set(t, (tagWeights.get(t) ?? 0) + baseWeight);
    }

    const implicitTags = mod.implicit_tags ?? [];
    const desiredInternalTags = isPrefix ? desiredPrefixInternalTags : desiredSuffixInternalTags;
    const matchingTags = implicitTags.filter(t => desiredInternalTags.has(t));
    const isNoTagDesired =
      implicitTags.length === 0 &&
      ((isPrefix && (target.noTagMods?.prefix ?? false)) ||
       (!isPrefix && (target.noTagMods?.suffix ?? false)));

    if (matchingTags.length > 0 || isNoTagDesired) {
      const counted = isPrefix ? countedDesiredPrefix : countedDesiredSuffix;
      if (!counted.has(id)) {
        counted.add(id);
        // reqFactor weights required mods (1.5×) vs optional (1.0×) in the count
        let reqFactor = 1.0;
        for (const t of matchingTags) {
          reqFactor = Math.max(reqFactor, desiredInternalTags.get(t) ?? 1.0);
        }
        if (isPrefix) desiredPrefixCountTotal += reqFactor;
        else desiredSuffixCountTotal += reqFactor;

        const desiredCountByTag = isPrefix ? desiredPrefixCountByTag : desiredSuffixCountByTag;
        for (const t of matchingTags) {
          desiredCountByTag.set(t, (desiredCountByTag.get(t) ?? 0) + reqFactor);
        }
      }
    }
  }

  let untaggedDesiredSuffixBase = 0;
  let untaggedDesiredPrefixBase = 0;
  for (const id of countedDesiredSuffix) {
    const mod = mods[id];
    if (mod && (mod.implicit_tags ?? []).length === 0) {
      untaggedDesiredSuffixBase += getSpawnWeight(mod.spawn_weights, itemTags);
    }
  }
  for (const id of countedDesiredPrefix) {
    const mod = mods[id];
    if (mod && (mod.implicit_tags ?? []).length === 0) {
      untaggedDesiredPrefixBase += getSpawnWeight(mod.spawn_weights, itemTags);
    }
  }

  const baseType = (baseItems && target.requirements?.length)
    ? computeBaseTypeContext(baseItems, target.itemClass, target.requirements)
    : null;

  let gearType: PoolContext['gearType'] = null;
  if (baseItems) {
    const classCounts = new Map<string, number>();
    let total = 0;
    for (const base of Object.values(baseItems)) {
      if (!GENESIS_ITEM_CLASSES.has(base.item_class)) continue;
      classCounts.set(base.item_class, (classCounts.get(base.item_class) ?? 0) + 1);
      total++;
    }
    gearType = { classCounts, total };
  }

  return {
    prefixTagWeights, suffixTagWeights,
    totalPrefix, totalSuffix,
    desiredPrefixCountByTag, desiredSuffixCountByTag,
    desiredPrefixCountTotal, desiredSuffixCountTotal,
    untaggedDesiredSuffixBase, untaggedDesiredPrefixBase,
    baseType, gearType,
  };
}
