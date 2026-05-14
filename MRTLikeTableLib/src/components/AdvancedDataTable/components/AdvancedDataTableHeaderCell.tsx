import React, { memo, useState } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { PushPin, ViewModule } from '@mui/icons-material';
import type { VisibilityState } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ColumnFilter } from './ColumnFilter';
import { CELL_PADDING, SYSTEM_COLUMN_IDS } from '../utils/constants';
import { autoSizeColumn } from '../utils/autoSizeColumn';

/* =========================================================
   Draggable Header
========================================================= */

const DraggableHeader = memo(function DraggableHeader({
  id,
  children,
  isSortable,
  isSorted,
  onSort,
}: {
  id: string;
  children: React.ReactNode;
  isSortable?: boolean;
  isSorted?: false | 'asc' | 'desc';
  onSort?: (event: unknown) => void;
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.5 : 1,
    whiteSpace: 'nowrap',
    fontWeight: 600,
  };

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Box
        component='span'
        onClick={isSortable ? onSort : undefined}
        sx={{
          cursor: isSortable ? 'pointer' : 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          '&:hover': isSortable ? { color: 'primary.main' } : {},
        }}
      >
        {children}
        {isSorted && (
          <Typography variant='caption' sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            {isSorted === 'asc' ? '↑' : '↓'}
          </Typography>
        )}
      </Box>
    </Box>
  );
});

/* =========================================================
   Resize Handle
========================================================= */

const ResizeHandle = memo(function ResizeHandle({ header, columnResizeDirection = 'ltr' }: { header: any; columnResizeDirection?: 'ltr' | 'rtl' }) {
  if (!header.column.getCanResize()) return null;

  const isResizing = header.column.getIsResizing();
  const isRTL = columnResizeDirection === 'rtl';

  return (
    <Box
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        autoSizeColumn(header.getContext().table, header.column.id);
      }}
      sx={{
        position: 'absolute',
        top: 0,
        [isRTL ? 'left' : 'right']: 0,
        height: '100%',
        width: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'col-resize',
        zIndex: 5,
        [isRTL ? 'marginLeft' : 'marginRight']: '-2px',
        userSelect: 'none',

        // invisible by default
        '&::before': {
          content: '""',
          position: 'absolute',
          [isRTL ? 'left' : 'right']: '2px',
          width: '2px',
          height: '60%',
          borderRadius: '2px',
          backgroundColor: isResizing ? 'primary.main' : 'divider',
          transition: 'all 0.2s ease',
        },

        // hover effect (like MRT)
        '&:hover::before': {
          backgroundColor: 'primary.main',
          height: '80%',
          width: '3px',
        },

        // active resizing state
        ...(isResizing && {
          '&::before': {
            width: '3px',
            backgroundColor: 'primary.main',
            height: '90%',
          },
        }),
      }}
    />
  );
});

/* =========================================================
   Memoized Header Cell
========================================================= */

export const AdvancedDataTableHeaderCell = memo(function AdvancedDataTableHeaderCell({
  header,
  density,
  enableColumnOrdering,
  enableColumnPinning,
  enableGrouping,
  showFilters,
  filterOptions,
  columnResizeDirection = 'ltr',
}: {
  header: any;
  density: string;
  enableColumnOrdering: boolean;
  enableColumnPinning: boolean;
  enableGrouping: boolean;
  showFilters: boolean;
  columnVisibility: VisibilityState;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  columnSizing: any;
  filterOptions?: Record<string, Array<string | { label?: string; value: any }>>;
  columnResizeDirection?: 'ltr' | 'rtl';
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const isPinned = header.column.getIsPinned();
  const grow = (header.column.columnDef as any).grow;
  const size = header.getSize();
  const style: React.CSSProperties = {
    flexBasis: grow ? 1 : size,
    width: grow ? 0 : size,
    minWidth: grow ? 100 : size,
    flexShrink: 0,

    position: isPinned ? 'sticky' : 'relative',
    left: isPinned === 'left' ? header.column.getStart('left') : undefined,
    right: isPinned === 'right' ? header.column.getAfter('right') : undefined,
    zIndex: isPinned ? 3 : 1,
  };

  const isActionColumn = SYSTEM_COLUMN_IDS.some((id) => header.column.id === id);
  const padding = CELL_PADDING[density] ?? CELL_PADDING.small;
  const headerPadding = isActionColumn ? padding.action : padding.data;
  const isSystemColumn = SYSTEM_COLUMN_IDS.includes(header.column.id);

  return (
    <Box
      role='columnheader'
      data-grow={grow ? 'true' : 'false'}
      style={style}
      className={`advanced-data-table__header-cell ${isActionColumn ? 'advanced-data-table__header-cell--action' : 'advanced-data-table__header-cell--data'}`}
      sx={{
        p: headerPadding,
        zIndex: isPinned ? 3 : 1,
      }}
    >
      {isActionColumn ? (
        <Box className='advanced-data-table__action-cell-content'>{flexRender(header.column.columnDef.header, header.getContext())}</Box>
      ) : (
        <Box className='advanced-data-table__header-content'>
          <Box className='advanced-data-table__header-title-row'>
            {enableColumnOrdering && !isSystemColumn ? (
              <DraggableHeader
                id={header.id}
                isSortable={header.column.getCanSort()}
                isSorted={header.column.getIsSorted()}
                onSort={header.column.getToggleSortingHandler()}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </DraggableHeader>
            ) : (
              <Box
                className='advanced-data-table__draggable-header-title'
                sx={{
                  cursor: header.column.getCanSort() ? 'pointer' : 'default',
                }}
                onClick={header.column.getToggleSortingHandler()}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {header.column.getIsSorted() && (
                  <Typography variant='caption' className='advanced-data-table__header-sort-icon'>
                    {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                  </Typography>
                )}
              </Box>
            )}

            {enableGrouping && header.column.getCanGroup() && (
              <IconButton
                size='small'
                onClick={() => header.column.toggleGrouping()}
                className={`advanced-data-table__grouping-button ${header.column.getIsGrouped() ? 'is-grouped' : ''}`}
              >
                <ViewModule sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            )}

            {enableColumnPinning && !header.column.id.startsWith('__') && (
              <>
                <IconButton
                  size='small'
                  onClick={handleOpen}
                  className={`advanced-data-table__pin-button ${header.column.getIsPinned() ? 'is-pinned' : ''}`}
                >
                  <PushPin sx={{ fontSize: '0.9rem', transform: header.column.getIsPinned() ? 'rotate(45deg)' : 'none' }} />
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                  <MenuItem
                    onClick={() => {
                      header.column.pin(header.column.getIsPinned() === 'left' ? false : 'left');
                      handleClose();
                    }}
                  >
                    <ListItemIcon>
                      <PushPin fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>{header.column.getIsPinned() === 'left' ? 'Unpin' : 'Pin Left'}</ListItemText>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      header.column.pin(header.column.getIsPinned() === 'right' ? false : 'right');
                      handleClose();
                    }}
                  >
                    <ListItemIcon>
                      <PushPin fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>{header.column.getIsPinned() === 'right' ? 'Unpin' : 'Pin Right'}</ListItemText>
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>

          {showFilters && header.column.getCanFilter() && <ColumnFilter column={header.column} filterOptions={filterOptions} />}
        </Box>
      )}
      <ResizeHandle header={header} columnResizeDirection={columnResizeDirection} />
    </Box>
  );
});
