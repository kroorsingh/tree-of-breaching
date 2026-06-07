import { create } from 'zustand';
import type { TargetItem, OptimizationResult, NodeId } from '../data/types';
import { optimize } from '../lib/optimizer';
import { loadAll } from '../lib/repoe-loader';
import { buildModPool, calcTagProbabilities, getItemTags } from '../lib/mod-pool';
import type { TagProbability } from '../lib/mod-pool';
import type { ModsDB, BaseItemsDB } from '../lib/repoe-loader';

type DataState = 'idle' | 'loading' | 'ready' | 'error';

interface AppState {
  targetItem: TargetItem | null;
  pointBudget: number;
  result: OptimizationResult | null;
  tagProbabilities: TagProbability[];
  pinnedNodes: Set<NodeId>;

  // RePoE data
  dataState: DataState;
  dataError: string | null;
  modsDB: ModsDB | null;
  baseItemsDB: BaseItemsDB | null;

  setTargetItem: (item: TargetItem) => void;
  setPointBudget: (n: number) => void;
  togglePin: (id: NodeId) => void;
  clearTarget: () => void;
  loadData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  targetItem: null,
  pointBudget: 20,
  result: null,
  tagProbabilities: [],
  pinnedNodes: new Set(),
  dataState: 'idle',
  dataError: null,
  modsDB: null,
  baseItemsDB: null,

  loadData: async () => {
    const { dataState } = get();
    if (dataState === 'loading' || dataState === 'ready') return;
    set({ dataState: 'loading', dataError: null });
    try {
      const { mods, baseItems } = await loadAll();
      set({ modsDB: mods, baseItemsDB: baseItems, dataState: 'ready' });
      // Re-run optimizer with full data if target is set
      const { targetItem, pointBudget } = get();
      if (targetItem) runOptimizer(targetItem, pointBudget, mods, baseItems, set);
    } catch (e) {
      set({ dataState: 'error', dataError: String(e) });
    }
  },

  setTargetItem: (item) => {
    set({ targetItem: item });
    const { pointBudget, modsDB, baseItemsDB } = get();
    runOptimizer(item, pointBudget, modsDB, baseItemsDB, set);
    // Kick off data load if not started
    const { dataState } = get();
    if (dataState === 'idle') get().loadData();
  },

  setPointBudget: (n) => {
    set({ pointBudget: n });
    const { targetItem, modsDB, baseItemsDB } = get();
    if (targetItem) runOptimizer(targetItem, n, modsDB, baseItemsDB, set);
  },

  togglePin: (id) => {
    const pins = new Set(get().pinnedNodes);
    if (pins.has(id)) pins.delete(id); else pins.add(id);
    set({ pinnedNodes: pins });
  },

  clearTarget: () => set({ targetItem: null, result: null, tagProbabilities: [] }),
}));

function runOptimizer(
  item: TargetItem,
  budget: number,
  mods: ModsDB | null,
  baseItems: BaseItemsDB | null,
  set: (s: Partial<AppState>) => void,
) {
  const result = optimize(item, budget);
  let tagProbabilities: TagProbability[] = [];

  if (mods && baseItems && item.targetTags.length > 0) {
    const itemTags = getItemTags(
      baseItems,
      item.sourceItem?.baseType ?? '',
      item.sourceItem?.itemClass ?? item.itemClass,
    );
    const pool = buildModPool(mods, itemTags, result.allocation, item.sourceItem?.itemLevel ?? 100);
    tagProbabilities = calcTagProbabilities(pool, item.targetTags.map(t => t.tag));
  }

  set({ result, tagProbabilities });
}
