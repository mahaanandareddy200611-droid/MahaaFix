import api from "../api/api";

export const Login = (data) => {
    return api.post("api/v1/auth/login", data);
};

export const Signup = (data) => {
    return api.post("api/v1/auth/signup", data);
};

export const Dashboard = ()=>{
    return api.get("api/vi/jobs//my-jobs")
}