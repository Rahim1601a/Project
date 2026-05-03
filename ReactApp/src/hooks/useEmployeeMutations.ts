import { useQueryClient } from '@tanstack/react-query';
import { useGenericMutation } from './useGenericQuery';

export type Company = {
  id: number;
  name: string;
};

export type Country = {
  id: number;
  name: string;
  code: string;
  companyId?: number;
};

export type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  salary: number;
  companyId?: number;
  company?: Company;
  countries: Country[];
};

/** Payload structure expected by the API */
interface EmployeePayload {
  id?: number;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  salary: number;
  companyId?: number;
  countryIds: number[];
}

/** Helper to map Employee entity to API Payload */
const mapToPayload = (employee: Partial<Employee>): EmployeePayload => ({
  id: employee.id,
  firstName: employee.firstName || '',
  lastName: employee.lastName || '',
  position: employee.position || '',
  department: employee.department || '',
  salary: employee.salary || 0,
  companyId: employee.companyId,
  countryIds: employee.countries?.map(c => c.id) || []
});

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const mutation = useGenericMutation<Employee, Error, EmployeePayload>(
    '/employees',
    'POST',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      },
    }
  );

  // Return a wrapped version that handles the mapping
  return {
    ...mutation,
    mutate: (employee: Omit<Employee, 'id'>) => mutation.mutate(mapToPayload(employee)),
    mutateAsync: (employee: Omit<Employee, 'id'>) => mutation.mutateAsync(mapToPayload(employee)),
  };
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  const mutation = useGenericMutation<boolean, Error, EmployeePayload>(
    (variables) => `/employees/${variables.id}`,
    'PUT',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      },
    }
  );

  return {
    ...mutation,
    mutate: (employee: Employee) => mutation.mutate(mapToPayload(employee)),
    mutateAsync: (employee: Employee) => mutation.mutateAsync(mapToPayload(employee)),
  };
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useGenericMutation<boolean, Error, number>(
    (id) => `/employees/${id}`,
    'DELETE',
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      },
    }
  );
}
