import type { BoostableTag, GearSlot } from './genesis-tree';

// ─── Defense type ──────────────────────────────────────────────────────────────

export type DefenseType =
  | 'Armour'
  | 'Evasion'
  | 'Energy Shield'
  | 'Armour / Evasion'
  | 'Armour / Energy Shield'
  | 'Evasion / Energy Shield';

export const DEFENSE_OPTIONS: DefenseType[] = [
  'Armour', 'Evasion', 'Energy Shield',
  'Armour / Evasion', 'Armour / Energy Shield', 'Evasion / Energy Shield',
];

export const DEFENSE_TO_REQS: Record<DefenseType, { str: boolean; dex: boolean; int: boolean }> = {
  'Armour':                  { str: true,  dex: false, int: false },
  'Evasion':                 { str: false, dex: true,  int: false },
  'Energy Shield':           { str: false, dex: false, int: true  },
  'Armour / Evasion':        { str: true,  dex: true,  int: false },
  'Armour / Energy Shield':  { str: true,  dex: false, int: true  },
  'Evasion / Energy Shield': { str: false, dex: true,  int: true  },
};

// ─── Slot groups ───────────────────────────────────────────────────────────────

export const ARMOUR_SLOTS: GearSlot[] = ['Gloves', 'Boots', 'Helmet', 'Body Armour', 'Shield'];
export const ARMOUR_SLOTS_SET: Set<string> = new Set(ARMOUR_SLOTS);

// ─── CuratedMod type ──────────────────────────────────────────────────────────

export interface CuratedMod {
  id: string;
  displayName: string;
  modType: 'prefix' | 'suffix';
  /** Tags fed to the optimizer as targetTags */
  tags: BoostableTag[];
  /** Key in mods.json — spawn_weights on this mod determine availability via getSpawnWeight */
  repoeModId: string;
}

// ─── Curated mod list ─────────────────────────────────────────────────────────
//
// All slot/defense-type restrictions are derived at runtime from mods.json spawn_weights
// (see ManualTab in ItemInput/index.tsx).  repoeModId is a verified mods.json key.
//
// Verified spawn tags per mod (abbreviated):
//   IncreasedLife1       default=1000  → all non-weapon
//   IncreasedMana1       ring/amulet/int_armour/str_int/dex_int/belt
//   LocalIncrEShield1    int_armour only        (local flat ES on armour)
//   IncreasedEShield1    ring/amulet/belt       (global flat ES)
//   LifeRegeneration1    default=1000  → all non-weapon  (suffix in game data)
//   Armour/Eva/ES %      each: matching armour tag only (e.g. str_armour for armour%)
//   AddedPhysicalDamage1 ring/amulet/gloves
//   AddedFireDamage1     ring/amulet/gloves
//   AddedColdDamage1     ring/amulet/gloves
//   AddedLightningDamage1ring/amulet/gloves
//   SpellDamage1         amulet only
//   FireResist1          armour/ring/amulet/belt
//   AllResistances1      shield/ring/amulet only
//   Strength1            str_armour/str_dex/str_int/ring/amulet/belt
//   Dexterity1           dex_armour/all gloves/str_dex/dex_int/ring/amulet
//   Intelligence1        int_armour/str_int/dex_int/helmet/ring/amulet
//   AllAttributes1       ring/amulet/belt
//   ManaRegeneration1    ring/amulet/focus(ES shield)/str_int_shield
//   StunRecovery1        armour/belt
//   MovementVelocity1    boots only             (prefix in game data)
//   IncreasedAttackSpeed1gloves/ring(t1)/dex shields
//   IncreasedCastSpeed1  ring/amulet/wand/dagger/sceptre
//   CriticalStrikeChance1amulet only
//   CriticalMultiplier1  amulet only
//   IncreasedAccuracyNew1_gloves/helmet/ring/amulet/dex shields
//   BeltFlaskEffect      belt only (prefix)
//   BeltFlaskCharges     belt only (suffix)
//
// ─────────────────────────────────────────────────────────────────────────────

