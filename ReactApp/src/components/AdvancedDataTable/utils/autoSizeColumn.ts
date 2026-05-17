import type { Table, Row } from '@tanstack/react-table';

const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
const context = canvas?.getContext('2d');

function measureTextWidth(text: string, font = '14px Roboto'): number {
  if (!context) return text.length * 8;
  context.font = font;
  return context.measureText(text).width;
}

export function autoSizeColumn<T extends object>(table: Table<T>, columnId: string, visibleRows?: Row<T>[]) {
  const column = table.getColumn(columnId);
  if (!column) return;

  const rows = visibleRows ?? table.getRowModel().rows;
  let maxWidth = 0;
  const font = '600 0.875rem Roboto';

  const headerText = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
  maxWidth = Math.max(maxWidth, measureTextWidth(String(headerText), font));

  const cellFont = '400 0.875rem Roboto';
  rows.forEach((row) => {
    const value = row.getValue(columnId);
    if (value != null) {
      maxWidth = Math.max(maxWidth, measureTextWidth(String(value), cellFont));
    }
  });

  const padding = 32;
  const finalSize = Math.min(Math.max(maxWidth + padding, 50), 800);

  table.setColumnSizing((prev) => ({
    ...prev,
    [columnId]: finalSize,
  }));
}

export function autoSizeAllColumns<T extends object>(table: Table<T>) {
  const columns = table.getAllLeafColumns();
  const rows = table.getRowModel().rows;

  const newSizing: Record<string, number> = {};

  columns.forEach((column) => {
    if (column.id.startsWith('__')) return;

    let maxWidth = 0;
    const headerText = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
    maxWidth = Math.max(maxWidth, measureTextWidth(String(headerText), '600 0.875rem Roboto'));

    rows.forEach((row) => {
      const value = row.getValue(column.id);
      if (value != null) {
        maxWidth = Math.max(maxWidth, measureTextWidth(String(value), '400 0.875rem Roboto'));
      }
    });

    newSizing[column.id] = Math.min(Math.max(maxWidth + 32, 50), 800);
  });

  table.setColumnSizing((prev) => ({ ...prev, ...newSizing }));
}
