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

const ResizeHandle = memo(function ResizeHandle({ header }: { header: any }) {
  if (!header.column.getCanResize()) return null;

  return (
    <Box
      onMouseDown={header.getResizeHandler()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        autoSizeColumn(header.getContext().table, header.column.id);
      }}
      sx={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: 10,
        height: '100%',
        cursor: 'col-resize',
        userSelect: 'none',
        '&:hover': {
          backgroundColor: 'primary.main',
        },
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
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const isPinned = header.column.getIsPinned();
  const style: React.CSSProperties = {
    flexBasis: header.getSize(),
    width: header.getSize(),
    minWidth: header.getSize(),
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
      style={style}
      sx={{
        position: 'relative',
        p: headerPadding,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: isActionColumn ? 'center' : 'flex-start',
        boxSizing: 'border-box',
        overflow: 'hidden',
        borderBottom: '2px solid',
        borderColor: 'divider',
        fontWeight: isActionColumn ? 'normal' : 'bold',
        bgcolor: 'background.paper',
      }}
    >
      {isActionColumn ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          {flexRender(header.column.columnDef.header, header.getContext())}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'flex-start' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              gap: 0.5,
              justifyContent: 'flex-start',
            }}
          >
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
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: header.column.getCanSort() ? 'pointer' : 'default',
                  fontWeight: 600,
                }}
                onClick={header.column.getToggleSortingHandler()}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {header.column.getIsSorted() && (
                  <Typography variant='caption' color='primary'>
                    {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                  </Typography>
                )}
              </Box>
            )}

            {enableGrouping && header.column.getCanGroup() && (
              <IconButton
                size='small'
                onClick={() => header.column.toggleGrouping()}
                sx={{
                  ml: 0.5,
                  opacity: header.column.getIsGrouped() ? 1 : 0.3,
                  '&:hover': { opacity: 1 },
                  color: header.column.getIsGrouped() ? 'primary.main' : 'inherit',
                }}
              >
                <ViewModule sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            )}

            {enableColumnPinning && !header.column.id.startsWith('__') && (
              <>
                <IconButton
                  size='small'
                  onClick={handleOpen}
                  sx={{ ml: 'auto', opacity: header.column.getIsPinned() ? 1 : 0.3, '&:hover': { opacity: 1 } }}
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
      <ResizeHandle header={header} />
    </Box>
  );
});
