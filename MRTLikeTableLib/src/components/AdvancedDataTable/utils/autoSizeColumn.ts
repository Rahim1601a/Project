// ✅ Create canvas ONCE (type-safe)
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

function measureTextWidth(text: string, font = '14px Roboto'): number {
  if (!context) return text.length * 8;

  context.font = font;
  return context.measureText(text).width;
}

export function autoSizeColumn(table: any, columnId: string, visibleRows?: any[]) {
  const column = table.getColumn(columnId);
  if (!column) return;

  // ✅ Use virtualized rows if available
  const rows = visibleRows ?? table.getPaginationRowModel().rows;

  let maxWidth = 0;
  const font = '14px Poppins';

  // ✅ Header
  const headerText = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;

  maxWidth = Math.max(maxWidth, measureTextWidth(String(headerText), font));

  // ✅ Cells
  for (let i = 0; i < rows.length; i++) {
    const value = rows[i]?.getValue(columnId);
    if (value != null) {
      const width = measureTextWidth(String(value), font);
      if (width > maxWidth) maxWidth = width;
    }
  }

  const padding = 48;
  const newSize = Math.min(Math.max(maxWidth + padding, 80), 600);

  table.setColumnSizing((prev: any) => {
    if (prev[columnId] === newSize) return prev;
    return {
      ...prev,
      [columnId]: newSize,
    };
  });
}
