import ItemInput from './components/ItemInput';
import GenesisTree from './components/GenesisTree';
import Results from './components/Results';
import { useAppStore } from './store/app-store';

export default function App() {
  const { pointBudget, setPointBudget, dataState, loadData } = useAppStore();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface)',
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.05em', margin: 0 }}>
            Tree of Breaching
          </h1>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: 0 }}>
            Genesis Tree optimizer · Path of Exile 3.28
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Data load status */}
          {dataState === 'idle' && (
            <button onClick={loadData} style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
              border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-dim)',
            }}>Load mod data</button>
          )}
          {dataState === 'loading' && <span style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>Loading data…</span>}
          {dataState === 'ready'   && <span style={{ fontSize: 11, color: '#86efac' }}>● Mod data ready</span>}
          {dataState === 'error'   && <span style={{ fontSize: 11, color: '#f87171' }}>● Data error</span>}

          <label style={{ fontSize: 12, color: 'var(--text-dim)' }}>Point Budget</label>
          <input
            type="number"
            min={1}
            max={60}
            value={pointBudget}
            onChange={e => setPointBudget(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
            style={{
              width: 56, padding: '4px 8px', borderRadius: 4,
              border: '1px solid var(--border)', background: 'var(--surface2)',
              color: 'var(--gold)', fontSize: 14, fontWeight: 700,
              textAlign: 'center', outline: 'none',
            }}
          />
        </div>
      </header>

      {/* Main layout */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '340px 1fr',
        gridTemplateRows: '1fr auto',
        gap: 0,
        overflow: 'hidden',
      }}>
        {/* Left sidebar */}
        <div style={{
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}>
          <Section title="Target Item">
            <ItemInput />
          </Section>

          <div style={{ borderTop: '1px solid var(--border)' }}>
            <Section title="Recommended Allocation">
              <Results />
            </Section>
          </div>
        </div>

        {/* Tree visualization */}
        <div style={{ padding: 16, overflowY: 'auto' }}>
          <GenesisTree />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '14px 16px' }}>
      <p style={{
        fontSize: 10, fontWeight: 700, color: 'var(--text-dim)',
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
        borderBottom: '1px solid var(--border)', paddingBottom: 6,
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}
