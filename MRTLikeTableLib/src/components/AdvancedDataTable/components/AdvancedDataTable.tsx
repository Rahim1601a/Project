import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Box, Snackbar, Alert, Typography } from '@mui/material';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { flexRender } from '@tanstack/react-table';

import type { AdvancedDataTableProps, ADTExportParams } from '../types/types';
import { useAdvancedDataTable } from '../hooks/useAdvancedDataTable';
import { useColumnSizing } from '../hooks/useColumnSizing';
import { useDensity } from '../hooks/useDensity';
import { ADTRoot, ADTTableContainer } from './AdvancedDataTable.styles';
import { AdvancedDataTableToolbar } from './AdvancedDataTableToolbar';
import { AdvancedDataTableHeader } from './AdvancedDataTableHeader';
import { AdvancedDataTableBody } from './AdvancedDataTableBody';
import { AdvancedDataTablePagination } from './AdvancedDataTablePagination';
import { exportTableData } from '../utils/export';

function AdvancedDataTableInner<T extends object>(props: AdvancedDataTableProps<T>) {
  const {
    title,
    enableGlobalFilter,
    enableColumnFilters,
    enableHiding,
    enableFullScreen,
    enableDensity,
    enableColumnOrdering,
    enableColumnPinning,
    enableColumnResizing,
    enableGrouping,
    layoutMode = 'grid',
    renderTopToolbarCustomActions,
    renderBottomToolbarCustomActions,
    loading,
    onScrollEnd,
    enableColumnFooters,
    renderDetailPanel,
    initialDensity = 'comfortable',
    themeConfig,
  } = props;

  // 1. Base Hooks
  const { table, state, dispatch } = useAdvancedDataTable(props);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerMounted, setContainerMounted] = useState(false);
  void containerMounted;
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const setTableContainerRef = useCallback((node: HTMLDivElement | null) => {
    tableContainerRef.current = node;
    setContainerMounted(node !== null);
  }, []);

  // 2. State Hooks
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'error' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // 3. Custom Logic Hooks
  const { densityStyles } = useDensity(state.density);
  const { setColumnSizing } = useColumnSizing(table, tableContainerRef, layoutMode, dispatch);

  // 4. Callback Hooks
  const toggleFullScreen = useCallback(() => {
    if (!isFullScreen) {
      containerRef.current?.requestFullscreen?.().catch(() => {
        setIsFullScreen(true);
      });
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullScreen(false);
    }
  }, [isFullScreen]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (active && over && active.id !== over.id) {
        const allCols = table.getAllLeafColumns().map((c) => c.id);
        const oldOrder = state.columnOrder.length ? state.columnOrder : allCols;
        const oldIndex = oldOrder.indexOf(active.id as string);
        const newIndex = oldOrder.indexOf(over.id as string);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(oldOrder, oldIndex, newIndex) as string[];
          dispatch({ type: 'SET_COLUMN_ORDER', payload: newOrder });
        }
      }
    },
    [state.columnOrder, table, dispatch]
  );

  const handleExport = useCallback(
    async (params: ADTExportParams) => {
      try {
        if (props.onExport) {
          await props.onExport(params);

          setSnackbar({
            open: true,
            message: `Export ${params.type.toUpperCase()} completed`,
            severity: 'success',
          });

          return;
        }

        const selectedRows = table.getSelectedRowModel().flatRows;

        const rowsToExport = selectedRows.length > 0 ? selectedRows : table.getPrePaginationRowModel().flatRows;

        if (!rowsToExport.length) {
          setSnackbar({
            open: true,
            message: 'No rows available to export',
            severity: 'info',
          });

          return;
        }

        await exportTableData({
          type: params.type,
          rows: rowsToExport,
          table,
          fileName: title || 'export',
        });

        setSnackbar({
          open: true,
          message: `${params.type.toUpperCase()} exported successfully`,
          severity: 'success',
        });
      } catch (error: any) {
        console.error('Export failed:', error);

        setSnackbar({
          open: true,
          message: error?.message || 'Export failed',
          severity: 'error',
        });
      }
    },
    [props, table, title]
  );

  // 5. Memo Hooks
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const columnOrder = useMemo(
    () => (state.columnOrder.length ? state.columnOrder : table.getAllLeafColumns().map((c) => c.id)),
    [state.columnOrder, table]
  );

  // 6. Effect Hooks (Placed at the end of the hook section to maintain order stability)
  useEffect(() => {
    const handleCopy = (e: any) => {
      setSnackbar({ open: true, message: `Copied: ${e.detail}`, severity: 'info' });
    };
    window.addEventListener('adt-copy' as any, handleCopy);
    return () => window.removeEventListener('adt-copy' as any, handleCopy);
  }, []);

  const totalWidth = Math.max(table.getTotalSize(), 0);

  return (
    <ADTRoot ref={containerRef} isFullScreen={isFullScreen} layoutMode={layoutMode} themeConfig={themeConfig} style={densityStyles}>
      <AdvancedDataTableToolbar
        table={table}
        title={title}
        enableGlobalFilter={enableGlobalFilter}
        enableColumnFilters={enableColumnFilters}
        enableHiding={enableHiding}
        enableFullScreen={enableFullScreen}
        enableDensity={enableDensity}
        isFullScreen={isFullScreen}
        toggleFullScreen={toggleFullScreen}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        density={state.density}
        setDensity={(d) => dispatch({ type: 'SET_DENSITY', payload: d })}
        onExport={handleExport}
        renderTopToolbarCustomActions={renderTopToolbarCustomActions}
        resetState={() => dispatch({ type: 'RESET_STATE', payload: { ...state, density: initialDensity } })}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
          <ADTTableContainer role='grid' aria-label={title || 'Advanced Data Table'} ref={setTableContainerRef} isFullScreen={isFullScreen}>
            <AdvancedDataTableHeader
              table={table}
              tableContainerRef={tableContainerRef}
              enableColumnOrdering={enableColumnOrdering}
              enableColumnPinning={enableColumnPinning}
              enableColumnResizing={enableColumnResizing}
              enableColumnGrouping={enableGrouping}
              showFilters={showFilters}
              columnSizing={state.columnSizing}
              columnPinning={state.columnPinning}
              columnOrder={state.columnOrder}
              columnFilters={state.columnFilters}
              setColumnSizing={setColumnSizing}
            />

            <AdvancedDataTableBody
              table={table}
              tableContainerRef={tableContainerRef}
              loading={loading}
              density={state.density}
              columnSizing={state.columnSizing}
              columnVisibility={state.columnVisibility}
              columnFilters={state.columnFilters}
              onScrollEnd={onScrollEnd}
              renderDetailPanel={renderDetailPanel}
            />

            {enableColumnFooters && (
              <Box sx={{ borderTop: '2px solid var(--adt-border-color)', backgroundColor: 'var(--adt-header-bg)' }}>
                {table.getFooterGroups().map((footerGroup) => (
                  <Box
                    key={footerGroup.id}
                    sx={{ display: 'flex', width: totalWidth, minWidth: '100%', borderBottom: '2px solid var(--adt-border-color)' }}
                  >
                    {/* Left Pinned Footers */}
                    {footerGroup.headers
                      .filter((h) => h.column.getIsPinned() === 'left')
                      .map((header) => (
                        <Box
                          key={header.id}
                          sx={{
                            width: header.getSize(),
                            flex: '0 0 auto',
                            p: 'var(--adt-cell-padding-y) var(--adt-cell-padding-x)',
                            fontWeight: 'bold',
                            borderRight: '1px solid var(--adt-border-color)',
                            position: 'sticky',
                            left: header.column.getStart('left'),
                            zIndex: 11,
                            backgroundColor: 'inherit',
                          }}
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
                        </Box>
                      ))}

                    {/* Unpinned Footers (Not virtualized for simplicity in footer, but following same order) */}
                    {footerGroup.headers
                      .filter((h) => !h.column.getIsPinned())
                      .map((header) => (
                        <Box
                          key={header.id}
                          sx={{
                            width: header.getSize(),
                            flex: '0 0 auto',
                            p: 'var(--adt-cell-padding-y) var(--adt-cell-padding-x)',
                            fontWeight: 'bold',
                            borderRight: '1px solid var(--adt-border-color)',
                          }}
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
                        </Box>
                      ))}

                    {/* Right Pinned Footers */}
                    {footerGroup.headers
                      .filter((h) => h.column.getIsPinned() === 'right')
                      .map((header) => (
                        <Box
                          key={header.id}
                          sx={{
                            width: header.getSize(),
                            flex: '0 0 auto',
                            p: 'var(--adt-cell-padding-y) var(--adt-cell-padding-x)',
                            fontWeight: 'bold',
                            borderRight: '1px solid var(--adt-border-color)',
                            position: 'sticky',
                            right: header.column.getAfter('right'),
                            zIndex: 11,
                            backgroundColor: 'inherit',
                          }}
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
                        </Box>
                      ))}
                  </Box>
                ))}
              </Box>
            )}
          </ADTTableContainer>
        </SortableContext>
      </DndContext>

      <AdvancedDataTablePagination table={table} renderBottomToolbarCustomActions={renderBottomToolbarCustomActions} />

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} variant='filled' sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ADTRoot>
  );
}

class AdvancedDataTableErrorBoundary extends React.Component<any, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AdvancedDataTable Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            border: '1px solid var(--adt-border-color)',
            borderRadius: 2,
            bgcolor: 'error.light',
            color: 'error.contrastText',
          }}
        >
          <Typography variant='h6'>Something went wrong in the data table.</Typography>
          <Typography variant='body2'>{this.state.error?.message}</Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

export const AdvancedDataTable = (props: AdvancedDataTableProps<any>) => (
  <AdvancedDataTableErrorBoundary>
    <AdvancedDataTableInner {...props} />
  </AdvancedDataTableErrorBoundary>
);
