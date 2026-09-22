import api from "../api/api";

export const Login = (data) => {
    return api.post("api/v1/auth/login", data);
};

export const Signup = (data) => {
    return api.post("api/v1/auth/signup", data);
};

export const Dashboard = ()=>{
    return api.get("api/v1/jobs/my-jobs")
}

export const Forgotpassword = (data) => {
    return api.post("api/v1/auth/forget-password", data);
};

export const VerifyOTP = (data) =>{
    return api.post("api/v1/auth/verify-reset-otp",data)
}

export const ChangePassword =(data)=>{
    return api.post("api/v1/auth/reset-password",data)
}