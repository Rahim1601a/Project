import { memo } from 'react';
import type { Table } from '@tanstack/react-table';
import { Box } from '@mui/material';
import { ADTHeaderBar, ADTHeaderRow } from './AdvancedDataTable.styles';
import { AdvancedDataTableHeaderCell } from './AdvancedDataTableHeaderCell';
import { useVirtualColumns } from '../hooks/useVirtualColumns';

interface Props<T extends object> {
  table: Table<T>;
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
  enableColumnOrdering?: boolean;
  enableColumnPinning?: boolean;
  enableColumnResizing?: boolean;
  showFilters?: boolean;
  columnSizing: Record<string, number>;
  setColumnSizing: (sizing: any) => void;
}

function AdvancedDataTableHeaderInner<T extends object>({
  table,
  tableContainerRef,
  enableColumnOrdering,
  enableColumnPinning,
  enableColumnResizing,
  showFilters,
  columnSizing,
  setColumnSizing,
}: Props<T>) {
  const visibleColumns = table.getVisibleLeafColumns();
  const leftPinnedCols = visibleColumns.filter(c => c.getIsPinned() === 'left');
  const rightPinnedCols = visibleColumns.filter(c => c.getIsPinned() === 'right');
  const unpinnedCols = visibleColumns.filter(c => !c.getIsPinned());

  const columnVirtualizer = useVirtualColumns(tableContainerRef, unpinnedCols, columnSizing);
  const virtualColumns = columnVirtualizer.getVirtualItems();
  const totalUnpinnedWidth = columnVirtualizer.getTotalSize();
  
  const totalWidth = 
    leftPinnedCols.reduce((acc, c) => acc + c.getSize(), 0) + 
    totalUnpinnedWidth + 
    rightPinnedCols.reduce((acc, c) => acc + c.getSize(), 0);

  const beforeWidth = virtualColumns[0]?.start ?? 0;
  const afterWidth = totalUnpinnedWidth - (virtualColumns[virtualColumns.length - 1]?.end ?? 0);

  return (
    <ADTHeaderBar role='rowgroup'>
      {table.getHeaderGroups().map((headerGroup) => (
        <ADTHeaderRow
          key={headerGroup.id}
          role='row'
          style={{ width: totalWidth, minWidth: '100%' }}
        >
          {/* Left Pinned Headers */}
          {headerGroup.headers
            .filter((header) => header.column.getIsPinned() === 'left')
            .map((header) => (
              <AdvancedDataTableHeaderCell
                key={header.id}
                header={header}
                enableColumnOrdering={enableColumnOrdering}
                enableColumnPinning={enableColumnPinning}
                enableColumnResizing={enableColumnResizing}
                showFilters={showFilters}
                columnSizing={columnSizing}
                setColumnSizing={setColumnSizing}
              />
            ))}

          {/* Spacer Before */}
          {beforeWidth > 0 && <Box sx={{ width: beforeWidth, flexShrink: 0 }} />}

          {/* Virtual Unpinned Headers */}
          {virtualColumns.map((virtualColumn) => {
            const header = headerGroup.headers.find(h => h.column.id === unpinnedCols[virtualColumn.index]?.id);
            if (!header) return null;
            return (
              <AdvancedDataTableHeaderCell
                key={header.id}
                header={header}
                style={{ width: header.getSize() }}
                enableColumnOrdering={enableColumnOrdering}
                enableColumnPinning={enableColumnPinning}
                enableColumnResizing={enableColumnResizing}
                showFilters={showFilters}
                columnSizing={columnSizing}
                setColumnSizing={setColumnSizing}
              />
            );
          })}

          {/* Spacer After */}
          {afterWidth > 0 && <Box sx={{ width: afterWidth, flexShrink: 0 }} />}

          {/* Right Pinned Headers */}
          {headerGroup.headers
            .filter((header) => header.column.getIsPinned() === 'right')
            .map((header) => (
              <AdvancedDataTableHeaderCell
                key={header.id}
                header={header}
                enableColumnOrdering={enableColumnOrdering}
                enableColumnPinning={enableColumnPinning}
                enableColumnResizing={enableColumnResizing}
                showFilters={showFilters}
                columnSizing={columnSizing}
                setColumnSizing={setColumnSizing}
              />
            ))}
        </ADTHeaderRow>
      ))}
    </ADTHeaderBar>
  );
}

export const AdvancedDataTableHeader = memo(AdvancedDataTableHeaderInner) as typeof AdvancedDataTableHeaderInner;
