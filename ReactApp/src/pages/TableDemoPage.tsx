import React, { useMemo, useState } from 'react';
import { Typography, Box, Chip, Divider } from '@mui/material';
import type { ColumnDef } from '@tanstack/react-table';
import { AdvancedDataTable } from '../components/AdvancedDataTable';

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  status: 'active' | 'inactive' | 'pending';
}

const mockData: Person[] = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    age: 28,
    status: 'active',
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    age: 34,
    status: 'inactive',
  },
  {
    id: 3,
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@example.com',
    age: 22,
    status: 'active',
  },
  {
    id: 4,
    firstName: 'Bob',
    lastName: 'Brown',
    email: 'bob@example.com',
    age: 45,
    status: 'pending',
  },
  {
    id: 5,
    firstName: 'Charlie',
    lastName: 'Davis',
    email: 'charlie@example.com',
    age: 31,
    status: 'active',
  },
  {
    id: 6,
    firstName: 'Eve',
    lastName: 'Wilson',
    email: 'eve@example.com',
    age: 29,
    status: 'inactive',
  },
  {
    id: 7,
    firstName: 'Frank',
    lastName: 'Miller',
    email: 'frank@example.com',
    age: 50,
    status: 'active',
  },
  {
    id: 8,
    firstName: 'Grace',
    lastName: 'Lee',
    email: 'grace@example.com',
    age: 27,
    status: 'pending',
  },
  {
    id: 9,
    firstName: 'Henry',
    lastName: 'Taylor',
    email: 'henry@example.com',
    age: 38,
    status: 'active',
  },
  {
    id: 10,
    firstName: 'Ivy',
    lastName: 'Anderson',
    email: 'ivy@example.com',
    age: 24,
    status: 'inactive',
  },
  {
    id: 11,
    firstName: 'Jack',
    lastName: 'Thomas',
    email: 'jack@example.com',
    age: 33,
    status: 'active',
  },
  {
    id: 12,
    firstName: 'Kelly',
    lastName: 'Moore',
    email: 'kelly@example.com',
    age: 41,
    status: 'pending',
  },
];

const TableDemoPage: React.FC = () => {
  const [data, setData] = useState<Person[]>(mockData);

  const columns = useMemo<ColumnDef<Person, any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 80,
        enableEditing: false,
      },
      {
        accessorKey: 'firstName',
        header: 'First Name',
      },
      {
        accessorKey: 'lastName',
        header: 'Last Name',
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 250,
      },
      {
        accessorKey: 'age',
        header: 'Age',
        size: 100,
        cell: (info) => {
          const val = info.getValue();
          return (
            <Typography variant='body2' color={typeof val === 'number' && val > 30 ? 'error' : 'textPrimary'}>
              {val ?? ''}
            </Typography>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          if (!status) return null;
          return (
            <Chip
              label={status.toString()}
              size='small'
              color={status === 'active' ? 'success' : status === 'inactive' ? 'error' : 'warning'}
              variant='outlined'
            />
          );
        },
      },
    ],
    [],
  );

  const handleSaveRow = async (row: Person, values: any) => {
    setData((prev) => prev.map((item) => (item.id === row.id ? { ...item, ...values } : item)));
  };

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
          TanStack Table (Full Feature Demo)
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          A high-performance table component with grouping, inline editing, multi-format exports, and state persistence.
        </Typography>
      </Box>

      <AdvancedDataTable
        isStorage={true}
        title='Employee Directory'
        columns={columns}
        data={data}
        enableGlobalFilter
        enableColumnFilters
        enableColumnOrdering
        enableColumnPinning
        enableDensity
        enableHiding
        enableFullScreen
        enableGrouping
        enableExpanding
        enableRowNumbers
        enableClickToCopy
        enableEditing
        enableColumnResizing
        onRowSave={handleSaveRow}
        renderDetailPanel={({ row }) => (
          <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Typography variant='body2'>
              <strong>Full Name:</strong> {row.firstName} {row.lastName}
            </Typography>
            <Typography variant='body2'>
              <strong>Department:</strong> Engineering
            </Typography>
            <Typography variant='body2'>
              <strong>Hire Date:</strong> {new Date().toLocaleDateString()}
            </Typography>
            <Typography variant='body2'>
              <strong>Internal ID:</strong> UUID-{row.id}-89XY
            </Typography>
          </Box>
        )}
        renderTopToolbarCustomActions={(table) => (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={`Total: ${data.length}`} variant='outlined' size='small' />
            <Chip label={`Selected: ${table.getSelectedRowModel().rows.length}`} color='primary' size='small' />
          </Box>
        )}
        renderBottomToolbarCustomActions={() => (
          <Typography variant='caption' sx={{ fontStyle: 'italic' }}>
            Last updated: {new Date().toLocaleTimeString()}
          </Typography>
        )}
        storageKey='demo-table-all-features-v3'
        actionMode='menu'
        renderRowActionMenuItems={(_, close) => [
          <Box key='actions' sx={{ py: 1 }}>
            <Typography variant='caption' sx={{ px: 2, fontWeight: 'bold' }}>
              Quick Actions
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Box
              onClick={close}
              sx={{
                px: 2,
                py: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              View Profile
            </Box>
          </Box>,
        ]}
      />
    </Box>
  );
};

export default TableDemoPage;
