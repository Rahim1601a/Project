import React, { memo, useCallback, useMemo } from 'react';
import { Box, TextField, IconButton, Typography } from '@mui/material';
import { KeyboardArrowDown, ContentCopy, GroupWork } from '@mui/icons-material';
import { flexRender } from '@tanstack/react-table';
import { CELL_PADDING, ROW_HEIGHTS, SYSTEM_COLUMN_IDS } from '../utils/constants';

/* =========================================================
   Cell Props
========================================================= */

interface AdvancedDataTableCellProps {
  cell: any;
  density: string;
  isSelected?: boolean;
  isExpanded?: boolean;
  enableClickToCopy?: boolean;
  isEditing?: boolean;
  editValue?: any;
  columnSizing?: Record<string, number>;
}

/* =========================================================
   Custom Equality — prevents re-renders unless relevant data changes.
   With 100 rows × 10 columns, this eliminates ~990 needless re-renders
   per interaction.
========================================================= */

function cellAreEqual(prev: AdvancedDataTableCellProps, next: AdvancedDataTableCellProps): boolean {
  return (
    prev.cell.getValue() === next.cell.getValue() &&
    prev.density === next.density &&
    prev.isEditing === next.isEditing &&
    prev.isSelected === next.isSelected &&
    prev.isExpanded === next.isExpanded &&
    prev.editValue === next.editValue &&
    prev.columnSizing?.[prev.cell.column.id] === next.columnSizing?.[next.cell.column.id]
  );
}

/* =========================================================
   Memoized Table Cell
========================================================= */

export const AdvancedDataTableCell = memo(function AdvancedDataTableCell({
  cell,
  density,
  enableClickToCopy,
  isEditing,
}: AdvancedDataTableCellProps) {
  const isPinned = cell.column.getIsPinned();
  const isGrouped = cell.getIsGrouped();
  const isPlaceholder = cell.getIsPlaceholder();
  const isAggregated = cell.getIsAggregated();

  const isActionCell = SYSTEM_COLUMN_IDS.includes(cell.column.id);

  const handleCopy = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!enableClickToCopy || isEditing || isActionCell) return;
      const target = event.target as HTMLElement;
      if (target.closest('input,button,textarea,select,label,[role="button"],[role="checkbox"]')) return;
      const text = cell.getValue()?.toString() || '';
      navigator.clipboard.writeText(text);
      window.dispatchEvent(new CustomEvent('table-copy', { detail: text }));
    },
    [enableClickToCopy, isEditing, cell],
  );

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
          slotProps={{
            input: {
              sx: {
                height: '100%', // ✅ match row
                alignItems: 'center',
              },
            },
          }}
        />
      );
    }

    if (isGrouped) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 1.5 }}>
          <IconButton size='small' onClick={cell.row.getToggleExpandedHandler()} sx={{ p: 0.5 }}>
            <KeyboardArrowDown
              fontSize='small'
              sx={{
                transform: cell.row.getIsExpanded() ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s',
              }}
            />
          </IconButton>
          <GroupWork fontSize='small' color='action' />
          <Typography variant='body2' sx={{ fontWeight: 600 }}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            ({cell.row.subRows?.length ?? 0} items)
          </Typography>
        </Box>
      );
    }

    if (isAggregated) {
      return flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext());
    }

    if (isPlaceholder) return null;

    if (isActionCell) {
      return flexRender(cell.column.columnDef.cell, cell.getContext());
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%', gap: 0.5 }}>
        <Box
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </Box>
        {enableClickToCopy && !isActionCell && (
          <ContentCopy
            sx={{
              ml: 'auto',
              fontSize: '0.85rem',
              opacity: 0.3,
              cursor: 'pointer',
              '&:hover': { opacity: 1, color: 'primary.main' },
              flexShrink: 0,
            }}
          />
        )}
      </Box>
    );
  };

  const padding = CELL_PADDING[density] ?? CELL_PADDING.small;
  const cellPadding = isActionCell ? padding.action : padding.data;

  /** Memoize inline styles to avoid object re-creation */
  const inlineStyle = useMemo(
    () => ({
      flexBasis: cell.column.getSize(),
      width: cell.column.getSize(),
      minWidth: cell.column.getSize(),
      flexShrink: 0,

      position: (isPinned ? 'sticky' : 'relative') as React.CSSProperties['position'],
      left: isPinned === 'left' ? cell.column.getStart('left') : undefined,
      right: isPinned === 'right' ? cell.column.getAfter('right') : undefined,
    }),
    [cell.column, cell.column.getSize(), isPinned],
  );

  return (
    <Box
      role='cell'
      style={inlineStyle}
      sx={{
        height: ROW_HEIGHTS[density], // ✅ FIXED HEIGHT
        minHeight: ROW_HEIGHTS[density],
        maxHeight: ROW_HEIGHTS[density],

        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        overflow: 'hidden',

        p: cellPadding,
      }}
      onClick={handleCopy}
    >
      {renderContent()}
    </Box>
  );
}, cellAreEqual);
