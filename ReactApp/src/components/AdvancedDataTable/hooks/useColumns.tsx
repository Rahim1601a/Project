import React, { useMemo } from 'react';
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
  enableClickToCopy?: boolean;
}

export function useColumns<T extends object>({
  columns,
  enableRowNumbers,
  enableExpanding,
  renderDetailPanel,
  actionMode = 'inline',
  renderRowActions,
  renderRowActionMenuItems,
  enableEditing,
  enableRowSelection,
  displayColumnDefOptions,
  enableClickToCopy,
}: UseColumnsProps<T>) {
  return useMemo(() => {
    const leadingDisplayCols: ADT_ColumnDef<T>[] = [];
    let actionColumn: ADT_ColumnDef<T> | null = null;

    if (enableRowSelection) {
      const opts = displayColumnDefOptions?.['mrt-row-select'] || {};

      leadingDisplayCols.push({
        id: '__select__',
        header: ({ table }) => (
          <Checkbox
            size='small'
            indeterminate={table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
            checked={table.getIsAllRowsSelected()}
            onClick={(event) => {
              event.stopPropagation();
            }}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            size='small'
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onClick={(event) => {
              event.stopPropagation();
            }}
            onChange={(e) => {
              row.getToggleSelectedHandler()(e.nativeEvent);
            }}
          />
        ),
        size: opts.size ?? 50,
        minSize: opts.minSize ?? 40,
        maxSize: opts.maxSize ?? 70,
        enableSorting: false,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enableHiding: false,
        enableResizing: false,
        enableGrouping: false,
        grow: false,

        ...opts,
      });
    }

    if (enableExpanding || renderDetailPanel) {
      const opts = displayColumnDefOptions?.['mrt-row-expand'] || {};

      leadingDisplayCols.push({
        id: '__expand__',
        header: '',
        cell: ({ row }) => {
          if (row.getIsGrouped()) {
            return null;
          }

          const canExpand = row.getCanExpand();

          return (
            <IconButton
              size='small'
              disabled={!canExpand}
              aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
              onClick={(event) => {
                event.stopPropagation();

                if (canExpand) {
                  row.toggleExpanded();
                }
              }}
            >
              {row.getIsExpanded() ? <KeyboardArrowDown fontSize='small' /> : <KeyboardArrowRight fontSize='small' />}
            </IconButton>
          );
        },
        size: opts.size ?? 50,
        minSize: opts.minSize ?? 40,
        maxSize: opts.maxSize ?? 70,
        enableSorting: false,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enableHiding: false,
        enableResizing: false,
        enableGrouping: false,
        grow: false,
        ...opts,
      });
    }

    if (enableRowNumbers) {
      const opts = displayColumnDefOptions?.['mrt-row-numbers'] || {};

      leadingDisplayCols.push({
        id: '__row_numbers__',
        header: '#',
        cell: ({ row, table }) => {
          const sortedRows = table.getSortedRowModel().flatRows;
          const index = sortedRows.findIndex((currentRow) => currentRow.id === row.id);
          return index !== -1 ? index + 1 : row.index + 1;
        },
        size: opts.size ?? 60,
        minSize: opts.minSize ?? 50,
        maxSize: opts.maxSize ?? 80,
        enableSorting: false,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enableHiding: false,
        enableResizing: false,
        enableGrouping: false,
        grow: false,
        ...opts,
      });
    }

    const dataCols: ADT_ColumnDef<T>[] = columns.map((col) => ({
      ...col,
      enableClickToCopy: col.enableClickToCopy ?? enableClickToCopy,
      filterFn: col.filterFn ?? (col.filterVariant ? filterFnByVariant[col.filterVariant] : filterFnByVariant.text),
      enableGrouping: col.enableGrouping ?? true,
    }));

    if (actionMode !== 'none') {
      const opts = displayColumnDefOptions?.['mrt-row-actions'] || {};
      actionColumn = {
        id: '__actions__',
        header: 'Actions',
        cell: ({ row, table }) => {
          const meta = table.options.meta as ADTMeta<T>;
          const isEditing = meta?.editingRowId === row.id;

          if (isEditing) {
            return (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  width: '100%',
                }}
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                <IconButton
                  size='small'
                  color='primary'
                  aria-label='Save row'
                  onClick={async (event) => {
                    event.stopPropagation();

                    const errors = await meta.validateRow?.(meta.editValues || {}, row.original);

                    if (errors && Object.keys(errors).length > 0) {
                      meta.setRowErrors?.(errors);
                      return;
                    }

                    await meta.onRowSave?.(row.original, meta.editValues || {});

                    meta.setEditingRowId?.(null);
                    meta.setEditValues?.({});
                    meta.setRowErrors?.({});
                  }}
                >
                  <Save fontSize='small' />
                </IconButton>

                <IconButton
                  size='small'
                  color='error'
                  aria-label='Cancel editing'
                  onClick={(event) => {
                    event.stopPropagation();

                    meta.setEditingRowId?.(null);
                    meta.setEditValues?.({});
                    meta.setRowErrors?.({});
                  }}
                >
                  <Cancel fontSize='small' />
                </IconButton>
              </Box>
            );
          }

          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                width: '100%',
              }}
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              {enableEditing && (
                <IconButton
                  size='small'
                  aria-label='Edit row'
                  onClick={(event) => {
                    event.stopPropagation();

                    meta.setEditingRowId?.(row.id);
                    meta.setEditValues?.({ ...row.original });
                    meta.setRowErrors?.({});
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
        size: opts.size ?? 110,
        minSize: opts.minSize ?? 90,
        maxSize: opts.maxSize ?? 180,
        enableSorting: false,
        enableColumnFilter: false,
        enableGlobalFilter: false,
        enableHiding: false,
        enableResizing: false,
        enableGrouping: false,
        grow: false,
        ...opts,
      };
    }

    return actionColumn ? [...leadingDisplayCols, ...dataCols, actionColumn] : [...leadingDisplayCols, ...dataCols];
  }, [
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
    enableClickToCopy,
  ]);
}
