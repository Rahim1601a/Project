import { useEffect, useState } from 'react';
import { useForm, useWatch, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box
} from '@mui/material';
import { AutocompleteCursorDropdown } from './AutocompleteCursorDropdown';
import { FormTextField } from './FormFields';
import { useAutocompleteLookup } from '../hooks/useAutocompleteLookup';
import type { Employee } from '../hooks/useEmployeeMutations';
import type { SelectOption } from '../types/common';

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  salary: number;
  company: SelectOption | null;
  countries: SelectOption[];
}

const employeeSchema: yup.ObjectSchema<EmployeeFormData> = yup.object({
  firstName: yup.string().required('First Name is required'),
  lastName: yup.string().required('Last Name is required'),
  position: yup.string().required('Position is required'),
  department: yup.string().required('Department is required'),
  salary: yup.number().typeError('Salary must be a number').min(0, 'Salary must be at least 0').required('Salary is required'),
  company: yup.mixed<SelectOption>().nullable().default(null),
  countries: yup.array().of(yup.mixed<SelectOption>().required()).min(1, 'At least one country is required').required(),
});

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
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
  const methods = useForm<EmployeeFormData>({
    resolver: yupResolver(employeeSchema) as any,
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

  const {
    control,
    handleSubmit,
    reset,
    setValue
  } = methods;

  const selectedCompany = useWatch({ control, name: 'company' });

  // Data fetching hooks
  const companyData = useAutocompleteLookup({
    url: '/companies',
    queryKey: ['companies'],
    isPagination: false,
  });

  const countryData = useAutocompleteLookup({
    url: '/countries',
    queryKey: ['countries'],
    isPagination: true,
    isCascading: true,
    parentId: selectedCompany?.value as number,
    parentFilterKey: 'companyId',
    isEnabled: !!selectedCompany,
  });

  // Handle cascading reset
  useEffect(() => {
    if (!selectedCompany) {
      setValue('countries', []);
    }
  }, [selectedCompany, setValue]);

  useEffect(() => {
    if (open) {
      reset({
        firstName: initialData?.firstName || '',
        lastName: initialData?.lastName || '',
        position: initialData?.position || '',
        department: initialData?.department || '',
        salary: initialData?.salary || 0,
        company: initialData?.company ? { value: initialData.company.id, label: initialData.company.name } : null,
        countries: initialData?.countries?.map(c => ({ value: c.id, label: c.name })) || [],
      });
    } else {
      reset();
    }
  }, [initialData, open, reset]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit((data) => onSubmit(data))}>
          <DialogContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
              <Box sx={{ gridColumn: 'span 1' }}><FormTextField name="firstName" label="First Name" /></Box>
              <Box sx={{ gridColumn: 'span 1' }}><FormTextField name="lastName" label="Last Name" /></Box>
              <Box sx={{ gridColumn: 'span 2' }}><FormTextField name="position" label="Position" /></Box>
              <Box sx={{ gridColumn: 'span 2' }}><FormTextField name="department" label="Department" /></Box>
              <Box sx={{ gridColumn: 'span 2' }}>
                <FormTextField name="salary" label="Salary" type="number"
                  onChange={(e) => setValue('salary', Number(e.target.value), { shouldValidate: true })}
                />
              </Box>

              <Box sx={{ gridColumn: 'span 2' }}>
                <AutocompleteCursorDropdown
                  control={control}
                  name="company"
                  label="Company"
                  options={companyData.options}
                  isLoading={companyData.isLoading}
                />
              </Box>

              <Box sx={{ gridColumn: 'span 2' }}>
                <AutocompleteCursorDropdown
                  control={control}
                  name="countries"
                  label="Preferred Countries"
                  options={countryData.options}
                  isLoading={countryData.isLoading}
                  onScrollEnd={() => countryData.hasNextPage && countryData.fetchNextPage()}
                  isMulti
                  isPagination={true}
                  isDisabled={!selectedCompany}
                  placeholderText={!selectedCompany ? "Select a company first" : ""}
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
      </FormProvider>
    </Dialog>
  );
}
