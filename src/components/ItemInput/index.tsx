import { useState } from 'react';
import { parseAdvancedCopy } from '../../lib/item-parser';
import { useAppStore } from '../../store/app-store';
import { BOOSTABLE_TAGS, GEAR_SLOTS } from '../../data/genesis-tree';
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

    const targetTags: TargetTag[] = [];
    const seen = new Set<string>();
    for (const mod of parsed.explicits) {
      for (const tag of mod.tags) {
        if (!seen.has(tag)) {
          seen.add(tag);
          targetTags.push({ tag, required: true });
        }
      }
    }

    onSubmit({
      itemClass: parsed.itemClass,
      requirements: {
        str: (parsed.requirements.str ?? 0) > 0,
        dex: (parsed.requirements.dex ?? 0) > 0,
        int: (parsed.requirements.int ?? 0) > 0,
      },
      targetTags,
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
  const [reqStr, setReqStr] = useState(false);
  const [reqDex, setReqDex] = useState(false);
  const [reqInt, setReqInt] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  function toggleTag(tag: string) {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  }

  function handleSubmit() {
    const targetTags: TargetTag[] = [...selectedTags].map(tag => ({ tag, required: true }));
    onSubmit({
      itemClass: slot,
      requirements: { str: reqStr, dex: reqDex, int: reqInt },
      targetTags,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label>Gear Slot</Label>
        <select
          value={slot}
          onChange={e => setSlot(e.target.value)}
          style={selectStyle}
        >
          {GEAR_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <Label>Attribute Requirements (determines armor sub-type)</Label>
        <div className="flex gap-3 mt-1">
          {(['str', 'dex', 'int'] as const).map(attr => {
            const checked = attr === 'str' ? reqStr : attr === 'dex' ? reqDex : reqInt;
            const setter  = attr === 'str' ? setReqStr : attr === 'dex' ? setReqDex : setReqInt;
            const label   = attr === 'str' ? 'Strength (Armour)' : attr === 'dex' ? 'Dexterity (Evasion)' : 'Intelligence (ES)';
            return (
              <label key={attr} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
                <input type="checkbox" checked={checked} onChange={e => setter(e.target.checked)}
                  style={{ accentColor: 'var(--gold)', width: 14, height: 14 }} />
                {label}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Desired Mod Tags</Label>
        <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, marginBottom: 6 }}>
          Select the mod categories you want to land on the item.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {BOOSTABLE_TAGS.map(tag => {
            const active = selectedTags.has(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  padding: '4px 10px', borderRadius: 12, fontSize: 12, cursor: 'pointer',
                  border: '1px solid',
                  borderColor: active ? 'var(--gold)' : 'var(--border)',
                  background: active ? 'var(--node-recommended)' : 'var(--surface2)',
                  color: active ? 'var(--gold)' : 'var(--text-dim)',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.1s',
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={handleSubmit} disabled={selectedTags.size === 0} style={primaryBtnStyle(selectedTags.size === 0)}>
        Optimize Tree
      </button>
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
