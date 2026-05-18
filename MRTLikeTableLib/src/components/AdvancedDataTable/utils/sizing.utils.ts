import type { Table, Column } from '@tanstack/react-table';

export interface ColumnSizeInfo {
  [key: string]: number;
}

export function calculateGrowColumnSizes<T extends object>(
  table: Table<T>,
  containerWidth: number,
  layoutMode: 'grid' | 'grid-no-grow' | 'semantic'
): ColumnSizeInfo | null {
  if (layoutMode === 'semantic' || containerWidth <= 0) return null;

  const visibleColumns = table.getVisibleLeafColumns();
  const columnSizing = table.getState().columnSizing;

  let totalFixedWidth = 0;
  const growColumns: Column<T, any>[] = [];

  visibleColumns.forEach((column) => {
    const colDef = column.columnDef as any;
    const isManualResized = !!columnSizing[column.id];

    if (isManualResized) {
      totalFixedWidth += columnSizing[column.id];
    } else if (colDef.grow === false || (layoutMode === 'grid-no-grow' && !colDef.grow)) {
      totalFixedWidth += column.getSize();
    } else {
      growColumns.push(column);
    }
  });

  const SCROLL_BUFFER = 12;
  const availableWidth = Math.max(0, containerWidth - totalFixedWidth - SCROLL_BUFFER);
  const newSizing: ColumnSizeInfo = { ...columnSizing };

  if (growColumns.length > 0) {
    growColumns.forEach((column) => {
      const colDef = column.columnDef as any;
      const growFactor = typeof colDef.grow === 'number' ? colDef.grow : 1;

      let targetWidth =
        (availableWidth * growFactor) /
        growColumns.reduce((acc, c) => acc + (typeof (c.columnDef as any).grow === 'number' ? (c.columnDef as any).grow : 1), 0);

      const minSize = colDef.minSize ?? 40;
      const maxSize = colDef.maxSize ?? Number.MAX_SAFE_INTEGER;

      newSizing[column.id] = Math.min(maxSize, Math.max(minSize, targetWidth));
    });
  }

  visibleColumns.forEach((col) => {
    if (!newSizing[col.id]) {
      newSizing[col.id] = col.getSize();
    }
  });

  return newSizing;
}

export function getStickyOffsets<T extends object>(table: Table<T>) {
  const leftPinned = table.getLeftLeafColumns();
  const rightPinned = table.getRightLeafColumns();

  const leftOffsets: Record<string, number> = {};
  let currentLeft = 0;
  leftPinned.forEach((col) => {
    leftOffsets[col.id] = currentLeft;
    currentLeft += col.getSize();
  });

  const rightOffsets: Record<string, number> = {};
  let currentRight = 0;
  [...rightPinned].reverse().forEach((col) => {
    rightOffsets[col.id] = currentRight;
    currentRight += col.getSize();
  });

  return { leftOffsets, rightOffsets };
}
