import { create } from 'zustand';
import type { TargetItem, OptimizationResult, NodeId } from '../data/types';
import { optimize } from '../lib/optimizer';
import { loadAll } from '../lib/repoe-loader';
import { buildModPool, computePoolContext, calcTagProbabilities, getItemTags } from '../lib/mod-pool';
import type { TagProbability } from '../lib/mod-pool';
import type { ModsDB, BaseItemsDB } from '../lib/repoe-loader';

type DataState = 'idle' | 'loading' | 'ready' | 'error';

interface AppState {
  targetItem: TargetItem | null;
  pointBudget: number;
  result: OptimizationResult | null;
  tagProbabilities: TagProbability[];
  /** Pool share of no-tag desired suffix mods in the optimized suffix pool (0 if none) */
  noTagSuffixShare: number;
  /** Pool share of no-tag desired prefix mods in the optimized prefix pool (0 if none) */
  noTagPrefixShare: number;
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
  noTagSuffixShare: 0,
  noTagPrefixShare: 0,
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

  clearTarget: () => set({ targetItem: null, result: null, tagProbabilities: [], noTagSuffixShare: 0, noTagPrefixShare: 0 }),
}));

function runOptimizer(
  item: TargetItem,
  budget: number,
  mods: ModsDB | null,
  baseItems: BaseItemsDB | null,
  set: (s: Partial<AppState>) => void,
) {
  const itemLevel = item.sourceItem?.itemLevel ?? 100;
  let tagProbabilities: TagProbability[] = [];
  let noTagSuffixShare = 0;
  let noTagPrefixShare = 0;

  if (mods && baseItems) {
    const itemTags = getItemTags(
      baseItems,
      item.sourceItem?.baseType ?? '',
      item.sourceItem?.itemClass ?? item.itemClass,
    );

    const ctx = computePoolContext(mods, itemTags, item, itemLevel);
    const result = optimize(item, budget, ctx);

    const needsPool = item.targetTags.length > 0 || item.noTagMods?.suffix || item.noTagMods?.prefix;
    if (needsPool) {
      const pool = buildModPool(mods, itemTags, result.allocation, itemLevel);
      if (item.targetTags.length > 0) {
        tagProbabilities = calcTagProbabilities(pool, item.targetTags.map(t => t.tag));
      }
      if (item.noTagMods?.suffix && ctx.untaggedDesiredSuffixBase > 0) {
        noTagSuffixShare = pool.suffixTotal > 0
          ? ctx.untaggedDesiredSuffixBase / pool.suffixTotal
          : 0;
      }
      if (item.noTagMods?.prefix && ctx.untaggedDesiredPrefixBase > 0) {
        noTagPrefixShare = pool.prefixTotal > 0
          ? ctx.untaggedDesiredPrefixBase / pool.prefixTotal
          : 0;
      }
    }

    set({ result, tagProbabilities, noTagSuffixShare, noTagPrefixShare });
  } else {
    // Heuristic run before data is loaded
    const result = optimize(item, budget);
    set({ result, tagProbabilities: [], noTagSuffixShare: 0, noTagPrefixShare: 0 });
  }
}
