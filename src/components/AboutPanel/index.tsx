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
              <strong>Scores the rest</strong> — the goal is to maximise the joint probability of landing{' '}
              <em>all</em> the mods you specified. This is equivalent to maximising the sum of log(pool share)
              for each desired mod. For each optional node, the tool computes the gradient of that objective:
              <pre style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 4, padding: '10px 14px', fontSize: 12,
                color: 'var(--text)', overflowX: 'auto', margin: '10px 0',
              }}>
{`score = (M−1) × (n_desired_with_tag − n_desired_total × tag_pool_share)`}
              </pre>
              Breaking down the terms:
              <ul style={{ paddingLeft: 18, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li><strong>M</strong> — the node's multiplier (e.g. 1.06 for +6% Devoted, 0.4 for −60% Forsaken)</li>
                <li><strong>n_desired_with_tag</strong> — how many of your specified mods carry this tag</li>
                <li><strong>n_desired_total</strong> — total number of your specified mods (in this pool)</li>
                <li><strong>tag_pool_share</strong> — fraction of the full mod pool occupied by this tag (wanted mods + unwanted mods combined)</li>
              </ul>
              <p style={{ marginTop: 8 }}>
                Scoring by count rather than spawn weight is intentional: the tag's pool share already encodes
                rarity, so weighting by individual mod weight would double-count it in the wrong direction
                (favouring common mods when rarer ones need more help).
              </p>
              <p style={{ marginTop: 8 }}>
                Prefix and suffix pools are scored <em>separately and simultaneously</em>. A node that helps
                one of your suffix mods but grows a pool of unwanted prefix mods gets penalised for the prefix
                side — so the tool won't suggest "attack modifier chance" just because Attack Speed has the
                attack tag, if you haven't asked for any attack prefixes.
              </p>
              <p style={{ marginTop: 8 }}>
                Positive score: the node shifts the item's overall hit probability up.{' '}
                Negative: it would make things worse (not recommended).
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
