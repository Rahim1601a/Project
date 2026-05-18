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
import type { AdvancedDataTableProps, ADTMeta, AdvancedDataTableValidationErrors, ADTTableState } from '../types/types';
import { tableReducer, initialState } from '../tableState';
import { filterFnByVariant } from '../utils/filters';
import { useColumns } from './useColumns';

function getDefaultColumnPinning<T extends object>(props: AdvancedDataTableProps<T>) {
  const leftPinned: string[] = [];
  const rightPinned: string[] = [];

  if (props.enableRowSelection) {
    leftPinned.push('__select__');
  }

  if (props.enableExpanding || props.renderDetailPanel) {
    leftPinned.push('__expand__');
  }

  if (props.enableRowNumbers) {
    leftPinned.push('__row_numbers__');
  }

  if ((props.actionMode ?? 'inline') !== 'none') {
    rightPinned.push('__actions__');
  }

  return {
    left: leftPinned,
    right: rightPinned,
  };
}

function mergeUniqueColumns(requiredColumns: string[], savedColumns?: string[]) {
  return Array.from(new Set([...requiredColumns, ...(savedColumns ?? [])]));
}

function buildInitialTableState<T extends object>(props: AdvancedDataTableProps<T>): ADTTableState {
  const defaultPinning = getDefaultColumnPinning(props);

  const baseState: ADTTableState = {
    ...initialState,
    density: props.initialDensity ?? 'comfortable',
    columnPinning: defaultPinning,
  };

  if (!props.isStorage) {
    return baseState;
  }

  try {
    const saved = localStorage.getItem(props.storageKey ?? 'adt_state');

    if (!saved) {
      return baseState;
    }

    const parsed = JSON.parse(saved);

    return {
      ...baseState,
      ...parsed,
      columnPinning: {
        left: mergeUniqueColumns(defaultPinning.left, parsed.columnPinning?.left),
        right: mergeUniqueColumns(defaultPinning.right, parsed.columnPinning?.right),
      },
    };
  } catch (error) {
    console.error('Failed to parse saved table state', error);
    return baseState;
  }
}

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

  const [state, dispatch] = useReducer(tableReducer, props, buildInitialTableState);

  useEffect(() => {
    if (!isStorage) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save table state', error);
    }
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
    [onRowSave, validateRow, enableEditing, editingRowId, editValues, rowErrors, props.filterOptions]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination: props.state?.pagination ?? state.pagination,
      sorting: props.state?.sorting ?? state.sorting,
      columnFilters: props.state?.columnFilters ?? state.columnFilters,
      globalFilter: props.state?.globalFilter ?? state.globalFilter,
      columnVisibility: props.state?.columnVisibility ?? state.columnVisibility,
      columnOrder: props.state?.columnOrder ?? state.columnOrder,
      columnPinning: props.state?.columnPinning ?? state.columnPinning,
      columnSizing: props.state?.columnSizing ?? state.columnSizing,
      grouping: props.state?.grouping ?? state.grouping,
      expanded: props.state?.expanded ?? state.expanded,
      rowSelection: props.state?.rowSelection ?? state.rowSelection,
    },
    onPaginationChange: (updater) => {
      if (props.onPaginationChange) {
        props.onPaginationChange(updater);
      }
      dispatch({ type: 'SET_PAGINATION', payload: updater as any });
    },
    onSortingChange: (updater) => {
      if (props.onSortingChange) {
        props.onSortingChange(updater);
      }
      dispatch({ type: 'SET_SORTING', payload: updater as any });
    },
    onColumnFiltersChange: (updater) => {
      if (props.onColumnFiltersChange) {
        props.onColumnFiltersChange(updater);
      }
      dispatch({ type: 'SET_COLUMN_FILTERS', payload: updater as any });
    },
    onGlobalFilterChange: (updater) => {
      if (props.onGlobalFilterChange) {
        props.onGlobalFilterChange(updater);
      }
      dispatch({ type: 'SET_GLOBAL_FILTER', payload: updater as any });
    },
    onColumnVisibilityChange: (updater) => {
      dispatch({ type: 'SET_COLUMN_VISIBILITY', payload: updater as any });
    },
    onColumnOrderChange: (updater) => {
      dispatch({ type: 'SET_COLUMN_ORDER', payload: updater as any });
    },
    onColumnPinningChange: (updater) => {
      dispatch({ type: 'SET_COLUMN_PINNING', payload: updater as any });
    },
    onColumnSizingChange: (updater) => {
      dispatch({ type: 'SET_COLUMN_SIZING', payload: updater as any });
    },
    onGroupingChange: (updater) => {
      dispatch({ type: 'SET_GROUPING', payload: updater as any });
    },
    onExpandedChange: (updater) => {
      dispatch({ type: 'SET_EXPANDED', payload: updater as any });
    },
    onRowSelectionChange: (updater) => {
      dispatch({ type: 'SET_ROW_SELECTION', payload: updater as any });
    },

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
    getRowCanExpand: renderDetailPanel ? () => true : undefined,

    defaultColumn: useMemo(
      () => ({
        minSize: 80,
        size: 150,
        maxSize: 1000,
        filterFn: filterFnByVariant.text,
        enableGrouping: true,
      }),
      []
    ),

    meta,

    autoResetPageIndex: false,
    enableColumnResizing: true,
    columnResizeMode: props.columnResizeMode ?? 'onChange',
    enableGrouping: props.enableGrouping ?? false,
  });

  return {
    table,
    state,
    dispatch,
  };
}
