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
import type { ADTDensity } from '../types/types';

const SCHEMA_VERSION = 3;

export interface PersistenceAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const localStorageAdapter: PersistenceAdapter = {
  getItem: (key) => (typeof window !== 'undefined' ? localStorage.getItem(key) : null),
  setItem: (key, value) => {
    if (typeof window !== 'undefined') localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (typeof window !== 'undefined') localStorage.removeItem(key);
  },
};

export interface TablePersistenceState {
  _version?: number;
  pagination?: PaginationState;
  sorting?: SortingState;
  columnVisibility?: VisibilityState;
  columnOrder?: ColumnOrderState;
  columnPinning?: ColumnPinningState;
  columnSizing?: ColumnSizingState;
  grouping?: GroupingState;
  density?: ADTDensity;
}

export interface UseTableStateOptions {
  adapter?: PersistenceAdapter;
  enabled?: boolean;
  onStateChange?: (state: TablePersistenceState) => void;
  initialDensity?: ADTDensity;
}

const DEFAULT_PAGINATION: PaginationState = { pageIndex: 0, pageSize: 10 };
const DEFAULT_PINNING: ColumnPinningState = { left: ['__select__'], right: ['__actions__'] };

export function useTableState(storageKey: string, options?: UseTableStateOptions) {
  const adapter = options?.adapter ?? localStorageAdapter;
  const onStateChange = options?.onStateChange;
  const enabled = options?.enabled ?? false;
  const DEFAULT_DENSITY: ADTDensity = options?.initialDensity ?? 'compact';

  const [initialData] = useState<TablePersistenceState>(() => {
    if (!enabled) return {};
    const raw = adapter.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed._version !== SCHEMA_VERSION) {
          adapter.removeItem(storageKey);
          return {};
        }
        return parsed as TablePersistenceState;
      } catch (e) {
        console.error(`Failed to parse table state for ${storageKey}`, e);
      }
    }
    return {};
  });

  const [pagination, setPagination] = useState<PaginationState>(initialData.pagination ?? DEFAULT_PAGINATION);
  const [sorting, setSorting] = useState<SortingState>(initialData.sorting ?? []);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [globalFilter, _setGlobalFilter] = useState('');
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('');

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialData.columnVisibility ?? {});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(initialData.columnOrder ?? []);
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(initialData.columnPinning ?? DEFAULT_PINNING);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(initialData.columnSizing ?? {});
  const [grouping, setGrouping] = useState<GroupingState>(initialData.grouping ?? []);
  const [density, setDensity] = useState<ADTDensity>(initialData.density ?? DEFAULT_DENSITY);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
    }, 300);
    return () => clearTimeout(handler);
  }, [globalFilter]);

  useEffect(() => {
    if (!enabled) return;
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
  }, [
    storageKey,
    adapter,
    enabled,
    onStateChange,
    pagination,
    sorting,
    columnVisibility,
    columnOrder,
    columnPinning,
    columnSizing,
    grouping,
    density,
  ]);

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
    if (enabled) {
      adapter.removeItem(storageKey);
    }
  }, [storageKey, adapter, enabled, DEFAULT_DENSITY]);

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
