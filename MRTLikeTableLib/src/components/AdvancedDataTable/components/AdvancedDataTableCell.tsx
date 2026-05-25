import type React from 'react';
import type { Cell } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { Box, IconButton, Tooltip, TextField, Typography } from '@mui/material';
import { ContentCopy, KeyboardArrowRight, KeyboardArrowDown } from '@mui/icons-material';
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
  const isEditableCell =
    isEditingRow && colDef.enableEditing !== false && !['__actions__', '__select__', '__row_numbers__', '__expand__'].includes(column.id);

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
    minWidth: style?.minWidth ?? column.getSize(),
    ...(isPinnedState === 'left' ? { left: column.getStart('left'), zIndex: 11, position: 'sticky' } : {}),
    ...(isPinnedState === 'right' ? { right: column.getAfter('right'), zIndex: 11, position: 'sticky' } : {}),
  };

  const renderGroupedCellContent = () => {
    if (cell.getIsGrouped()) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            width: '100%',
            minWidth: 0,
            fontWeight: 700,
          }}
        >
          <IconButton
            size='small'
            disabled={!row.getCanExpand()}
            onClick={(event) => {
              event.stopPropagation();
              row.toggleExpanded();
            }}
            sx={{
              p: 0.25,
              flexShrink: 0,
            }}
          >
            {row.getIsExpanded() ? <KeyboardArrowDown fontSize='small' /> : <KeyboardArrowRight fontSize='small' />}
          </IconButton>

          <Box
            sx={{
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {flexRender(colDef.cell, getContext())}
          </Box>

          <Typography
            component='span'
            variant='caption'
            color='text.secondary'
            sx={{
              flexShrink: 0,
              ml: 0.5,
            }}
          >
            ({row.subRows.length})
          </Typography>
        </Box>
      );
    }

    if (cell.getIsAggregated()) {
      return flexRender(colDef.aggregatedCell ?? colDef.cell, getContext());
    }

    if (cell.getIsPlaceholder()) {
      return null;
    }

    return flexRender(colDef.cell, getContext());
  };

  const renderCellContent = () => {
    if (isEditableCell) {
      const editValue = meta?.editValues?.[column.id] ?? cell.getValue() ?? '';
      const error = meta?.rowErrors?.[column.id as keyof T] as string | undefined;

      return (
        <TextField
          variant='standard'
          size='small'
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

    return renderGroupedCellContent();
  };

  const cellProps = typeof colDef.muiTableBodyCellProps === 'function'
    ? colDef.muiTableBodyCellProps({ cell, column, row, table: getContext().table })
    : colDef.muiTableBodyCellProps || {};

  const { style: cellStyle, sx: cellSx, ...otherCellProps } = cellProps;

  const mergedStyle: React.CSSProperties = {
    ...finalStyle,
    ...cellStyle,
  };

  return (
    <ADTCellWrapper
      data-column-id={column.id}
      style={mergedStyle}
      sx={cellSx}
      isPinned={!!isPinnedState}
      grow={colDef.grow}
      {...otherCellProps}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0, overflow: 'hidden' }}>
        <Box
          className='adt-cell-content'
          sx={{
            flexGrow: 1,
            minWidth: 0,
            maxWidth: '100%',
            fontSize: 'inherit',
            display: 'block',
            overflow: 'hidden',
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            lineHeight: 1.35,
          }}
        >
          {renderCellContent()}
        </Box>

        {colDef.enableClickToCopy && cell.getValue() != null && !isEditableCell && !cell.getIsGrouped() && (
          <Tooltip title='Copy to clipboard'>
            <IconButton size='small' onClick={handleCopy} sx={{ ml: 0.5, p: 0.25, opacity: 0.6, flexShrink: 0, '&:hover': { opacity: 1 } }}>
              <ContentCopy sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </ADTCellWrapper>
  );
}

export const AdvancedDataTableCell = AdvancedDataTableCellInner;
