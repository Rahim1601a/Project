import type React from 'react';
import { memo } from 'react';
import type { Cell } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { Box, IconButton, Tooltip, TextField } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import { ADTCellWrapper } from './AdvancedDataTable.styles';
import type { ADT_ColumnDef, ADTMeta } from '../types/types';

interface Props<T extends object> {
  cell: Cell<T, unknown>;
  style?: React.CSSProperties;
}

function AdvancedDataTableCellInner<T extends object>({ cell, style }: Props<T>) {
  const { column, row, getContext } = cell;
  const colDef = column.columnDef as ADT_ColumnDef<T>;
  const isPinnedState = column.getIsPinned();
  
  const meta = getContext().table.options.meta as ADTMeta<T>;
  const isEditingRow = meta?.editingRowId === row.id;
  const isEditableCell = isEditingRow && colDef.enableEditing !== false && 
    !['__actions__', '__select__', '__row_numbers__', '__expand__'].includes(column.id);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const val = cell.getValue();
    if (val != null) {
      navigator.clipboard.writeText(String(val));
      window.dispatchEvent(new CustomEvent('adt-copy', { detail: String(val) }));
    }
  };

  const finalStyle: React.CSSProperties = {
    ...style,
    width: style?.width ?? column.getSize(),
    ...(isPinnedState === 'left' ? { left: column.getStart('left'), zIndex: 11, position: 'sticky' } : {}),
    ...(isPinnedState === 'right' ? { right: column.getAfter('right'), zIndex: 11, position: 'sticky' } : {}),
  };

  const renderCellContent = () => {
    if (isEditableCell) {
      const editValue = meta?.editValues?.[column.id] ?? cell.getValue() ?? '';
      const error = meta?.rowErrors?.[column.id as keyof T] as string | undefined;

      return (
        <TextField
          variant="standard"
          size="small"
          fullWidth
          value={editValue}
          error={!!error}
          helperText={error}
          onChange={(e) => {
            meta?.setEditValues?.((prev) => ({
              ...prev,
              [column.id]: e.target.value,
            }));
          }}
          onClick={(e) => e.stopPropagation()} // Prevent row click events
        />
      );
    }

    return flexRender(colDef.cell, getContext());
  };

  return (
    <ADTCellWrapper role='gridcell' style={finalStyle} isPinned={!!isPinnedState} grow={colDef.grow}>
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
        <Box
          sx={{
            flexGrow: 1,
            fontSize: 'inherit',
            display: 'block',
          }}
        >
          {renderCellContent()}
        </Box>

        {colDef.enableClickToCopy && cell.getValue() != null && !isEditableCell && (
          <Tooltip title='Copy to clipboard'>
            <IconButton size='small' onClick={handleCopy} sx={{ ml: 0.5, p: 0.25, opacity: 0.6, '&:hover': { opacity: 1 } }}>
              <ContentCopy sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </ADTCellWrapper>
  );
}

export const AdvancedDataTableCell = memo(AdvancedDataTableCellInner, (prev, next) => {
  const prevMeta = prev.cell.getContext().table.options.meta as ADTMeta<any>;
  const nextMeta = next.cell.getContext().table.options.meta as ADTMeta<any>;
  
  const colId = prev.cell.column.id;
  const isEditingPrev = prevMeta?.editingRowId === prev.cell.row.id;
  const isEditingNext = nextMeta?.editingRowId === next.cell.row.id;
  
  const prevEditValue = isEditingPrev ? prevMeta?.editValues?.[colId] : undefined;
  const nextEditValue = isEditingNext ? nextMeta?.editValues?.[colId] : undefined;
  
  const prevError = isEditingPrev ? prevMeta?.rowErrors?.[colId] : undefined;
  const nextError = isEditingNext ? nextMeta?.rowErrors?.[colId] : undefined;

  return (
    prev.cell.getValue() === next.cell.getValue() &&
    prev.cell.column.id === next.cell.column.id &&
    prev.cell.column.getSize() === next.cell.column.getSize() &&
    prev.cell.column.getIsPinned() === next.cell.column.getIsPinned() &&
    prev.style?.transform === next.style?.transform &&
    prev.style?.width === next.style?.width &&
    isEditingPrev === isEditingNext &&
    prevEditValue === nextEditValue &&
    prevError === nextError
  );
}) as typeof AdvancedDataTableCellInner;
