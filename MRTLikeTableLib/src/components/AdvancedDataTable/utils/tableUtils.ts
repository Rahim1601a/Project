import type { Table, Column, Row } from '@tanstack/react-table';

export function getVisibleLeafColumns<T extends object>(table: Table<T>) {
  return table.getVisibleLeafColumns();
}

export function getColumnId(column: Column<any, any>): string {
  return column.id;
}

export function getRowId(row: Row<any>): string {
  return row.id;
}

export function isActionColumn(columnId: string): boolean {
  return columnId.startsWith('__');
}

export function parseExportData<T extends object>(rows: Row<T>[], columns: Column<T, any>[]) {
  return rows.map((row) => {
    const data: Record<string, any> = {};
    columns.forEach((col) => {
      if (!isActionColumn(col.id)) {
        data[col.id] = row.getValue(col.id);
      }
    });
    return data;
  });
}
