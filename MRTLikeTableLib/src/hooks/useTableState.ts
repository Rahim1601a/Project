import { useState, useEffect, useCallback } from 'react';
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  GroupingState,
} from '@tanstack/react-table';

/* =========================================================
   Schema Version — bump when adding/removing persisted fields
   to auto-clear stale localStorage data
 ========================================================= */
const SCHEMA_VERSION = 2;

/* =========================================================
   Persistence Adapter (Scalability)
   Default: localStorage. Override for sessionStorage,
   IndexedDB, server-side, or testing.
 ========================================================= */

export interface PersistenceAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const localStorageAdapter: PersistenceAdapter = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
};

/* =========================================================
   Types
 ========================================================= */

export interface TablePersistenceState {
  _version?: number;
  pagination?: PaginationState;
  sorting?: SortingState;
  columnVisibility?: VisibilityState;
  columnOrder?: ColumnOrderState;
  columnPinning?: ColumnPinningState;
  columnSizing?: ColumnSizingState;
  grouping?: GroupingState;
  density?: 'small' | 'medium' | 'large';
}

export interface UseTableStateOptions {
  /** Override the default localStorage persistence adapter */
  adapter?: PersistenceAdapter;
  /** Callback triggered whenever the persisted state changes */
  onStateChange?: (state: TablePersistenceState) => void;
}

/* =========================================================
   Constants
 ========================================================= */

const DEFAULT_PAGINATION: PaginationState = { pageIndex: 0, pageSize: 10 };
const DEFAULT_PINNING: ColumnPinningState = { left: ['__select__', '__actions__'], right: [] };
const DEFAULT_DENSITY: 'small' | 'medium' | 'large' = 'small';

/* =========================================================
   Hook
 ========================================================= */

export function useTableState(storageKey: string, options?: UseTableStateOptions) {
  const adapter = options?.adapter ?? localStorageAdapter;
  const onStateChange = options?.onStateChange;

  // 1. Load initial state from storage ONCE
  const [initialData] = useState<TablePersistenceState>(() => {
    const raw = adapter.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);

        // Schema version guard — clear stale data
        if (parsed._version !== SCHEMA_VERSION) {
          adapter.removeItem(storageKey);
          return {};
        }

        return {
          pagination: parsed.pagination,
          sorting: parsed.sorting,
          columnVisibility: parsed.columnVisibility,
          columnOrder: parsed.columnOrder,
          columnPinning: parsed.columnPinning,
          columnSizing: parsed.columnSizing,
          grouping: parsed.grouping,
          density: parsed.density,
        };
      } catch (e) {
        console.error(`Failed to parse table state for ${storageKey}`, e);
      }
    }
    return {};
  });

  // 2. Initialize all states
  const [pagination, setPagination] = useState<PaginationState>(initialData.pagination ?? DEFAULT_PAGINATION);
  const [sorting, setSorting] = useState<SortingState>(initialData.sorting ?? []);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]); // NEVER persist

  // Global filter with internal state for immediate UI feedback
  const [globalFilter, _setGlobalFilter] = useState('');
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('');

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialData.columnVisibility ?? {});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(initialData.columnOrder ?? []);
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(
    initialData.columnPinning ?? DEFAULT_PINNING,
  );
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(initialData.columnSizing ?? {});
  const [grouping, setGrouping] = useState<GroupingState>(initialData.grouping ?? []);
  const [density, setDensity] = useState<'small' | 'medium' | 'large'>(initialData.density ?? DEFAULT_DENSITY);

  // 3. Debounce Effect for Global Filter
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
    }, 300);
    return () => clearTimeout(handler);
  }, [globalFilter]);

  // 4. Persistence Effect (Excluding filters)
  useEffect(() => {
    const stateToSave: TablePersistenceState = {
      _version: SCHEMA_VERSION,
      pagination,
      sorting,
      columnVisibility,
      columnOrder,
      columnPinning,
      columnSizing,
      grouping,
      density,
    };
    adapter.setItem(storageKey, JSON.stringify(stateToSave));
    onStateChange?.(stateToSave);
  }, [storageKey, adapter, onStateChange, pagination, sorting, columnVisibility, columnOrder, columnPinning, columnSizing, grouping, density]);

  const resetState = useCallback(() => {
    setPagination(DEFAULT_PAGINATION);
    setSorting([]);
    setColumnFilters([]);
    _setGlobalFilter('');
    setDebouncedGlobalFilter('');
    setColumnVisibility({});
    setColumnOrder([]);
    setColumnPinning(DEFAULT_PINNING);
    setColumnSizing({});
    setGrouping([]);
    setDensity(DEFAULT_DENSITY);
    adapter.removeItem(storageKey);
  }, [storageKey, adapter]);

  return {
    pagination,
    setPagination,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    globalFilter,
    setGlobalFilter: _setGlobalFilter,
    debouncedGlobalFilter,
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    columnPinning,
    setColumnPinning,
    grouping,
    setGrouping,
    density,
    setDensity,
    columnSizing,
    setColumnSizing,
    resetState,
  };
}
