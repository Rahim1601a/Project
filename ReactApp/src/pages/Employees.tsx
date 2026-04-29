import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { type MRT_ColumnDef } from 'material-react-table';
import { GenericTable } from '../components/GenericTable';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  salary: number;
}

export default function Employees() {
  const columns = useMemo<MRT_ColumnDef<Employee>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', size: 80 },
      { 
        accessorFn: (row) => `${row.firstName} ${row.lastName}`, 
        id: 'name', 
        header: 'Name' 
      },
      { accessorKey: 'position', header: 'Position' },
      { accessorKey: 'department', header: 'Department' },
      { 
        accessorKey: 'salary', 
        header: 'Salary',
        Cell: ({ cell }) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cell.getValue<number>())
      },
    ],
    []
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h3" color="text.primary" sx={{ fontWeight: 800 }}>
        Employees
      </Typography>

      <GenericTable<Employee>
        queryKey={['employees']}
        url="/employees"
        columns={columns}
        pageSize={3}
      />
    </Box>
  );
}
