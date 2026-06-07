import type { TreeNode } from './types';

/**
 * Tree has TWO roots: 'a' and 'g' — both are direct children of the Start node
 * (the Provisioning Wombgift activation point, not modelled as a tree node).
 *
 * Main branches:
 *   Start → a → G cluster (armour, top-right) + b → F, c hub
 *   Start → g → stat req nodes, j → K/k/m/n (devoted), h → jewellery
 *
 * Canvas: 920 × 730. Pentagon r=46, Square r=46.
 */
export const TREE_NODES: TreeNode[] = [

  // ── a BRANCH: Start → a → G (top-right) + b → c hub ─────────────
  {
    id: 'a', name: 'Socket and Link Count', type: 'Small', category: 'sockets',
    description: 'Birthed Equipment rolls Sockets and Links +10 times, keeping the best outcome',
    parents: [],
    effects: [{ category: 'sockets', value: 10 }],
    position: { x: 760, y: 572 },
  },
  {
    id: 'b', name: 'Modifier Tier Rating', type: 'Small', category: 'modTierRating',
    description: 'Birthed Equipment has +20 to Modifier Tier Rating',
    parents: ['a'],
    effects: [{ category: 'modTierRating', value: 20 }],
    position: { x: 638, y: 498 },
  },
  {
    id: 'F', name: 'Basic Nurturing', type: 'Notable', category: 'quality',
    description: 'Birthed Armour have a random amount of Quality',
    parents: ['b'],
    effects: [{ category: 'quality', value: 1 }],
    position: { x: 685, y: 420 },
  },
  {
    id: 'c', name: 'Item Level', type: 'Small', category: 'itemLevel',
    description: 'Birthed Equipment has 25% chance for +1 to Item Level',
    parents: ['b'],
    effects: [{ category: 'itemLevel', value: 0.25 }],
    position: { x: 518, y: 428 },
  },
  // c's children: f, E, e, D, d
  {
    id: 'f', name: 'Modifier Tier Rating', type: 'Small', category: 'modTierRating',
    description: 'Birthed Equipment has +20 to Modifier Tier Rating',
    parents: ['c'],
    effects: [{ category: 'modTierRating', value: 20 }],
    position: { x: 498, y: 275 },
  },
  {
    id: 'E', name: 'Arterial Mesh', type: 'Notable', category: 'sockets',
    description: 'Birthed Equipment rolls Sockets and Links +50 times, keeping the best outcome',
    parents: ['c'],
    effects: [{ category: 'sockets', value: 50 }],
    position: { x: 383, y: 213 },
  },
  {
    id: 'e', name: 'Divine Rolls', type: 'Small', category: 'divine',
    description: 'Values of the random modifiers on Birthed Equipment are rolled an additional time keeping the best outcome',
    parents: ['c'],
    effects: [{ category: 'divine', value: 1 }],
    position: { x: 408, y: 333 },
  },
  {
    id: 'D', name: 'Solid Cysts', type: 'Notable', category: 'fractured',
    description: 'Birthed Equipment has 33% chance to be Fractured',
    parents: ['c'],
    effects: [{ category: 'fractured', value: 0.33 }],
    position: { x: 298, y: 255 },
  },
  {
    id: 'd', name: 'Additional Item Chance', type: 'Small', category: 'additionalItem',
    description: '50% chance for Wombgifts to Birth an additional Equipment Item',
    parents: ['c'],
    effects: [{ category: 'additionalItem', value: 0.5 }],
    position: { x: 363, y: 408 },
  },

  // ── G CLUSTER — Armour gear types (top right) ────────────────────
  {
    id: 'G', name: 'Guardian Flesh', type: 'Notable', category: 'gearType',
    description: '500% increased chance for Birthed Equipment to be Armour',
    parents: ['a'],
    effects: [{ category: 'gearType', value: 6, gear: 'Armour' }],
    position: { x: 825, y: 268 },
  },
  { id: 'G1', name: 'Increased Shields Chance',     type: 'Small', category: 'gearType', description: '5000% increased chance for Birthed Equipment to be Shields',     parents: ['G'], effects: [{ category: 'gearType', value: 51, gear: 'Shield' }],      position: { x: 825, y: 222 } },
  { id: 'G2', name: 'Increased Helmets Chance',     type: 'Small', category: 'gearType', description: '5000% increased chance for Birthed Equipment to be Helmets',     parents: ['G'], effects: [{ category: 'gearType', value: 51, gear: 'Helmet' }],      position: { x: 869, y: 245 } },
  { id: 'G3', name: 'Increased Body Armour Chance', type: 'Small', category: 'gearType', description: '5000% increased chance for Birthed Equipment to be Body Armour', parents: ['G'], effects: [{ category: 'gearType', value: 51, gear: 'Body Armour' }], position: { x: 852, y: 296 } },
  { id: 'G4', name: 'Increased Gloves Chance',      type: 'Small', category: 'gearType', description: '5000% increased chance for Birthed Equipment to be Gloves',      parents: ['G'], effects: [{ category: 'gearType', value: 51, gear: 'Gloves' }],      position: { x: 798, y: 296 } },
  { id: 'G5', name: 'Increased Boots Chance',       type: 'Small', category: 'gearType', description: '5000% increased chance for Birthed Equipment to be Boots',       parents: ['G'], effects: [{ category: 'gearType', value: 51, gear: 'Boots' }],       position: { x: 781, y: 245 } },

  // ── C CLUSTER — Forsaken Technique (upper center-right) ──────────
  {
    id: 'C', name: 'Forsaken Technique', type: 'Notable', category: 'hub',
    description: 'Hub node — allocate to access Forsaken Technique satellites',
    parents: ['f'],
    effects: [],
    position: { x: 518, y: 122 },
  },
  { id: 'C1', name: 'Reduced Lightning Modifier Chance', type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 60% reduced chance for Lightning Modifiers', parents: ['C'], effects: [{ category: 'modTag', value: 0.4, tag: 'Lightning' }], position: { x: 518, y:  76 } },
  { id: 'C2', name: 'Reduced Cold Modifier Chance',      type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 60% reduced chance for Cold Modifiers',      parents: ['C'], effects: [{ category: 'modTag', value: 0.4, tag: 'Cold' }],      position: { x: 562, y:  99 } },
  { id: 'C3', name: 'Reduced Fire Modifier Chance',      type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 60% reduced chance for Fire Modifiers',      parents: ['C'], effects: [{ category: 'modTag', value: 0.4, tag: 'Fire' }],      position: { x: 545, y: 150 } },
  { id: 'C4', name: 'Reduced Physical Modifier Chance',  type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 60% reduced chance for Physical Modifiers',  parents: ['C'], effects: [{ category: 'modTag', value: 0.4, tag: 'Physical' }],  position: { x: 491, y: 150 } },
  { id: 'C5', name: 'Reduced Chaos Modifier Chance',     type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 60% reduced chance for Chaos Modifiers',     parents: ['C'], effects: [{ category: 'modTag', value: 0.4, tag: 'Chaos' }],     position: { x: 474, y:  99 } },

  // ── B CLUSTER — Forsaken Zeal (upper center) ─────────────────────
  {
    id: 'B', name: 'Forsaken Zeal', type: 'Notable', category: 'hub',
    description: 'Hub node — allocate to access Forsaken Zeal satellites',
    parents: ['e'],
    effects: [],
    position: { x: 325, y: 178 },
  },
  { id: 'B1', name: 'Reduced Speed Modifier Chance',    type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 60% reduced chance for Speed Modifiers',    parents: ['B'], effects: [{ category: 'modTag', value: 0.4, tag: 'Speed' }],    position: { x: 325, y: 132 } },
  { id: 'B2', name: 'Reduced Caster Modifier Chance',   type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 60% reduced chance for Caster Modifiers',   parents: ['B'], effects: [{ category: 'modTag', value: 0.4, tag: 'Caster' }],   position: { x: 371, y: 178 } },
  { id: 'B3', name: 'Reduced Attack Modifier Chance',   type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 60% reduced chance for Attack Modifiers',   parents: ['B'], effects: [{ category: 'modTag', value: 0.4, tag: 'Attack' }],   position: { x: 325, y: 224 } },
  { id: 'B4', name: 'Reduced Critical Modifier Chance', type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 60% reduced chance for Critical Modifiers', parents: ['B'], effects: [{ category: 'modTag', value: 0.4, tag: 'Critical' }], position: { x: 279, y: 178 } },

  // ── A CLUSTER — Forsaken Soul (left) ─────────────────────────────
  {
    id: 'A', name: 'Forsaken Soul', type: 'Notable', category: 'hub',
    description: 'Hub node — allocate to access Forsaken Soul satellites',
    parents: ['d'],
    effects: [],
    position: { x: 155, y: 265 },
  },
  { id: 'A1', name: 'Reduced Defenses Modifier Chance',   type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 60% reduced chance for Defence Modifiers',    parents: ['A'], effects: [{ category: 'modTag', value: 0.4, tag: 'Defense' }],    position: { x: 155, y: 219 } },
  { id: 'A2', name: 'Reduced Attributes Modifier Chance', type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 60% reduced chance for Attribute Modifiers',  parents: ['A'], effects: [{ category: 'modTag', value: 0.4, tag: 'Attributes' }], position: { x: 199, y: 247 } },
  { id: 'A3', name: 'Reduced Resistance Modifier Chance', type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 60% reduced chance for Resistance Modifiers', parents: ['A'], effects: [{ category: 'modTag', value: 0.4, tag: 'Resistance' }], position: { x: 182, y: 298 } },
  { id: 'A4', name: 'Reduced Mana Modifier Chance',       type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 60% reduced chance for Mana Modifiers',       parents: ['A'], effects: [{ category: 'modTag', value: 0.4, tag: 'Mana' }],       position: { x: 128, y: 298 } },
  { id: 'A5', name: 'Reduced Life Modifier Chance',       type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 60% reduced chance for Life Modifiers',       parents: ['A'], effects: [{ category: 'modTag', value: 0.4, tag: 'Life' }],       position: { x: 111, y: 247 } },

  // ── g BRANCH: Start → g → stat nodes, j (devoteds), h (jewellery) ─
  {
    id: 'g', name: 'Additional Item Chance', type: 'Small', category: 'additionalItem',
    description: '25% chance for Wombgifts to Birth an additional Equipment Item',
    parents: [],
    effects: [{ category: 'additionalItem', value: 0.25 }],
    position: { x: 653, y: 613 },
  },
  // stat req nodes ring around g
  { id: 'g1', name: 'Less Intelligence Items', type: 'Small', category: 'statReq', description: '85% less chance for Birthed Equipment to have Intelligence Requirements',  parents: ['g'], effects: [{ category: 'statReq', value: 0.15, statReq: 'int' }], position: { x: 653, y: 573 } },
  { id: 'g2', name: 'More Intelligence Items', type: 'Small', category: 'statReq', description: '300% more chance for Birthed Equipment to have Intelligence Requirements', parents: ['g'], effects: [{ category: 'statReq', value: 4,    statReq: 'int' }], position: { x: 689, y: 580 } },
  { id: 'g3', name: 'More Dexterity Items',    type: 'Small', category: 'statReq', description: '300% more chance for Birthed Equipment to have Dexterity Requirements',    parents: ['g'], effects: [{ category: 'statReq', value: 4,    statReq: 'dex' }], position: { x: 689, y: 646 } },
  { id: 'g4', name: 'Less Dexterity Items',    type: 'Small', category: 'statReq', description: '85% less chance for Birthed Equipment to have Dexterity Requirements',     parents: ['g'], effects: [{ category: 'statReq', value: 0.15, statReq: 'dex' }], position: { x: 653, y: 653 } },
  { id: 'g5', name: 'Less Strength Items',     type: 'Small', category: 'statReq', description: '85% less chance for Birthed Equipment to have Strength Requirements',      parents: ['g'], effects: [{ category: 'statReq', value: 0.15, statReq: 'str' }], position: { x: 617, y: 646 } },
  { id: 'g6', name: 'More Strength Items',     type: 'Small', category: 'statReq', description: '300% more chance for Birthed Equipment to have Strength Requirements',     parents: ['g'], effects: [{ category: 'statReq', value: 4,    statReq: 'str' }], position: { x: 617, y: 580 } },

  // j: gateway to devoted clusters and K/Severing
  {
    id: 'j', name: 'Item Level', type: 'Small', category: 'itemLevel',
    description: 'Birthed Equipment has 25% chance for +1 to Item Level',
    parents: ['g'],
    effects: [{ category: 'itemLevel', value: 0.25 }],
    position: { x: 520, y: 580 },
  },
  {
    id: 'K', name: 'Severing', type: 'Notable', category: 'severing',
    description: 'Birthed Equipment has the lowest Level Modifier removed',
    parents: ['j'],
    effects: [{ category: 'severing', value: 1 }],
    position: { x: 453, y: 535 },
  },
  {
    id: 'k', name: 'Modifier Tier Rating', type: 'Small', category: 'modTierRating',
    description: 'Birthed Equipment has +20 to Modifier Tier Rating',
    parents: ['j'],
    effects: [{ category: 'modTierRating', value: 20 }],
    position: { x: 453, y: 483 },
  },
  {
    id: 'm', name: 'Divine Rolls', type: 'Small', category: 'divine',
    description: 'Values of the random modifiers on Birthed Equipment are rolled an additional time keeping the best outcome',
    parents: ['j'],
    effects: [{ category: 'divine', value: 1 }],
    position: { x: 438, y: 588 },
  },
  {
    id: 'n', name: 'Additional Item Chance', type: 'Small', category: 'additionalItem',
    description: '50% chance for Wombgifts to Birth an additional Equipment Item',
    parents: ['j'],
    effects: [{ category: 'additionalItem', value: 0.5 }],
    position: { x: 425, y: 645 },
  },

  // ── L CLUSTER — Devoted Technique (left, via k) ──────────────────
  {
    id: 'L', name: 'Devoted Technique', type: 'Notable', category: 'hub',
    description: 'Hub node — allocate to access Devoted Technique satellites',
    parents: ['k'],
    effects: [],
    position: { x: 168, y: 415 },
  },
  { id: 'L1', name: 'Increased Chaos Modifier Chance',     type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 500% increased chance for Chaos Modifiers',     parents: ['L'], effects: [{ category: 'modTag', value: 6, tag: 'Chaos' }],     position: { x: 168, y: 369 } },
  { id: 'L2', name: 'Increased Physical Modifier Chance',  type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 500% increased chance for Physical Modifiers',  parents: ['L'], effects: [{ category: 'modTag', value: 6, tag: 'Physical' }],  position: { x: 212, y: 401 } },
  { id: 'L3', name: 'Increased Fire Modifier Chance',      type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 500% increased chance for Fire Modifiers',      parents: ['L'], effects: [{ category: 'modTag', value: 6, tag: 'Fire' }],      position: { x: 195, y: 452 } },
  { id: 'L4', name: 'Increased Cold Modifier Chance',      type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 500% increased chance for Cold Modifiers',      parents: ['L'], effects: [{ category: 'modTag', value: 6, tag: 'Cold' }],      position: { x: 141, y: 452 } },
  { id: 'L5', name: 'Increased Lightning Modifier Chance', type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 500% increased chance for Lightning Modifiers', parents: ['L'], effects: [{ category: 'modTag', value: 6, tag: 'Lightning' }], position: { x: 124, y: 401 } },

  // ── M CLUSTER — Devoted Zeal (lower left, via m) ─────────────────
  {
    id: 'M', name: 'Devoted Zeal', type: 'Notable', category: 'hub',
    description: 'Hub node — allocate to access Devoted Zeal satellites',
    parents: ['m'],
    effects: [],
    position: { x: 102, y: 523 },
  },
  { id: 'M1', name: 'Increased Critical Modifier Chance', type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 500% increased chance for Critical Modifiers', parents: ['M'], effects: [{ category: 'modTag', value: 6, tag: 'Critical' }], position: { x: 102, y: 477 } },
  { id: 'M2', name: 'Increased Attack Modifier Chance',   type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 500% increased chance for Attack Modifiers',   parents: ['M'], effects: [{ category: 'modTag', value: 6, tag: 'Attack' }],   position: { x: 148, y: 523 } },
  { id: 'M3', name: 'Increased Caster Modifier Chance',   type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 500% increased chance for Caster Modifiers',   parents: ['M'], effects: [{ category: 'modTag', value: 6, tag: 'Caster' }],   position: { x: 102, y: 569 } },
  { id: 'M4', name: 'Increased Speed Modifier Chance',    type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 500% increased chance for Speed Modifiers',    parents: ['M'], effects: [{ category: 'modTag', value: 6, tag: 'Speed' }],    position: { x:  56, y: 523 } },

  // ── N CLUSTER — Devoted Soul (bottom left, via n) ─────────────────
  {
    id: 'N', name: 'Devoted Soul', type: 'Notable', category: 'hub',
    description: 'Hub node — allocate to access Devoted Soul satellites',
    parents: ['n'],
    effects: [],
    position: { x: 140, y: 635 },
  },
  { id: 'N1', name: 'Increased Life Modifier Chance',       type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 500% increased chance for Life Modifiers',       parents: ['N'], effects: [{ category: 'modTag', value: 6, tag: 'Life' }],       position: { x: 140, y: 589 } },
  { id: 'N2', name: 'Increased Mana Modifier Chance',       type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 500% increased chance for Mana Modifiers',       parents: ['N'], effects: [{ category: 'modTag', value: 6, tag: 'Mana' }],       position: { x: 184, y: 617 } },
  { id: 'N3', name: 'Increased Defenses Modifier Chance',   type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 500% increased chance for Defense Modifiers',    parents: ['N'], effects: [{ category: 'modTag', value: 6, tag: 'Defense' }],    position: { x: 167, y: 668 } },
  { id: 'N4', name: 'Increased Attributes Modifier Chance', type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 500% increased chance for Attribute Modifiers',  parents: ['N'], effects: [{ category: 'modTag', value: 6, tag: 'Attributes' }], position: { x: 113, y: 668 } },
  { id: 'N5', name: 'Increased Resistance Modifier Chance', type: 'Notable', category: 'modTag', description: 'Birthed Equipment has 500% increased chance for Resistance Modifiers', parents: ['N'], effects: [{ category: 'modTag', value: 6, tag: 'Resistance' }], position: { x:  96, y: 617 } },

  // ── h BRANCH: g → h → i (jewels), H cluster (jewellery) ─────────
  {
    id: 'h', name: 'Additional Item Chance', type: 'Small', category: 'additionalItem',
    description: '50% chance for Wombgifts to Birth an additional Equipment Item',
    parents: ['g'],
    effects: [{ category: 'additionalItem', value: 0.5 }],
    position: { x: 528, y: 650 },
  },
  {
    id: 'i', name: 'Increased Jewel Chance', type: 'Small', category: 'gearType',
    description: '5000% increased chance for Birthed Equipment to be Jewels. Provisioning Wombgifts may instead Birth Jewels',
    parents: ['h'],
    effects: [{ category: 'gearType', value: 51, gear: 'Jewel' }],
    position: { x: 438, y: 668 },
  },
  {
    id: 'H', name: 'Glittering Flesh', type: 'Notable', category: 'gearType',
    description: '500% increased chance for Birthed Equipment to be Jewellery',
    parents: ['h'],
    effects: [{ category: 'gearType', value: 6, gear: 'Jewellery' }],
    position: { x: 488, y: 688 },
  },
  { id: 'H1', name: 'Increased Amulets Chance', type: 'Small', category: 'gearType', description: '5000% increased chance for Birthed Equipment to be Amulets', parents: ['H'], effects: [{ category: 'gearType', value: 51, gear: 'Amulet' }], position: { x: 442, y: 711 } },
  { id: 'H2', name: 'Increased Rings Chance',   type: 'Small', category: 'gearType', description: '5000% increased chance for Birthed Equipment to be Rings',   parents: ['H'], effects: [{ category: 'gearType', value: 51, gear: 'Ring' }],   position: { x: 488, y: 725 } },
  { id: 'H3', name: 'Increased Belts Chance',   type: 'Small', category: 'gearType', description: '5000% increased chance for Birthed Equipment to be Belts',   parents: ['H'], effects: [{ category: 'gearType', value: 51, gear: 'Belt' }],   position: { x: 534, y: 711 } },
];

export const NODE_MAP = new Map<string, TreeNode>(
  TREE_NODES.map(n => [n.id, n])
);

export const EXCLUSIVE_CLUSTERS: Record<string, string[]> = {
  L: ['L1', 'L2', 'L3', 'L4', 'L5'],
  M: ['M1', 'M2', 'M3', 'M4'],
  N: ['N1', 'N2', 'N3', 'N4', 'N5'],
  A: ['A1', 'A2', 'A3', 'A4', 'A5'],
  B: ['B1', 'B2', 'B3', 'B4'],
  C: ['C1', 'C2', 'C3', 'C4', 'C5'],
  G: ['G1', 'G2', 'G3', 'G4', 'G5'],
  H: ['H1', 'H2', 'H3'],
};

export const SATELLITE_TO_HUB: Record<string, string> = {};
for (const [hub, sats] of Object.entries(EXCLUSIVE_CLUSTERS)) {
  for (const sat of sats) SATELLITE_TO_HUB[sat] = hub;
}

export const BOOSTABLE_TAGS = [
  'Chaos', 'Physical', 'Fire', 'Cold', 'Lightning',
  'Critical', 'Attack', 'Caster', 'Speed',
  'Life', 'Mana', 'Defense', 'Attributes', 'Resistance',
] as const;
export type BoostableTag = typeof BOOSTABLE_TAGS[number];

export const GEAR_SLOTS = [
  'Gloves', 'Boots', 'Helmet', 'Body Armour', 'Shield',
  'Ring', 'Amulet', 'Belt', 'Jewel',
] as const;
export type GearSlot = typeof GEAR_SLOTS[number];

export const SLOT_TO_NODE: Record<string, string> = {
  'Gloves':      'G4',
  'Boots':       'G5',
  'Helmet':      'G2',
  'Body Armour': 'G3',
  'Shield':      'G1',
  'Ring':        'H2',
  'Amulet':      'H1',
  'Belt':        'H3',
  'Jewel':       'i',
};

export const ITEM_CLASS_TO_SLOT: Record<string, GearSlot> = {
  'Gloves':       'Gloves',
  'Boots':        'Boots',
  'Helmets':      'Helmet',
  'Body Armours': 'Body Armour',
  'Shields':      'Shield',
  'Rings':        'Ring',
  'Amulets':      'Amulet',
  'Belts':        'Belt',
  'Jewels':       'Jewel',
};
