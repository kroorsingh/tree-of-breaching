import { useEffect } from 'react';

interface Props {
  onClose: () => void;
}

export default function AboutPanel({ onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '28px 32px', maxWidth: 560, width: '90%',
          maxHeight: '85vh', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2 style={{ color: 'var(--gold)', fontSize: 16, fontWeight: 700, letterSpacing: '0.05em' }}>
            About Tree of Breaching
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-dim)', fontSize: 18, lineHeight: 1, padding: '0 2px',
            }}
          >
            ✕
          </button>
        </div>

        <Section title="How optimization works">
          <p>
            The optimizer scores every candidate node across three dimensions, then picks the best
            value-per-point until the budget runs out. Cluster rules (one satellite per hub) are
            enforced throughout.
          </p>

          <p style={{ marginTop: 14, fontWeight: 600, color: 'var(--text)' }}>1 — Mod tag nodes (Devoted / Forsaken)</p>
          <p style={{ marginTop: 6 }}>
            Every mod has a <em>spawn weight</em> and a set of tags. Devoted nodes multiply
            the weight of all mods sharing a tag; Forsaken nodes shrink it. The tool scores
            each node by how much it shifts the joint probability of landing <em>all</em> your
            desired mods:
          </p>
          <pre style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 4, padding: '10px 14px', fontSize: 12,
            color: 'var(--text)', overflowX: 'auto', margin: '10px 0',
          }}>
{`score = (M−1) × (n_desired_with_tag − n_desired_total × tag_pool_share)`}
          </pre>
          <p>
            Prefix and suffix pools are scored separately — a node that inflates an unwanted
            prefix pool gets penalised even if it helps a suffix you want.
          </p>

          <p style={{ marginTop: 14, fontWeight: 600, color: 'var(--text)' }}>2 — Base type nodes (Less / More Str / Dex / Int items)</p>
          <p style={{ marginTop: 6 }}>
            Genesis draws from a global pool of ~610 base items. Nodes like "Less Strength Items"
            cut the weight of strength-requirement bases (≈37% of the pool), increasing the
            relative probability of the base type you actually want. The tool scores these using
            the exact log-probability change, since the multipliers are large (0.15× or 4×).
          </p>
          <p style={{ marginTop: 6 }}>
            For items with no attribute requirements (rings, amulets, belts, jewels), all three
            "Less X Items" nodes are typically recommended — removing attribute-gated bases
            raises the chance of generating the target slot significantly.
          </p>

          <p style={{ marginTop: 14, fontWeight: 600, color: 'var(--text)' }}>3 — Gear type nodes (Gloves, Helmet, Ring, etc.)</p>
          <p style={{ marginTop: 6 }}>
            These nodes multiply the weight of an entire item class within the Genesis pool.
            G4 "Gloves" (51×) scores far higher than any mod tag node when you're targeting
            gloves, so the optimizer will always pick the matching slot node first — competing
            against a fair per-point comparison with the mod tag nodes.
          </p>
        </Section>

        <Section title="Data attribution">
          <p>
            Mod pool data (spawn weights, tag lists, base item tags) comes from{' '}
            <a
              href="https://github.com/lvlvllvlvllvlvl/RePoE"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--gold)', textDecoration: 'underline' }}
            >
              RePoE
            </a>
            , a community project that extracts and formats Path of Exile game data
            into machine-readable JSON. Huge thanks to the RePoE contributors — this
            tool wouldn't be possible without their work.
          </p>
          <p style={{ marginTop: 8 }}>
            Genesis tree structure is based on publicly available 3.28 patch data.
          </p>
        </Section>

        <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'right' }}>
          Press <kbd style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 3, padding: '1px 5px', fontSize: 11,
          }}>Esc</kbd> or click outside to close
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{
        fontSize: 10, fontWeight: 700, color: 'var(--text-dim)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        borderBottom: '1px solid var(--border)', paddingBottom: 6, marginBottom: 10,
      }}>
        {title}
      </p>
      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}
