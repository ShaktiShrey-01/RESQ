import axios from 'axios';
import toast from 'react-hot-toast';

// 1. Create the custom Axios instance
const api = axios.create({
  // Point this to your backend server port (change 5000 if your backend uses a different port)
  baseURL: 'http://localhost:8000/api', 
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Automatically attach auth tokens to requests (if logged in)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Global Error Handler (The Response Interceptor)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = 
      error.response?.data?.message || 
      error.message || 
      "An unexpected error occurred.";

    if (error.response?.status === 401) {
      toast.error("Session expired or invalid credentials.");
    } else if (error.response?.status === 500) {
      toast.error("Server error. Please try again later.");
    } else {
      // Catches 400 Bad Request, 404, 409 (e.g. "User already registered")
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export default api;