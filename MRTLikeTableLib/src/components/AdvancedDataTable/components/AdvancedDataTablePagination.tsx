import React from 'react';
import type { Table } from '@tanstack/react-table';
import { Box, TablePagination, Typography } from '@mui/material';
import { ADTFooter } from './AdvancedDataTable.styles';

interface Props<T extends object> {
  table: Table<T>;
  renderBottomToolbarCustomActions?: (props: { table: Table<T> }) => React.ReactNode;
}

function AdvancedDataTablePaginationInner<T extends object>({ table, renderBottomToolbarCustomActions }: Props<T>) {
  const { pagination } = table.getState();
  const rowCount = table.getRowCount();
  const selectedCount = Object.keys(table.getState().rowSelection).length;

  return (
    <ADTFooter>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {selectedCount > 0 && (
          <Typography variant='body2' color='text.secondary'>
            {selectedCount} row(s) selected
          </Typography>
        )}
        {renderBottomToolbarCustomActions?.({ table })}
      </Box>

      <TablePagination
        component='div'
        count={rowCount}
        page={pagination.pageIndex}
        onPageChange={(_, page) => table.setPageIndex(page)}
        rowsPerPage={pagination.pageSize}
        onRowsPerPageChange={(e) => table.setPageSize(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        sx={{ border: 'none' }}
      />
    </ADTFooter>
  );
}

export const AdvancedDataTablePagination = AdvancedDataTablePaginationInner;
