import axios from "axios";

// Use an environment-specific backend URL.
// Fall back to localhost for local development.
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000";

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000, // after 20 seconds it rejects or silply time out for responce 
    headers: {
        Accept: "application/json",
    },
});

// Attach the current JWT to each request when available.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;