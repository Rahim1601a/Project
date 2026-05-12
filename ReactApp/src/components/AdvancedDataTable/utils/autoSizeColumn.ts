export function autoSizeColumn(table: any, columnId: string) {
  const column = table.getColumn(columnId);
  if (!column) return;

  const rows = table.getRowModel().rows;

  let maxWidth = 0;

  // Header width
  const headerText = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;

  maxWidth = Math.max(maxWidth, headerText.length * 8);

  // Cell widths
  rows.forEach((row: any) => {
    const value = row.getValue(columnId);
    if (value != null) {
      maxWidth = Math.max(maxWidth, String(value).length * 8);
    }
  });

  column.setSize(Math.min(Math.max(maxWidth + 32, 80), 400));
}
