import axios, { AxiosError } from "axios";

// Augmented error type for API errors
interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000",
  withCredentials: true, // send HttpOnly cookies on all requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach bearer token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: normalize error shape
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Narrow unknown to AxiosError
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const { response, request } = axiosError;

      if (response) {
        // Backend uses { status, code?, message }
        const data = response.data as
          | { status?: string; code?: string; message?: string }
          | undefined;

        const safeError: ApiError = new Error(
          data?.message || "Something went wrong. Please try again."
        );
        safeError.statusCode = response.status;
        safeError.code = data?.code;
        throw safeError;
      }

      if (request && !response) {
        throw new Error("Network error. Please check your connection.");
      }
    }

    throw new Error("Unexpected error occurred.");
  }
);

export default apiClient;
