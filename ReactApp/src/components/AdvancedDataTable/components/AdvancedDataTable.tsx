import { memo, useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  type ColumnFiltersState,
  type RowSelectionState,
  type ExpandedState,
  type ColumnSizingState,
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
import { useVirtualizer } from '@tanstack/react-virtual';
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
  Skeleton,
  Snackbar,
} from '@mui/material';
import {
  DensitySmall,
  DensityMedium,
  DensityLarge,
  Download,
  ViewColumn,
  Fullscreen,
  FullscreenExit,
  Search,
  FilterList,
  FilterListOff,
  Clear,
  RestartAlt,
  PictureAsPdf,
  TableRows,
} from '@mui/icons-material';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useTableState } from '../hooks/useTableState';
import type { AdvancedDataTableProps, AdvancedDataTableValidationErrors } from '../types/types';
import { filterFnByVariant, buildFilterOptionsFromData } from '../utils/filters';
import { AdvancedDataTableRow } from './AdvancedDataTableRow';
import { AdvancedDataTableHeaderCell } from './AdvancedDataTableHeaderCell';
import { FIXED_COLUMN_WIDTHS, COLUMN_DEFAULTS, ROW_HEIGHTS, VIRTUALIZER_OVERSCAN, SCROLL_BUFFER, PAGE_SIZE_OPTIONS } from '../utils/constants';
import { useColumns } from '../hooks/useColumns';
import './AdvancedDataTable.scss';

/** Lazy-load heavy export dependencies (jsPDF is ~300KB) */
const lazyExportCSV = async (...args: Parameters<typeof import('../utils/export').exportCSV>) => {
  const { exportCSV } = await import('../utils/export');
  return exportCSV(...args);
};
const lazyExportXLSX = async (...args: Parameters<typeof import('../utils/export').exportXLSX>) => {
  const { exportXLSX } = await import('../utils/export');
  return exportXLSX(...args);
};
const lazyExportPDF = async (...args: Parameters<typeof import('../utils/export').exportPDF>) => {
  const { exportPDF } = await import('../utils/export');
  return exportPDF(...args);
};

