import React from 'react';

import type { ColumnDef, PaginationState, SortingState, ColumnFiltersState } from '@tanstack/react-table';

/* =========================================================
   Column Definition
========================================================= */

export type AdvancedDataTableColumnDef<T extends object> = ColumnDef<T, unknown> & {
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
};

/* =========================================================
   Table Props
========================================================= */

export type AdvancedDataTableProps<T extends object> = {
  columns: AdvancedDataTableColumnDef<T>[];
  data?: T[];

  loading?: boolean;
  rowCount?: number;

  manualMode?: boolean;
  fetchData?: (params: { pagination: PaginationState; sorting: SortingState; columnFilters: ColumnFiltersState; globalFilter: string }) => void;

  actionMode?: 'none' | 'inline' | 'menu';
  renderRowActions?: (row: T) => React.ReactNode;
  renderRowActionMenuItems?: (row: T, closeMenu: () => void) => React.ReactNode;

  onRowSave?: (row: T, values: Record<string, any>) => Promise<void> | void;

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

  renderDetailPanel?: (props: { row: T }) => React.ReactNode;

  renderTopToolbarCustomActions?: (table: any) => React.ReactNode;
  renderBottomToolbarCustomActions?: (table: any) => React.ReactNode;

  storageKey?: string;
  title?: string;

  validateRow?: (values: Record<string, any>, row: T) => AdvancedDataTableValidationErrors<T> | Promise<AdvancedDataTableValidationErrors<T>>;

  onExport?: (params: {
    type: 'csv' | 'xlsx' | 'pdf';
    selectionMode: 'all' | 'page' | 'selected';
    sorting: SortingState;
    columnFilters: ColumnFiltersState;
    globalFilter: string;
    selectedRowIds: string[];
  }) => Promise<void>;

  /** Dynamic filter options by column accessor key */
  filterOptions?: Record<string, Array<string | { label?: string; value: any }>>;
};

/* =========================================================
   Editing + Validation Types
========================================================= */

export type AdvancedDataTableValidationErrors<T extends object> = Partial<Record<keyof T, string>> | null;

export type AdvancedDataTableMeta<T extends object> = {
  editingRowId?: string | null;
  setEditingRowId?: (id: string | null) => void;

  editValues?: Record<string, any>;
  setEditValues?: React.Dispatch<React.SetStateAction<Record<string, any>>>;

  rowErrors?: AdvancedDataTableValidationErrors<T>;
  setRowErrors?: React.Dispatch<React.SetStateAction<AdvancedDataTableValidationErrors<T>>>;

  validateRow?: (values: Record<string, any>, row: T) => AdvancedDataTableValidationErrors<T> | Promise<AdvancedDataTableValidationErrors<T>>;
};
