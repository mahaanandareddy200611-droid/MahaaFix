
import api from "../api/api";

const AUTH_BASE_URL = "/api/v1/auth";

// Authenticate an existing user.
export const Login = (data) => {
    return api.post(`${AUTH_BASE_URL}/login`, data);
};

// Register a new user.
export const Signup = (data) => {
    return api.post(`${AUTH_BASE_URL}/signup`, data);
};

// Request a password-reset OTP.
export const Forgotpassword = (data) => {
    return api.post(
        `${AUTH_BASE_URL}/forget-password`,
        data
    );
};

// Verify the password-reset OTP.
export const VerifyOTP = (data) => {
    return api.post(
        `${AUTH_BASE_URL}/verify-reset-otp`,
        data
    );
};

// Set the new password.
export const ChangePassword = (data) => {
    return api.post(
        `${AUTH_BASE_URL}/reset-password`,
        data
    );
};

// Existing dashboard helper, retained for compatibility.
// We can move it to job.service.js when we implement the Jobs feature.
export const Dashboard = () => {
    return api.get("/api/v1/jobs/my-jobs");
};