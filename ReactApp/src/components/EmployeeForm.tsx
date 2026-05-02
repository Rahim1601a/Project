import { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Button, 
  TextField, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  Box 
} from '@mui/material';
import { AutocompleteCursorDropdown } from './AutocompleteCursorDropdown';
import type { Company, Country, Employee } from '../hooks/useEmployeeMutations';

const employeeSchema = z.object({
  firstName: z.string().min(1, 'First Name is required'),
  lastName: z.string().min(1, 'Last Name is required'),
  position: z.string().min(1, 'Position is required'),
  department: z.string().min(1, 'Department is required'),
  salary: z.number().min(0, 'Salary must be at least 0'),
  company: z.custom<Company>().nullable(),
  countries: z.array(z.custom<Country>()).min(1, 'At least one country is required'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeFormData) => void;
  initialData?: Partial<Employee>;
  title: string;
  isSaving: boolean;
}

export function EmployeeForm({
  open,
  onClose,
  onSubmit,
  initialData,
  title,
  isSaving,
}: EmployeeFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      position: '',
      department: '',
      salary: 0,
      company: null,
      countries: [],
    },
  });

  // Watch the company field for cascading
  const selectedCompany = useWatch({ control, name: 'company' });

  // Reset form when initialData changes or dialog closes/opens
  useEffect(() => {
    if (open) {
      reset({
        firstName: initialData?.firstName || '',
        lastName: initialData?.lastName || '',
        position: initialData?.position || '',
        department: initialData?.department || '',
        salary: initialData?.salary || 0,
        company: initialData?.company || null,
        countries: initialData?.countries || [],
      });
    } else {
      reset();
    }
  }, [initialData, open, reset]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <form onSubmit={handleSubmit((data) => onSubmit(data))}>
        <DialogContent>
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: 2, 
              mt: 1 
            }}
          >
            <Box sx={{ gridColumn: 'span 1' }}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="First Name"
                    fullWidth
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                  />
                )}
              />
            </Box>
            <Box sx={{ gridColumn: 'span 1' }}>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Last Name"
                    fullWidth
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                  />
                )}
              />
            </Box>
            <Box sx={{ gridColumn: 'span 2' }}>
              <Controller
                name="position"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Position"
                    fullWidth
                    error={!!errors.position}
                    helperText={errors.position?.message}
                  />
                )}
              />
            </Box>
            <Box sx={{ gridColumn: 'span 2' }}>
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Department"
                    fullWidth
                    error={!!errors.department}
                    helperText={errors.department?.message}
                  />
                )}
              />
            </Box>
            <Box sx={{ gridColumn: 'span 2' }}>
              <Controller
                name="salary"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    label="Salary"
                    type="number"
                    fullWidth
                    error={!!errors.salary}
                    helperText={errors.salary?.message}
                  />
                )}
              />
            </Box>
            {/* Company — independent dropdown (no cascading) */}
            <Box sx={{ gridColumn: 'span 2' }}>
              <Controller
                name="company"
                control={control}
                render={({ field }) => (
                  <AutocompleteCursorDropdown<Company>
                    {...field}
                    label="Company"
                    url="/companies"
                    queryKey={['companies']}
                    getOptionLabel={(option) => option.name}
                    error={!!errors.company}
                    helperText={errors.company?.message}
                  />
                )}
              />
            </Box>
            {/* Countries — cascading dropdown: depends on Company selection */}
            <Box sx={{ gridColumn: 'span 2' }}>
              <Controller
                name="countries"
                control={control}
                render={({ field }) => (
                  <AutocompleteCursorDropdown<Country>
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                    }}
                    label="Countries"
                    url="/countries"
                    queryKey={['countries']}
                    isMulti
                    getOptionLabel={(option) => option.name}
                    error={!!errors.countries}
                    helperText={errors.countries?.message}
                    isCascading={true}
                    parentId={selectedCompany?.id ?? null}
                    parentFilterKey="companyId"
                  />
                )}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
