import { useState, useEffect } from 'react';
import { parseAdvancedCopy } from '../../lib/item-parser';
import { useAppStore } from '../../store/app-store';
import { GEAR_SLOTS } from '../../data/genesis-tree';
import type { GearSlot } from '../../data/genesis-tree';
import {
  CURATED_MODS, ARMOUR_SLOTS_SET,
  DEFENSE_OPTIONS, DEFENSE_TO_REQS,
} from '../../data/curated-mods';
import type { CuratedMod, DefenseType } from '../../data/curated-mods';
import { getItemTags } from '../../data/slot-defense-tags';
import { loadMods, getSpawnWeight } from '../../lib/repoe-loader';
import type { TargetItem, TargetTag } from '../../data/types';

type Tab = 'paste' | 'manual';

export default function ItemInput() {
  const [tab, setTab] = useState<Tab>('paste');
  const { setTargetItem, clearTarget, targetItem } = useAppStore();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1">
        {(['paste', 'manual'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              border: '1px solid',
              borderColor: tab === t ? 'var(--gold)' : 'var(--border)',
              background: tab === t ? 'var(--node-recommended)' : 'var(--surface2)',
              color: tab === t ? 'var(--gold)' : 'var(--text-dim)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {t === 'paste' ? 'Paste Item' : 'Build Manually'}
          </button>
        ))}
        {targetItem && (
          <button
            onClick={clearTarget}
            style={{
              marginLeft: 'auto', padding: '6px 12px', borderRadius: 4,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {tab === 'paste' ? <PasteTab onSubmit={setTargetItem} /> : <ManualTab onSubmit={setTargetItem} />}

      {targetItem && <ItemPreview item={targetItem} />}
    </div>
  );
}

// ─── Paste tab ───────────────────────────────────────────────────────────────

function PasteTab({ onSubmit }: { onSubmit: (item: TargetItem) => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    setError('');
    const parsed = parseAdvancedCopy(text);
    if (!parsed) { setError('Could not parse item. Use Ctrl+Alt+C in PoE to copy.'); return; }
    if (!parsed.explicits.length) { setError('No explicit mods found. Make sure to use advanced copy (Ctrl+Alt+C).'); return; }

    const prefixTagSet = new Set<string>();
    const suffixTagSet = new Set<string>();
    for (const mod of parsed.explicits) {
      const dest = mod.type === 'Prefix' ? prefixTagSet : suffixTagSet;
      for (const tag of mod.tags) dest.add(tag);
    }
    const allTagSet = new Set([...prefixTagSet, ...suffixTagSet]);
    const toTargetTags = (s: Set<string>): TargetTag[] => [...s].map(tag => ({ tag, required: true }));

    onSubmit({
      itemClass: parsed.itemClass,
      requirements: {
        str: (parsed.requirements.str ?? 0) > 0,
        dex: (parsed.requirements.dex ?? 0) > 0,
        int: (parsed.requirements.int ?? 0) > 0,
      },
      targetTags: toTargetTags(allTagSet),
      prefixTargetTags: toTargetTags(prefixTagSet),
      suffixTargetTags: toTargetTags(suffixTagSet),
      sourceItem: parsed,
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
        In PoE, press <kbd style={{ background: 'var(--surface2)', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--border)' }}>Ctrl+Alt+C</kbd> over an item and paste below.
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste advanced item copy here..."
        rows={10}
        style={{
          width: '100%', padding: '8px 10px', borderRadius: 4,
          border: '1px solid var(--border)', background: 'var(--surface2)',
          color: 'var(--text)', fontFamily: 'monospace', fontSize: 12,
          resize: 'vertical', outline: 'none',
        }}
      />
      {error && <p style={{ color: '#f87171', fontSize: 12 }}>{error}</p>}
      <button onClick={handleSubmit} disabled={!text.trim()} style={primaryBtnStyle(!text.trim())}>
        Parse &amp; Optimize
      </button>
    </div>
  );
}

// ─── Manual tab ──────────────────────────────────────────────────────────────

function ManualTab({ onSubmit }: { onSubmit: (item: TargetItem) => void }) {
  const [slot, setSlot] = useState<string>(GEAR_SLOTS[0]);
  const [defenseType, setDefenseType] = useState<DefenseType>('Armour');
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [suffixes, setSuffixes] = useState<string[]>([]);
  const [validModIds, setValidModIds] = useState<Set<string> | null>(null);
  const [modsLoading, setModsLoading] = useState(true);

  const isArmourSlot = ARMOUR_SLOTS_SET.has(slot);

  // Rebuild valid-mod set from mods.json spawn_weights whenever slot or defense type changes.
  // loadMods() is cached after the first call — subsequent changes are near-instant.
  useEffect(() => {
    setModsLoading(true);
    const itemTags = getItemTags(slot as GearSlot, isArmourSlot ? defenseType : undefined);
    loadMods().then(mods => {
      const valid = new Set<string>();
      for (const mod of CURATED_MODS) {
        const modData = mods[mod.repoeModId];
        if (modData && getSpawnWeight(modData.spawn_weights, itemTags) > 0) {
          valid.add(mod.id);
        }
      }
      setPrefixes(p => p.filter(id => valid.has(id)));
      setSuffixes(s => s.filter(id => valid.has(id)));
      setValidModIds(valid);
      setModsLoading(false);
    }).catch(() => {
      setModsLoading(false);
    });
  }, [slot, defenseType, isArmourSlot]);

  function addMod(modType: 'prefix' | 'suffix', id: string) {
    if (modType === 'prefix') setPrefixes(p => [...p, id]);
    else setSuffixes(s => [...s, id]);
  }

  function removeMod(modType: 'prefix' | 'suffix', id: string) {
    if (modType === 'prefix') setPrefixes(p => p.filter(x => x !== id));
    else setSuffixes(s => s.filter(x => x !== id));
  }

  function handleSubmit() {
    const prefixTagSet = new Set<string>();
    const suffixTagSet = new Set<string>();
    let hasNoTagPrefix = false;
    let hasNoTagSuffix = false;
    for (const id of prefixes) {
      const mod = CURATED_MODS.find(m => m.id === id);
      if (!mod) continue;
      if (mod.tags.length === 0) hasNoTagPrefix = true;
      else mod.tags.forEach(t => prefixTagSet.add(t));
    }
    for (const id of suffixes) {
      const mod = CURATED_MODS.find(m => m.id === id);
      if (!mod) continue;
      if (mod.tags.length === 0) hasNoTagSuffix = true;
      else mod.tags.forEach(t => suffixTagSet.add(t));
    }
    const allTagSet = new Set([...prefixTagSet, ...suffixTagSet]);
    const toTargetTags = (s: Set<string>): TargetTag[] => [...s].map(tag => ({ tag, required: true }));
    const requirements = isArmourSlot ? DEFENSE_TO_REQS[defenseType] : { str: false, dex: false, int: false };
    onSubmit({
      itemClass: slot, requirements,
      targetTags: toTargetTags(allTagSet),
      prefixTargetTags: toTargetTags(prefixTagSet),
      suffixTargetTags: toTargetTags(suffixTagSet),
      noTagMods: { prefix: hasNoTagPrefix, suffix: hasNoTagSuffix },
    });
  }

  const canSubmit = prefixes.length + suffixes.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Slot */}
      <div>
        <Label>Gear Slot</Label>
        <select value={slot} onChange={e => setSlot(e.target.value)} style={selectStyle}>
          {GEAR_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Defense type — armour slots only */}
      {isArmourSlot && (
        <div>
          <Label>Defense Type</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
            {DEFENSE_OPTIONS.map(dt => {
              const active = defenseType === dt;
              return (
                <button
                  key={dt}
                  onClick={() => setDefenseType(dt)}
                  style={{
                    padding: '4px 10px', borderRadius: 12, fontSize: 12, cursor: 'pointer',
                    border: '1px solid',
                    borderColor: active ? 'var(--gold)' : 'var(--border)',
                    background: active ? 'var(--node-recommended)' : 'var(--surface2)',
                    color: active ? 'var(--gold)' : 'var(--text-dim)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {dt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Prefixes */}
      <ModSection
        label="Prefixes"
        modType="prefix"
        selected={prefixes}
        validModIds={validModIds}
        loading={modsLoading}
        onAdd={id => addMod('prefix', id)}
        onRemove={id => removeMod('prefix', id)}
      />

      {/* Suffixes */}
      <ModSection
        label="Suffixes"
        modType="suffix"
        selected={suffixes}
        validModIds={validModIds}
        loading={modsLoading}
        onAdd={id => addMod('suffix', id)}
        onRemove={id => removeMod('suffix', id)}
      />

      <button onClick={handleSubmit} disabled={!canSubmit} style={primaryBtnStyle(!canSubmit)}>
        Optimize Tree
      </button>
    </div>
  );
}

function ModSection({
  label, modType, selected, validModIds, loading, onAdd, onRemove,
}: {
  label: string;
  modType: CuratedMod['modType'];
  selected: string[];
  validModIds: Set<string> | null;
  loading: boolean;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const options = validModIds
    ? CURATED_MODS.filter(m => m.modType === modType && !selected.includes(m.id) && validModIds.has(m.id))
    : [];
  const canAdd = selected.length < 3;

  return (
    <div>
      <Label>
        {label}{' '}
        <span style={{ fontWeight: 400, color: 'var(--text-dim)', textTransform: 'none', letterSpacing: 0 }}>
          ({selected.length}/3)
        </span>
      </Label>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
          {selected.map(id => {
            const mod = CURATED_MODS.find(m => m.id === id);
            return (
              <span
                key={id}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 8px 3px 10px', borderRadius: 12, fontSize: 12,
                  border: '1px solid var(--gold)', background: 'var(--node-recommended)',
                  color: 'var(--gold)',
                }}
              >
                {mod?.displayName}
                <button
                  onClick={() => onRemove(id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--gold)', fontSize: 13, lineHeight: 1, padding: 0,
                    opacity: 0.7,
                  }}
                >×</button>
              </span>
            );
          })}
        </div>
      )}

      {loading && (
        <p style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>Loading mods…</p>
      )}

      {!loading && canAdd && options.length > 0 && (
        <ModSearch
          options={options}
          placeholder={`Search ${label.toLowerCase()}…`}
          onSelect={onAdd}
        />
      )}

      {!loading && canAdd && options.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>
          No more {label.toLowerCase()} available for this slot.
        </p>
      )}
    </div>
  );
}

function ModSearch({
  options, placeholder, onSelect,
}: {
  options: CuratedMod[];
  placeholder: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = query.trim()
    ? options.filter(m => m.displayName.toLowerCase().includes(query.toLowerCase()))
    : options;

  function pick(id: string) {
    onSelect(id);
    setQuery('');
    setOpen(false);
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{
          ...selectStyle,
          outline: open ? '1px solid var(--border)' : 'none',
        }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderTop: 'none', borderRadius: '0 0 4px 4px',
          maxHeight: 200, overflowY: 'auto',
        }}>
          {filtered.map(m => (
            <div
              key={m.id}
              onMouseDown={() => pick(m.id)}
              style={{
                padding: '6px 10px', fontSize: 13, cursor: 'pointer',
                color: 'var(--text)',
                borderBottom: '1px solid var(--border)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {m.displayName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Item preview ─────────────────────────────────────────────────────────────

function ItemPreview({ item }: { item: TargetItem }) {
  return (
    <div style={{
      border: '1px solid var(--gold-dim)', borderRadius: 4,
      background: 'var(--surface2)', padding: '10px 12px',
    }}>
      <p style={{ color: 'var(--rare)', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
        {item.sourceItem?.name ?? item.itemClass}
        {item.sourceItem && <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}> — {item.sourceItem.baseType}</span>}
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>
        Target tags: {item.targetTags.map(t => t.tag).join(', ')}
      </p>
      {item.sourceItem && (
        <div style={{ fontSize: 12, color: 'var(--text)' }}>
          {item.sourceItem.explicits.map((m, i) => (
            <div key={i} style={{ padding: '2px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                {m.type} T{m.tier} [{m.tags.join(', ')}]
              </span>
              <br />{m.stat}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{children}</p>;
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px', borderRadius: 4,
  border: '1px solid var(--border)', background: 'var(--surface2)',
  color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer',
};

const primaryBtnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '8px 16px', borderRadius: 4, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
  background: disabled ? 'var(--border)' : 'var(--gold)',
  color: disabled ? 'var(--text-dim)' : '#0d0d10',
  fontWeight: 700, fontSize: 13, letterSpacing: '0.03em',
  opacity: disabled ? 0.5 : 1,
});
