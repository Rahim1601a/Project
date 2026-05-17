import type React from 'react';
import { memo } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { ArrowDownward, ArrowUpward, PushPin, DragIndicator } from '@mui/icons-material';
import type { Header } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ADTHeaderCellWrapper, ADTResizeHandle } from './AdvancedDataTable.styles';
import type { ADT_ColumnDef, ADTMeta } from '../types/types';
import { ColumnFilter } from './ColumnFilter';

interface Props<T extends object> {
  header: Header<T, unknown>;
  style?: React.CSSProperties;
  enableColumnOrdering?: boolean;
  enableColumnPinning?: boolean;
  enableColumnResizing?: boolean;
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
  showFilters,
}: Props<T>) {
  const { column } = header;
  const colDef = column.columnDef as ADT_ColumnDef<T>;
  const isPinned = column.getIsPinned();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    disabled: !enableColumnOrdering || column.id.startsWith('__'),
  });

  const finalStyle: React.CSSProperties = {
    ...externalStyle,
    transform: externalStyle?.transform ?? CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 30 : isPinned ? 21 : 1,
    width: externalStyle?.width ?? header.getSize(),
    ...(isPinned === 'left' ? { left: column.getStart('left'), position: 'sticky', zIndex: 25 } : {}),
    ...(isPinned === 'right' ? { right: column.getAfter('right'), position: 'sticky', zIndex: 25 } : {}),
  };

  const handleSort = (e: React.MouseEvent) => {
    if (column.getCanSort()) {
      column.getToggleSortingHandler()?.(e);
    }
  };

  return (
    <ADTHeaderCellWrapper 
      role='columnheader' 
      aria-sort={column.getIsSorted() === 'desc' ? 'descending' : column.getIsSorted() === 'asc' ? 'ascending' : 'none'}
      ref={setNodeRef} 
      style={finalStyle} 
      isPinned={!!isPinned} 
      grow={colDef.grow}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: showFilters ? 1 : 0 }}>
        {enableColumnOrdering && !column.id.startsWith('__') && (
          <Box {...attributes} {...listeners} sx={{ cursor: 'grab', display: 'flex', mr: 0.5, opacity: 0.5, '&:hover': { opacity: 1 } }}>
            <DragIndicator fontSize='small' />
          </Box>
        )}

        <Box
          onClick={handleSort}
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexGrow: 1,
            cursor: column.getCanSort() ? 'pointer' : 'default',
            overflow: 'hidden',
          }}
        >
          <Typography variant='subtitle2' sx={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.2 }}>
            {flexRender(colDef.header, header.getContext())}
          </Typography>
          
          {column.getIsSorted() && (
            <Box sx={{ ml: 0.5, display: 'flex', color: 'primary.main' }}>
              {column.getIsSorted() === 'desc' ? <ArrowDownward fontSize='inherit' /> : <ArrowUpward fontSize='inherit' />}
            </Box>
          )}
        </Box>

        {enableColumnPinning && !column.id.startsWith('__') && (
          <IconButton size='small' onClick={() => column.pin(isPinned ? false : 'left')} sx={{ p: 0.25, opacity: isPinned ? 1 : 0.3 }}>
            <PushPin sx={{ fontSize: '1rem', transform: isPinned ? 'none' : 'rotate(45deg)' }} />
          </IconButton>
        )}
      </Box>

      {showFilters && column.getCanFilter() && (
        <Box onClick={(e) => e.stopPropagation()} sx={{ width: '100%' }}>
          <ColumnFilter 
            column={column} 
            filterOptions={(header.getContext().table.options.meta as ADTMeta<T>)?.filterOptions} 
          />
        </Box>
      )}

      {enableColumnResizing && column.getCanResize() && (
        <ADTResizeHandle
          onMouseDown={(e) => {
            e.stopPropagation();
            header.getResizeHandler()(e);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            header.getResizeHandler()(e);
          }}
          onDoubleClick={() => {
            import('../utils/autoSizeColumn').then(({ autoSizeColumn }) => {
              autoSizeColumn(header.getContext().table as any, column.id);
            });
          }}
          isResizing={column.getIsResizing()}
        />
      )}
    </ADTHeaderCellWrapper>
  );
}

export const AdvancedDataTableHeaderCell = memo(AdvancedDataTableHeaderCellInner, (prev, next) => {
  return (
    prev.header.getSize() === next.header.getSize() &&
    prev.header.column.getIsSorted() === next.header.column.getIsSorted() &&
    prev.header.column.getIsPinned() === next.header.column.getIsPinned() &&
    prev.showFilters === next.showFilters &&
    prev.columnSizing === next.columnSizing &&
    prev.style?.transform === next.style?.transform
  );
}) as typeof AdvancedDataTableHeaderCellInner;
