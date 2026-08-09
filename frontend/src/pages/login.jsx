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

    const handleLogin = async () => {
        try {   
            const response = await loginUser(value);

            console.log("Login response:", response.data);
            const token = response.data.token;
            const user = response.data.user;
            localStorage.setItem("Token stored :",token)
            localStorage.setItem("user", JSON.stringify(user));
            alert("Login sucessfull")


            navigate("/dashboard")


            
        } catch (error) {
            console.log("Login error:", error);
            console.log("Backend Responce:",error.responce?.message)

            alert(error.response?.data?.message||"Login failed")
        }
    };

    return (
        <div>
            <h1>Hey! USER</h1>

            <p>Welcome to login page</p>

            <p>Email</p>

            <input
                type="email"
                name="email"
                value={value.email}
                onChange={handleChange}
            />

            <p>Password</p>

            <input
                type="password"
                name="password"
                value={value.password}
                onChange={handleChange}
            />

            <button onClick={handleLogin}>
                Login
            </button>

            <button>
                Forgot Password
            </button>

            <p>Don't have an account?</p>

            <button onClick={()=>navigate("/signup")}>
                Signup
            </button>
        </div>
    );
}

export default Login;