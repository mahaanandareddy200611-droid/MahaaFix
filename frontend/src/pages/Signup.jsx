import { useState } from "react";
import { Signup as signupUser } from "../services/auth.service";
import { useNavigate } from "react-router-dom";

function Signup() {
    const [value, setValue] = useState({
        name: "",
        email: "",
        password: "",
        age: "",
        mobileNumber: "",
        role: "customer"
    });

    const handleChange = (e) => {
        setValue({
            ...value,
            [e.target.name]: e.target.value
        });
    };
    const navigate = useNavigate()
    const handleSignup = async () => {
        try {
            const response = await signupUser(value);

            console.log("Signup response:", response.data);

            alert("signup successfull")
            navigate("/login")


        } catch (error) {
            alert(error.response?.data?.message||"Signup failed")

            console.log("Signup error:", error);
        }
    };

    return (
        <div>
            <h1>Hello New USER</h1>

            <p>Please Signup</p>

            <p>Name</p>
            <input
                type="text"
                name="name"
                value={value.name}
                onChange={handleChange}
            />

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

            <p>Mobile</p>
            <input
                type="text"
                name="mobileNumber"
                value={value.mobileNumber}
                onChange={handleChange}
            />

            <p>Age</p>
            <input
                type="number"
                name="age"
                value={value.age}
                onChange={handleChange}
            />

            <button onClick={handleSignup}>
                Signup
            </button>

            <p>Already have an account?</p>

            <button onClick={()=>navigate("/login")}>
                Login
            </button>
        </div>
    );
}

export default Signup;