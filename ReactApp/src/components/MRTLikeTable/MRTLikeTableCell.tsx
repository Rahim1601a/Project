import React, { memo, useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  IconButton,
  alpha,
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowRight,
  ContentCopy,
} from '@mui/icons-material';
import { flexRender } from '@tanstack/react-table';
import { CELL_PADDING, SYSTEM_COLUMN_IDS } from './constants';

/* =========================================================
   Cell Props
========================================================= */

interface MRTLikeTableCellProps {
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

function cellAreEqual(prev: MRTLikeTableCellProps, next: MRTLikeTableCellProps): boolean {
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

export const MRTLikeTableCell = memo(function MRTLikeTableCell({
  cell,
  density,
  enableClickToCopy,
  isEditing,
}: MRTLikeTableCellProps) {
  const isPinned = cell.column.getIsPinned();
  const isGrouped = cell.getIsGrouped();
  const isPlaceholder = cell.getIsPlaceholder();
  const isAggregated = cell.getIsAggregated();

  const handleCopy = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!enableClickToCopy || isEditing || isActionCell) return;
    const target = event.target as HTMLElement;
    if (target.closest('input,button,textarea,select,label,[role="button"],[role="checkbox"]')) return;
    const text = cell.getValue()?.toString() || '';
    navigator.clipboard.writeText(text);
  }, [enableClickToCopy, isEditing, cell]);

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

    if (isActionCell) {
      return flexRender(cell.column.columnDef.cell, cell.getContext());
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 0.5 }}>
        <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1 }}>
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

  const isActionCell = SYSTEM_COLUMN_IDS.includes(cell.column.id);
  const padding = CELL_PADDING[density] ?? CELL_PADDING.small;
  const cellPadding = isActionCell ? padding.action : padding.data;

  /** Memoize inline styles to avoid object re-creation */
  const inlineStyle = useMemo(() => ({
    width: cell.column.getSize(),
    position: (isPinned ? 'sticky' : 'relative') as React.CSSProperties['position'],
    left: isPinned === 'left' ? cell.column.getStart('left') : undefined,
    right: isPinned === 'right' ? cell.column.getAfter('right') : undefined,
    flex: `0 0 ${cell.column.getSize()}px`,
  }), [cell.column, isPinned]);

  return (
    <Box
      role='cell'
      style={inlineStyle}
      sx={{
        p: cellPadding,
        zIndex: isPinned ? 2 : 1,
        backgroundColor: isPinned ? 'background.paper' : 'inherit',
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isActionCell ? 'center' : 'flex-start',
        boxSizing: 'border-box',
        overflow: 'hidden',
        height: '100%',
        cursor: enableClickToCopy && !isEditing && !isActionCell ? 'copy' : 'default',
        '&:hover': enableClickToCopy && !isEditing && !isActionCell ? { bgcolor: alpha('#000', 0.02) } : {},
      }}
      onClick={handleCopy}
    >
      {renderContent()}
    </Box>
  );
}, cellAreEqual);