export const CURATED_MODS: CuratedMod[] = [

  // ── Prefixes ─────────────────────────────────────────────────────────────────

  { id: 'max_life',      displayName: 'Maximum Life',                        modType: 'prefix', tags: ['Life'],                       repoeModId: 'IncreasedLife1' },
  { id: 'max_mana',      displayName: 'Maximum Mana',                        modType: 'prefix', tags: ['Mana'],                       repoeModId: 'IncreasedMana1' },
  { id: 'flat_es_local', displayName: 'Maximum Energy Shield (item)',        modType: 'prefix', tags: ['Defense'],                    repoeModId: 'LocalIncreasedEnergyShield1' },
  { id: 'flat_es',       displayName: 'Maximum Energy Shield',               modType: 'prefix', tags: ['Defense'],                    repoeModId: 'IncreasedEnergyShield1' },

  // Local defence % — each spawns only on its matching armour type
  { id: 'inc_armour',    displayName: 'Increased Armour %',                  modType: 'prefix', tags: ['Defense'],                    repoeModId: 'LocalIncreasedPhysicalDamageReductionRatingPercent1' },
  { id: 'inc_evasion',   displayName: 'Increased Evasion %',                 modType: 'prefix', tags: ['Defense'],                    repoeModId: 'LocalIncreasedEvasionRatingPercent1' },
  { id: 'inc_es',        displayName: 'Increased Energy Shield %',           modType: 'prefix', tags: ['Defense'],                    repoeModId: 'LocalIncreasedEnergyShieldPercent1' },
  { id: 'inc_armour_ev', displayName: 'Increased Armour and Evasion %',      modType: 'prefix', tags: ['Defense'],                    repoeModId: 'LocalIncreasedArmourAndEvasion1' },
  { id: 'inc_armour_es', displayName: 'Increased Armour and Energy Shield %',modType: 'prefix', tags: ['Defense'],                    repoeModId: 'LocalIncreasedArmourAndEnergyShield1' },
  { id: 'inc_ev_es',     displayName: 'Increased Evasion and Energy Shield %',modType: 'prefix',tags: ['Defense'],                    repoeModId: 'LocalIncreasedEvasionAndEnergyShield1' },

  // Added damage to attacks — ring/amulet/gloves
  { id: 'phys_dmg',      displayName: 'Added Physical Damage to Attacks',   modType: 'prefix', tags: ['Physical', 'Attack'],          repoeModId: 'AddedPhysicalDamage1' },
  { id: 'fire_dmg',      displayName: 'Added Fire Damage to Attacks',       modType: 'prefix', tags: ['Fire', 'Attack'],              repoeModId: 'AddedFireDamage1' },
  { id: 'cold_dmg',      displayName: 'Added Cold Damage to Attacks',       modType: 'prefix', tags: ['Cold', 'Attack'],              repoeModId: 'AddedColdDamage1' },
  { id: 'lightning_dmg', displayName: 'Added Lightning Damage to Attacks',  modType: 'prefix', tags: ['Lightning', 'Attack'],         repoeModId: 'AddedLightningDamage1' },

  // Spell damage — amulet only
  { id: 'spell_dmg',     displayName: 'Increased Spell Damage %',           modType: 'prefix', tags: ['Caster'],                     repoeModId: 'SpellDamage1' },

  // Shield block — prefix, rolls on Armour/Evasion/hybrid shields but not ES or Ev/ES shields
  { id: 'block',         displayName: 'Block Chance',                       modType: 'prefix', tags: ['Defense'],                    repoeModId: 'LocalIncreasedBlockPercentage1' },
  { id: 'spell_block',   displayName: 'Spell Block Chance',                 modType: 'prefix', tags: ['Defense'],                    repoeModId: 'ShieldSpellBlockPercentage1' },

  // Belt prefixes
  { id: 'flask_duration',displayName: 'Flask Effect Duration',              modType: 'prefix', tags: ['Mana'],                       repoeModId: 'BeltIncreasedFlaskEffect1_' },

  // Movement speed is a prefix in the game data
  { id: 'move_speed',    displayName: 'Movement Speed',                     modType: 'prefix', tags: ['Speed'],                      repoeModId: 'MovementVelocity1' },

  // ── Suffixes ─────────────────────────────────────────────────────────────────

  // Resistances — armour/ring/amulet/belt
  { id: 'fire_res',      displayName: 'Fire Resistance',                    modType: 'suffix', tags: ['Fire', 'Resistance'],          repoeModId: 'FireResist1' },
  { id: 'cold_res',      displayName: 'Cold Resistance',                    modType: 'suffix', tags: ['Cold', 'Resistance'],          repoeModId: 'ColdResist1' },
  { id: 'lightning_res', displayName: 'Lightning Resistance',               modType: 'suffix', tags: ['Lightning', 'Resistance'],     repoeModId: 'LightningResist1' },
  { id: 'chaos_res',     displayName: 'Chaos Resistance',                   modType: 'suffix', tags: ['Chaos'],                      repoeModId: 'ChaosResist1' },
  // All elemental res — shield/ring/amulet only
  { id: 'all_ele_res',   displayName: 'All Elemental Resistances',          modType: 'suffix', tags: ['Fire', 'Cold', 'Lightning', 'Resistance'], repoeModId: 'AllResistances1' },

  // Attributes — spawn_weights already encode which armour types / jewellery each can roll on
  { id: 'strength',      displayName: 'Strength',                           modType: 'suffix', tags: ['Attributes'],                  repoeModId: 'Strength1' },
  { id: 'dexterity',     displayName: 'Dexterity',                          modType: 'suffix', tags: ['Attributes'],                  repoeModId: 'Dexterity1' },
  { id: 'intelligence',  displayName: 'Intelligence',                       modType: 'suffix', tags: ['Attributes'],                  repoeModId: 'Intelligence1' },
  { id: 'all_attrs',     displayName: 'All Attributes',                     modType: 'suffix', tags: ['Attributes'],                  repoeModId: 'AllAttributes1' },

  // Life regen is a suffix in game data
  { id: 'life_regen',    displayName: 'Life Regeneration per Second',       modType: 'suffix', tags: ['Life'],                        repoeModId: 'LifeRegeneration1' },

  // Mana regen — ring/amulet/ES shields only
  { id: 'mana_regen',    displayName: 'Mana Regeneration Rate',             modType: 'suffix', tags: ['Mana'],                        repoeModId: 'ManaRegeneration1' },

  // Stun recovery — armour and belt
  { id: 'stun_recovery', displayName: 'Stun and Block Recovery',            modType: 'suffix', tags: ['Defense'],                     repoeModId: 'StunRecovery1' },

  // Speed
  { id: 'attack_speed',  displayName: 'Attack Speed',                       modType: 'suffix', tags: ['Attack', 'Speed'],             repoeModId: 'IncreasedAttackSpeed1' },
  { id: 'cast_speed',    displayName: 'Cast Speed',                         modType: 'suffix', tags: ['Caster', 'Speed'],             repoeModId: 'IncreasedCastSpeed1' },

  // Critical — amulet only for both
  { id: 'crit_chance',   displayName: 'Critical Strike Chance',             modType: 'suffix', tags: ['Critical'],                    repoeModId: 'CriticalStrikeChance1' },
  { id: 'crit_multi',    displayName: 'Critical Strike Multiplier',         modType: 'suffix', tags: ['Critical'],                    repoeModId: 'CriticalMultiplier1' },

  // Accuracy — gloves/helmet/ring/amulet/dex shields
  { id: 'accuracy',      displayName: 'Accuracy Rating',                    modType: 'suffix', tags: ['Attack'],                      repoeModId: 'IncreasedAccuracyNew1_' },

  // Spell suppression — suffix, rolls on Evasion / hybrid-evasion armour only
  { id: 'suppress',      displayName: 'Spell Suppression Chance',           modType: 'suffix', tags: ['Defense'],                     repoeModId: 'ChanceToSuppressSpells1_' },

  // Belt suffix
  { id: 'flask_charges', displayName: 'Flask Charges Gained',               modType: 'suffix', tags: ['Life'],                        repoeModId: 'BeltIncreasedFlaskChargesGained1' },
];
