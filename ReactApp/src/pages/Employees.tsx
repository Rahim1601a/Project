import { useMemo, useState } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Chip } from '@mui/material';
import { type MRT_ColumnDef } from 'material-react-table';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { GenericTable } from '../components/GenericTable';
import { EmployeeForm } from '../components/EmployeeForm';
import { 
  useCreateEmployee, 
  useUpdateEmployee, 
  useDeleteEmployee, 
} from '../hooks/useEmployeeMutations';
import type { Employee, Country } from '../hooks/useEmployeeMutations';


export default function Employees() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const { mutateAsync: createEmployee, isPending: isCreating } = useCreateEmployee();
  const { mutateAsync: updateEmployee, isPending: isUpdating } = useUpdateEmployee();
  const { mutateAsync: deleteEmployee } = useDeleteEmployee();


  const columns = useMemo<MRT_ColumnDef<Employee>[]>(
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
        accessorFn: (row) => row.company?.name ?? 'N/A',
        id: 'companyName',
        header: 'Company',
      },

      { 
        accessorKey: 'countries', 
        header: 'Countries',
        Cell: ({ cell }) => (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {cell.getValue<Country[]>()?.map((c) => (
              <Chip key={c.id} label={c.code} size="small" variant="outlined" />
            ))}
          </Box>
        ),
      },
      { 
        accessorKey: 'position', 
        header: 'Position' 
      },
      { 
        accessorKey: 'department', 
        header: 'Department' 
      },
      { 
        accessorKey: 'salary', 
        header: 'Salary',
        Cell: ({ cell }) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cell.getValue<number>()),
      },
    ],
    []
  );

  const handleCreateEmployee = async (values: any) => {
    try {
      await createEmployee({
        ...values,
        companyId: values.company?.id
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateEmployee = async (values: any) => {
    if (!editingEmployee) return;
    try {
      await updateEmployee({ 
        ...editingEmployee, 
        ...values,
        companyId: values.company?.id
      });
      setIsEditModalOpen(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteEmployee = async (row: any) => {
    if (window.confirm(`Are you sure you want to delete ${row.original.firstName}?`)) {
      try {
        await deleteEmployee(row.original.id);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h3" color="text.primary" sx={{ fontWeight: 800 }}>
        Employees
      </Typography>

      <GenericTable<Employee>
        queryKey={['employees']}
        url="/employees"
        columns={columns}
        pageSize={10}
        tableOptions={{
          enableRowActions: true,
          renderRowActions: ({ row }) => (
            <Box sx={{ display: 'flex', gap: '1rem' }}>
              <Tooltip title="Edit">
                <IconButton onClick={() => {
                  setEditingEmployee(row.original);
                  setIsEditModalOpen(true);
                }}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton color="error" onClick={() => handleDeleteEmployee(row)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          ),
          renderTopToolbarCustomActions: () => (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create New Employee
            </Button>
          ),
        }}
      />

      <EmployeeForm
        title="Create New Employee"
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateEmployee}
        isSaving={isCreating}
      />

      {editingEmployee && (
        <EmployeeForm
          title="Edit Employee"
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingEmployee(null);
          }}
          onSubmit={handleUpdateEmployee}
          initialData={editingEmployee}
          isSaving={isUpdating}
        />
      )}
    </Box>
  );
}


