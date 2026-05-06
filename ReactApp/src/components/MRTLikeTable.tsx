import React, { memo, useEffect, useMemo, useState, useRef } from 'react';

import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { useVirtualizer } from '@tanstack/react-virtual';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

import {
  Box,
  Checkbox,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  TablePagination,
  TextField,
  Tooltip,
  Typography,
  Divider,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  alpha,
  Skeleton,
} from '@mui/material';

import {
  DensitySmall,
  DensityMedium,
  DensityLarge,
  MoreVert,
  PushPin,
  Download,
  ViewColumn,
  Fullscreen,
  FullscreenExit,
  Search,
  FilterList,
  FilterListOff,
  Clear,
  KeyboardArrowDown,
  KeyboardArrowRight,
  ContentCopy,
  RestartAlt,
  ViewModule,
  Edit,
  Save,
  Cancel,
  PictureAsPdf,
  TableRows,
} from '@mui/icons-material';

import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent } from '@dnd-kit/core';

import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';

import { useTableState } from '../hooks/useTableState';

/* =========================================================
   Types
========================================================= */

export type MRTLikeTableProps<T extends object> = {
  columns: ColumnDef<T, unknown>[];
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
  enableClickToCopy?: boolean;
  enableRowNumbers?: boolean;
  enableEditing?: boolean;

  renderDetailPanel?: (props: { row: T }) => React.ReactNode;

  renderTopToolbarCustomActions?: (table: any) => React.ReactNode;
  renderBottomToolbarCustomActions?: (table: any) => React.ReactNode;

  storageKey?: string;
  title?: string;

  /* -------- NEW (Additive) -------- */

  validateRow?: (values: Record<string, any>, row: T) => MRTValidationErrors<T> | Promise<MRTValidationErrors<T>>;

  onExport?: (params: {
    type: 'csv' | 'xlsx' | 'pdf';
    selectionMode: 'all' | 'page' | 'selected';
    sorting: SortingState;
    columnFilters: ColumnFiltersState;
    globalFilter: string;
    selectedRowIds: string[];
  }) => Promise<void>;
};
/* =========================================================
   NEW: Editing + Validation Types (Additive)
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

/* =========================================================
   Helpers
========================================================= */

function exportCSV<T extends object>(rows: T[], table: any, file = 'export.csv') {
  const columns = table.getAllColumns().filter((c: any) => c.id !== '__actions__' && c.id !== '__select__');
  const header = columns.map((c: any) => (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id)).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c: any) => {
          const val = (row as any)[c.id] ?? '';
          return `"${val.toString().replace(/"/g, '""')}"`;
        })
        .join(','),
    )
    .join('\n');
  const blob = new Blob([`${header}\n${body}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', file);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportXLSX<T extends object>(rows: T[], table: any, file = 'export.xlsx') {
  const columns = table.getAllColumns().filter((c: any) => c.id !== '__actions__' && c.id !== '__select__');
  const header = columns.map((c: any) => (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id));

  let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">
<Worksheet ss:Name="Sheet1"><Table>`;

  xml += '<Row>';
  header.forEach((h: string) => {
    xml += `<Cell><Data ss:Type="String">${h}</Data></Cell>`;
  });
  xml += '</Row>';

  rows.forEach((row) => {
    xml += '<Row>';
    columns.forEach((c: any) => {
      const val = (row as any)[c.id] ?? '';
      xml += `<Cell><Data ss:Type="String">${val}</Data></Cell>`;
    });
    xml += '</Row>';
  });

  xml += '</Table></Worksheet></Workbook>';

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', file);
  link.click();
}

function exportPDF<T extends object>(rows: T[], table: any, file = 'export.pdf') {
  const columns = table.getAllColumns().filter((c: any) => c.id !== '__actions__' && c.id !== '__select__');
  const headers = columns.map((c: any) => (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id));
  const body = rows.map((row) => columns.map((c: any) => (row as any)[c.id] ?? ''));

  const doc = new jsPDF();
  autoTable(doc, {
    head: [headers],
    body: body,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [25, 118, 210] }, // Primary color
  });
  doc.save(file);
}

/* =========================================================
   Draggable Header
========================================================= */

