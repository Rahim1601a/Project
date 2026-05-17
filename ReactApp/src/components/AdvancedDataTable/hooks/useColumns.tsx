import { useMemo } from 'react';
import { Box, Checkbox, IconButton } from '@mui/material';
import { KeyboardArrowRight, KeyboardArrowDown, Edit, Save, Cancel } from '@mui/icons-material';
import type { Row, Table } from '@tanstack/react-table';
import type { ADT_ColumnDef, ADTMeta } from '../types/types';
import { filterFnByVariant } from '../utils/filters';
import { RowActionMenu } from '../components/RowActionMenu';

interface UseColumnsProps<T extends object> {
  columns: ADT_ColumnDef<T>[];
  enableRowNumbers?: boolean;
  enableExpanding?: boolean;
  renderDetailPanel?: (props: { row: Row<T>; table: Table<T> }) => React.ReactNode;
  actionMode?: 'none' | 'inline' | 'menu';
  renderRowActions?: (props: { row: Row<T>; table: Table<T> }) => React.ReactNode;
  renderRowActionMenuItems?: (props: { row: Row<T>; table: Table<T>; closeMenu: () => void }) => React.ReactNode;
  enableEditing?: boolean;
  enableRowSelection?: boolean;
  displayColumnDefOptions?: Record<string, Partial<ADT_ColumnDef<T>>>;
}

export function useColumns<T extends object>({
  columns,
  enableRowNumbers,
  enableExpanding,
  renderDetailPanel,
  actionMode,
  renderRowActions,
  renderRowActionMenuItems,
  enableEditing,
  enableRowSelection,
  displayColumnDefOptions,
}: UseColumnsProps<T>) {
  return useMemo(() => {
    const displayCols: ADT_ColumnDef<T>[] = [];

    if (enableRowSelection) {
      const opts = displayColumnDefOptions?.['mrt-row-select'] || {};
      displayCols.push({
        id: '__select__',
        header: ({ table }) => (
          <Checkbox
            size='small'
            indeterminate={table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox 
            size='small' 
            checked={row.getIsSelected()} 
            disabled={!row.getCanSelect()} 
            onChange={(e) => {
              // Pass the native event which has shiftKey property
              row.getToggleSelectedHandler()(e.nativeEvent);
            }} 
          />
        ),
        size: opts.size ?? 50,
        minSize: opts.minSize ?? 40,
        enableSorting: false,
        enableColumnFilter: false,
        enableHiding: false,
        enableResizing: false,
        grow: false,
        ...opts,
      });
    }

    if (enableRowNumbers) {
      const opts = displayColumnDefOptions?.['mrt-row-numbers'] || {};
      displayCols.push({
        id: '__row_numbers__',
        header: '#',
        cell: ({ row, table }) => {
          // Find the row's index in the fully filtered and sorted data model
          const sortedRows = table.getSortedRowModel().flatRows;
          const index = sortedRows.findIndex(r => r.id === row.id);
          return index !== -1 ? index + 1 : row.index + 1;
        },
        size: opts.size ?? 50,
        minSize: opts.minSize ?? 40,
        enableSorting: false,
        enableColumnFilter: false,
        grow: false,
        ...opts,
      });
    }

    if (enableExpanding || renderDetailPanel) {
      const opts = displayColumnDefOptions?.['mrt-row-expand'] || {};
      displayCols.push({
        id: '__expand__',
        header: '',
        cell: ({ row }) => (
          <IconButton size='small' onClick={row.getToggleExpandedHandler()}>
            {row.getIsExpanded() ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
          </IconButton>
        ),
        size: opts.size ?? 50,
        minSize: opts.minSize ?? 40,
        enableSorting: false,
        enableColumnFilter: false,
        grow: false,
        ...opts,
      });
    }

    const dataCols = columns.map((col) => ({
      ...col,
      filterFn: col.filterVariant ? filterFnByVariant[col.filterVariant] : filterFnByVariant.text,
    }));

    if (actionMode !== 'none') {
      const opts = displayColumnDefOptions?.['mrt-row-actions'] || {};
      displayCols.push({
        id: '__actions__',
        header: 'Actions',
        cell: ({ row, table }) => {
          const meta = table.options.meta as ADTMeta<T>;
          const isEditing = meta?.editingRowId === row.id;

          if (isEditing) {
            return (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton
                  size='small'
                  color='primary'
                  onClick={async () => {
                    const errs = await meta.validateRow?.(meta.editValues || {}, row.original);
                    if (errs && Object.keys(errs).length > 0) {
                      meta.setRowErrors?.(errs);
                      return;
                    }
                    await meta.onRowSave?.(row.original, meta.editValues || {});
                    meta.setEditingRowId?.(null);
                  }}
                >
                  <Save fontSize='small' />
                </IconButton>
                <IconButton size='small' color='error' onClick={() => meta.setEditingRowId?.(null)}>
                  <Cancel fontSize='small' />
                </IconButton>
              </Box>
            );
          }

          return (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {enableEditing && (
                <IconButton
                  size='small'
                  onClick={() => {
                    meta.setEditingRowId?.(row.id);
                    meta.setEditValues?.({ ...row.original });
                  }}
                >
                  <Edit fontSize='small' />
                </IconButton>
              )}
              {actionMode === 'inline' ? (
                renderRowActions?.({ row, table })
              ) : (
                <RowActionMenu row={row.original} render={(_, closeMenu) => renderRowActionMenuItems?.({ row, table, closeMenu })} />
              )}
            </Box>
          );
        },
        size: opts.size ?? 100,
        enableSorting: false,
        enableColumnFilter: false,
        grow: false,
        ...opts,
      });
    }

    return [...displayCols, ...dataCols];
  }, [
    columns,
    enableRowNumbers,
    enableExpanding,
    renderDetailPanel,
    enableRowSelection,
    actionMode,
    renderRowActions,
    renderRowActionMenuItems,
    enableEditing,
    displayColumnDefOptions,
  ]);
}
