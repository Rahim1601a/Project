import { useState, useEffect, useCallback } from 'react';
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ColumnOrderState,
  ColumnPinningState,
  GroupingState,
} from '@tanstack/react-table';

export interface TablePersistenceState {
  pagination?: PaginationState;
  sorting?: SortingState;
  columnVisibility?: VisibilityState;
  columnOrder?: ColumnOrderState;
  columnPinning?: ColumnPinningState;
  grouping?: GroupingState;
  density?: 'small' | 'medium' | 'large';
}

export function useTableState(storageKey: string) {
  // 1. Load initial state from LocalStorage ONCE
  const [initialData] = useState<TablePersistenceState>(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Schema validation / fallback
        return {
          pagination: parsed.pagination,
          sorting: parsed.sorting,
          columnVisibility: parsed.columnVisibility,
          columnOrder: parsed.columnOrder,
          columnPinning: parsed.columnPinning,
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
  const [pagination, setPagination] = useState<PaginationState>(initialData.pagination ?? { pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>(initialData.sorting ?? []);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]); // NEVER persist

  // Global filter with internal state for immediate UI feedback
  const [globalFilter, _setGlobalFilter] = useState('');
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('');

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialData.columnVisibility ?? {});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(initialData.columnOrder ?? []);
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(
    initialData.columnPinning ?? { left: ['__select__', '__actions__'], right: [] },
  );
  const [grouping, setGrouping] = useState<GroupingState>(initialData.grouping ?? []);
  const [density, setDensity] = useState<'small' | 'medium' | 'large'>(initialData.density ?? 'small');

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
      pagination,
      sorting,
      columnVisibility,
      columnOrder,
      columnPinning,
      grouping,
      density,
    };
    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
  }, [storageKey, pagination, sorting, columnVisibility, columnOrder, columnPinning, grouping, density]);

  const resetState = useCallback(() => {
    setPagination({ pageIndex: 0, pageSize: 10 });
    setSorting([]);
    setColumnFilters([]);
    _setGlobalFilter('');
    setColumnVisibility({});
    setColumnOrder([]);
    setColumnPinning({ left: ['__select__', '__actions__'], right: [] });
    setGrouping([]);
    setDensity('small');
    localStorage.removeItem(storageKey);
  }, [storageKey]);

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
    resetState,
  };
}
