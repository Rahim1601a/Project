export const ADT_ARIA_LABELS = {
  table: 'Advanced Data Table',
  toolbar: 'Table Toolbar',
  search: 'Search across all columns',
  filter: 'Filter by column',
  sort: 'Sort by column',
  pagination: 'Table Pagination',
  density: 'Toggle row density',
  visibility: 'Toggle column visibility',
  fullscreen: 'Toggle fullscreen mode',
  export: 'Export data',
  reset: 'Reset table state',
  pin: 'Pin column',
  unpin: 'Unpin column',
  group: 'Group by column',
  ungroup: 'Ungroup by column',
  expand: 'Expand row',
  collapse: 'Collapse row',
  select: 'Select row',
  selectAll: 'Select all rows',
  resize: 'Resize column',
};

export function getAriaLabel(key: keyof typeof ADT_ARIA_LABELS) {
  return ADT_ARIA_LABELS[key];
}
