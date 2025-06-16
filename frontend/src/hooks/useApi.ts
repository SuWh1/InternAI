import { useState, useEffect } from 'react';
import type { ApiError } from '../types/api';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error as ApiError,
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    ...state,
    refetch: fetchData,
  };
}

export function useApiMutation<T, TData = any>(
  apiCall: (data: TData) => Promise<T>
): {
  mutate: (data: TData) => Promise<T>;
  loading: boolean;
  error: ApiError | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutate = async (data: TData): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall(data);
      setLoading(false);
      return result;
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError);
      setLoading(false);
      throw apiError;
    }
  };

  return {
    mutate,
    loading,
    error,
  };
} 