import { useCallback, useState } from "react";

interface UseApiState {
  loading: boolean;
  error: string | null;
  data: any;
}

export function useApi() {
  const [state, setState] = useState<UseApiState>({
    loading: false,
    error: null,
    data: null,
  });

  const request = useCallback(
    async (url: string, options: RequestInit = {}) => {
      setState({ loading: true, error: null, data: null });

      try {
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
          ...options,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "API request failed");
        }

        const data = await response.json();
        setState({ loading: false, error: null, data });
        return data;
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        setState({ loading: false, error, data: null });
        throw err;
      }
    },
    []
  );

  return { ...state, request };
}
