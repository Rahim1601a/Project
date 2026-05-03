import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseInfiniteQueryOptions,
  type QueryKey,
  type InfiniteData,
} from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';

import type { ApiResponse, CursorPagedResponse } from '../types/api';



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
  url: string | ((variables: TVariables) => string),
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options?: Omit<UseMutationOptions<T, TError, TVariables, TContext>, 'mutationFn'>
) {
  return useMutation<T, TError, TVariables, TContext>({
    mutationFn: async (variables: TVariables) => {
      const resolvedUrl = typeof url === 'function' ? url(variables) : url;
      const response = await apiClient<ApiResponse<T>>(resolvedUrl, {
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

/**
 * A generic hook for infinite scrolling (GET requests with cursor pagination)
 */
export function useGenericInfiniteQuery<
  T = unknown,
  TError = Error,
  TQueryKey extends QueryKey = QueryKey
>(
  queryKey: TQueryKey,
  url: string,
  pageSize: number = 10,
  params?: Record<string, string | number | boolean>,
  options?: Omit<UseInfiniteQueryOptions<CursorPagedResponse<T>, TError, InfiniteData<CursorPagedResponse<T>, number | null>, TQueryKey, number | null>, 'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'>
) {
  return useInfiniteQuery<
    CursorPagedResponse<T>, 
    TError, 
    InfiniteData<CursorPagedResponse<T>, number | null>, 
    TQueryKey, 
    number | null
  >({
    queryKey,
    queryFn: async ({ pageParam = null }) => {
      const response = await apiClient<ApiResponse<CursorPagedResponse<T>>>(url, {
        params: {
          ...params,
          pageSize,
          ...(pageParam !== null ? { cursor: pageParam } : {}),
        },
      });
      if (!response.success) {
        throw new Error(response.message || 'API Error');
      }
      return response.data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    ...options,
  });
}