const DraggableHeader = memo(function DraggableHeader({
  id,
  children,
  isSortable,
  isSorted,
  onSort,
}: {
  id: string;
  children: React.ReactNode;
  isSortable?: boolean;
  isSorted?: false | 'asc' | 'desc';
  onSort?: (event: unknown) => void;
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.5 : 1,
    whiteSpace: 'nowrap',
    fontWeight: 600,
  };

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Box
        component='span'
        onClick={isSortable ? onSort : undefined}
        sx={{
          cursor: isSortable ? 'pointer' : 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          '&:hover': isSortable ? { color: 'primary.main' } : {},
        }}
      >
        {children}
        {isSorted && (
          <Typography variant='caption' sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            {isSorted === 'asc' ? '↑' : '↓'}
          </Typography>
        )}
      </Box>
    </Box>
  );
});

/* =========================================================
   Resize Handle
========================================================= */

const ResizeHandle = memo(function ResizeHandle({ header }: { header: any }) {
  if (!header.column.getCanResize()) return null;

  return (
    <Box
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      sx={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: 4,
        height: '100%',
        cursor: 'col-resize',
        userSelect: 'none',
        '&:hover': {
          backgroundColor: 'primary.main',
          width: 6,
        },
        ...(header.column.getIsResizing() && {
          backgroundColor: 'primary.dark',
          width: 6,
        }),
      }}
    />
  );
});

/* =========================================================
   Row Action Menu
========================================================= */

const RowActionMenu = memo(function RowActionMenu({ row, render }: { row: any; render?: (row: any, close: () => void) => React.ReactNode }) {
  // const RowActionMenu = memo(function RowActionMenu<T>({ row, render }: { row: T; render?: (row: T, close: () => void) => React.ReactNode }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton size='small' onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreVert fontSize='small' />
      </IconButton>
      <Menu
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {render?.(row, () => setAnchor(null))}
      </Menu>
    </>
  );
});

/* =========================================================
   Column Filter UI
========================================================= */