function AdvancedDataTableInner<T extends object>({
  columns,
  data = [],
  loading = false,
  rowCount = 0,
  manualMode = false,
  fetchData,
  actionMode = 'none',
  renderRowActions,
  renderRowActionMenuItems,
  enableGlobalFilter = false,
  enableColumnFilters = false,
  enableColumnOrdering = false,
  enableColumnPinning = false,
  enableColumnResizing = false,
  enableHiding = false,
  enableFullScreen = false,
  enableGrouping = false,
  enableClickToCopy = false,
  enableRowNumbers = false,
  enableExpanding = false,
  enableEditing = false,
  enableRowSelection = false,
  layoutMode = 'grid-no-grow',
  columnResizeMode = 'onChange',
  columnResizeDirection = 'ltr',
  displayColumnDefOptions,
  renderDetailPanel,
  onRowSave,
  renderTopToolbarCustomActions,
  renderBottomToolbarCustomActions,
  isStorage = false,
  storageKey = 'AdvancedDataTableState',
  title,
  validateRow,
  onExport,
  filterOptions,
}: AdvancedDataTableProps<T>) {
  const autoFilterOptions = useMemo(() => {
    if (!data || data.length === 0) return {};
    return buildFilterOptionsFromData(data, columns);
  }, [data, columns]);

  const resolvedFilterOptions = useMemo(
    () => ({
      ...autoFilterOptions,
      ...filterOptions,
    }),
    [autoFilterOptions, filterOptions]
  );

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
    columnSizing,
    setColumnSizing,
  } = useTableState(storageKey, { enabled: isStorage });

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [rowErrors, setRowErrors] = useState<AdvancedDataTableValidationErrors<T>>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  // Listen for copy events from cells
  useEffect(() => {
    const handleCopyNotify = (e: any) => {
      setSnackbar({ open: true, message: `Copied: ${e.detail}` });
    };
    window.addEventListener('table-copy', handleCopyNotify);
    return () => window.removeEventListener('table-copy', handleCopyNotify);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const isManualResized = useRef(Object.keys(columnSizing).length > 0);

  // Sync ref with state if it becomes empty (e.g. on Reset)
  useEffect(() => {
    if (Object.keys(columnSizing).length === 0) {
      isManualResized.current = false;
    }
  }, [columnSizing]);

  // Server Fetch
  useEffect(() => {
    if (!manualMode || !fetchData) return;
    fetchData({ pagination, sorting, columnFilters, globalFilter: debouncedGlobalFilter });
  }, [manualMode, fetchData, pagination, sorting, columnFilters, debouncedGlobalFilter]);

  // Columns
  const finalColumns = useColumns({
    columns,
    enableRowNumbers,
    renderDetailPanel,
    enableExpanding,
    actionMode,
    renderRowActions,
    renderRowActionMenuItems,
    enableEditing,
    enableRowSelection,
    displayColumnDefOptions,
  });

  // Table Instance
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
      columnSizing,
    },
    defaultColumn: useMemo(
      () => ({
        minSize: COLUMN_DEFAULTS.minSize,
        size: COLUMN_DEFAULTS.size,
        maxSize: COLUMN_DEFAULTS.maxSize,
        filterFn: filterFnByVariant.text,
      }),
      []
    ),
    enableRowSelection: enableRowSelection ? (row) => !row.getIsGrouped() : false,
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
    onColumnSizingChange: (updater) => {
      isManualResized.current = true;
      setColumnSizing(updater);
    },
    enableColumnResizing,
    columnResizeMode,
    columnResizeDirection,
    globalFilterFn: filterFnByVariant.text,
    meta: useMemo(
      () => ({
        editingRowId,
        setEditingRowId,
        editValues,
        setEditValues,
        onRowSave,
        enableEditing,
        validateRow,
        rowErrors,
        setRowErrors,
      }),
      [editingRowId, editValues, onRowSave, enableEditing, validateRow, rowErrors]
    ),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    autoResetPageIndex: false,
  });

  const { rows } = table.getRowModel();
  const estimateSize = useCallback(() => ROW_HEIGHTS[density] ?? ROW_HEIGHTS.small, [density]);
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize,
    overscan: VIRTUALIZER_OVERSCAN,
  });

  // ✅ PERF FIX: Trigger re-measure when expansion state changes
  useEffect(() => {
    rowVirtualizer.measure();
  }, [expanded, rowVirtualizer, density]);

  // ✅ PERF FIX: Single consolidated page-reset on filter change
  const previousFilters = useRef<{ cf: ColumnFiltersState; gf: string }>({ cf: [], gf: '' });
  useEffect(() => {
    const changed =
      JSON.stringify(previousFilters.current.cf) !== JSON.stringify(columnFilters) || previousFilters.current.gf !== debouncedGlobalFilter;
    if (changed) {
      table.setPageIndex(0);
      previousFilters.current = { cf: columnFilters, gf: debouncedGlobalFilter };
    }
  }, [columnFilters, debouncedGlobalFilter]);

  // ✅ PERF FIX: Stable table reference for effects
  const tableRef = useRef(table);
  useEffect(() => {
    tableRef.current = table;
  }, [table]);

  // ✅ PERF FIX: Debounced ResizeObserver
  useEffect(() => {
    let rafId: number | null = null;
    const calculateResponsiveColumnSizes = () => {
      const currentTable = tableRef.current;
      if (!tableContainerRef.current || !currentTable) return;

      // 🛑 STOP: Don't overwrite if user is actively resizing OR has manually resized
      if (currentTable.getState().columnSizingInfo.isResizingColumn || isManualResized.current) return;

      const containerWidth = tableContainerRef.current.clientWidth;
      if (containerWidth <= 0) return;

      const leafColumns = table.getAllLeafColumns();
      const visibleColumns = leafColumns.filter((col) => col.getIsVisible());
      const fixedWidth = visibleColumns.reduce((sum, col) => sum + (FIXED_COLUMN_WIDTHS[col.id] || 0), 0);
      const availableWidth = Math.max(containerWidth - fixedWidth - SCROLL_BUFFER, 0);

      const dataColumns = visibleColumns.filter((col) => !FIXED_COLUMN_WIDTHS[col.id]);
      if (dataColumns.length > 0) {
        const columnWidth = Math.max(
          COLUMN_DEFAULTS.responsiveMin,
          Math.min(Math.floor(availableWidth / dataColumns.length), COLUMN_DEFAULTS.responsiveMax)
        );

        const currentSizing = currentTable.getState().columnSizing;
        const newSizing: ColumnSizingState = {};
        let changed = false;

        dataColumns.forEach((col) => {
          newSizing[col.id] = columnWidth;
          if (currentSizing[col.id] !== columnWidth) changed = true;
        });

        // ✅ Only update if actually different to prevent render loops
        if (changed) setColumnSizing(newSizing);
      }
    };

    calculateResponsiveColumnSizes();

    const resizeObserver = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(calculateResponsiveColumnSizes);
    });

    if (tableContainerRef.current) resizeObserver.observe(tableContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [setColumnSizing]); // table removed from dependencies

  // Handlers
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (active && over && active.id !== over.id) {
        setColumnOrder((old) => {
          const ids = old.length ? old : table.getAllLeafColumns().map((c) => c.id);
          const oi = ids.indexOf(active.id as string);
          const ni = ids.indexOf(over.id as string);
          if (oi === -1 || ni === -1) return old;
          return arrayMove(ids, oi, ni);
        });
      }
    },
    [setColumnOrder, table]
  );

  const toggleFullScreen = useCallback(() => {
    if (!isFullScreen) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
    setIsFullScreen(!isFullScreen);
  }, [isFullScreen]);

  // ✅ PERF: Memoize derived selection data
  const selectedRows = useMemo(() => table.getSelectedRowModel().rows.map((r) => r.original), [table, rowSelection]);
  const selectedRowIds = useMemo(() => Object.keys(rowSelection), [rowSelection]);

  // ✅ PERF FIX: Memoized handlers
  const handleServerExport = useCallback(
    (type: 'csv' | 'xlsx' | 'pdf', selectionMode: 'all' | 'page' | 'selected') => {
      onExport?.({ type, selectionMode, sorting, columnFilters, globalFilter: debouncedGlobalFilter, selectedRowIds });
    },
    [onExport, sorting, columnFilters, debouncedGlobalFilter, selectedRowIds]
  );

  const [visibilityAnchor, setVisibilityAnchor] = useState<HTMLElement | null>(null);
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);

  // ✅ PERF FIX: Stabilize sensors with useMemo
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const columnOrderState = table.getState().columnOrder;
  const sortableItems = useMemo(
    () => (columnOrderState.length ? columnOrderState : table.getAllLeafColumns().map((c) => c.id)),
    [columnOrderState, table]
  );

  const hasFilters = globalFilter || (columnFilters && columnFilters.length > 0);
  const filteredRowCount = table.getFilteredRowModel().rows.length;

  // ✅ PERF FIX: Memoized clearAllFilters
  const clearAllFilters = useCallback(() => {
    setColumnFilters([]);
    setGlobalFilter('');
    setPagination((prev: any) => ({ ...prev, pageIndex: 0 }));
  }, [setColumnFilters, setGlobalFilter, setPagination]);

  const rootClass = isFullScreen ? 'advanced-data-table advanced-data-table--fullscreen' : 'advanced-data-table';
  const tableContainerClass = isFullScreen
    ? 'advanced-data-table__table-container advanced-data-table__table-container--fullscreen'
    : 'advanced-data-table__table-container';

  return (
    <Paper ref={containerRef} elevation={2} className={rootClass} data-layout={enableColumnResizing ? layoutMode || 'grid-no-grow' : 'semantic'}>
      {/* Top Toolbar */}
      <Box className='advanced-data-table__toolbar'>
        <Box className='advanced-data-table__toolbar-group'>
          {title && (
            <Typography variant='h6' className='advanced-data-table__toolbar-title'>
              {title}
            </Typography>
          )}
          {renderTopToolbarCustomActions?.(table)}
        </Box>
        <Box className='advanced-data-table__toolbar-group'>
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
              className='advanced-data-table__search'
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
      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={() => setExportAnchor(null)}
        slotProps={{ paper: { className: 'advanced-data-table__menu-paper' } }}
      >
        <MenuItem
          onClick={() => {
            setExportAnchor(null);
            if (manualMode && onExport) handleServerExport('csv', selectedRowIds.length ? 'selected' : 'all');
            else lazyExportCSV(selectedRowIds.length ? selectedRows : rows.map((r) => r.original), table);
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
            else lazyExportXLSX(selectedRowIds.length ? selectedRows : rows.map((r) => r.original), table);
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
            else lazyExportPDF(selectedRowIds.length ? selectedRows : rows.map((r) => r.original), table);
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
        slotProps={{ paper: { className: 'advanced-data-table__menu-paper' } }}
      >
        <Box className='advanced-data-table__menu-header'>
          <Typography variant='subtitle2' className='advanced-data-table__menu-title'>
            Columns
          </Typography>
          <Box className='advanced-data-table__menu-actions'>
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
        <Box className='advanced-data-table__menu-section'>
          <Typography variant='caption' className='advanced-data-table__density-label'>
            Density
          </Typography>
          <Box className='advanced-data-table__menu-density'>
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
            className={tableContainerClass}
            sx={{
              maxHeight: isFullScreen ? 'calc(100vh - 120px)' : 550,
            }}
          >
            {/* Header */}
            <Box className='advanced-data-table__header-bar'>
              {table.getHeaderGroups().map((hg) => (
                <Box key={hg.id} className='advanced-data-table__header-row'>
                  {hg.headers.map((header) => (
                    <AdvancedDataTableHeaderCell
                      key={header.id}
                      header={header}
                      density={density}
                      enableColumnOrdering={enableColumnOrdering}
                      enableColumnPinning={enableColumnPinning}
                      enableGrouping={enableGrouping}
                      showFilters={showFilters}
                      filterOptions={resolvedFilterOptions}
                      columnVisibility={columnVisibility}
                      isAllSelected={table.getIsAllRowsSelected()}
                      isSomeSelected={table.getIsSomeRowsSelected()}
                      columnSizing={table.getState().columnSizing}
                      columnResizeDirection={columnResizeDirection}
                    />
                  ))}
                </Box>
              ))}
            </Box>

            {/* Empty State */}
            {!loading && filteredRowCount === 0 && (
              <Box className='advanced-data-table__empty-state'>
                <Typography variant='body1'>{hasFilters ? 'No results match your filters' : 'No records found'}</Typography>
                {hasFilters && (
                  <Box className='advanced-data-table__empty-state-actions'>
                    <IconButton color='primary' onClick={clearAllFilters}>
                      <RestartAlt />
                    </IconButton>
                    <Typography variant='caption'>Clear all filters</Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Body */}
            <Box className='advanced-data-table__body' sx={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <Box key={i} className='advanced-data-table__skeleton-row'>
                      {table.getVisibleLeafColumns().map((c) => (
                        <Box key={c.id} className='advanced-data-table__skeleton-cell' sx={{ width: c.getSize(), minWidth: c.getSize() }}>
                          <Skeleton variant='text' />
                        </Box>
                      ))}
                    </Box>
                  ))
                : rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    return (
                      <AdvancedDataTableRow
                        key={row.id}
                        ref={rowVirtualizer.measureElement}
                        virtualIndex={virtualRow.index}
                        row={row}
                        density={density}
                        isSelected={row.getIsSelected()}
                        isExpanded={row.getIsExpanded()}
                        enableClickToCopy={enableClickToCopy}
                        editingRowId={editingRowId}
                        editValues={editValues}
                        onEditChange={(col, val) => setEditValues((prev) => ({ ...prev, [col]: val }))}
                        columnSizing={table.getState().columnSizing}
                        renderDetailPanel={renderDetailPanel}
                        rowSelection={rowSelection}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualRow.start}px)` }}
                      />
                    );
                  })}
            </Box>
          </Box>
        </SortableContext>
      </DndContext>

      {/* Footer / Pagination */}
      <Box className='advanced-data-table__footer'>
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
          rowsPerPageOptions={[...PAGE_SIZE_OPTIONS]}
          className='advanced-data-table__pagination'
        />
      </Box>

      {/* Loading Overlay */}
      {loading && table.getRowModel().rows.length > 0 && (
        <Box className='advanced-data-table__loading-overlay'>
          <CircularProgress size={40} />
        </Box>
      )}
      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Paper>
  );
}

export const AdvancedDataTable = memo(AdvancedDataTableInner) as typeof AdvancedDataTableInner;
