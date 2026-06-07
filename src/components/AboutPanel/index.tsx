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
            Every mod that can roll on an item has a <em>spawn weight</em> — a number that
            controls how likely it is to appear. The Genesis tree lets you tilt those weights
            with two node types:
          </p>
          <ul style={{ paddingLeft: 18, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li><strong style={{ color: 'var(--gold)' }}>Devoted</strong> nodes increase the spawn weight of mods with a specific tag (e.g. life, fire, speed)</li>
            <li><strong style={{ color: '#f87171' }}>Forsaken</strong> nodes decrease it</li>
          </ul>
          <p style={{ marginTop: 8 }}>
            By boosting the tags you want (and suppressing ones you don't), you shift the pool in your favour.
          </p>

          <p style={{ marginTop: 14, fontWeight: 600, color: 'var(--text)' }}>What the tool does</p>

          <ol style={{ paddingLeft: 18, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li>
              <strong>Locks required nodes</strong> — based on your item's slot and attributes, certain nodes
              are mandatory (e.g. the armour hub for body armours, the Strength gate for Str-only items).
              These are always included first.
            </li>
            <li>
              <strong>Scores the rest</strong> — for each optional node, the tool calculates how much it
              moves the needle on your desired mods, using real spawn-weight numbers from the game data:
              <pre style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 4, padding: '10px 14px', fontSize: 12,
                color: 'var(--text)', overflowX: 'auto', margin: '10px 0',
              }}>
{`ΔP = (M−1) × (desired_tag_weight × total − desired_total × tag_weight) / total²`}
              </pre>
              This is the exact rate of change in your hit probability as the node's multiplier M is applied.
              Breaking down the terms:
              <ul style={{ paddingLeft: 18, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li><strong>M</strong> — the node's multiplier (e.g. 1.5 for a +50% Devoted node, 0.5 for a −50% Forsaken node)</li>
                <li><strong>desired_tag_weight</strong> — total spawn weight of your wanted mods that belong to this tag</li>
                <li><strong>total</strong> — total spawn weight of all mods competing for the slot</li>
                <li><strong>desired_total</strong> — total spawn weight of all your wanted mods</li>
                <li><strong>tag_weight</strong> — total spawn weight of all mods in this tag, wanted or not</li>
              </ul>
              <p style={{ marginTop: 8 }}>
                The key insight: a Devoted node helps when your desired mods are <em>concentrated</em> in
                that tag relative to the pool overall. A Forsaken node helps when they're <em>absent</em> from
                that tag — suppressing it clears out competition without hurting your targets.
              </p>
            </li>
            <li>
              <strong>Picks the best value</strong> — nodes are ranked by impact-per-point-spent and selected
              until the budget runs out. Cluster rules (you can only pick one satellite from each hub) are
              respected throughout.
            </li>
          </ol>

          <p style={{ marginTop: 10 }}>
            Before mod data is loaded, a simpler estimate is used: Devoted nodes on your target tags score
            by their multiplier strength, and Forsaken nodes on undesired tags get a smaller bonus.
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