const ColumnFilter = React.memo(function ColumnFilter({ column }: { column: any }) {
  if (!column.getCanFilter()) return null;

  const variant = column.columnDef.filterVariant ?? 'text';
  const columnFilterValue = column.getFilterValue();

  // Local state for debouncing input to prevent lag and focus loss
  const [localValue, setLocalValue] = React.useState(columnFilterValue);
  const lastPushedValue = React.useRef(columnFilterValue);

  // Sync external changes (e.g., clearing filters globally) to local state
  React.useEffect(() => {
    // Only sync if the incoming value is different from what we last pushed.
    // This prevents overwriting the user's current typing if a debounce just fired.
    if (JSON.stringify(columnFilterValue) !== JSON.stringify(lastPushedValue.current)) {
      setLocalValue(columnFilterValue);
      lastPushedValue.current = columnFilterValue;
    }
  }, [columnFilterValue]);

  // Debounce effect to apply filter after user stops typing
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      // Only set if different to prevent unnecessary re-renders
      if (JSON.stringify(localValue) !== JSON.stringify(columnFilterValue)) {
        lastPushedValue.current = localValue;
        column.setFilterValue(localValue);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [localValue, columnFilterValue, column]);

  // TEXT FILTER (MRT default)
  if (variant === 'text') {
    return (
      <TextField
        size='small'
        variant='outlined'
        value={(localValue as string) ?? ''}
        placeholder='Filter…'
        onChange={(e) => setLocalValue(e.target.value || undefined)}
        sx={{ width: '100%' }}
        slotProps={{
          input: {
            sx: { fontSize: '0.75rem', mt: 0.5 },
            startAdornment: (
              <InputAdornment position='start'>
                <Search sx={{ fontSize: '0.9rem', opacity: 0.5 }} />
              </InputAdornment>
            ),
            endAdornment: localValue ? (
              <InputAdornment position='end'>
                <IconButton size='small' onClick={() => setLocalValue(undefined)}>
                  <Clear fontSize='small' />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
      />
    );
  }

  // SELECT FILTER
  if (variant === 'select') {
    return (
      <TextField
        select
        size='small'
        value={(localValue as string) ?? ''}
        onChange={(e) => setLocalValue(e.target.value || undefined)}
        sx={{ mt: 0.5, width: '100%' }}
      >
        <MenuItem value=''>All</MenuItem>
        {column.columnDef.filterSelectOptions?.map((opt: string) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  // RANGE FILTER (NUMBER / DATE)
  if (variant === 'range') {
    const [min, max] = (localValue as [any, any]) ?? [];

    return (
      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, width: '100%' }}>
        <TextField
          size='small'
          placeholder='Min'
          type='number'
          value={min ?? ''}
          onChange={(e) => setLocalValue([e.target.value || undefined, max])}
          sx={{ width: '50%' }}
        />
        <TextField
          size='small'
          placeholder='Max'
          type='number'
          value={max ?? ''}
          onChange={(e) => setLocalValue([min, e.target.value || undefined])}
          sx={{ width: '50%' }}
        />
      </Box>
    );
  }

  return null;
});

/* =========================================================
   Memoized Table Components
========================================================= */

const MRTLikeTableCell = memo(function MRTLikeTableCell({
  cell,
  density,
  enableClickToCopy,
  isEditing,
}: {
  cell: any;
  density: string;
  isSelected?: boolean;
  enableClickToCopy?: boolean;
  isEditing?: boolean;
  onEditChange?: (columnId: string, value: any) => void;
  editValue?: any;
  columnSizing?: any;
}) {
  const isPinned = cell.column.getIsPinned();
  const isGrouped = cell.getIsGrouped();
  const isPlaceholder = cell.getIsPlaceholder();
  const isAggregated = cell.getIsAggregated();

  const handleCopy = () => {
    if (!enableClickToCopy || isEditing) return;
    const text = cell.getValue()?.toString() || '';
    navigator.clipboard.writeText(text);
  };

  const renderContent = () => {
    const tableMeta = (cell.getContext().table.options as any).meta;
    const editingRowId = tableMeta?.editingRowId;
    const isRowEditing = editingRowId === cell.row.id;

    if (
      isRowEditing &&
      !isGrouped &&
      !isPlaceholder &&
      !isAggregated &&
      cell.column.columnDef.enableEditing !== false &&
      !cell.column.id.startsWith('__')
    ) {
      const errorMessage = tableMeta?.rowErrors?.[cell.column.id];
      const currentEditValue = tableMeta.editValues?.[cell.column.id];
      return (
        <TextField
          variant='standard'
          value={currentEditValue ?? cell.getValue() ?? ''}
          error={Boolean(errorMessage)}
          helperText={errorMessage}
          onChange={(e) =>
            tableMeta.setEditValues((prev: any) => ({
              ...prev,
              [cell.column.id]: e.target.value,
            }))
          }
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              tableMeta.setEditingRowId(null);
              tableMeta.setEditValues({});
              tableMeta.setRowErrors?.(null);
            }
            if (e.key === 'Enter') {
              const validateAndSave = async () => {
                const errors = await tableMeta.validateRow?.(tableMeta.editValues, cell.row.original);

                if (errors && Object.keys(errors).length > 0) {
                  tableMeta.setRowErrors?.(errors);
                  return;
                }

                await tableMeta.onRowSave?.(cell.row.original, tableMeta.editValues);
                tableMeta.setEditingRowId(null);
                tableMeta.setEditValues({});
                tableMeta.setRowErrors?.(null);
              };
              validateAndSave();
            }
          }}
          fullWidth
          size='small'
        />
      );
    }

    if (isGrouped) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size='small'
            onClick={(e) => {
              e.stopPropagation();
              cell.row.getToggleExpandedHandler()();
            }}
            sx={{ p: 0 }}
          >
            {cell.row.getIsExpanded() ? <KeyboardArrowDown fontSize='small' /> : <KeyboardArrowRight fontSize='small' />}
          </IconButton>
          {flexRender(cell.column.columnDef.cell, cell.getContext())} ({cell.row.subRows?.length ?? 0})
        </Box>
      );
    }

    if (isAggregated) {
      return flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext());
    }

    if (isPlaceholder) return null;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
        {enableClickToCopy && <ContentCopy sx={{ fontSize: '0.8rem', opacity: 0.1 }} />}
      </Box>
    );
  };

  return (
    <Box
      role='cell'
      style={{
        width: cell.column.getSize(),
        minWidth: cell.column.getSize(),
        maxWidth: cell.column.getSize(),
        position: isPinned ? 'sticky' : 'relative',
        left: isPinned === 'left' ? cell.column.getStart('left') : undefined,
        right: isPinned === 'right' ? cell.column.getAfter('right') : undefined,
      }}
      sx={{
        p: density === 'small' ? '4px 8px' : density === 'medium' ? '8px 12px' : '12px 16px',
        zIndex: isPinned ? 2 : 1,
        backgroundColor: isPinned ? 'background.paper' : 'inherit',
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        flex: '0 0 auto',
        boxSizing: 'border-box',
        overflow: 'hidden',
        height: '100%',
        cursor: enableClickToCopy && !isEditing ? 'copy' : 'default',

        '&:hover': enableClickToCopy && !isEditing ? { bgcolor: alpha('#000', 0.02) } : {},
      }}
      onClick={handleCopy}
    >
      {renderContent()}
    </Box>
  );
});

