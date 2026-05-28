import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAuth } from 'firebase/auth';

const viteEnv = (import.meta as any).env || {};

const BACKEND_API_BASE_URL = viteEnv.VITE_BACKEND_API_URL || 'http://localhost:8082/api';

/**
 * Axios client with automatic Firebase token refresh interceptor.
 *
 * Automatically includes fresh Firebase ID tokens on every request,
 * preventing 401 errors from expired tokens.
 *
 * Usage:
 *   import { apiClient } from '@/backend/axiosClient';
 *   const data = await apiClient.get('/albums');
 *   const response = await apiClient.post('/songs', { title: '...' });
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: BACKEND_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor: Add fresh Firebase ID token to every request.
 *
 * This ensures that:
 * - Each request uses a fresh token (not expired)
 * - Frontend doesn't need to manually call getIdToken(true)
 * - Token is only added if Firebase user is authenticated
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      try {
        // Force refresh to get fresh token (will refresh if expired)
        const idToken = await currentUser.getIdToken(true);

        // Add token to Authorization header
        config.headers.Authorization = `Bearer ${idToken}`;
      } catch (error) {
        console.error('Failed to refresh Firebase token:', error);
        // Continue without token; backend middleware will handle 401
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor: Handle 401 errors gracefully.
 *
 * If backend returns 401 even after token refresh, it means:
 * - Firebase UID is not linked in database
 * - Session needs to be re-synced
 * - User should re-authenticate
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.warn(
        'API returned 401. Firebase user may not be provisioned in backend. ' +
        'Try re-authenticating or contacting support.'
      );
      // You could trigger a re-sync or logout here if needed
      // Example: window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
