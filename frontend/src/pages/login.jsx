import { useState } from "react";
import { Login as loginUser } from "../services/auth.service";
import { useNavigate } from "react-router-dom";

function Login() {
    const navigate=useNavigate()

    const [value, setValue] = useState({
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        setValue({
            ...value,
            [e.target.name]: e.target.value
        });
    };
    const handleForgotPassword = async ()=>{
        // const 
    }
    const handleLogin = async () => {
        try {   
            const response = await loginUser(value);

            console.log("Login response:", response.data);
            const token = response.data.token;
            const user = response.data.user;
            localStorage.setItem("token",token)
            localStorage.setItem("user", JSON.stringify(user));
            alert("Login sucessfull")


            navigate("/dashboard")


            
        } catch (error) {
            console.log("Login error:", error);
            console.log("Backend Responce:",error.response?.data)

            alert(error.response?.data?.message||"Login failed")
        }
    };

    return (
        <div className="Login-page">
        <div className="Login-card">
            <h1>Hey! USER</h1>

            <p>Welcome to login page</p>
        <div/>
        <div className="Login-form">
            <p>Email</p>

            <input
                type="email"
                name="email"
                value={value.email}
                onChange={handleChange}
            />
        </div>
        <div className="Login-form">
            <p>Password</p>

            <input
                type="password"
                name="password"
                value={value.password}
                onChange={handleChange}
            />
        </div>

            <button
            className="Login-button" 
            onClick={handleLogin}>
                Login
            </button>

            <button className="ForgotPassword-Button"
            onClick={handleForgotPassword}
            >
                Forgot Password
            </button>
            <div className="Signup-navigation">
            <p>Don't have an account?</p>

            <button onClick={()=>navigate("/signup")}>
                Signup
            </button>
            </div>
        </div>
        </div>
    );
}

export default Login;