import type { ParsedItem, ParsedImplicit, ParsedMod } from '../data/types';
import { ITEM_CLASS_TO_SLOT } from '../data/genesis-tree';

/**
 * Parses the advanced copy format (Ctrl+Alt+C) from Path of Exile.
 * Returns null if the text doesn't look like a valid item.
 */
export function parseAdvancedCopy(raw: string): ParsedItem | null {
  const text = raw.replace(/\r\n/g, '\n').trim();
  const sections = text.split('\n--------\n');
  if (sections.length < 2) return null;

  // ── Section 0: header ────────────────────────────────────────────
  const headerLines = sections[0].split('\n');
  let itemClass = '';
  let rarity = '';
  const nameLines: string[] = [];

  for (const line of headerLines) {
    if (line.startsWith('Item Class: ')) itemClass = line.slice('Item Class: '.length).trim();
    else if (line.startsWith('Rarity: ')) rarity = line.slice('Rarity: '.length).trim();
    else nameLines.push(line.trim());
  }

  if (!itemClass || !rarity) return null;
  const name = nameLines[0] ?? '';
  const baseType = nameLines[1] ?? nameLines[0] ?? '';

  // ── Find item level ───────────────────────────────────────────────
  let itemLevel = 0;
  for (const section of sections) {
    const match = section.match(/^Item Level:\s*(\d+)/m);
    if (match) { itemLevel = parseInt(match[1], 10); break; }
  }

  // ── Find requirements ─────────────────────────────────────────────
  const requirements: ParsedItem['requirements'] = {};
  for (const section of sections) {
    if (!section.startsWith('Requirements:') && !section.includes('\nLevel:')) continue;
    const lvl = section.match(/Level:\s*(\d+)/); if (lvl) requirements.level = parseInt(lvl[1], 10);
    const str = section.match(/Str:\s*(\d+)/);   if (str) requirements.str   = parseInt(str[1], 10);
    const dex = section.match(/Dex:\s*(\d+)/);   if (dex) requirements.dex   = parseInt(dex[1], 10);
    const int = section.match(/Int:\s*(\d+)/);   if (int) requirements.int   = parseInt(int[1], 10);
  }

  // ── Find the last section (implicits + explicits + footer) ────────
  // The implicits section is the first section containing { ... Implicit ... }
  // The explicits section is the first section containing { Prefix/Suffix Modifier }
  const implicits: ParsedImplicit[] = [];
  const explicits: ParsedMod[] = [];
  const influences: string[] = [];

  for (const section of sections) {
    if (section.includes('Implicit Modifier')) {
      parseImplicits(section, implicits);
    }
    if (section.includes('Prefix Modifier') || section.includes('Suffix Modifier')) {
      parseExplicits(section, explicits, influences);
    }
  }

  const slot = ITEM_CLASS_TO_SLOT[itemClass];

  return {
    itemClass: slot ?? itemClass,
    baseType,
    name,
    itemLevel,
    requirements,
    influences,
    implicits,
    explicits,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseImplicits(section: string, out: ParsedImplicit[]) {
  const lines = section.split('\n');
  let pending: { source: string; tier: string } | null = null;

  for (const line of lines) {
    const implicitMeta = line.match(/^\{\s*(.+?)\s+Implicit Modifier(?:\s+\((.+?)\))?\s*\}/);
    if (implicitMeta) {
      pending = { source: implicitMeta[1].trim(), tier: implicitMeta[2]?.trim() ?? '' };
      continue;
    }
    if (pending && line.trim() && !line.startsWith('(')) {
      out.push({ ...pending, stat: cleanStatLine(line) });
      pending = null;
    }
  }
}

function parseExplicits(section: string, mods: ParsedMod[], influences: string[]) {
  const lines = section.split('\n');
  let pending: Omit<ParsedMod, 'stat'> | null = null;

  for (const line of lines) {
    // { Prefix Modifier "name" (Tier: 3) — tag1, tag2 }
    const modMeta = line.match(
      /^\{\s*(Prefix|Suffix)\s+Modifier\s+"([^"]+)"\s+\(Tier:\s*(\d+)\)(?:\s+[—\-–]\s*(.+?))?\s*\}/
    );
    if (modMeta) {
      const tags = modMeta[4]
        ? modMeta[4].split(',').map(t => t.trim()).filter(Boolean)
        : [];
      pending = {
        type: modMeta[1] as 'Prefix' | 'Suffix',
        name: modMeta[2],
        tier: parseInt(modMeta[3], 10),
        tags,
      };
      continue;
    }

    // Influence footer lines like "Searing Exarch Item"
    if (line.endsWith(' Item') && !line.startsWith('{') && !line.startsWith('(') && !pending) {
      influences.push(line.replace(/ Item$/, '').trim());
      continue;
    }

    if (pending && line.trim() && !line.startsWith('{') && !line.startsWith('(')) {
      mods.push({ ...pending, stat: cleanStatLine(line) });
      pending = null;
    }
  }
}

/** Strip rolled-value ranges like "10(7-10)" → "10" and "(augmented)" suffixes */
function cleanStatLine(line: string): string {
  return line
    .replace(/(\d+)\(\d+-\d+\)/g, '$1')   // "10(7-10)" → "10"
    .replace(/\s*\(augmented\)/g, '')
    .trim();
}
