/**
 * Lazy-loads RePoE data from public/data/ (local files, no network after first load).
 * Data is cached in module-level variables after first fetch.
 *
 * To update the data, replace public/data/mods.json and public/data/base_items.json.
 */

export interface RePoEMod {
  name: string;
  generation_type: string;
  domain: string;
  required_level: number;
  is_essence_only?: boolean;
  groups: string[];
  implicit_tags: string[];
  adds_tags: string[];
  spawn_weights: { tag: string; weight: number }[];
  generation_weights?: { tag: string; weight: number }[];
  stats: { id: string; min: number; max: number }[];
  type: string;
}

export interface RePoEBaseItem {
  name: string;
  item_class: string;
  tags: string[];
  domain: string;
  requirements?: { strength?: number; dexterity?: number; intelligence?: number; level?: number };
  drop_level?: number;
}

export type ModsDB = Record<string, RePoEMod>;
export type BaseItemsDB = Record<string, RePoEBaseItem>;

// ─── Module-level cache ──────────────────────────────────────────────────────

let _mods: ModsDB | null = null;
let _baseItems: BaseItemsDB | null = null;
let _modsPromise: Promise<ModsDB> | null = null;
let _baseItemsPromise: Promise<BaseItemsDB> | null = null;

export async function loadMods(): Promise<ModsDB> {
  if (_mods) return _mods;
  if (_modsPromise) return _modsPromise;
  _modsPromise = fetch(`${import.meta.env.BASE_URL}data/mods.json`)
    .then(r => { if (!r.ok) throw new Error(`Failed to load mods.json: ${r.status}`); return r.json(); })
    .then(data => { _mods = data as ModsDB; _modsPromise = null; return _mods; })
    .catch(e => { _modsPromise = null; throw e; });
  return _modsPromise;
}

export async function loadBaseItems(): Promise<BaseItemsDB> {
  if (_baseItems) return _baseItems;
  if (_baseItemsPromise) return _baseItemsPromise;
  _baseItemsPromise = fetch(`${import.meta.env.BASE_URL}data/base_items.json`)
    .then(r => { if (!r.ok) throw new Error(`Failed to load base_items.json: ${r.status}`); return r.json(); })
    .then(data => { _baseItems = data as BaseItemsDB; _baseItemsPromise = null; return _baseItems; })
    .catch(e => { _baseItemsPromise = null; throw e; });
  return _baseItemsPromise;
}

export async function loadAll(): Promise<{ mods: ModsDB; baseItems: BaseItemsDB }> {
  const [mods, baseItems] = await Promise.all([loadMods(), loadBaseItems()]);
  return { mods, baseItems };
}

/** Find a base item by its display name (e.g. "Crusader Gloves"). Returns first match. */
export function findBaseByName(baseItems: BaseItemsDB, name: string): RePoEBaseItem | undefined {
  return Object.values(baseItems).find(b => b.name === name);
}

/** Find all base items of a given item_class (e.g. "Gloves") */
export function getBasesByClass(baseItems: BaseItemsDB, itemClass: string): RePoEBaseItem[] {
  return Object.values(baseItems).filter(b => b.item_class === itemClass);
}

/**
 * Given an item's tag array (from base_items.json) and a mod's spawn_weights array,
 * returns the effective spawn weight (0 if the mod cannot appear on this item).
 * spawn_weights is evaluated in ORDER — first matching tag wins.
 */
export function getSpawnWeight(
  spawnWeights: { tag: string; weight: number }[],
  itemTags: string[],
): number {
  const tagSet = new Set(itemTags);
  for (const entry of spawnWeights) {
    if (tagSet.has(entry.tag)) return entry.weight;
  }
  return 0;
}
