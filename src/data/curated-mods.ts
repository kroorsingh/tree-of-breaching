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
// All slot/defense-type filtering is derived at runtime from mods.json spawn_weights.
// repoeModId keys are verified against mods.json.
//
// ─────────────────────────────────────────────────────────────────────────────

export const CURATED_MODS: CuratedMod[] = [

  // ── Prefixes ─────────────────────────────────────────────────────────────────

  // Life / Mana (global)
  { id: 'max_life',           displayName: 'Maximum Life',                            modType: 'prefix', tags: ['Life'],                                    repoeModId: 'IncreasedLife1' },
  { id: 'max_mana',           displayName: 'Maximum Mana',                            modType: 'prefix', tags: ['Mana'],                                    repoeModId: 'IncreasedMana1' },

  // Flat local defence — single stat (each spawns on its matching armour type only)
  { id: 'flat_armour_local',  displayName: 'Armour (item)',                           modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'LocalIncreasedPhysicalDamageReductionRating1' },
  { id: 'flat_ev_local',      displayName: 'Evasion Rating (item)',                   modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'LocalIncreasedEvasionRating1' },
  { id: 'flat_es_local',      displayName: 'Energy Shield (item)',                    modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'LocalIncreasedEnergyShield1' },

  // Flat local defence — hybrid stat (each spawns on its matching hybrid armour type)
  { id: 'flat_armour_ev_local',displayName: 'Armour and Evasion (item)',              modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'LocalBaseArmourAndEvasionRating1' },
  { id: 'flat_armour_es_local',displayName: 'Armour and Energy Shield (item)',        modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'LocalBaseArmourAndEnergyShield1' },
  { id: 'flat_ev_es_local',   displayName: 'Evasion and Energy Shield (item)',        modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'LocalBaseEvasionRatingAndEnergyShield1' },

  // Flat local defence + life (each spawns on its matching armour type and compatible hybrids)
  { id: 'flat_armour_life',   displayName: 'Armour and Maximum Life (item)',          modType: 'prefix', tags: ['Defense', 'Life'],                         repoeModId: 'LocalBaseArmourAndLife1' },
  { id: 'flat_ev_life',       displayName: 'Evasion and Maximum Life (item)',         modType: 'prefix', tags: ['Defense', 'Life'],                         repoeModId: 'LocalBaseEvasionRatingAndLife1' },
  { id: 'flat_es_life',       displayName: 'Energy Shield and Maximum Life (item)',   modType: 'prefix', tags: ['Defense', 'Life'],                         repoeModId: 'LocalBaseEnergyShieldAndLife1' },
  { id: 'flat_es_mana',       displayName: 'Energy Shield and Maximum Mana (item)',   modType: 'prefix', tags: ['Defense', 'Mana'],                         repoeModId: 'LocalBaseEnergyShieldAndMana1' },

  // % local defence — single stat
  { id: 'inc_armour',         displayName: 'Increased Armour %',                      modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'LocalIncreasedPhysicalDamageReductionRatingPercent1' },
  { id: 'inc_evasion',        displayName: 'Increased Evasion %',                     modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'LocalIncreasedEvasionRatingPercent1' },
  { id: 'inc_es',             displayName: 'Increased Energy Shield %',               modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'LocalIncreasedEnergyShieldPercent1' },

  // % local defence — hybrid stat
  { id: 'inc_armour_ev',      displayName: 'Increased Armour and Evasion %',          modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'LocalIncreasedArmourAndEvasion1' },
  { id: 'inc_armour_es',      displayName: 'Increased Armour and Energy Shield %',    modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'LocalIncreasedArmourAndEnergyShield1' },
  { id: 'inc_ev_es',          displayName: 'Increased Evasion and Energy Shield %',   modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'LocalIncreasedEvasionAndEnergyShield1' },

  // % local defence + stun recovery (combined prefix — each spawns on matching armour type)
  { id: 'inc_armour_stun',    displayName: 'Increased Armour % and Stun Recovery',    modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'LocalIncreasedPhysicalDamageReductionRatingPercentAndStunRecovery1' },
  { id: 'inc_ev_stun',        displayName: 'Increased Evasion % and Stun Recovery',   modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'LocalIncreasedEvasionRatingPercentAndStunRecovery1' },
  { id: 'inc_es_stun',        displayName: 'Increased Energy Shield % and Stun Recovery', modType: 'prefix', tags: ['Defense'],                             repoeModId: 'LocalIncreasedEnergyShieldPercentAndStunRecovery1' },
  { id: 'inc_armour_ev_stun', displayName: 'Increased Armour/Evasion % and Stun Recovery',   modType: 'prefix', tags: ['Defense'],                          repoeModId: 'LocalIncreasedArmourAndEvasionAndStunRecovery1' },
  { id: 'inc_armour_es_stun', displayName: 'Increased Armour/ES % and Stun Recovery',         modType: 'prefix', tags: ['Defense'],                          repoeModId: 'LocalIncreasedArmourAndEnergyShieldAndStunRecovery1' },
  { id: 'inc_ev_es_stun',     displayName: 'Increased Evasion/ES % and Stun Recovery',        modType: 'prefix', tags: ['Defense'],                          repoeModId: 'LocalIncreasedEvasionAndEnergyShieldAndStunRecovery1' },

  // Global defence % (jewellery — amulet only)
  { id: 'global_armour_pct',  displayName: 'Increased Armour % (global)',             modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'IncreasedPhysicalDamageReductionRatingPercent1' },
  { id: 'global_ev_pct',      displayName: 'Increased Evasion % (global)',            modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'IncreasedEvasionRatingPercent1' },
  { id: 'global_es_pct',      displayName: 'Increased Energy Shield % (global)',      modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'IncreasedEnergyShieldPercent1' },

  // Global flat defence (jewellery)
  { id: 'flat_ev_ring',       displayName: 'Evasion Rating',                          modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'IncreasedEvasionRating1' },
  { id: 'flat_es',            displayName: 'Maximum Energy Shield',                   modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'IncreasedEnergyShield1' },
  { id: 'flat_armour_belt',   displayName: 'Armour Rating (belt)',                    modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'IncreasedPhysicalDamageReductionRating1' },

  // Shield block — prefix, spawns on non-ES / non-Ev/ES shields
  { id: 'block',              displayName: 'Block Chance',                            modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'LocalIncreasedBlockPercentage1' },
  { id: 'spell_block',        displayName: 'Spell Block Chance',                      modType: 'prefix', tags: ['Defense'],                                 repoeModId: 'ShieldSpellBlockPercentage1' },

  // Added damage to attacks — ring/amulet/gloves
  { id: 'phys_dmg',           displayName: 'Added Physical Damage to Attacks',        modType: 'prefix', tags: ['Physical', 'Attack'],                      repoeModId: 'AddedPhysicalDamage1' },
  { id: 'fire_dmg',           displayName: 'Added Fire Damage to Attacks',            modType: 'prefix', tags: ['Fire', 'Attack'],                          repoeModId: 'AddedFireDamage1' },
  { id: 'cold_dmg',           displayName: 'Added Cold Damage to Attacks',            modType: 'prefix', tags: ['Cold', 'Attack'],                          repoeModId: 'AddedColdDamage1' },
  { id: 'lightning_dmg',      displayName: 'Added Lightning Damage to Attacks',       modType: 'prefix', tags: ['Lightning', 'Attack'],                     repoeModId: 'AddedLightningDamage1' },

  // Elemental damage with attack skills % — ring/amulet/belt
  { id: 'ele_dmg_attacks',    displayName: 'Elemental Damage with Attacks',           modType: 'prefix', tags: ['Fire', 'Cold', 'Lightning', 'Attack'],     repoeModId: 'WeaponElementalDamage1' },

  // Spell damage — amulet only (SpellDamage1) or ES shield only (SpellDamageOnWeapon1)
  { id: 'spell_dmg',          displayName: 'Increased Spell Damage %',               modType: 'prefix', tags: ['Caster'],                                  repoeModId: 'SpellDamage1' },
  { id: 'spell_dmg_shield',   displayName: 'Increased Spell Damage % (shield)',      modType: 'prefix', tags: ['Caster'],                                  repoeModId: 'SpellDamageOnWeapon1' },

  // Thorns — body armour/shield/belt/helmet
  { id: 'thorns',             displayName: 'Damage Returned to Attackers',           modType: 'prefix', tags: ['Physical'],                                repoeModId: 'AttackerTakesDamage1' },

  // Movement speed — boots only (prefix in game data)
  { id: 'move_speed',         displayName: 'Movement Speed',                         modType: 'prefix', tags: ['Speed'],                                   repoeModId: 'MovementVelocity1' },

  // Belt prefixes
  { id: 'flask_effect',       displayName: 'Flask Effect',                           modType: 'prefix', tags: ['Life'],                                    repoeModId: 'BeltIncreasedFlaskEffect1_' },
  { id: 'flask_life_recovery',displayName: 'Flask Life Recovery Rate',               modType: 'prefix', tags: ['Life'],                                    repoeModId: 'BeltFlaskLifeRecoveryRate1' },

  // ── Suffixes ─────────────────────────────────────────────────────────────────

  // Resistances — armour/ring/amulet/belt
  { id: 'fire_res',           displayName: 'Fire Resistance',                        modType: 'suffix', tags: ['Fire', 'Resistance'],                      repoeModId: 'FireResist1' },
  { id: 'cold_res',           displayName: 'Cold Resistance',                        modType: 'suffix', tags: ['Cold', 'Resistance'],                      repoeModId: 'ColdResist1' },
  { id: 'lightning_res',      displayName: 'Lightning Resistance',                   modType: 'suffix', tags: ['Lightning', 'Resistance'],                 repoeModId: 'LightningResist1' },
  { id: 'chaos_res',          displayName: 'Chaos Resistance',                       modType: 'suffix', tags: ['Chaos', 'Resistance'],                    repoeModId: 'ChaosResist1' },
  { id: 'all_ele_res',        displayName: 'All Elemental Resistances',              modType: 'suffix', tags: ['Fire', 'Cold', 'Lightning', 'Resistance'], repoeModId: 'AllResistances1' },

  // Maximum resistances — shield only
  { id: 'max_fire_res',       displayName: 'Maximum Fire Resistance',               modType: 'suffix', tags: ['Fire', 'Resistance'],                      repoeModId: 'MaximumFireResist1' },
  { id: 'max_cold_res',       displayName: 'Maximum Cold Resistance',               modType: 'suffix', tags: ['Cold', 'Resistance'],                      repoeModId: 'MaximumColdResist1' },
  { id: 'max_lightning_res',  displayName: 'Maximum Lightning Resistance',          modType: 'suffix', tags: ['Lightning', 'Resistance'],                 repoeModId: 'MaximumLightningResist1' },
  { id: 'max_chaos_res',      displayName: 'Maximum Chaos Resistance',              modType: 'suffix', tags: ['Chaos', 'Resistance'],                    repoeModId: 'MaximumChaosResist1' },
  { id: 'max_all_res',        displayName: 'Maximum Resistances',                  modType: 'suffix', tags: ['Fire', 'Cold', 'Lightning', 'Resistance'], repoeModId: 'MaximumAllResist1_' },

  // Elemental damage % — ring/amulet
  { id: 'fire_dmg_pct',       displayName: 'Increased Fire Damage %',               modType: 'suffix', tags: ['Fire'],                                    repoeModId: 'FireDamagePercent1' },
  { id: 'cold_dmg_pct',       displayName: 'Increased Cold Damage %',               modType: 'suffix', tags: ['Cold'],                                    repoeModId: 'ColdDamagePercent1' },
  { id: 'lightning_dmg_pct',  displayName: 'Increased Lightning Damage %',          modType: 'suffix', tags: ['Lightning'],                               repoeModId: 'LightningDamagePercent1' },
  { id: 'dot_multi',          displayName: 'Damage over Time Multiplier',           modType: 'suffix', tags: [],                                         repoeModId: 'GlobalDamageOverTimeMultiplier1h1' },

  // Attributes
  { id: 'strength',           displayName: 'Strength',                               modType: 'suffix', tags: ['Attributes'],                              repoeModId: 'Strength1' },
  { id: 'dexterity',          displayName: 'Dexterity',                              modType: 'suffix', tags: ['Attributes'],                              repoeModId: 'Dexterity1' },
  { id: 'intelligence',       displayName: 'Intelligence',                           modType: 'suffix', tags: ['Attributes'],                              repoeModId: 'Intelligence1' },
  { id: 'all_attrs',          displayName: 'All Attributes',                         modType: 'suffix', tags: ['Attributes'],                              repoeModId: 'AllAttributes1' },

  // Life
  { id: 'life_regen',         displayName: 'Life Regeneration per Second',          modType: 'suffix', tags: ['Life'],                                    repoeModId: 'LifeRegeneration1' },
  { id: 'life_regen_rate',    displayName: 'Increased Life Regeneration Rate %',   modType: 'suffix', tags: ['Life'],                                    repoeModId: 'LifeRegenerationRate1' },
  { id: 'life_leech',         displayName: 'Life Leech from Physical Attacks',     modType: 'suffix', tags: ['Life', 'Physical', 'Attack'],             repoeModId: 'LifeLeechPermyriadSuffix1' },
  { id: 'life_on_kill',       displayName: 'Life gained on Kill',                  modType: 'suffix', tags: ['Life'],                                    repoeModId: 'LifeGainedFromEnemyDeath1' },
  { id: 'life_on_hit',        displayName: 'Life gained per Hit',                  modType: 'suffix', tags: ['Life'],                                    repoeModId: 'LifeGainPerTarget1' },

  // Mana
  { id: 'mana_regen',         displayName: 'Mana Regeneration Rate',               modType: 'suffix', tags: ['Mana'],                                    repoeModId: 'ManaRegeneration1' },
  { id: 'mana_leech',         displayName: 'Mana Leech from Physical Attacks',     modType: 'suffix', tags: ['Mana', 'Physical', 'Attack'],             repoeModId: 'ManaLeechPermyriadSuffix1' },
  { id: 'mana_on_kill',       displayName: 'Mana gained on Kill',                  modType: 'suffix', tags: ['Mana'],                                    repoeModId: 'ManaGainedFromEnemyDeath1' },

  // Energy shield recovery — int_armour and hybrids
  { id: 'es_recharge_rate',   displayName: 'Energy Shield Recharge Rate',          modType: 'suffix', tags: ['Defense'],                                 repoeModId: 'EnergyShieldRechargeRate1' },
  { id: 'es_recharge_start',  displayName: 'Faster Energy Shield Recharge Start', modType: 'suffix', tags: ['Defense'],                                 repoeModId: 'FasterStartEnergyShieldRecharge1' },

  // Physical damage reduction — str_armour and hybrids
  { id: 'phys_reduction',     displayName: 'Physical Damage Reduction %',          modType: 'suffix', tags: ['Physical'],                                repoeModId: 'AdditionalPhysicalDamageReduction1' },

  // Stun / block recovery
  { id: 'stun_recovery',      displayName: 'Stun and Block Recovery',               modType: 'suffix', tags: [],                                         repoeModId: 'StunRecovery1' },

  // Speed
  { id: 'attack_speed',       displayName: 'Attack Speed',                          modType: 'suffix', tags: ['Attack', 'Speed'],                         repoeModId: 'IncreasedAttackSpeed1' },
  { id: 'cast_speed',         displayName: 'Cast Speed',                            modType: 'suffix', tags: ['Caster', 'Speed'],                         repoeModId: 'IncreasedCastSpeed1' },

  // Accuracy
  { id: 'accuracy',           displayName: 'Accuracy Rating',                       modType: 'suffix', tags: ['Attack'],                                  repoeModId: 'IncreasedAccuracyNew1_' },

  // Critical
  { id: 'crit_chance',        displayName: 'Critical Strike Chance',                modType: 'suffix', tags: ['Critical'],                                repoeModId: 'CriticalStrikeChance1' },
  { id: 'crit_multi',         displayName: 'Critical Strike Multiplier',            modType: 'suffix', tags: ['Critical'],                                repoeModId: 'CriticalMultiplier1' },
  { id: 'spell_crit',         displayName: 'Spell Critical Strike Chance',          modType: 'suffix', tags: ['Critical', 'Caster'],                      repoeModId: 'SpellCriticalStrikeChance1' },

  // Spell suppression — evasion-based armour
  { id: 'suppress',           displayName: 'Spell Suppression Chance',              modType: 'suffix', tags: [],                                         repoeModId: 'ChanceToSuppressSpells1_' },

  // Avoid ailments — shield only
  { id: 'avoid_ailments',     displayName: 'Avoid Elemental Ailments %',           modType: 'suffix', tags: ['Fire', 'Cold', 'Lightning'],              repoeModId: 'ChanceToAvoidElementalStatusAilments1' },

  // Reduced crit damage taken — str shields (Armour/Armour+Ev/Armour+ES)
  { id: 'reduce_crit_dmg',    displayName: 'Reduced Extra Damage from Crits',      modType: 'suffix', tags: ['Critical'],                                repoeModId: 'ReducedExtraDamageFromCrits1___' },

  // Reduced attribute requirements — armour/shield slots
  { id: 'reduce_attr_reqs',   displayName: 'Reduced Attribute Requirements',       modType: 'suffix', tags: [],                                         repoeModId: 'ReducedLocalAttributeRequirements1' },

  // Belt suffixes
  { id: 'flask_duration',     displayName: 'Flask Duration',                       modType: 'suffix', tags: ['Life'],                                    repoeModId: 'BeltIncreasedFlaskDuration1' },
  { id: 'flask_charges',      displayName: 'Flask Charges Gained',                 modType: 'suffix', tags: ['Life'],                                    repoeModId: 'BeltIncreasedFlaskChargesGained1' },
  { id: 'stun_duration',      displayName: 'Stun Duration on Enemies',             modType: 'suffix', tags: [],                                         repoeModId: 'StunDuration1' },
];
