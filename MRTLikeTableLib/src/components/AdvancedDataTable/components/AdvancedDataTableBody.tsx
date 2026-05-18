import React, { useEffect } from 'react';
import type { Table, Row } from '@tanstack/react-table';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ADTBody, ADTLoadingOverlay } from './AdvancedDataTable.styles';
import { AdvancedDataTableRow } from './AdvancedDataTableRow';
import { useVirtualRows } from '../hooks/useVirtualRows';
import { useVirtualColumns } from '../hooks/useVirtualColumns';
import { getVirtualRowStyles } from '../utils/virtualization.utils';
import type { ADTDensity } from '../types/types';

interface Props<T extends object> {
  table: Table<T>;
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
  loading?: boolean;
  density: ADTDensity;
  columnSizing: Record<string, number>;
  columnVisibility: Record<string, boolean>;
  columnFilters: any[];
  onScrollEnd?: () => void;
  renderDetailPanel?: (props: { row: Row<T>; table: Table<T> }) => React.ReactNode;
}

function AdvancedDataTableBodyInner<T extends object>({ table, tableContainerRef, loading, density, columnSizing, onScrollEnd, renderDetailPanel }: Props<T>) {
  const rows = table.getRowModel().rows;

  const rowVirtualizer = useVirtualRows(tableContainerRef, rows.length, density, columnSizing);
  const virtualRows = rowVirtualizer.getVirtualItems();

  const visibleColumns = table.getVisibleLeafColumns();
  const unpinnedCols = visibleColumns.filter((c) => !c.getIsPinned());
  const columnVirtualizer = useVirtualColumns(tableContainerRef, unpinnedCols, columnSizing);

  useEffect(() => {
    if (!onScrollEnd || !tableContainerRef.current) return;
    const container = tableContainerRef.current;

    let lastScrollTop = container.scrollTop;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop > lastScrollTop && scrollHeight - scrollTop - clientHeight < 150 && !loading) {
        onScrollEnd();
      }
      lastScrollTop = scrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onScrollEnd, tableContainerRef, loading]);

  if (!loading && rows.length === 0) {
    return (
      <Box sx={{ p: 8, textAlign: 'center', width: '100%' }}>
        <Typography variant='h6' color='text.secondary'>No records found</Typography>
      </Box>
    );
  }

  const totalWidth = Math.max(table.getTotalSize(), 0);

  return (
    <ADTBody
      role='rowgroup'
      aria-rowcount={rows.length}
      sx={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        width: totalWidth ? `${totalWidth}px` : '100%',
        minWidth: '100%',
      }}
    >
      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index];
        if (!row) return null;
        return (
          <AdvancedDataTableRow
            key={row.id}
            row={row}
            table={table}
            virtualRow={virtualRow}
            rowVirtualizer={rowVirtualizer}
            columnVirtualizer={columnVirtualizer}
            columnSizing={columnSizing}
            renderDetailPanel={renderDetailPanel}
            style={getVirtualRowStyles(virtualRow)}
          />
        );
      })}

      {loading && (
        <ADTLoadingOverlay>
          <CircularProgress />
        </ADTLoadingOverlay>
      )}
    </ADTBody>
  );
}

export const AdvancedDataTableBody = AdvancedDataTableBodyInner;
