import type { ADTTableState, ADTDensity } from './types/types';
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  GroupingState,
  ExpandedState,
  Updater,
} from '@tanstack/react-table';

export type ADTAction =
  | { type: 'SET_PAGINATION'; payload: Updater<PaginationState> }
  | { type: 'SET_SORTING'; payload: Updater<SortingState> }
  | { type: 'SET_COLUMN_FILTERS'; payload: Updater<ColumnFiltersState> }
  | { type: 'SET_GLOBAL_FILTER'; payload: string }
  | { type: 'SET_COLUMN_VISIBILITY'; payload: Updater<VisibilityState> }
  | { type: 'SET_COLUMN_ORDER'; payload: Updater<ColumnOrderState> }
  | { type: 'SET_COLUMN_PINNING'; payload: Updater<ColumnPinningState> }
  | { type: 'SET_COLUMN_SIZING'; payload: Updater<ColumnSizingState> }
  | { type: 'SET_GROUPING'; payload: Updater<GroupingState> }
  | { type: 'SET_DENSITY'; payload: ADTDensity }
  | { type: 'SET_EXPANDED'; payload: Updater<ExpandedState> }
  | { type: 'SET_ROW_SELECTION'; payload: Updater<Record<string, boolean>> }
  | { type: 'RESET_STATE'; payload: ADTTableState };

export const initialState: ADTTableState = {
  pagination: { pageIndex: 0, pageSize: 10 },
  sorting: [],
  columnFilters: [],
  globalFilter: '',
  columnVisibility: {},
  columnOrder: [],
  columnPinning: { left: [], right: [] },
  columnSizing: {},
  grouping: [],
  density: 'comfortable',
  expanded: {},
  rowSelection: {},
};

function applyUpdater<T>(updater: Updater<T>, old: T): T {
  return typeof updater === 'function' ? (updater as Function)(old) : updater;
}

export function tableReducer(state: ADTTableState, action: ADTAction): ADTTableState {
  switch (action.type) {
    case 'SET_PAGINATION':
      return { ...state, pagination: applyUpdater(action.payload, state.pagination) };
    case 'SET_SORTING':
      return { ...state, sorting: applyUpdater(action.payload, state.sorting) };
    case 'SET_COLUMN_FILTERS':
      return { ...state, columnFilters: applyUpdater(action.payload, state.columnFilters) };
    case 'SET_GLOBAL_FILTER':
      return { ...state, globalFilter: action.payload };
    case 'SET_COLUMN_VISIBILITY':
      return { ...state, columnVisibility: applyUpdater(action.payload, state.columnVisibility) };
    case 'SET_COLUMN_ORDER':
      return { ...state, columnOrder: applyUpdater(action.payload, state.columnOrder) };
    case 'SET_COLUMN_PINNING':
      return { ...state, columnPinning: applyUpdater(action.payload, state.columnPinning) };
    case 'SET_COLUMN_SIZING':
      return { ...state, columnSizing: applyUpdater(action.payload, state.columnSizing) };
    case 'SET_GROUPING':
      return { ...state, grouping: applyUpdater(action.payload, state.grouping) };
    case 'SET_DENSITY':
      return { ...state, density: action.payload };
    case 'SET_EXPANDED':
      return { ...state, expanded: applyUpdater(action.payload, state.expanded) };
    case 'SET_ROW_SELECTION':
      return { ...state, rowSelection: applyUpdater(action.payload, state.rowSelection) };
    case 'RESET_STATE':
      return action.payload;
    default:
      return state;
  }
}
