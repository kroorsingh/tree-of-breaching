import type { DefenseType } from './curated-mods';
import type { GearSlot } from './genesis-tree';
import { ARMOUR_SLOTS_SET } from './curated-mods';

// Maps "slot|defenseType" (armour) or "slot" (jewellery) to the PoE base item tag array.
// Tags are verified against base_items.json — order matters for getSpawnWeight (first match wins).
export const SLOT_DEFENSE_TAGS: Record<string, string[]> = {
  // ── Gloves ────────────────────────────────────────────────────────────────────
  'Gloves|Armour':                  ['str_armour',     'gloves', 'armour', 'default'],
  'Gloves|Evasion':                 ['dex_armour',     'gloves', 'armour', 'default'],
  'Gloves|Energy Shield':           ['int_armour',     'gloves', 'armour', 'default'],
  'Gloves|Armour / Evasion':        ['str_dex_armour', 'gloves', 'armour', 'default'],
  'Gloves|Armour / Energy Shield':  ['str_int_armour', 'gloves', 'armour', 'default'],
  'Gloves|Evasion / Energy Shield': ['dex_int_armour', 'gloves', 'armour', 'default'],

  // ── Boots ─────────────────────────────────────────────────────────────────────
  'Boots|Armour':                   ['str_armour',     'boots', 'armour', 'default'],
  'Boots|Evasion':                  ['dex_armour',     'boots', 'armour', 'default'],
  'Boots|Energy Shield':            ['int_armour',     'boots', 'armour', 'default'],
  'Boots|Armour / Evasion':         ['str_dex_armour', 'boots', 'armour', 'default'],
  'Boots|Armour / Energy Shield':   ['str_int_armour', 'boots', 'armour', 'default'],
  'Boots|Evasion / Energy Shield':  ['dex_int_armour', 'boots', 'armour', 'default'],

  // ── Helmet ────────────────────────────────────────────────────────────────────
  'Helmet|Armour':                  ['str_armour',     'helmet', 'armour', 'default'],
  'Helmet|Evasion':                 ['dex_armour',     'helmet', 'armour', 'default'],
  'Helmet|Energy Shield':           ['int_armour',     'helmet', 'armour', 'default'],
  'Helmet|Armour / Evasion':        ['str_dex_armour', 'helmet', 'armour', 'default'],
  'Helmet|Armour / Energy Shield':  ['str_int_armour', 'helmet', 'armour', 'default'],
  'Helmet|Evasion / Energy Shield': ['dex_int_armour', 'helmet', 'armour', 'default'],

  // ── Body Armour ───────────────────────────────────────────────────────────────
  'Body Armour|Armour':                  ['str_armour',     'body_armour', 'armour', 'default'],
  'Body Armour|Evasion':                 ['dex_armour',     'body_armour', 'armour', 'default'],
  'Body Armour|Energy Shield':           ['int_armour',     'body_armour', 'armour', 'default'],
  'Body Armour|Armour / Evasion':        ['str_dex_armour', 'body_armour', 'armour', 'default'],
  'Body Armour|Armour / Energy Shield':  ['str_int_armour', 'body_armour', 'armour', 'default'],
  'Body Armour|Evasion / Energy Shield': ['dex_int_armour', 'body_armour', 'armour', 'default'],

  // ── Shield — includes shield-subtype tags; ES shield uses 'focus' not 'int_shield' ──
  'Shield|Armour':                  ['str_armour',     'str_shield',     'shield', 'armour', 'default'],
  'Shield|Evasion':                 ['dex_armour',     'dex_shield',     'shield', 'armour', 'default'],
  'Shield|Energy Shield':           ['int_armour',     'focus',          'shield', 'armour', 'default'],
  'Shield|Armour / Evasion':        ['str_dex_armour', 'str_dex_shield', 'shield', 'armour', 'default'],
  'Shield|Armour / Energy Shield':  ['str_int_armour', 'str_int_shield', 'shield', 'armour', 'default'],
  'Shield|Evasion / Energy Shield': ['dex_int_armour', 'dex_int_shield', 'shield', 'armour', 'default'],

  // ── Jewellery — no defense type ───────────────────────────────────────────────
  'Ring':   ['ring',   'default'],
  'Amulet': ['amulet', 'default'],
  'Belt':   ['belt',   'default'],
};

export function getItemTags(slot: GearSlot, defenseType?: DefenseType): string[] {
  const key = ARMOUR_SLOTS_SET.has(slot) && defenseType
    ? `${slot}|${defenseType}`
    : slot;
  return SLOT_DEFENSE_TAGS[key] ?? ['default'];
}