const MRTLikeTableRow = memo(
  React.forwardRef(function MRTLikeTableRow(
    {
      row,
      density,
      isSelected,
      enableClickToCopy,
      editingRowId,
      editValues,
      onEditChange,
      style,
      columnSizing, // Used to trigger re-render
      renderDetailPanel,
      virtualIndex,
    }: {
      row: any;
      density: string;
      isSelected: boolean;
      enableClickToCopy?: boolean;
      editingRowId?: string | null;
      editValues?: Record<string, any>;
      onEditChange?: (columnId: string, value: any) => void;
      style?: React.CSSProperties;
      columnSizing?: any;
      renderDetailPanel?: (props: { row: any }) => React.ReactNode;
      virtualIndex: number;
    },
    ref: any,
  ) {
    const isEditing = editingRowId === row.id;

    return (
      <Box
        ref={ref}
        data-index={virtualIndex}
        role='row'
        style={style}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: 'max-content',
          minWidth: '100%',
          bgcolor: isEditing ? alpha('#000', 0.03) : row.getIsGrouped() ? alpha('#000', 0.02) : 'transparent',
          '&:hover': {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
          },
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ display: 'flex', width: 'max-content', minWidth: '100%' }}>
          {row.getVisibleCells().map((cell: any) => (
            <MRTLikeTableCell
              key={cell.id}
              cell={cell}
              density={density}
              enableClickToCopy={enableClickToCopy}
              isEditing={isEditing}
              editValue={isEditing ? editValues?.[cell.column.id] : undefined}
            />
          ))}
        </Box>

        {/* Detail Panel */}
        {renderDetailPanel && row.getIsExpanded() && (
          <Box sx={{ width: '100%', p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha('#000', 0.01) }}>
            {renderDetailPanel({ row: row.original })}
          </Box>
        )}
      </Box>
    );
  }),
);

