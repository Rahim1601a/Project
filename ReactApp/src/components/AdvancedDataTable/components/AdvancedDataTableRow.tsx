import { memo } from 'react';
import type { Row, Table } from '@tanstack/react-table';
import { Box, Collapse } from '@mui/material';
import type { VirtualItem } from '@tanstack/react-virtual';
import { ADTRowWrapper } from './AdvancedDataTable.styles';
import { AdvancedDataTableCell } from './AdvancedDataTableCell';

interface Props<T extends object> {
  row: Row<T>;
  table: Table<T>;
  virtualRow: VirtualItem;
  rowVirtualizer: any;
  columnVirtualizer: any;
  renderDetailPanel?: (props: { row: Row<T>; table: Table<T> }) => React.ReactNode;
}

function AdvancedDataTableRowInner<T extends object>({ row, table, virtualRow, rowVirtualizer, columnVirtualizer, renderDetailPanel }: Props<T>) {
  const isSelected = row.getIsSelected();
  const isExpanded = row.getIsExpanded();
  const meta = table.options.meta as any;
  const isEditing = meta?.editingRowId === row.id;

  const allCells = row.getVisibleCells();
  const leftPinnedCells = allCells.filter((cell) => cell.column.getIsPinned() === 'left');
  const rightPinnedCells = allCells.filter((cell) => cell.column.getIsPinned() === 'right');
  const unpinnedCells = allCells.filter((cell) => !cell.column.getIsPinned());

  const virtualColumns = columnVirtualizer.getVirtualItems();
  const totalUnpinnedWidth = columnVirtualizer.getTotalSize();
  
  const beforeWidth = virtualColumns[0]?.start ?? 0;
  const afterWidth = totalUnpinnedWidth - (virtualColumns[virtualColumns.length - 1]?.end ?? 0);
  
  const totalWidth = 
    leftPinnedCells.reduce((acc, c) => acc + c.column.getSize(), 0) + 
    totalUnpinnedWidth + 
    rightPinnedCells.reduce((acc, c) => acc + c.column.getSize(), 0);

  return (
    <ADTRowWrapper
      role='row'
      data-index={virtualRow.index}
      ref={rowVirtualizer.measureElement}
      isSelected={isSelected}
      isEditing={isEditing}
      isGrouped={row.getIsGrouped()}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: totalWidth,
        minWidth: '100%',
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      <Box sx={{ display: 'flex', width: '100%', minHeight: 'inherit' }}>
        {/* Left Pinned */}
        {leftPinnedCells.map((cell) => (
          <AdvancedDataTableCell key={cell.id} cell={cell} style={{ width: cell.column.getSize() }} />
        ))}

        {/* Spacer Before */}
        {beforeWidth > 0 && <Box sx={{ width: beforeWidth, flexShrink: 0 }} />}

        {/* Virtual Cells */}
        {virtualColumns.map((virtualColumn: VirtualItem) => {
          const cell = unpinnedCells[virtualColumn.index];
          if (!cell) return null;
          return (
            <AdvancedDataTableCell
              key={cell.id}
              cell={cell}
              style={{ width: cell.column.getSize() }}
            />
          );
        })}

        {/* Spacer After */}
        {afterWidth > 0 && <Box sx={{ width: afterWidth, flexShrink: 0 }} />}

        {/* Right Pinned */}
        {rightPinnedCells.map((cell) => (
          <AdvancedDataTableCell key={cell.id} cell={cell} style={{ width: cell.column.getSize() }} />
        ))}
      </Box>

      {renderDetailPanel && (
        <Collapse in={isExpanded} unmountOnExit>
          <Box sx={{ p: 2, borderBottom: '1px solid var(--adt-border-color)' }}>{renderDetailPanel({ row, table })}</Box>
        </Collapse>
      )}
    </ADTRowWrapper>
  );
}

export const AdvancedDataTableRow = memo(AdvancedDataTableRowInner, (prev, next) => {
  const prevMeta = prev.table.options.meta as any;
  const nextMeta = next.table.options.meta as any;
  const prevIsEditing = prevMeta?.editingRowId === prev.row.id;
  const nextIsEditing = nextMeta?.editingRowId === next.row.id;

  return (
    prev.row.id === next.row.id &&
    prev.row.original === next.row.original &&
    prev.row.getIsSelected() === next.row.getIsSelected() &&
    prev.row.getIsExpanded() === next.row.getIsExpanded() &&
    prevIsEditing === nextIsEditing &&
    prev.virtualRow.start === next.virtualRow.start &&
    prev.table.getState().columnSizing === next.table.getState().columnSizing &&
    prev.table.getState().columnVisibility === next.table.getState().columnVisibility &&
    prev.table.getState().columnOrder === next.table.getState().columnOrder &&
    prev.table.getState().columnPinning === next.table.getState().columnPinning
  );
}) as typeof AdvancedDataTableRowInner;
