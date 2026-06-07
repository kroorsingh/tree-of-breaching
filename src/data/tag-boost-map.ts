/**
 * Maps Genesis Tree display tag names (also used in advanced copy format)
 * to their lowercase internal implicit_tag values in mods.json.
 *
 * Confirmed from data inspection of public/data/mods.json.
 * Notable special cases: Defense→defences (British spelling), Attributes→attribute (singular).
 */
export const GENESIS_TAG_TO_IMPLICIT_TAG: Record<string, string> = {
  Life:       'life',
  Mana:       'mana',
  Fire:       'fire',
  Cold:       'cold',
  Lightning:  'lightning',
  Chaos:      'chaos',
  Physical:   'physical',
  Resistance: 'resistance',
  Defense:    'defences',
  Attributes: 'attribute',
  Attack:     'attack',
  Caster:     'caster',
  Critical:   'critical',
  Speed:      'speed',
};
