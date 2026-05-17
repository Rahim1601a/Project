import { useReducer, useMemo, useEffect, useState } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  useReactTable,
} from '@tanstack/react-table';
import type { AdvancedDataTableProps, ADTMeta, AdvancedDataTableValidationErrors } from '../types/types';
import { tableReducer, initialState } from '../tableState';
import { filterFnByVariant } from '../utils/filters';
import { useColumns } from './useColumns';

export function useAdvancedDataTable<T extends object>(props: AdvancedDataTableProps<T>) {
  const {
    data = [],
    columns: userColumns,
    manualPagination,
    manualSorting,
    manualFiltering,
    manualGrouping,
    rowCount,
    getSubRows,
    enableEditing,
    onRowSave,
    validateRow,
    isStorage,
    storageKey = 'adt_state',
    enableRowNumbers,
    enableExpanding,
    renderDetailPanel,
    actionMode = 'inline',
    renderRowActions,
    renderRowActionMenuItems,
    enableRowSelection,
    displayColumnDefOptions,
  } = props;

  const [state, dispatch] = useReducer(tableReducer, props, (p) => {
    const baseState = {
      ...initialState,
      density: p.initialDensity ?? 'comfortable',
    };

    if (p.isStorage) {
      try {
        const saved = localStorage.getItem(p.storageKey ?? 'adt_state');
        if (saved) {
          return { ...baseState, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.error('Failed to parse saved table state', e);
      }
    }
    return baseState;
  });

  // Persistence Sync
  useEffect(() => {
    if (!isStorage) return;
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, isStorage, storageKey]);

  const columns = useColumns({
    columns: userColumns,
    enableRowNumbers,
    enableExpanding,
    renderDetailPanel,
    actionMode,
    renderRowActions,
    renderRowActionMenuItems,
    enableEditing,
    enableRowSelection,
    displayColumnDefOptions,
  });

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [rowErrors, setRowErrors] = useState<AdvancedDataTableValidationErrors<T>>({});

  const meta = useMemo<ADTMeta<T>>(
    () => ({
      onRowSave,
      validateRow,
      enableEditing,
      editingRowId,
      setEditingRowId,
      editValues,
      setEditValues,
      rowErrors,
      setRowErrors,
      filterOptions: props.filterOptions,
    }),
    [onRowSave, validateRow, enableEditing, editingRowId, editValues, rowErrors, props.filterOptions],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination: state.pagination,
      sorting: state.sorting,
      columnFilters: state.columnFilters,
      globalFilter: state.globalFilter,
      columnVisibility: state.columnVisibility,
      columnOrder: state.columnOrder,
      columnPinning: state.columnPinning,
      columnSizing: state.columnSizing,
      grouping: state.grouping,
      expanded: state.expanded,
      rowSelection: state.rowSelection,
    },
    onPaginationChange: (updater) => dispatch({ type: 'SET_PAGINATION', payload: updater as any }),
    onSortingChange: (updater) => dispatch({ type: 'SET_SORTING', payload: updater as any }),
    onColumnFiltersChange: (updater) => dispatch({ type: 'SET_COLUMN_FILTERS', payload: updater as any }),
    onGlobalFilterChange: (updater) => dispatch({ type: 'SET_GLOBAL_FILTER', payload: updater as any }),
    onColumnVisibilityChange: (updater) => dispatch({ type: 'SET_COLUMN_VISIBILITY', payload: updater as any }),
    onColumnOrderChange: (updater) => dispatch({ type: 'SET_COLUMN_ORDER', payload: updater as any }),
    onColumnPinningChange: (updater) => dispatch({ type: 'SET_COLUMN_PINNING', payload: updater as any }),
    onColumnSizingChange: (updater) => dispatch({ type: 'SET_COLUMN_SIZING', payload: updater as any }),
    onGroupingChange: (updater) => dispatch({ type: 'SET_GROUPING', payload: updater as any }),
    onExpandedChange: (updater) => dispatch({ type: 'SET_EXPANDED', payload: updater as any }),
    onRowSelectionChange: (updater) => dispatch({ type: 'SET_ROW_SELECTION', payload: updater as any }),

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),

    manualPagination,
    manualSorting,
    manualFiltering,
    manualGrouping,
    rowCount: manualPagination ? rowCount : data.length,
    getSubRows,

    defaultColumn: useMemo(
      () => ({
        minSize: 40,
        size: 150,
        maxSize: 1000,
        filterFn: filterFnByVariant.text,
      }),
      [],
    ),

    meta,

    autoResetPageIndex: false,
    enableColumnResizing: true,
    columnResizeMode: props.columnResizeMode ?? 'onChange',
  });

  return {
    table,
    state,
    dispatch,
  };
}
