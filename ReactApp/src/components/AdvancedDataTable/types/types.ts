import type React from 'react';
import type {
  ColumnDef,
  PaginationState,
  SortingState,
  ColumnFiltersState,
  Row,
  Table,
  VisibilityState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  GroupingState,
  ExpandedState,
} from '@tanstack/react-table';

export type ADTDensity = 'compact' | 'comfortable' | 'spacious';

export type ADT_ColumnDef<T extends object> = ColumnDef<T, any> & {
  filterVariant?:
    | 'autocomplete'
    | 'checkbox'
    | 'date'
    | 'date-range'
    | 'datetime'
    | 'datetime-range'
    | 'multi-select'
    | 'range'
    | 'range-slider'
    | 'select'
    | 'text'
    | 'time'
    | 'time-range';
  multiSelectLogic?: 'AND' | 'OR';
  grow?: boolean | number;
  enableEditing?: boolean;
  enableClickToCopy?: boolean;
  muiTableHeadCellProps?: any;
  muiTableBodyCellProps?: any;
};

export interface AdvancedDataTableProps<T extends object> {
  columns: ADT_ColumnDef<T>[];
  data?: T[];

  loading?: boolean;
  rowCount?: number;
  manualPagination?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  manualGrouping?: boolean;
  fetchData?: (params: {
    pagination: PaginationState;
    sorting: SortingState;
    columnFilters: ColumnFiltersState;
    globalFilter: string;
    grouping: GroupingState;
  }) => void;

  enableGlobalFilter?: boolean;
  enableColumnFilters?: boolean;
  enableColumnOrdering?: boolean;
  enableColumnPinning?: boolean;
  enableDensity?: boolean;
  enableHiding?: boolean;
  enableFullScreen?: boolean;
  enableGrouping?: boolean;
  enableExpanding?: boolean;
  enableRowNumbers?: boolean;
  enableEditing?: boolean;
  enableColumnResizing?: boolean;
  enableClickToCopy?: boolean;
  enableRowSelection?: boolean;
  enableStickyHeader?: boolean;
  enableStickyFooter?: boolean;
  enableColumnFooters?: boolean;
  enableRowPinning?: boolean;
  enablePagination?: boolean;

  layoutMode?: 'grid' | 'grid-no-grow' | 'semantic';
  initialDensity?: ADTDensity;
  columnResizeMode?: 'onChange' | 'onEnd';
  actionMode?: 'none' | 'inline' | 'menu';

  renderRowActions?: (props: { row: Row<T>; table: Table<T> }) => React.ReactNode;
  renderRowActionMenuItems?: (props: { row: Row<T>; table: Table<T>; closeMenu: () => void }) => React.ReactNode;
  renderDetailPanel?: (props: { row: Row<T>; table: Table<T> }) => React.ReactNode;
  renderTopToolbarCustomActions?: (props: { table: Table<T> }) => React.ReactNode;
  renderBottomToolbarCustomActions?: (props: { table: Table<T> }) => React.ReactNode;

  onRowSelectionChange?: (rowSelection: Record<string, boolean>) => void;
  onRowSave?: (row: T, values: Record<string, any>) => Promise<void> | void;

  validateRow?: (values: Record<string, any>, row: T) => AdvancedDataTableValidationErrors<T> | Promise<AdvancedDataTableValidationErrors<T>>;

  onScrollEnd?: () => void;
  onExport?: (params: ADTExportParams) => Promise<void>;

  getSubRows?: (originalRow: T) => T[] | undefined;
  filterOptions?: Record<string, Array<string | { label?: string; value: any }>>;
  displayColumnDefOptions?: Record<string, Partial<ADT_ColumnDef<T>>>;

  isStorage?: boolean;
  storageKey?: string;
  title?: string;
}

export type ADTExportParams = {
  type: 'csv' | 'xlsx' | 'pdf';
  selectionMode: 'all' | 'page' | 'selected';
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  selectedRowIds: string[];
};

export type AdvancedDataTableValidationErrors<T extends object> = Partial<Record<keyof T, string>> | null;

export interface ADTTableState {
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  columnVisibility: VisibilityState;
  columnOrder: ColumnOrderState;
  columnPinning: ColumnPinningState;
  columnSizing: ColumnSizingState;
  grouping: GroupingState;
  density: ADTDensity;
  expanded: ExpandedState;
  rowSelection: Record<string, boolean>;
}

export type ADTMeta<T extends object> = {
  editingRowId?: string | null;
  setEditingRowId?: (id: string | null) => void;
  editValues?: Record<string, any>;
  setEditValues?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  rowErrors?: AdvancedDataTableValidationErrors<T>;
  setRowErrors?: React.Dispatch<React.SetStateAction<AdvancedDataTableValidationErrors<T>>>;
  onRowSave?: (row: T, values: Record<string, any>) => Promise<void> | void;
  validateRow?: (values: Record<string, any>, row: T) => AdvancedDataTableValidationErrors<T> | Promise<AdvancedDataTableValidationErrors<T>>;
  enableEditing?: boolean;
  filterOptions?: Record<string, Array<string | { label?: string; value: any }>>;
};