const MRTLikeTableHeaderCell = memo(function MRTLikeTableHeaderCell({
  header,
  density,
  enableColumnOrdering,
  enableColumnPinning,
  enableGrouping,
  showFilters,
}: {
  header: any;
  density: string;
  enableColumnOrdering: boolean;
  enableColumnPinning: boolean;
  enableGrouping: boolean;
  showFilters: boolean;
  columnVisibility: VisibilityState;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  columnSizing: any;
}) {
  const isPinned = header.column.getIsPinned();
  const style: React.CSSProperties = {
    width: header.getSize(),
    position: isPinned ? 'sticky' : 'relative',
    left: isPinned === 'left' ? header.column.getStart('left') : undefined,
    right: isPinned === 'right' ? header.column.getAfter('right') : undefined,
    zIndex: isPinned ? 3 : 1,
    minWidth: header.getSize(),
    maxWidth: header.getSize(),
  };

  return (
    <Box
      role='columnheader'
      style={style}
      sx={{
        p: density === 'small' ? '4px 8px' : density === 'medium' ? '8px 12px' : '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flex: '0 0 auto',
        boxSizing: 'border-box',
        overflow: 'hidden',
        borderBottom: '2px solid',
        borderColor: 'divider',
        fontWeight: 'bold',

        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          {enableColumnOrdering && !header.column.id.startsWith('__') ? (
            <DraggableHeader
              id={header.id}
              isSortable={header.column.getCanSort()}
              isSorted={header.column.getIsSorted()}
              onSort={header.column.getToggleSortingHandler()}
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
            </DraggableHeader>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: header.column.getCanSort() ? 'pointer' : 'default',
                fontWeight: 600,
              }}
              onClick={header.column.getToggleSortingHandler()}
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
              {header.column.getIsSorted() && (
                <Typography variant='caption' color='primary'>
                  {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                </Typography>
              )}
            </Box>
          )}

          {enableGrouping && header.column.getCanGroup() && (
            <IconButton
              size='small'
              onClick={() => header.column.toggleGrouping()}
              sx={{
                ml: 0.5,
                opacity: header.column.getIsGrouped() ? 1 : 0.3,
                '&:hover': { opacity: 1 },
                color: header.column.getIsGrouped() ? 'primary.main' : 'inherit',
              }}
            >
              <ViewModule sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          )}

          {enableColumnPinning && !header.column.id.startsWith('__') && (
            <IconButton
              size='small'
              onClick={() => header.column.pin(header.column.getIsPinned() ? false : 'left')}
              sx={{
                ml: 'auto',
                opacity: header.column.getIsPinned() ? 1 : 0.3,
                '&:hover': { opacity: 1 },
              }}
            >
              <PushPin
                sx={{
                  fontSize: '0.9rem',
                  transform: header.column.getIsPinned() ? 'rotate(45deg)' : 'none',
                }}
              />
            </IconButton>
          )}
        </Box>

        {showFilters && header.column.getCanFilter() && <ColumnFilter column={header.column} />}
      </Box>
      <ResizeHandle header={header} />
    </Box>
  );
});

/* =========================================================
   Main Component
========================================================= */

function MRTLikeTableInner<T extends object>({
  columns,
  data = [],
  loading = false,
  rowCount = 0,
  manualMode = false,
  fetchData,

  actionMode = 'none',
  renderRowActions,
  renderRowActionMenuItems,

  enableGlobalFilter = true,
  enableColumnFilters = true,
  enableColumnOrdering = true,
  enableColumnPinning = true,
  enableHiding = true,
  enableFullScreen = true,
  enableGrouping = false,
  enableClickToCopy = false,
  enableRowNumbers = false,
  enableExpanding = false,
  enableEditing = false,
  renderDetailPanel,
  onRowSave,
  renderTopToolbarCustomActions,
  renderBottomToolbarCustomActions,
  storageKey = 'mrt-like-table',
  title,
  validateRow,
  onExport,
}: MRTLikeTableProps<T>) {
  /* ---------------- State (Centralized) ---------------- */

  const {
    pagination,
    setPagination,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    globalFilter,
    setGlobalFilter,
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
  } = useTableState(storageKey);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [rowErrors, setRowErrors] = useState<MRTValidationErrors<T>>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  /* ---------------- Server Fetch ---------------- */

  useEffect(() => {
    if (!manualMode || !fetchData) return;
    fetchData({ pagination, sorting, columnFilters, globalFilter: debouncedGlobalFilter });
  }, [manualMode, fetchData, pagination, sorting, columnFilters, debouncedGlobalFilter]);

  /* ---------------- Columns ---------------- */

  const finalColumns = useMemo<ColumnDef<T, unknown>[]>(() => {
    const cols: ColumnDef<T, unknown>[] = [];

    // Row Numbers
    if (enableRowNumbers) {
      cols.push({
        id: '__row_numbers__',
        header: '#',
        size: 50,
        enableSorting: false,
        enableColumnFilter: false,
        enableHiding: false,
        cell: ({ row }) => row.index + 1,
      });
    }

    // Detail Panel / Expand Column
    if (renderDetailPanel || enableExpanding) {
      cols.push({
        id: '__expand__',
        header: '',
        size: 50,
        enableSorting: false,
        enableColumnFilter: false,
        enableHiding: false,
        cell: ({ row }) => (
          <IconButton
            size='small'
            onClick={row.getToggleExpandedHandler()}
            sx={{ transform: row.getIsExpanded() ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <KeyboardArrowDown fontSize='small' />
          </IconButton>
        ),
      });
    }

    // Selection Column
    cols.push({
      id: '__select__',
      header: ({ table }) => {
        const isAllSelected = table.getIsAllRowsSelected();
        const isSomeSelected = table.getIsSomeRowsSelected();
        return (
          <Checkbox
            size='small'
            indeterminate={isSomeSelected && !isAllSelected}
            checked={isAllSelected}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        );
      },
      cell: ({ row }) => (
        <Checkbox size='small' checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} disabled={!row.getCanSelect()} />
      ),
      size: 48,
      enableSorting: false,
      enableColumnFilter: false,
      enableHiding: false,
    });

    // Actions Column
    if (actionMode !== 'none') {
      cols.push({
        id: '__actions__',
        header: 'Actions',
        size: 120,
        enableSorting: false,
        enableColumnFilter: false,
        enableHiding: false,
        cell: ({ row, table: t }) => {
          const meta = (t.options as any).meta;
          const isEditing = meta.editingRowId === row.id;

          if (isEditing) {
            return (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title='Save'>
                  <IconButton
                    size='small'
                    color='primary'
                    onClick={async () => {
                      const errors = await meta.validateRow?.(meta.editValues, row.original);

                      if (errors && Object.keys(errors).length > 0) {
                        meta.setRowErrors?.(errors);
                        return;
                      }

                      await meta.onRowSave?.(row.original, meta.editValues);
                      meta.setEditingRowId(null);
                      meta.setEditValues({});
                      meta.setRowErrors?.(null);
                    }}
                  >
                    <Save fontSize='small' />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Cancel'>
                  <IconButton
                    size='small'
                    color='error'
                    onClick={() => {
                      meta.setEditingRowId(null);
                      meta.setEditValues({});
                      meta.setRowErrors?.(null);
                    }}
                  >
                    <Cancel fontSize='small' />
                  </IconButton>
                </Tooltip>
              </Box>
            );
          }

          return (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {meta.enableEditing && (
                <Tooltip title='Edit'>
                  <IconButton
                    size='small'
                    onClick={() => {
                      meta.setEditingRowId(row.id);
                      meta.setEditValues({ ...row.original });
                    }}
                  >
                    <Edit fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
              {actionMode === 'inline' ? renderRowActions?.(row.original) : <RowActionMenu row={row.original} render={renderRowActionMenuItems} />}
            </Box>
          );
        },
      });
    }

    cols.push(...columns);
    return cols;
  }, [columns, actionMode, renderRowActions, renderRowActionMenuItems, enableRowNumbers, renderDetailPanel, enableExpanding]);

  /* ---------------- Table Instance ---------------- */

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: finalColumns,
    state: {
      pagination,
      sorting,
      columnFilters,
      globalFilter: debouncedGlobalFilter,
      columnVisibility,
      columnOrder,
      columnPinning,
      rowSelection,
      grouping,
      expanded,
    },
    defaultColumn: {
      minSize: 40,
      size: 150,
      maxSize: 1000,
      filterFn: 'includesString', // Default to string includes to avoid TanStack auto-guessing wrong types
    },
    enableRowSelection: (row) => !row.getIsGrouped(),
    getRowCanExpand: renderDetailPanel ? () => true : undefined,

    enableGrouping: true,
    manualPagination: manualMode,
    manualSorting: manualMode,
    manualFiltering: manualMode,
    rowCount: manualMode ? rowCount : data.length,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onRowSelectionChange: setRowSelection,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    columnResizeMode: 'onChange',
    globalFilterFn: 'includesString',

    meta: {
      editingRowId,
      setEditingRowId,
      editValues,
      setEditValues,
      onRowSave,
      enableEditing,
      validateRow,
      rowErrors,
      setRowErrors,
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    autoResetPageIndex: false,
  });

  /* ---------------- Handlers ---------------- */

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((old) => {
        const columnIds = old.length ? old : table.getAllLeafColumns().map((c) => c.id);
        const oldIndex = columnIds.indexOf(active.id as string);
        const newIndex = columnIds.indexOf(over.id as string);

        if (oldIndex === -1 || newIndex === -1) return old;
        return arrayMove(columnIds, oldIndex, newIndex);
      });
    }
  }, []);

  const toggleFullScreen = React.useCallback(() => {
    if (!isFullScreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullScreen(!isFullScreen);
  }, [isFullScreen]);

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);

  const selectedRowIds = Object.keys(rowSelection);

  const handleServerExport = (type: 'csv' | 'xlsx' | 'pdf', selectionMode: 'all' | 'page' | 'selected') => {
    onExport?.({
      type,
      selectionMode,
      sorting,
      columnFilters,
      globalFilter: debouncedGlobalFilter,
      selectedRowIds,
    });
  };

  /* ---------------- Virtualization ---------------- */

  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => (density === 'small' ? 37 : density === 'medium' ? 53 : 69),
    overscan: 10,
  });

  /* ---------------- Visibility Menu ---------------- */

  const [visibilityAnchor, setVisibilityAnchor] = useState<HTMLElement | null>(null);
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);

  /* ---------------- Render ---------------- */

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const sortableItems = React.useMemo(
    () => (table.getState().columnOrder.length ? table.getState().columnOrder : table.getAllLeafColumns().map((c) => c.id)),
    [table.getState().columnOrder, table.getAllLeafColumns()],
  );

  return (
    <Paper
      ref={containerRef}
      elevation={2}
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        ...(isFullScreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1300,
          borderRadius: 0,
        }),
      }}
    >
      {/* Top Toolbar */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {title && (
            <Typography variant='h6' sx={{ mr: 2 }}>
              {title}
            </Typography>
          )}
          {renderTopToolbarCustomActions?.(table)}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {enableGlobalFilter && (
            <TextField
              size='small'
              placeholder='Search...'
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Search fontSize='small' />
                    </InputAdornment>
                  ),
                  endAdornment: globalFilter ? (
                    <InputAdornment position='end'>
                      <IconButton size='small' onClick={() => setGlobalFilter('')}>
                        <Clear fontSize='small' />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
              sx={{ width: 250 }}
            />
          )}

          {enableColumnFilters && (
            <Tooltip title={showFilters ? 'Hide Filters' : 'Show Filters'}>
              <IconButton color={showFilters ? 'primary' : 'default'} onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? <FilterListOff /> : <FilterList />}
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title='Export Options'>
            <IconButton onClick={(e) => setExportAnchor(e.currentTarget)}>
              <Download />
            </IconButton>
          </Tooltip>

          {enableHiding && (
            <Tooltip title='View Settings'>
              <IconButton onClick={(e) => setVisibilityAnchor(e.currentTarget)}>
                <ViewColumn />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title='Reset Table'>
            <IconButton onClick={resetState} size='small'>
              <RestartAlt />
            </IconButton>
          </Tooltip>

          {enableFullScreen && (
            <Tooltip title='Toggle Fullscreen'>
              <IconButton onClick={toggleFullScreen}>{isFullScreen ? <FullscreenExit /> : <Fullscreen />}</IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Export Menu */}
      <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
        <MenuItem
          onClick={() => {
            setExportAnchor(null);
            if (manualMode && onExport) handleServerExport('csv', selectedRowIds.length ? 'selected' : 'all');
            else exportCSV(selectedRowIds.length ? selectedRows : rows.map((r) => r.original), table);
          }}
        >
          <ListItemIcon>
            <Download fontSize='small' />
          </ListItemIcon>
          <ListItemText>Export CSV</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setExportAnchor(null);
            if (manualMode && onExport) handleServerExport('xlsx', selectedRowIds.length ? 'selected' : 'all');
            else exportXLSX(selectedRowIds.length ? selectedRows : rows.map((r) => r.original), table);
          }}
        >
          <ListItemIcon>
            <TableRows fontSize='small' />
          </ListItemIcon>
          <ListItemText>Export Excel</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setExportAnchor(null);
            if (manualMode && onExport) handleServerExport('pdf', selectedRowIds.length ? 'selected' : 'all');
            else exportPDF(selectedRowIds.length ? selectedRows : rows.map((r) => r.original), table);
          }}
        >
          <ListItemIcon>
            <PictureAsPdf fontSize='small' />
          </ListItemIcon>
          <ListItemText>Export PDF</ListItemText>
        </MenuItem>
      </Menu>

      {/* Column Visibility Menu */}
      <Menu
        anchorEl={visibilityAnchor}
        open={Boolean(visibilityAnchor)}
        onClose={() => setVisibilityAnchor(null)}
        slotProps={{ paper: { sx: { maxHeight: 400, width: 250 } } }}
      >
        <Box
          sx={{
            p: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant='subtitle2' sx={{ px: 1 }}>
            Columns
          </Typography>
          <Box>
            <IconButton size='small' onClick={() => table.toggleAllColumnsVisible(true)}>
              <Typography variant='caption'>All</Typography>
            </IconButton>
            <IconButton size='small' onClick={() => table.toggleAllColumnsVisible(false)}>
              <Typography variant='caption'>None</Typography>
            </IconButton>
          </Box>
        </Box>
        <Divider />
        {table.getAllLeafColumns().map((column) => {
          if (column.id.startsWith('__')) return null;
          return (
            <MenuItem key={column.id} onClick={() => column.toggleVisibility()}>
              <ListItemIcon>
                <Checkbox size='small' checked={column.getIsVisible()} readOnly />
              </ListItemIcon>
              <ListItemText primary={column.columnDef.header as string} />
            </MenuItem>
          );
        })}
        <Divider />
        <Box sx={{ p: 1 }}>
          <Typography variant='caption' sx={{ px: 1, fontWeight: 'bold' }}>
            Density
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, px: 1 }}>
            <Tooltip title='Small'>
              <IconButton size='small' color={density === 'small' ? 'primary' : 'default'} onClick={() => setDensity('small')}>
                <DensitySmall fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Medium'>
              <IconButton size='small' color={density === 'medium' ? 'primary' : 'default'} onClick={() => setDensity('medium')}>
                <DensityMedium fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Large'>
              <IconButton size='small' color={density === 'large' ? 'primary' : 'default'} onClick={() => setDensity('large')}>
                <DensityLarge fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Menu>

      {/* Table Area */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableItems} strategy={horizontalListSortingStrategy}>
          <Box
            ref={tableContainerRef}
            sx={{
              flexGrow: 1,
              maxHeight: isFullScreen ? 'calc(100vh - 120px)' : 550,
              position: 'relative',
              overflow: 'auto',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                display: 'block',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                width: 'max-content',
                minWidth: '100%',
              }}
            >
              {table.getHeaderGroups().map((hg) => (
                <Box
                  key={hg.id}
                  sx={{
                    display: 'flex',
                    width: 'max-content',
                    minWidth: '100%',
                  }}
                >
                  {hg.headers.map((header) => (
                    <MRTLikeTableHeaderCell
                      key={header.id}
                      header={header}
                      density={density}
                      enableColumnOrdering={enableColumnOrdering}
                      enableColumnPinning={enableColumnPinning}
                      enableGrouping={enableGrouping}
                      showFilters={showFilters}
                      columnVisibility={columnVisibility}
                      isAllSelected={table.getIsAllRowsSelected()}
                      isSomeSelected={table.getIsSomeRowsSelected()}
                      columnSizing={table.getState().columnSizing}
                    />
                  ))}
                </Box>
              ))}
            </Box>

            {/* Body */}
            <Box
              sx={{
                display: 'block',
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: 'max-content',
                minWidth: '100%',
                position: 'relative',
              }}
            >
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Box key={i} sx={{ display: 'flex' }}>
                    {table.getVisibleLeafColumns().map((c) => (
                      <Box key={c.id} sx={{ p: 1, width: c.getSize() }}>
                        <Skeleton variant='text' />
                      </Box>
                    ))}
                  </Box>
                ))
              ) : rows.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant='body1' color='text.secondary'>
                    No records found
                  </Typography>
                </Box>
              ) : (
                rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  return (
                    <MRTLikeTableRow
                      key={row.id}
                      ref={rowVirtualizer.measureElement}
                      virtualIndex={virtualRow.index}
                      row={row}
                      density={density}
                      isSelected={row.getIsSelected()}
                      enableClickToCopy={enableClickToCopy}
                      editingRowId={editingRowId}
                      editValues={editValues}
                      onEditChange={(col, val) => setEditValues((prev) => ({ ...prev, [col]: val }))}
                      columnSizing={table.getState().columnSizing}
                      renderDetailPanel={renderDetailPanel}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    />
                  );
                })
              )}
            </Box>
          </Box>
        </SortableContext>
      </DndContext>

      {/* Footer / Pagination */}
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
        }}
      >
        <Typography variant='caption' color='text.secondary'>
          {table.getSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected
        </Typography>

        {renderBottomToolbarCustomActions?.(table)}

        <TablePagination
          component='div'
          count={manualMode ? rowCount : table.getFilteredRowModel().rows.length}
          page={pagination.pageIndex}
          rowsPerPage={pagination.pageSize}
          onPageChange={(_, p) => table.setPageIndex(p)}
          onRowsPerPageChange={(e) => table.setPageSize(Number(e.target.value))}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          sx={{ border: 'none' }}
        />
      </Box>

      {/* Loading Overlay (Optional but premium) */}
      {loading && table.getRowModel().rows.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.3)',
            zIndex: 10,
          }}
        >
          <CircularProgress size={40} />
        </Box>
      )}
    </Paper>
  );
}

export const MRTLikeTable = memo(MRTLikeTableInner) as typeof MRTLikeTableInner;
