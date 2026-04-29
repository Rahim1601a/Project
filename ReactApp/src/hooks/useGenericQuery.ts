import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
  statusCode: number;
}

/**
 * A generic hook for fetching data (GET requests)
 * 
 * @param queryKey The unique key for this query
 * @param url The API endpoint
 * @param params Optional query parameters
 * @param options Additional react-query options
 */
export function useGenericQuery<
  T = unknown,
  TError = Error,
  TData = T,
  TQueryKey extends QueryKey = QueryKey
>(
  queryKey: TQueryKey,
  url: string,
  params?: Record<string, string | number | boolean>,
  options?: Omit<UseQueryOptions<ApiResponse<T>, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ApiResponse<T>, TError, TData, TQueryKey>({
    queryKey,
    queryFn: async () => {
      const response = await apiClient<ApiResponse<T>>(url, { params });
      if (!response.success) {
        throw new Error(response.message || 'API Error');
      }
      return response;
    },
    select: (response) => response.data as unknown as TData,
    ...options,
  });
}

/**
 * A generic hook for mutating data (POST, PUT, PATCH, DELETE requests)
 * 
 * @param url The API endpoint
 * @param method The HTTP method
 * @param options Additional react-query options
 */
export function useGenericMutation<
  T = unknown,
  TError = Error,
  TVariables = unknown,
  TContext = unknown
>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options?: Omit<UseMutationOptions<T, TError, TVariables, TContext>, 'mutationFn'>
) {
  return useMutation<T, TError, TVariables, TContext>({
    mutationFn: async (variables: TVariables) => {
      const response = await apiClient<ApiResponse<T>>(url, {
        method,
        body: variables ? JSON.stringify(variables) : undefined,
      });
      if (!response.success) {
        throw new Error(response.message || 'API Error');
      }
      return response.data;
    },
    ...options,
  });
}
export interface CursorPagedResponse<T> {
  items: T[];
  nextCursor: number | null;
  hasMore: boolean;
}

export function useGenericCursorQuery<
  T = unknown,
  TError = Error,
  TQueryKey extends QueryKey = QueryKey
>(
  queryKey: TQueryKey,
  url: string,
  cursor: number | null,
  pageSize: number = 10,
  params?: Record<string, string | number | boolean>,
  options?: Omit<UseQueryOptions<ApiResponse<CursorPagedResponse<T>>, TError, CursorPagedResponse<T>, TQueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ApiResponse<CursorPagedResponse<T>>, TError, CursorPagedResponse<T>, TQueryKey>({
    queryKey: [...queryKey, cursor, pageSize] as unknown as TQueryKey,
    queryFn: async () => {
      const response = await apiClient<ApiResponse<CursorPagedResponse<T>>>(url, {
        params: { 
          ...params, 
          ...(cursor ? { cursor } : {}), 
          pageSize 
        },
      });
      if (!response.success) {
        throw new Error(response.message || 'API Error');
      }
      return response;
    },
    select: (response) => response.data,
    ...options,
  });
}
