import React, { memo, useEffect, useMemo, useState, useRef, useCallback } from 'react';

import {
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  type GroupingState,
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Box,
  Checkbox,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
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
  Layers,
  Edit,
  Save,
  Cancel,
  PictureAsPdf,
  TableRows,
} from "@mui/icons-material";

import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent } from '@dnd-kit/core';

import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';

/* =========================================================
   Types
========================================================= */

export type MRTLikeTableProps<T extends object> = {
  columns: ColumnDef<T, unknown>[];
  data?: T[];

  loading?: boolean;
  rowCount?: number;

  manualMode?: boolean;
  fetchData?: (params: {
    pagination: PaginationState;
    sorting: SortingState;
    columnFilters: ColumnFiltersState;
    globalFilter: string;
  }) => void;

  actionMode?: "none" | "inline" | "menu";
  renderRowActions?: (row: T) => React.ReactNode;
  renderRowActionMenuItems?: (
    row: T,
    closeMenu: () => void,
  ) => React.ReactNode;

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

  renderTopToolbarCustomActions?: (table: any) => React.ReactNode;
  renderBottomToolbarCustomActions?: (table: any) => React.ReactNode;

  storageKey?: string;
  title?: string;
};

/* =========================================================
   Helpers
========================================================= */

function exportCSV<T extends object>(
  rows: T[],
  table: any,
  file = "export.csv",
) {
  const columns = table
    .getAllColumns()
    .filter((c: any) => c.id !== "__actions__" && c.id !== "__select__");
  const header = columns.map((c: any) => (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c: any) => {
          const val = (row as any)[c.id] ?? "";
          return `"${val.toString().replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([`${header}\n${body}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", file);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportXLSX<T extends object>(
  rows: T[],
  table: any,
  file = "export.xlsx",
) {
  const columns = table
    .getAllColumns()
    .filter((c: any) => c.id !== "__actions__" && c.id !== "__select__");
  const header = columns.map((c: any) => (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id));

  let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">
<Worksheet ss:Name="Sheet1"><Table>`;

  xml += "<Row>";
  header.forEach((h: string) => {
    xml += `<Cell><Data ss:Type="String">${h}</Data></Cell>`;
  });
  xml += "</Row>";

  rows.forEach((row) => {
    xml += "<Row>";
    columns.forEach((c: any) => {
      const val = (row as any)[c.id] ?? "";
      xml += `<Cell><Data ss:Type="String">${val}</Data></Cell>`;
    });
    xml += "</Row>";
  });

  xml += "</Table></Worksheet></Workbook>";

  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", file);
  link.click();
}

function exportPDF<T extends object>(rows: T[], table: any, file = "export.pdf") {
  const columns = table
    .getAllColumns()
    .filter((c: any) => c.id !== "__actions__" && c.id !== "__select__");
  const header = columns.map((c: any) => (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id));
  
  const win = window.open("", "_blank");
  if (win) {
    win.document.write("<html><head><title>Export</title></head><body>");
    win.document.write('<table border="1" style="border-collapse:collapse;width:100%">');
    win.document.write("<thead><tr>");
    header.forEach((h: string) =>
      win.document.write(`<th>${h}</th>`),
    );
    win.document.write("</tr></thead><tbody>");
    rows.forEach((row) => {
      win.document.write("<tr>");
      columns.forEach((c: any) =>
        win.document.write(`<td>${(row as any)[c.id] ?? ""}</td>`),
      );
      win.document.write("</tr>");
    });
    win.document.write("</tbody></table></body></html>");
    win.document.close();
    win.print();
  }
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

const RowActionMenu = memo(function RowActionMenu<T>({ row, render }: { row: T; render?: (row: T, close: () => void) => React.ReactNode }) {
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

const ColumnFilter = memo(function ColumnFilter({ column }: { column: any }) {
  const columnFilterValue = column.getFilterValue();

  return (
    <TextField
      size='small'
      variant='standard'
      value={(columnFilterValue ?? '') as string}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder={`Filter...`}
      slotProps={{
        input: {
          sx: { fontSize: '0.75rem', mt: 0.5 },
          startAdornment: (
            <InputAdornment position='start'>
              <Search sx={{ fontSize: '0.9rem', opacity: 0.5 }} />
            </InputAdornment>
          ),
          endAdornment: columnFilterValue ? (
            <InputAdornment position='end'>
              <IconButton size='small' onClick={() => column.setFilterValue(undefined)}>
                <Clear sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
    />
  );
});

/* =========================================================
   Memoized Table Components
========================================================= */

const MRTLikeTableCell = memo(function MRTLikeTableCell({
  cell,
  density,
  isSelected,
  enableClickToCopy,
  isEditing,
  onEditChange,
  editValue,
}: {
  cell: any;
  density: string;
  isSelected?: boolean;
  enableClickToCopy?: boolean;
  isEditing?: boolean;
  onEditChange?: (columnId: string, value: any) => void;
  editValue?: any;
}) {
  const isPinned = cell.column.getIsPinned();
  const isGrouped = cell.getIsGrouped();
  const isPlaceholder = cell.getIsPlaceholder();
  const isAggregated = cell.getIsAggregated();

  const handleCopy = (e: React.MouseEvent) => {
    if (!enableClickToCopy || isEditing) return;
    const text = cell.getValue()?.toString() || "";
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
      !cell.column.id.startsWith("__")
    ) {
      const currentEditValue = tableMeta.editValues?.[cell.column.id];
      return (
        <TextField
          variant="standard"
          value={currentEditValue ?? cell.getValue() ?? ""}
          onChange={(e) =>
            tableMeta.setEditValues((prev: any) => ({
              ...prev,
              [cell.column.id]: e.target.value,
            }))
          }
          fullWidth
          size="small"
        />
      );
    }

    if (isGrouped) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              cell.row.getToggleExpandedHandler()();
            }}
            sx={{ p: 0 }}
          >
            {cell.row.getIsExpanded() ? (
              <KeyboardArrowDown fontSize="small" />
            ) : (
              <KeyboardArrowRight fontSize="small" />
            )}
          </IconButton>
          {flexRender(cell.column.columnDef.cell, cell.getContext())} (
          {cell.row.subRows?.length ?? 0})
        </Box>
      );
    }

    if (isAggregated) {
      return flexRender(
        cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
        cell.getContext(),
      );
    }

    if (isPlaceholder) return null;

    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
        {enableClickToCopy && (
          <ContentCopy sx={{ fontSize: "0.8rem", opacity: 0.1 }} />
        )}
      </Box>
    );
  };

  return (
    <TableCell
      sx={{
        p: density === "small" ? 0.5 : 1.5,
        position: isPinned ? "sticky" : "relative",
        left: isPinned === "left" ? cell.column.getStart("left") : undefined,
        right: isPinned === "right" ? cell.column.getAfter("right") : undefined,
        zIndex: isPinned ? 2 : 1,
        backgroundColor: isPinned ? "inherit" : "transparent",
        boxShadow: isPinned ? "2px 0 5px -2px rgba(0,0,0,0.05)" : "none",
        cursor: enableClickToCopy && !isEditing ? "copy" : "default",
        "&:hover":
          enableClickToCopy && !isEditing ? { bgcolor: alpha("#000", 0.02) } : {},
      }}
      onClick={handleCopy}
    >
      {renderContent()}
    </TableCell>
  );
});

const MRTLikeTableRow = memo(function MRTLikeTableRow({
  row,
  density,
  columnVisibility,
  isSelected,
  enableClickToCopy,
  editingRowId,
  editValues,
  onEditChange,
}: {
  row: any;
  density: string;
  columnVisibility: VisibilityState;
  isSelected: boolean;
  enableClickToCopy?: boolean;
  editingRowId?: string | null;
  editValues?: Record<string, any>;
  onEditChange?: (columnId: string, value: any) => void;
}) {
  const isEditing = editingRowId === row.id;

  return (
    <TableRow
      hover
      selected={isSelected || isEditing}
      sx={{
        "&.Mui-selected": {
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
        },
        "&.Mui-selected:hover": {
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12),
        },
        height: row.getIsGrouped() ? 40 : "auto",
        bgcolor: isEditing ? alpha("#000", 0.03) : row.getIsGrouped() ? alpha("#000", 0.02) : "transparent",
      }}
    >
      {row.getVisibleCells().map((cell: any) => (
        <MRTLikeTableCell
          key={cell.id}
          cell={cell}
          density={density}
          isSelected={isSelected}
          enableClickToCopy={enableClickToCopy}
          isEditing={isEditing}
          onEditChange={onEditChange}
          editValue={isEditing ? editValues?.[cell.column.id] : undefined}
        />
      ))}
    </TableRow>
  );
});

const MRTLikeTableHeaderCell = memo(function MRTLikeTableHeaderCell({
  header,
  density,
  enableColumnOrdering,
  enableColumnPinning,
  enableGrouping,
  showFilters,
  columnVisibility,
  isAllSelected, // Primitive to trigger re-render
  isSomeSelected, // Primitive to trigger re-render
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
}) {
  const isPinned = header.column.getIsPinned();
  const style: React.CSSProperties = {
    width: header.getSize(),
    position: isPinned ? 'sticky' : 'relative',
    left: isPinned === 'left' ? header.column.getStart('left') : undefined,
    right: isPinned === 'right' ? header.column.getAfter('right') : undefined,
    zIndex: isPinned ? 3 : 1,
    backgroundColor: alpha('#fff', 0.95),
    backdropFilter: 'blur(4px)',
    boxShadow: isPinned ? '2px 0 5px -2px rgba(0,0,0,0.1)' : 'none',
  };

  return (
    <TableCell key={header.id} style={style} sx={{ p: density === 'small' ? 0.5 : 1 }}>
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
              size="small"
              onClick={() => header.column.toggleGrouping()}
              sx={{
                ml: 0.5,
                opacity: header.column.getIsGrouped() ? 1 : 0.3,
                "&:hover": { opacity: 1 },
                color: header.column.getIsGrouped() ? "primary.main" : "inherit",
              }}
            >
              <ViewModule sx={{ fontSize: "0.9rem" }} />
            </IconButton>
          )}

          {enableColumnPinning && !header.column.id.startsWith("__") && (
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
    </TableCell>
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
  enableDensity = true,
  enableHiding = true,
  enableFullScreen = true,
  enableGrouping = false,
  enableExpanding = false,
  enableClickToCopy = false,
  enableRowNumbers = false,
  enableEditing = false,
  onRowSave,
  renderTopToolbarCustomActions,
  renderBottomToolbarCustomActions,
  storageKey = "mrt-like-table",
  title,
}: MRTLikeTableProps<T>) {
  /* ---------------- State ---------------- */

  const [pagination, setPagination] = useState<PaginationState>(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s.pagination) return s.pagination;
      } catch (e) {}
    }
    return { pageIndex: 0, pageSize: 10 };
  });

  const [sorting, setSorting] = useState<SortingState>(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s.sorting) return s.sorting;
      } catch (e) {}
    }
    return [];
  });

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s.columnFilters) return s.columnFilters;
      } catch (e) {}
    }
    return [];
  });

  const [globalFilter, setGlobalFilter] = useState(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s.globalFilter) return s.globalFilter;
      } catch (e) {}
    }
    return "";
  });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          const s = JSON.parse(raw);
          if (s.columnVisibility) return s.columnVisibility;
        } catch (e) {}
      }
      return {};
    },
  );

  const [grouping, setGrouping] = useState<GroupingState>(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s.grouping) return s.grouping;
      } catch (e) {}
    }
    return [];
  });

  const [expanded, setExpanded] = useState<ExpandedState>({});

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s.columnOrder) return s.columnOrder;
      } catch (e) {}
    }
    return [];
  });

  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s.columnPinning) return s.columnPinning;
      } catch (e) {}
    }
    return { left: ["__select__", "__actions__"], right: [] };
  });

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [density, setDensity] = useState<"small" | "medium" | "large">(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s.density) return s.density;
      } catch (e) {}
    }
    return "small";
  });

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  const containerRef = useRef<HTMLDivElement>(null);

  /* ---------------- Persistence ---------------- */

  const resetState = useCallback(() => {
    setPagination({ pageIndex: 0, pageSize: 10 });
    setSorting([]);
    setColumnFilters([]);
    setGlobalFilter("");
    setColumnVisibility({});
    setColumnOrder([]);
    setColumnPinning({ left: ["__select__", "__actions__"], right: [] });
    setGrouping([]);
    setDensity("small");
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        pagination,
        sorting,
        columnFilters,
        globalFilter,
        columnVisibility,
        columnOrder,
        columnPinning,
        density,
        grouping,
      }),
    );
  }, [
    storageKey,
    pagination,
    sorting,
    columnFilters,
    globalFilter,
    columnVisibility,
    columnOrder,
    columnPinning,
    density,
    grouping,
  ]);

  /* ---------------- Server Fetch ---------------- */

  useEffect(() => {
    if (!manualMode || !fetchData) return;
    fetchData({ pagination, sorting, columnFilters, globalFilter });
  }, [manualMode, fetchData, pagination, sorting, columnFilters, globalFilter]);

  /* ---------------- Columns ---------------- */

  const finalColumns = useMemo<ColumnDef<T, unknown>[]>(() => {
    const cols: ColumnDef<T, unknown>[] = [];

    // Row Numbers
    if (enableRowNumbers) {
      cols.push({
        id: "__row_numbers__",
        header: "#",
        size: 50,
        enableSorting: false,
        enableColumnFilter: false,
        enableHiding: false,
        cell: ({ row }) => row.index + 1,
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
            size="small"
            indeterminate={isSomeSelected && !isAllSelected}
            checked={isAllSelected}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        );
      },
      cell: ({ row }) => (
        <Checkbox
          size="small"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          disabled={!row.getCanSelect()}
        />
      ),
      size: 48,
      enableSorting: false,
      enableColumnFilter: false,
      enableHiding: false,
    });

    // Actions Column
    if (actionMode !== "none") {
      cols.push({
        id: "__actions__",
        header: "Actions",
        size: 120,
        enableSorting: false,
        enableColumnFilter: false,
        enableHiding: false,
        cell: ({ row, table: t }) => {
          const meta = (t.options as any).meta;
          const isEditing = meta.editingRowId === row.id;

          if (isEditing) {
            return (
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Tooltip title="Save">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={async () => {
                      await meta.onRowSave?.(row.original, meta.editValues);
                      meta.setEditingRowId(null);
                      meta.setEditValues({});
                    }}
                  >
                    <Save fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cancel">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      meta.setEditingRowId(null);
                      meta.setEditValues({});
                    }}
                  >
                    <Cancel fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            );
          }

          return (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {meta.enableEditing && (
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => {
                      meta.setEditingRowId(row.id);
                      meta.setEditValues(row.original);
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {actionMode === "inline" ? (
                renderRowActions?.(row.original)
              ) : (
                <RowActionMenu
                  row={row.original}
                  render={renderRowActionMenuItems}
                />
              )}
            </Box>
          );
        },
      });
    }

    cols.push(...columns);
    return cols;
  }, [columns, actionMode, renderRowActions, renderRowActionMenuItems]);

  /* ---------------- Table Instance ---------------- */

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: {
      pagination,
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      columnOrder,
      columnPinning,
      rowSelection,
      grouping,
      expanded,
    },
    enableRowSelection: true,
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
    columnResizeMode: "onChange",
    meta: {
      editingRowId,
      setEditingRowId,
      editValues,
      setEditValues,
      onRowSave,
      enableEditing,
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  /* ---------------- Handlers ---------------- */

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((old) => {
        const oldIndex = old.indexOf(active.id as string);
        const newIndex = old.indexOf(over.id as string);
        return arrayMove(old, oldIndex, newIndex);
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

  const selectedRows = useMemo(() => table.getSelectedRowModel().rows.map((r) => r.original), [table.getSelectedRowModel().rows]);

  /* ---------------- Visibility Menu ---------------- */

  const [visibilityAnchor, setVisibilityAnchor] = useState<HTMLElement | null>(null);

  /* ---------------- Render ---------------- */

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {title && <Typography variant='h6'>{title}</Typography>}
          {renderTopToolbarCustomActions?.(table)}

          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title="Export CSV">
            <IconButton
              size="small"
              onClick={() =>
                exportCSV(
                  table.getFilteredRowModel().rows.map((r: any) => r.original),
                  table,
                )
              }
            >
              <Download />
            </IconButton>
          </Tooltip>

          <Tooltip title="Export Excel">
            <IconButton
              size="small"
              onClick={() =>
                exportXLSX(
                  table.getFilteredRowModel().rows.map((r: any) => r.original),
                  table,
                )
              }
            >
              <TableRows />
            </IconButton>
          </Tooltip>

          <Tooltip title="Export PDF">
            <IconButton
              size="small"
              onClick={() =>
                exportPDF(
                  table.getFilteredRowModel().rows.map((r: any) => r.original),
                  table,
                )
              }
            >
              <PictureAsPdf />
            </IconButton>
          </Tooltip>

          <Tooltip title="Reset State">
            <IconButton onClick={resetState} size="small">
              <RestartAlt />
            </IconButton>
          </Tooltip>

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
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {enableColumnFilters && (
            <Tooltip title={showFilters ? 'Hide Filters' : 'Show Filters'}>
              <IconButton color={showFilters ? 'primary' : 'default'} onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? <FilterListOff /> : <FilterList />}
              </IconButton>
            </Tooltip>
          )}

          {enableHiding && (
            <Tooltip title='Show/Hide Columns'>
              <IconButton onClick={(e) => setVisibilityAnchor(e.currentTarget)}>
                <ViewColumn />
              </IconButton>
            </Tooltip>
          )}

          {enableDensity && (
            <Box
              sx={{
                display: 'flex',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                ml: 1,
              }}
            >
              <Tooltip title='Small Density'>
                <IconButton size='small' color={density === 'small' ? 'primary' : 'default'} onClick={() => setDensity('small')}>
                  <DensitySmall fontSize='small' />
                </IconButton>
              </Tooltip>
              <Tooltip title='Medium Density'>
                <IconButton size='small' color={density === 'medium' ? 'primary' : 'default'} onClick={() => setDensity('medium')}>
                  <DensityMedium fontSize='small' />
                </IconButton>
              </Tooltip>
              <Tooltip title='Large Density'>
                <IconButton size='small' color={density === 'large' ? 'primary' : 'default'} onClick={() => setDensity('large')}>
                  <DensityLarge fontSize='small' />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          <Tooltip title='Export Data'>
            <IconButton onClick={() => exportCSV(selectedRows.length ? selectedRows : data, table)}>
              <Download />
            </IconButton>
          </Tooltip>

          {enableFullScreen && (
            <Tooltip title='Toggle Fullscreen'>
              <IconButton onClick={toggleFullScreen}>{isFullScreen ? <FullscreenExit /> : <Fullscreen />}</IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

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
      </Menu>

      {/* Table Area */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={table.getState().columnOrder.length ? table.getState().columnOrder : table.getAllLeafColumns().map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          <TableContainer
            sx={{
              flexGrow: 1,
              maxHeight: isFullScreen ? 'calc(100vh - 120px)' : 550,
              position: 'relative',
            }}
          >
            <Table stickyHeader size={density === 'large' ? 'medium' : 'small'}>
              <TableHead>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
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
                      />
                    ))}
                  </TableRow>
                ))}
              </TableHead>

              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {table.getVisibleLeafColumns().map((c) => (
                        <TableCell key={c.id}>
                          <Skeleton variant='text' />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={999} align='center' sx={{ py: 10 }}>
                      <Typography variant='body1' color='text.secondary'>
                        No records found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  table
                    .getRowModel()
                    .rows.map((row) => (
                      <MRTLikeTableRow
                        key={row.id}
                        row={row}
                        density={density}
                        columnVisibility={columnVisibility}
                        isSelected={row.getIsSelected()}
                        enableClickToCopy={enableClickToCopy}
                        editingRowId={editingRowId}
                        editValues={editValues}
                        onEditChange={(col, val) =>
                          setEditValues((prev) => ({ ...prev, [col]: val }))
                        }
                      />
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
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
        <Typography variant="caption" color="text.secondary">
          {table.getSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected
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
