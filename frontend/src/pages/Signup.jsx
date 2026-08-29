import { useState } from "react";
import { Signup as signupUser } from "../services/auth.service";
import { useNavigate } from "react-router-dom";
import "../css/Signup.css";

function Signup() {
    const navigate = useNavigate();

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

    const handleSignup = async () => {
        try {
            const response = await signupUser(value);

            console.log("Signup response:", response.data);

            alert("Signup successful");
            navigate("/login");

        } catch (error) {
            console.log("Signup error:", error);

            alert(
                error.response?.data?.message ||
                "Signup failed"
            );
        }
    };

    return (
        <div className="signup-page">

            <div className="signup-card">

                <div className="signup-header">
                    <h1>Create your account</h1>
                    <p>Join MahaaFix and start managing your work records.</p>
                </div>

                <div className="form-group">
                    <label>Name</label>
                    <input
                        type="text"
                        name="name"
                        value={value.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                    />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={value.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                    />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={value.password}
                        onChange={handleChange}
                        placeholder="Create a password"
                    />
                </div>

                <div className="form-group">
                    <label>Mobile Number</label>
                    <input
                        type="text"
                        name="mobileNumber"
                        value={value.mobileNumber}
                        onChange={handleChange}
                        placeholder="Enter mobile number"
                    />
                </div>

                <div className="form-group">
                    <label>Age</label>
                    <input
                        type="number"
                        name="age"
                        value={value.age}
                        onChange={handleChange}
                        placeholder="Enter age"
                    />
                </div>

                <button
                    className="signup-button"
                    onClick={handleSignup}
                >
                    Create Account
                </button>

                <div className="login-link">
                    <span>Already have an account?</span>

                    <button onClick={() => navigate("/login")}>
                        Login
                    </button>
                </div>

            </div>

        </div>
    );
}

export default Signup;