import axios from 'axios';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const apiClient = async <T>(
  url: string,
  options?: FetchOptions
): Promise<T> => {
  const { params, method, body, headers } = options || {};

  try {
    const response = await axiosInstance.request<T>({
      url,
      method: (method as any) || 'GET',
      params,
      data: body && typeof body === 'string' ? JSON.parse(body) : body,
      headers: headers as any,
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      // Return the structured error response from the API
      return error.response.data as T;
    }
    throw error;
  }
};
