export type NodeId = string;

export type NodeCategory =
  | 'hub'
  | 'gearType'
  | 'statReq'
  | 'modTag'
  | 'modTierRating'
  | 'divine'
  | 'itemLevel'
  | 'sockets'
  | 'additionalItem'
  | 'fractured'
  | 'severing'
  | 'quality';

export interface NodeEffect {
  category: NodeCategory;
  /** Multiplier for modTag nodes (e.g. 6 for 500% increased, 0.4 for 60% reduced).
   *  For additive effects (tier rating, item level chance) this is the raw value. */
  value: number;
  /** PoE tag name this effect targets, for modTag nodes */
  tag?: string;
  /** Gear type name, for gearType nodes */
  gear?: string;
  /** Stat requirement affected, for statReq nodes */
  statReq?: 'str' | 'dex' | 'int';
}

export interface TreeNode {
  id: NodeId;
  name: string;
  description: string;
  type: 'Small' | 'Notable';
  category: NodeCategory;
  /** IDs of nodes that must be allocated before this one */
  parents: NodeId[];
  effects: NodeEffect[];
  position: { x: number; y: number };
}

// ─── Parsed Item ───────────────────────────────────────────────────────────────

export interface ParsedImplicit {
  source: string;
  tier: string;
  stat: string;
}

export interface ParsedMod {
  type: 'Prefix' | 'Suffix';
  name: string;
  tier: number;
  /** Tags from the advanced-copy format, e.g. ["Life", "Attack"] */
  tags: string[];
  stat: string;
}

export interface ParsedItem {
  itemClass: string;
  baseType: string;
  name: string;
  itemLevel: number;
  requirements: { level?: number; str?: number; dex?: number; int?: number };
  influences: string[];
  implicits: ParsedImplicit[];
  explicits: ParsedMod[];
}

// ─── Target Item (what the user wants to craft) ────────────────────────────────

export interface TargetTag {
  /** Exact tag name as shown in advanced copy, e.g. "Life", "Fire", "Resistance" */
  tag: string;
  /** If true, this tag MUST appear; if false it's a nice-to-have */
  required: boolean;
}

export interface TargetItem {
  itemClass: string;
  /** Stat requirements indicate the armor sub-type (str → armour, dex → evasion, int → es) */
  requirements: { str: boolean; dex: boolean; int: boolean };
  targetTags: TargetTag[];
  /**
   * Tags from prefix mod selections only. When present, used for prefix pool scoring so that
   * suffix-only tags (e.g. "Attack" from Attack Speed) don't inflate desired prefix mod counts.
   */
  prefixTargetTags?: TargetTag[];
  /**
   * Tags from suffix mod selections only. When present, used for suffix pool scoring so that
   * prefix-only tags don't inflate desired suffix mod counts.
   */
  suffixTargetTags?: TargetTag[];
  /**
   * Signals that the user is also targeting one or more mods with no Genesis boostable tags
   * (e.g. Spell Suppression). The optimizer responds by valuing forsaken nodes that reduce
   * the affix pool, increasing the no-tag mod's relative share.
   */
  noTagMods?: { prefix: boolean; suffix: boolean };
  /** Original parsed item, present for import path */
  sourceItem?: ParsedItem;
}

// ─── Optimization ──────────────────────────────────────────────────────────────

export interface OptimizationResult {
  /** Ordered list of recommended node IDs */
  allocation: NodeId[];
  /** Relative score (higher = better probability of hitting target mods) */
  score: number;
  pointsUsed: number;
  /** Per-node contribution to the score */
  breakdown: { nodeId: NodeId; nodeName: string; contribution: number }[];
}
