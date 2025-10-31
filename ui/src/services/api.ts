import axios from "axios";
import { getToken, clearAuth } from '../store/useAuth';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearAuth();
    }
    return Promise.reject(error);
  }
);

export default api;