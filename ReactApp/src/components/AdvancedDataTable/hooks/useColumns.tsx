import React, { useMemo } from 'react';
import { Box, Checkbox, IconButton, Tooltip, Typography } from '@mui/material';
import { KeyboardArrowDown, Edit, Save, Cancel } from '@mui/icons-material';
import type { FilterFn } from '@tanstack/react-table';
import type { ADT_ColumnDef } from '../types/types';
import { filterFnByVariant } from '../utils/filters';
import { RowActionMenu } from '../components/RowActionMenu';

interface UseColumnsProps<T extends object> {
  columns: ADT_ColumnDef<T>[];
  enableRowNumbers?: boolean;
  renderDetailPanel?: (props: { row: any }) => React.ReactNode;
  enableExpanding?: boolean;
  actionMode?: 'none' | 'inline' | 'menu';
  renderRowActions?: (row: T) => React.ReactNode;
  renderRowActionMenuItems?: (row: T, close: () => void) => React.ReactNode;
  enableEditing?: boolean;
  enableRowSelection?: boolean;
  onRowSave?: (oldRow: T, newValues: Record<string, any>) => Promise<void> | void;
  /** MRT compatible - options for built-in display columns */
  displayColumnDefOptions?: Record<string, { size?: number; maxSize?: number; minSize?: number; enableResizing?: boolean; grow?: boolean }>;
}

export function useColumns<T extends object>({
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
}: UseColumnsProps<T>) {
  return useMemo<ADT_ColumnDef<T>[]>(() => {
    const cols: ADT_ColumnDef<T>[] = [];

    // 1. Row Numbers
    if (enableRowNumbers) {
      const opts = displayColumnDefOptions?.['mrt-row-numbers'] || {};
      cols.push({
        id: '__row_numbers__',
        header: '#',
        size: opts.size ?? 50,
        minSize: opts.minSize ?? 40,
        maxSize: opts.maxSize ?? 60,
        enableResizing: opts.enableResizing ?? false,
        grow: opts.grow,
        enableSorting: false,
        enableColumnFilter: false,
        enableHiding: false,
        cell: ({ row }) => (
          <Typography component='span' variant='caption' color='text.secondary'>
            {row.index + 1}
          </Typography>
        ),
      });
    }

    // 2. Expand Column
    if (renderDetailPanel || enableExpanding) {
      const opts = displayColumnDefOptions?.['mrt-expand'] || {};
      cols.push({
        id: '__expand__',
        header: '',
        size: opts.size ?? 50,
        minSize: opts.minSize ?? 40,
        maxSize: opts.maxSize ?? 60,
        enableResizing: opts.enableResizing ?? false,
        grow: opts.grow,
        enableSorting: false,
        enableColumnFilter: false,
        enableHiding: false,
        cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <IconButton
              size='small'
              onClick={row.getToggleExpandedHandler()}
              sx={{
                transform: row.getIsExpanded() ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              <KeyboardArrowDown fontSize='small' />
            </IconButton>
          </Box>
        ),
      });
    }

    // 3. Selection Column
    if (enableRowSelection) {
      const opts = displayColumnDefOptions?.['mrt-row-select'] || {};
      cols.push({
        id: '__select__',
        size: opts.size ?? 50,
        minSize: opts.minSize ?? 40,
        maxSize: opts.maxSize ?? 60,
        enableResizing: opts.enableResizing ?? false,
        grow: opts.grow,
        enableSorting: false,
        enableColumnFilter: false,
        enableHiding: false,
        header: ({ table }) => {
          const isAll = table.getIsAllRowsSelected();
          const isSome = table.getIsSomeRowsSelected();
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <Checkbox
                size='small'
                indeterminate={isSome && !isAll}
                checked={isAll}
                onChange={table.getToggleAllRowsSelectedHandler()}
                sx={{
                  padding: 0, // ✅ REMOVE DEFAULT MUI PADDING
                  height: '100%',
                  alignSelf: 'center',
                }}
              />
            </Box>
          );
        },
        cell: ({ row }) => {
          const sel = row.getIsSelected();
          const can = row.getCanSelect();
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <Checkbox
                key={`cb-${row.id}`}
                size='small'
                checked={sel}
                onChange={row.getToggleSelectedHandler()}
                disabled={!can}
                sx={{
                  padding: 0, // ✅ REMOVE DEFAULT MUI PADDING
                  height: '100%',
                  alignSelf: 'center',
                }}
              />
            </Box>
          );
        },
      });
    }

    // 4. Data Columns
    cols.push(
      ...columns.map((col) => {
        if (col.filterVariant === 'multi-select') {
          const logic = col.multiSelectLogic ?? 'OR';
          return {
            ...col,
            minSize: col.minSize ?? 80,
            maxSize: col.maxSize ?? 320,
            grow: col.grow,
            filterFn: ((row, columnId, value) => {
              if (!Array.isArray(value) || value.length === 0) return true;
              const cell = String(row.getValue(columnId)).toLowerCase();
              return logic === 'AND'
                ? value.every((v) => cell.includes(String(v).toLowerCase()))
                : value.some((v) => cell === String(v).toLowerCase());
            }) satisfies FilterFn<any>,
          };
        }
        return {
          ...col,
          grow: col.grow,
          filterFn: col.filterVariant && filterFnByVariant[col.filterVariant] ? filterFnByVariant[col.filterVariant] : filterFnByVariant.text,
        };
      })
    );

    // 5. Actions Column
    if (actionMode !== 'none') {
      const opts = displayColumnDefOptions?.['mrt-row-actions'] || {};
      cols.push({
        id: '__actions__',
        header: 'Actions',
        size: opts.size ?? 60,
        minSize: opts.minSize ?? 100,
        maxSize: opts.maxSize ?? 150,
        enableResizing: opts.enableResizing ?? false,
        grow: opts.grow,
        enableSorting: false,
        enableColumnFilter: false,
        enableHiding: false,
        cell: ({ row, table: t }) => {
          const meta = (t.options as any).meta;
          const isEd = meta.editingRowId === row.id;

          if (isEd) {
            return (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%', // ✅ MATCH CELL
                }}
              >
                <Tooltip title='Save'>
                  <IconButton
                    size='small'
                    color='primary'
                    sx={{
                      padding: '4px', // ✅ REMOVE DEFAULT 12px
                      height: '100%',
                    }}
                    onClick={async () => {
                      const errs = await meta.validateRow?.(meta.editValues, row.original);
                      if (errs && Object.keys(errs).length > 0) {
                        meta.setRowErrors?.(errs);
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
                    sx={{
                      padding: '4px', // ✅ REMOVE DEFAULT 12px
                      height: '100%',
                    }}
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
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%', // ✅ MATCH CELL
              }}
            >
              {enableEditing && (
                <Tooltip title='Edit'>
                  <IconButton
                    size='small'
                    sx={{
                      padding: '4px',
                    }}
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

    return cols;
  }, [
    columns,
    actionMode,
    renderRowActions,
    renderRowActionMenuItems,
    enableRowNumbers,
    renderDetailPanel,
    enableExpanding,
    enableEditing,
    displayColumnDefOptions,
  ]);
}
