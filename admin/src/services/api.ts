import axios from 'axios';
import { getIdToken } from 'firebase/auth';
import { firebaseAuth } from './firebase';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string ?? '/api/v1',
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  const user = firebaseAuth.currentUser;
  if (user) {
    const token = await getIdToken(user);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const message = (error.response?.data as { message?: string })?.message ?? error.message;
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  },
);

export default apiClient;
