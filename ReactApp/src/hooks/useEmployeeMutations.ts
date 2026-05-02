import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';
import type { ApiResponse } from '../types/api';

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

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employee: Omit<Employee, 'id'>) => {
      const payload = {
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position,
        department: employee.department,
        salary: employee.salary,
        companyId: employee.companyId,
        countryIds: employee.countries?.map(c => c.id) || []
      };
      const res = await apiClient<ApiResponse<Employee>>('/employees', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employee: Employee) => {
      const payload = {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position,
        department: employee.department,
        salary: employee.salary,
        companyId: employee.companyId,
        countryIds: employee.countries?.map(c => c.id) || []
      };
      const res = await apiClient<ApiResponse<boolean>>(`/employees/${employee.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient<ApiResponse<boolean>>(`/employees/${id}`, {
        method: 'DELETE',
      });
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
