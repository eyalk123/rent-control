import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling (only logs when not using mock)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.warn('[API]', error.response.status, error.response.data);
    }
    // Network errors are expected when no backend is running - avoid console spam
    return Promise.reject(error);
  }
);

export default apiClient;
