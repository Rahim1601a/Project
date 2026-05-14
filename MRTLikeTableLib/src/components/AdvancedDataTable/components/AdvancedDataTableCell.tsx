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
    [enableClickToCopy, isEditing, isActionCell, cell]
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
        <Box className='advanced-data-table__cell-content--grouped'>
          <IconButton size='small' onClick={cell.row.getToggleExpandedHandler()} className='advanced-data-table__toggle-expand-button'>
            <KeyboardArrowDown
              fontSize='small'
              className={`advanced-data-table__expand-icon ${cell.row.getIsExpanded() ? 'is-expanded' : 'is-collapsed'}`}
            />
          </IconButton>
          <GroupWork fontSize='small' color='action' className='advanced-data-table__grouping-icon' />
          <Typography variant='body2' noWrap className='advanced-data-table__group-title'>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </Typography>
          <Typography variant='caption' color='text.secondary' noWrap className='advanced-data-table__group-count'>
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
      return <Box className='advanced-data-table__action-cell-content'>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Box>;
    }

    return (
      <Box className='advanced-data-table__cell-content'>
        <Box className='advanced-data-table__cell-text'>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Box>
        {enableClickToCopy && !isActionCell && <ContentCopy className='advanced-data-table__cell-copy-icon' />}
      </Box>
    );
  };

  const padding = CELL_PADDING[density] ?? CELL_PADDING.small;
  const cellPadding = isActionCell ? padding.action : padding.data;
  const grow = (cell.column.columnDef as any).grow;

  /** Memoize inline styles to avoid object re-creation */
  const inlineStyle = useMemo(() => {
    const size = cell.column.getSize();
    return {
      flexBasis: grow ? 1 : size,
      width: grow ? 0 : size,
      minWidth: grow ? 100 : size,
      flexShrink: 0,

      position: (isPinned ? 'sticky' : 'relative') as React.CSSProperties['position'],
      left: isPinned === 'left' ? cell.column.getStart('left') : undefined,
      right: isPinned === 'right' ? cell.column.getAfter('right') : undefined,
    };
  }, [cell.column, cell.column.getSize(), grow, isPinned]);

  return (
    <Box
      role='cell'
      data-grow={grow ? 'true' : 'false'}
      style={inlineStyle}
      className={`advanced-data-table__cell ${isActionCell ? 'advanced-data-table__cell--action' : ''}`}
      sx={{
        zIndex: isPinned ? 2 : 1,
        backgroundColor: isPinned ? 'background.paper' : 'inherit',
        height: ROW_HEIGHTS[density],
        minHeight: ROW_HEIGHTS[density],
        maxHeight: ROW_HEIGHTS[density],
        p: cellPadding,
        cursor: enableClickToCopy && !isActionCell ? 'copy' : 'default',
      }}
      onClick={handleCopy}
    >
      {renderContent()}
    </Box>
  );
}, cellAreEqual);
