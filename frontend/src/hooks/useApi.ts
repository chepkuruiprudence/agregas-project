import { useState, useCallback } from 'react';
import apiClient from '../services/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient[method](url, data);
      // Returns the response body directly ({ success, statusCode, data, message })
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message;
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { request, loading, error };
};