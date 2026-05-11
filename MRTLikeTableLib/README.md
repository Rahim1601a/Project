# MRT-Like Table

A production-grade, high-performance TanStack Table v8 wrapper built with MUI v6.

## Features

- **Row Virtualization**: Handles thousands of rows with ease using `@tanstack/react-virtual`.
- **Responsive Layout**: Automatic column sizing and horizontal scrolling.
- **Drag & Drop**: Column reordering using `@dnd-kit`.
- **Advanced Filtering**: Built-in filters for text, select, date, range, and more.
- **Column Pinning**: Pin columns to the left or right.
- **State Persistence**: Persists sorting, pagination, and visibility to localStorage.
- **Exporting**: Export to CSV, Excel, and PDF (jsPDF).
- **Inline Editing**: Full support for inline row editing with validation.
- **Theming**: Seamlessly integrates with MUI v6 themes.

## Installation

```bash
npm install mrt-like-table
# or
yarn add mrt-like-table
```

### Peer Dependencies

Ensure you have the following installed:
- `@mui/material` >= 6.0.0
- `@mui/icons-material` >= 6.0.0
- `@tanstack/react-table` >= 8.0.0
- `react` >= 18.0.0
- `react-dom` >= 18.0.0

## Quick Start

```tsx
import { MRTLikeTable, useTableState } from 'mrt-like-table';

const columns = [
  { accessorKey: 'id', header: 'ID', size: 80 },
  { accessorKey: 'name', header: 'Name', size: 200 },
];

const data = [
  { id: 1, name: 'John Doe' },
  { id: 2, name: 'Jane Smith' },
];

function App() {
  return (
    <MRTLikeTable
      columns={columns}
      data={data}
      title="Employee List"
      enableRowSelection
      enableColumnOrdering
    />
  );
}
```

## Documentation

### Props

| Prop | Type | Description |
| --- | --- | --- |
| `columns` | `MRTLikeColumnDef[]` | Column definitions. |
| `data` | `T[]` | Table data. |
| `loading` | `boolean` | Shows loading spinner and skeletons. |
| `manualMode` | `boolean` | Enable for server-side operations. |
| `fetchData` | `function` | Callback for server-side fetching. |
| `enableEditing` | `boolean` | Enable inline editing. |
| `storageKey` | `string` | LocalStorage key for state persistence. |

## License

MIT
