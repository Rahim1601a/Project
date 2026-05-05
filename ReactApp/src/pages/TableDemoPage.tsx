import React, { useMemo, useState } from 'react';
import { Container, Typography, Box, Chip, Divider } from '@mui/material';
import { MRTLikeTable } from '../components/MRTLikeTable';
import type { ColumnDef } from '@tanstack/react-table';

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
  const columns = useMemo<ColumnDef<Person, any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 80,
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
        cell: (info) => (
          <Typography variant='body2' color={info.getValue() > 30 ? 'error' : 'textPrimary'}>
            {info.getValue()}
          </Typography>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue() as Person['status'];
          return (
            <Chip
              label={status}
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

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
          TanStack Table (MRT-Like)
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          A high-performance table component built with TanStack Table and MUI, featuring density switching, column ordering, pinning, filtering, and
          more.
        </Typography>
      </Box>

      <MRTLikeTable
        title='Employee Directory'
        columns={columns}
        data={mockData}
        enableGlobalFilter
        enableColumnFilters
        enableColumnOrdering
        enableColumnPinning
        enableDensity
        enableHiding
        enableFullScreen
        storageKey='demo-table-state'
        actionMode='menu'
        renderRowActionMenuItems={(row, close) => [
          <Box key='actions' sx={{ py: 1 }}>
            <Typography variant='caption' sx={{ px: 2, fontWeight: 'bold' }}>
              Actions for {row.firstName}
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
            <Box
              onClick={close}
              sx={{
                px: 2,
                py: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              Edit Employee
            </Box>
            <Box
              onClick={close}
              sx={{
                px: 2,
                py: 1,
                cursor: 'pointer',
                color: 'error.main',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              Delete
            </Box>
          </Box>,
        ]}
      />
    </Box>
  );
};

export default TableDemoPage;
