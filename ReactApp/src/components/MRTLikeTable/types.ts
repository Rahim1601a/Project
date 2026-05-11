import type {
  ColumnDef,
  PaginationState,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';

/* =========================================================
   Column Definition
========================================================= */

export type MRTLikeColumnDef<T extends object> = ColumnDef<T, unknown> & {
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

export type MRTLikeTableProps<T extends object> = {
  columns: MRTLikeColumnDef<T>[];
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

  renderDetailPanel?: (props: { row: T }) => React.ReactNode;

  renderTopToolbarCustomActions?: (table: any) => React.ReactNode;
  renderBottomToolbarCustomActions?: (table: any) => React.ReactNode;

  storageKey?: string;
  title?: string;

  validateRow?: (values: Record<string, any>, row: T) => MRTValidationErrors<T> | Promise<MRTValidationErrors<T>>;

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

export type MRTValidationErrors<T extends object> = Partial<Record<keyof T, string>> | null;

export type MRTLikeTableMeta<T extends object> = {
  editingRowId?: string | null;
  setEditingRowId?: (id: string | null) => void;

  editValues?: Record<string, any>;
  setEditValues?: React.Dispatch<React.SetStateAction<Record<string, any>>>;

  rowErrors?: MRTValidationErrors<T>;
  setRowErrors?: React.Dispatch<React.SetStateAction<MRTValidationErrors<T>>>;

  validateRow?: (values: Record<string, any>, row: T) => MRTValidationErrors<T> | Promise<MRTValidationErrors<T>>;
};
