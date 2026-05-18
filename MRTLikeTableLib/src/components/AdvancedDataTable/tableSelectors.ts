import type { ADTTableState } from './types/types';

export const selectPagination = (state: ADTTableState) => state.pagination;
export const selectSorting = (state: ADTTableState) => state.sorting;
export const selectColumnFilters = (state: ADTTableState) => state.columnFilters;
export const selectGlobalFilter = (state: ADTTableState) => state.globalFilter;
export const selectColumnVisibility = (state: ADTTableState) => state.columnVisibility;
export const selectColumnOrder = (state: ADTTableState) => state.columnOrder;
export const selectColumnPinning = (state: ADTTableState) => state.columnPinning;
export const selectColumnSizing = (state: ADTTableState) => state.columnSizing;
export const selectGrouping = (state: ADTTableState) => state.grouping;
export const selectDensity = (state: ADTTableState) => state.density;
export const selectExpanded = (state: ADTTableState) => state.expanded;
export const selectRowSelection = (state: ADTTableState) => state.rowSelection;
