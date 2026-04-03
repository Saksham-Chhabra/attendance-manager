import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
});

// Request Interceptor: Attach Access Token
instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Silent Token Renewal
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return instance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const res = await axios.post('http://localhost:5000/api/auth/refresh', {}, { withCredentials: true });
        
        if (res.data.status === 'success') {
          const newToken = res.data.token;
          useAuthStore.getState().setToken(newToken);
          
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default instance;
