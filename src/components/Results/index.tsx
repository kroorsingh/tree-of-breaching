import { useAppStore } from '../../store/app-store';
import { NODE_MAP } from '../../data/genesis-tree';

export default function Results() {
  const { result, targetItem, pointBudget, tagProbabilities, noTagSuffixShare, noTagPrefixShare, dataState } = useAppStore();

  if (!result || !targetItem) {
    return (
      <div style={{ padding: '20px 0', color: 'var(--text-dim)', fontSize: 13, textAlign: 'center' }}>
        Import or build an item to see the optimal tree allocation.
      </div>
    );
  }

  const desiredTags = new Set(targetItem.targetTags.map(t => t.tag));
  const unusedPoints = pointBudget - result.pointsUsed;
  const hasNoTagTarget = targetItem.noTagMods?.suffix || targetItem.noTagMods?.prefix;

  return (
    <div className="flex flex-col gap-3">
      {/* Score header */}
      <div style={{
        background: 'var(--surface2)', border: '1px solid var(--gold-dim)',
        borderRadius: 4, padding: '10px 14px',
      }}>
        <p style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
          Allocation Summary
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>
            {result.breakdown.length} node{result.breakdown.length !== 1 ? 's' : ''} recommended
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            {result.pointsUsed}/{pointBudget} pts
            {unusedPoints > 0 && ` · ${unusedPoints} unspent`}
          </span>
        </div>
        <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.5 }}>
          These nodes give you the best odds of hitting your target mods when rolling the item.
          Exact per-mod odds are shown in <strong style={{ color: 'var(--text)' }}>Mod Pool Shares</strong> below.
        </p>
        <p style={{ fontSize: 10, color: 'var(--text-dim)', opacity: 0.5, marginTop: 3 }}>
          Efficiency score: {result.score.toFixed(3)}
        </p>
      </div>

      {/* Per-tag pool shares */}
      {tagProbabilities.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Mod Pool Shares
          </p>
          <div className="flex flex-col gap-1">
            {tagProbabilities.map(tp => (
              <div key={tp.displayTag} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 80, fontSize: 12, color: 'var(--text)', flexShrink: 0 }}>{tp.displayTag}</span>
                <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 2, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(tp.poolShare * 100, 100).toFixed(1)}%`,
                    height: '100%',
                    background: tp.poolShare > 0.1 ? 'var(--gold)' : '#4a9fe8',
                    transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{ width: 44, fontSize: 11, color: 'var(--text-dim)', textAlign: 'right', flexShrink: 0 }}>
                  {(tp.poolShare * 100).toFixed(1)}%
                </span>
                <span style={{ width: 44, fontSize: 11, color: tp.prob3Rolls > 0.5 ? '#86efac' : 'var(--text-dim)', textAlign: 'right', flexShrink: 0 }}>
                  {(tp.prob3Rolls * 100).toFixed(0)}%↑
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
            Pool share = fraction of affix pool. ↑ = P(at least 1 hit in 3 rolls).
          </p>
        </div>
      )}

      {/* No-tag target probability */}
      {hasNoTagTarget && (noTagSuffixShare > 0 || noTagPrefixShare > 0) && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            No-Tag Target Pool Share
          </p>
          <div className="flex flex-col gap-1">
            {noTagSuffixShare > 0 && (
              <NoTagRow label="Suffix (e.g. Suppress)" share={noTagSuffixShare} />
            )}
            {noTagPrefixShare > 0 && (
              <NoTagRow label="Prefix (no-tag)" share={noTagPrefixShare} />
            )}
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
            Share of the affix pool occupied by untagged desired mods after tree optimization.
            Optimizer forsook high-weight competing tags to maximize this.
          </p>
        </div>
      )}

      {hasNoTagTarget && noTagSuffixShare === 0 && noTagPrefixShare === 0 && dataState === 'loading' && (
        <p style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
          Loading mod database for no-tag probability data…
        </p>
      )}

      {dataState === 'loading' && !hasNoTagTarget && tagProbabilities.length === 0 && (
        <p style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
          Loading mod database for probability data…
        </p>
      )}
      {dataState === 'error' && (
        <p style={{ fontSize: 11, color: '#f87171' }}>
          Could not load mod data. Check that public/data/mods.json exists.
        </p>
      )}

      {/* Recommended nodes */}
      {result.breakdown.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Recommended Nodes
          </p>
          <div className="flex flex-col gap-1">
            {result.breakdown
              .sort((a, b) => b.contribution - a.contribution)
              .map(({ nodeId, nodeName, contribution }) => {
                const node = NODE_MAP.get(nodeId);
                const effect = node?.effects.find(e => e.category === 'modTag');
                const tag = effect?.tag;
                const isDevoted = (effect?.value ?? 1) > 1;
                const isForsaken = (effect?.value ?? 1) < 1;
                const isDesiredTag = tag ? desiredTags.has(tag) : false;
                const isForsakenForNoTag = isForsaken && hasNoTagTarget && !isDesiredTag;
                const highlight = isDevoted && isDesiredTag
                  ? 'devoted'
                  : isForsakenForNoTag
                  ? 'forsaken'
                  : 'neutral';

                return (
                  <div key={nodeId} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px', borderRadius: 4,
                    background: highlight === 'devoted'
                      ? 'var(--node-recommended)'
                      : highlight === 'forsaken'
                      ? 'rgba(74,159,232,0.08)'
                      : 'var(--surface2)',
                    border: `1px solid ${
                      highlight === 'devoted' ? 'var(--gold-dim)'
                      : highlight === 'forsaken' ? 'rgba(74,159,232,0.4)'
                      : 'var(--border)'}`,
                  }}>
                    <NodeBadge id={nodeId} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{nodeName}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {node?.description}
                      </p>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>
                        +{contribution.toFixed(5)}
                      </span>
                      {isForsakenForNoTag && (
                        <p style={{ fontSize: 10, color: '#4a9fe8', marginTop: 1 }}>pool↓</p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {result.breakdown.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>
          {hasNoTagTarget
            ? 'No forsake nodes improve pool share within budget. Try increasing the point budget.'
            : 'No modTag nodes score positively for the selected targets.'}
        </p>
      )}

      <AllocationSummary allocation={result.allocation} desiredTags={desiredTags} />
    </div>
  );
}

function NoTagRow({ label, share }: { label: string; share: number }) {
  const prob3 = 1 - Math.pow(1 - share, 3);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 140, fontSize: 12, color: 'var(--text)', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 2, height: 8, overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(share * 100, 100).toFixed(1)}%`,
          height: '100%',
          background: '#4a9fe8',
          transition: 'width 0.3s',
        }} />
      </div>
      <span style={{ width: 44, fontSize: 11, color: 'var(--text-dim)', textAlign: 'right', flexShrink: 0 }}>
        {(share * 100).toFixed(1)}%
      </span>
      <span style={{ width: 44, fontSize: 11, color: prob3 > 0.5 ? '#86efac' : 'var(--text-dim)', textAlign: 'right', flexShrink: 0 }}>
        {(prob3 * 100).toFixed(0)}%↑
      </span>
    </div>
  );
}

function NodeBadge({ id }: { id: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      background: 'var(--gold-dim)', color: 'var(--gold)',
      fontSize: 11, fontWeight: 700,
    }}>
      {id}
    </span>
  );
}

function AllocationSummary({ allocation, desiredTags }: { allocation: string[]; desiredTags: Set<string> }) {
  const lines: string[] = [];
  for (const id of allocation) {
    const node = NODE_MAP.get(id);
    if (!node) continue;
    for (const effect of node.effects) {
      if (effect.category === 'modTag' && effect.tag) {
        const dir = effect.value > 1
          ? `+${Math.round((effect.value - 1) * 100)}% increased`
          : `-${Math.round((1 - effect.value) * 100)}% reduced`;
        const mark = desiredTags.has(effect.tag) ? '✓' : '';
        lines.push(`${mark} ${dir} ${effect.tag} [${id}]`);
      }
    }
  }
  if (lines.length === 0) return null;
  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        All Active Modifiers
      </p>
      <pre style={{
        fontSize: 11, color: 'var(--text-dim)', background: 'var(--surface2)',
        border: '1px solid var(--border)', borderRadius: 4, padding: '8px 10px',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.8,
      }}>
        {lines.join('\n')}
      </pre>
    </div>
  );
}
