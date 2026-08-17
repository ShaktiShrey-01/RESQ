import axios from "axios";
import toast from "react-hot-toast";
import { store } from "../store/store";
import { setCredentials, logOut } from "../store/authSlice";

// 1. Create the custom Axios instance
const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Request Interceptor: Attach auth tokens automatically from Redux Store
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor: Handle Refresh Tokens & Display ALL Backend Errors via Toast
api.interceptors.response.use(
  (response) => response, 
  async (error) => {
    const originalRequest = error.config;

    // Extract the exact error message sent by your backend controller
    const errorMessage = 
      error.response?.data?.message || 
      error.message || 
      "An unexpected error occurred.";

    // 🛑 THE FIX: Define authentication routes that should NEVER trigger token refresh or session death 
    //in these routes when error comes up like invalid pasword or otp then it always returns error session expired whcih is incorrect so we need to bypass the rotate token logic for these routes
    const authRoutes = ['/users/login', '/users/signup', '/users/send-signup-otp', '/users/refreshtoken'];
    const isAuthRoute = originalRequest.url && authRoutes.some((route) => originalRequest.url.includes(route));

    // If it's an auth route (like wrong login or wrong OTP), bypass refresh logic and just show the error toast
    if (isAuthRoute) {
      toast.error(errorMessage);
      return Promise.reject(error);
    }

    // --- AUTO REFRESH TOKEN LOGIC ---
    // If we get a 401 Unauthorized on a protected route, and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Prevent infinite loops
      
      try {
        // Attempt to refresh the access token using the HttpOnly cookie
        const res = await axios.post(
          "http://localhost:8000/api/users/refreshtoken",
          {},
          { withCredentials: true }
        );

        // Update Redux with the new access token
        store.dispatch(
          setCredentials({
            accessToken: res.data.accessToken,
            user: res.data.user,
          })
        );

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // If the refresh token request itself fails, the session is completely dead
        store.dispatch(logOut());
        toast.error("Session expired. Please log in again.");
        return Promise.reject(refreshError);
      }
    }

    // --- GLOBAL TOAST ERROR HANDLER ---
    if (error.response?.status === 500) {
      toast.error("Server error. Please try again later.");
    } else {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export default api;