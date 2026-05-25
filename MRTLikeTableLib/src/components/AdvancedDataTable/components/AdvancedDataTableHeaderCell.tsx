import React, { useState } from 'react';
import { Box, Typography, IconButton, Tooltip, Menu, MenuItem } from '@mui/material';
import { ArrowDownward, ArrowUpward, MoreVert, DragIndicator, GroupWork, GroupOff } from '@mui/icons-material';
import type { Header } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ADTHeaderCellWrapper, ADTResizeHandle } from './AdvancedDataTable.styles';
import type { ADT_ColumnDef, ADTMeta } from '../types/types';
import { ColumnFilter } from './ColumnFilter';
import { autoSizeColumn } from '../utils/autoSizeColumn';

interface Props<T extends object> {
  header: Header<T, unknown>;
  style?: React.CSSProperties;
  enableColumnOrdering?: boolean;
  enableColumnPinning?: boolean;
  enableColumnResizing?: boolean;
  enableColumnGrouping?: boolean;
  showFilters?: boolean;
  columnSizing: Record<string, number>;
  setColumnSizing: (sizing: any) => void;
}

function AdvancedDataTableHeaderCellInner<T extends object>({
  header,
  style: externalStyle,
  enableColumnOrdering,
  enableColumnPinning,
  enableColumnResizing,
  enableColumnGrouping,
  showFilters,
}: Props<T>) {
  const { column } = header;
  const colDef = column.columnDef as ADT_ColumnDef<T>;
  const isPinned = column.getIsPinned();
  const isDisplayColumn = column.id.startsWith('__');

  const [pinMenuAnchor, setPinMenuAnchor] = useState<HTMLElement | null>(null);
  const isPinMenuOpen = Boolean(pinMenuAnchor);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    disabled: !enableColumnOrdering || isDisplayColumn,
  });

  const finalStyle: React.CSSProperties = {
    ...externalStyle,
    transform: externalStyle?.transform ?? CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 30 : isPinned ? 25 : 1,
    width: externalStyle?.width ?? header.getSize(),
    minWidth: externalStyle?.minWidth ?? header.getSize(),
    ...(isPinned === 'left' ? { left: column.getStart('left'), position: 'sticky', zIndex: 25 } : {}),
    ...(isPinned === 'right' ? { right: column.getAfter('right'), position: 'sticky', zIndex: 25 } : {}),
  };

  const handleSort = (e: React.MouseEvent) => {
    if (column.getCanSort()) {
      column.getToggleSortingHandler()?.(e);
    }
  };

  const openPinMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setPinMenuAnchor(event.currentTarget);
  };

  const closePinMenu = () => setPinMenuAnchor(null);

  const handlePinSelection = (position: 'left' | 'right' | false) => {
    column.pin(position);
    closePinMenu();
  };

  const handleAutoSize = () => {
    closePinMenu();
    autoSizeColumn(header.getContext().table, column.id);
  };

  const handleResizeStart = (event: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();

    if ('detail' in event && event.detail === 2) {
      return;
    }

    header.getResizeHandler()(event as any);
  };

  const canGroupColumn = enableColumnGrouping && !isDisplayColumn && column.getCanGroup();

  const cellProps = typeof colDef.muiTableHeadCellProps === 'function'
    ? colDef.muiTableHeadCellProps({ column, table: header.getContext().table, header })
    : colDef.muiTableHeadCellProps || {};

  const { style: cellStyle, sx: cellSx, ...otherCellProps } = cellProps;

  const mergedStyle: React.CSSProperties = {
    ...finalStyle,
    ...cellStyle,
  };

  return (
    <ADTHeaderCellWrapper
      data-column-id={column.id}
      aria-sort={column.getIsSorted() === 'desc' ? 'descending' : column.getIsSorted() === 'asc' ? 'ascending' : 'none'}
      ref={setNodeRef}
      style={mergedStyle}
      sx={cellSx}
      isPinned={!!isPinned}
      grow={colDef.grow}
      {...otherCellProps}
    >
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0, marginBottom: showFilters ? '8px' : 0 }}>
        {enableColumnOrdering && !isDisplayColumn && (
          <Box
            {...attributes}
            {...listeners}
            sx={{ cursor: 'grab', display: 'flex', mr: 0.5, opacity: 0.5, flexShrink: 0, '&:hover': { opacity: 1 } }}
          >
            <DragIndicator fontSize='small' />
          </Box>
        )}

        {canGroupColumn && (
          <Tooltip title={column.getIsGrouped() ? 'Remove grouping' : 'Group by this column'}>
            <IconButton
              size='small'
              onClick={(e) => {
                e.stopPropagation();
                column.toggleGrouping();
              }}
              sx={{
                p: 0.25,
                mr: 0.25,
                opacity: column.getIsGrouped() ? 1 : 0.35,
                flexShrink: 0,
              }}
            >
              {column.getIsGrouped() ? <GroupWork fontSize='small' /> : <GroupOff fontSize='small' />}
            </IconButton>
          </Tooltip>
        )}

        <Box
          onClick={handleSort}
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexGrow: 1,
            minWidth: 0,
            cursor: column.getCanSort() ? 'pointer' : 'default',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant='subtitle2'
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              lineHeight: 1.2,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {header.isPlaceholder ? null : flexRender(colDef.header, header.getContext())}
          </Typography>

          {column.getIsSorted() && (
            <Box
              sx={{
                ml: 0.5,
                display: 'flex',
                color: 'primary.main',
                flexShrink: 0,
              }}
            >
              {column.getIsSorted() === 'desc' ? <ArrowDownward fontSize='inherit' /> : <ArrowUpward fontSize='inherit' />}
            </Box>
          )}
        </Box>

        {enableColumnPinning && !isDisplayColumn && column.getCanPin?.() !== false && (
          <>
            <IconButton size='small' onClick={openPinMenu} sx={{ p: 0.25, opacity: 0.7, flexShrink: 0 }}>
              <MoreVert sx={{ fontSize: '1rem' }} />
            </IconButton>

            <Menu
              anchorEl={pinMenuAnchor}
              open={isPinMenuOpen}
              onClose={closePinMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              onClick={(event) => event.stopPropagation()}
            >
              <MenuItem onClick={() => handlePinSelection('left')} selected={isPinned === 'left'}>
                {isPinned === 'left' ? 'Unpin from left' : 'Pin left'}
              </MenuItem>
              <MenuItem onClick={() => handlePinSelection('right')} selected={isPinned === 'right'}>
                {isPinned === 'right' ? 'Unpin from right' : 'Pin right'}
              </MenuItem>
              <MenuItem onClick={() => handlePinSelection(false)} disabled={!isPinned}>
                Unpin
              </MenuItem>
              {enableColumnResizing && <MenuItem onClick={handleAutoSize}>Auto-size column</MenuItem>}
            </Menu>
          </>
        )}
      </div>

      {showFilters && column.getCanFilter() && (
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            width: '100%',
            minWidth: 0,
          }}
        >
          <ColumnFilter column={column} filterOptions={(header.getContext().table.options.meta as ADTMeta<T>)?.filterOptions} />
        </div>
      )}

      {enableColumnResizing && column.getCanResize() && (
        <ADTResizeHandle
          onPointerDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          onClick={(e) => {
            if (e.detail === 2) {
              e.stopPropagation();
              e.preventDefault();
              handleAutoSize();
            }
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleAutoSize();
          }}
          isResizing={column.getIsResizing()}
        />
      )}
    </ADTHeaderCellWrapper>
  );
}

export const AdvancedDataTableHeaderCell = AdvancedDataTableHeaderCellInner;
