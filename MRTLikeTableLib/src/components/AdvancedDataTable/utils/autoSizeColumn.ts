import type { Table } from '@tanstack/react-table';

function measureElementUnwrapped(el: any): number {
  // Save original styles of el
  const origElWidth = el.style.width;
  const origElMinWidth = el.style.minWidth;
  const origElFlex = el.style.flex;
  const origElDisplay = el.style.display;
  const origElWhiteSpace = el.style.whiteSpace;

  // Force unwrapped layout on el
  el.style.width = 'auto';
  el.style.minWidth = '0px';
  el.style.flex = 'none';
  el.style.display = 'inline-block';
  el.style.whiteSpace = 'nowrap';

  // Find inner text container and unwrap it
  const cellContent = el.querySelector('.adt-cell-content');
  let origTargetWhiteSpace = '';
  let origTargetWidth = '';
  let origTargetDisplay = '';
  if (cellContent) {
    origTargetWhiteSpace = cellContent.style.whiteSpace;
    origTargetWidth = cellContent.style.width;
    origTargetDisplay = cellContent.style.display;

    cellContent.style.whiteSpace = 'nowrap';
    cellContent.style.width = 'auto';
    cellContent.style.display = 'inline-block';
  }

  // Measure the true unwrapped width of the entire cell wrapper
  const measuredWidth = el.scrollWidth || el.offsetWidth || 0;

  // Restore cellContent styles
  if (cellContent) {
    cellContent.style.whiteSpace = origTargetWhiteSpace;
    cellContent.style.width = origTargetWidth;
    cellContent.style.display = origTargetDisplay;
  }

  // Restore el styles
  el.style.width = origElWidth;
  el.style.minWidth = origElMinWidth;
  el.style.flex = origElFlex;
  el.style.display = origElDisplay;
  el.style.whiteSpace = origElWhiteSpace;

  return measuredWidth;
}

export function autoSizeColumn<T extends object>(table: Table<T>, columnId: string) {
  if (typeof document === 'undefined') return;

  const elements = document.querySelectorAll(`[data-column-id="${columnId}"]`);
  let maxWidth = 0;

  elements.forEach((el: any) => {
    maxWidth = Math.max(maxWidth, measureElementUnwrapped(el));
  });

  const column = table.getColumn(columnId);
  const minSize = column?.columnDef.minSize ?? 50;
  const maxSize = column?.columnDef.maxSize ?? 800;

  // Add a small safety buffer of 4px to prevent any sub-pixel rendering wrap issues
  const finalSize = Math.min(Math.max(maxWidth + 4, minSize), maxSize);

  if (finalSize > 10) {
    table.setColumnSizing((prev) => ({
      ...prev,
      [columnId]: finalSize,
    }));
  }
}

export function autoSizeAllColumns<T extends object>(table: Table<T>) {
  if (typeof document === 'undefined') return;

  const columns = table.getAllLeafColumns();
  const newSizing: Record<string, number> = {};

  columns.forEach((column) => {
    if (column.id.startsWith('__')) return;

    const elements = document.querySelectorAll(`[data-column-id="${column.id}"]`);
    let maxWidth = 0;

    elements.forEach((el: any) => {
      maxWidth = Math.max(maxWidth, measureElementUnwrapped(el));
    });

    const minSize = column.columnDef.minSize ?? 50;
    const maxSize = column.columnDef.maxSize ?? 800;

    newSizing[column.id] = Math.min(Math.max(maxWidth + 4, minSize), maxSize);
  });

  table.setColumnSizing((prev) => ({ ...prev, ...newSizing }));
}
