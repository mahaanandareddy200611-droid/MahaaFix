import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Login as loginUser } from "../services/auth.service";

import "../css/login.css"

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((currentData) => ({
            ...currentData,
            [name]: value,
        }));

        setErrorMessage("");
    }
    const { login: establishSession } = useAuth();

    async function handleSubmit(event) {
        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const response = await loginUser({
                email: formData.email.trim(),
                password: formData.password,
            });

            const token = response.data?.token;
            const user = response.data?.user;

            // Do not treat an incomplete response as a successful login.
            if (
                typeof token !== "string" ||
                token.length === 0 ||
                !user ||
                typeof user !== "object"
            ) {
                setErrorMessage(
                    "The server returned an unexpected login response. Please try again."
                );
                return;
            }

            // Preserve the existing authentication mechanism for now.
            try {
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));
            } catch {
                // Avoid leaving a partially saved session.
                try {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                } catch {
                    // Storage may be unavailable entirely.
                }

                setErrorMessage(
                    "Your session could not be saved in this browser. Check your browser storage settings."
                );
                return;
            }

            navigate("/dashboard", { replace: true });
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                const serverMessage =
                    error.response.data?.message;

                if (status === 401) {
                    setErrorMessage(
                        "Email or password is incorrect."
                    );
                } else if (status === 400) {
                    setErrorMessage(
                        serverMessage ||
                            "Please check your email and password."
                    );
                } else if (status === 429) {
                    setErrorMessage(
                        "Too many login attempts. Please try again later."
                    );
                } else if (status >= 500) {
                    setErrorMessage(
                        "The MahaaFix server encountered a problem. Please try again later."
                    );
                } else {
                    setErrorMessage(
                        serverMessage || "Login failed."
                    );
                }
            } else if (error.request) {
                if (
                    error.code === "ECONNABORTED" ||
                    error.code === "ETIMEDOUT"
                ) {
                    setErrorMessage(
                        "The login request timed out. Please try again."
                    );
                } else {
                    setErrorMessage(
                        "Could not reach the MahaaFix server. Check your connection and try again."
                    );
                }
            } else {
                setErrorMessage(
                    "Something went wrong while preparing the login request."
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="Login-page">
            <section
                className="Login-card"
                aria-labelledby="login-heading"
            >
                <header className="Login-header">
                    <p className="Login-eyebrow">MAHAAFIX</p>

                    <h1 id="login-heading">
                        Welcome back
                    </h1>

                    <p>
                        Sign in to continue to your MahaaFix account.
                    </p>
                </header>

                {errorMessage && (
                    <div
                        id="login-error"
                        className="Login-error"
                        role="alert"
                    >
                        {errorMessage}
                    </div>
                )}

                <form
                    className="Login-form-container"
                    onSubmit={handleSubmit}
                    aria-busy={isSubmitting}
                >
                    <div className="Login-form">
                        <label htmlFor="login-email">
                            Email address
                        </label>

                        <input
                            id="login-email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                            placeholder="you@example.com"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="Login-form">
                        <label htmlFor="login-password">
                            Password
                        </label>

                        <input
                            id="login-password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                            minLength={6}
                            placeholder="Enter your password"
                            required
                            disabled={isSubmitting}
                        />

                        <div className="Login-form-link">
                            <Link to="/forgotpasswordotp">
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <button
                        className="Login-button"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? "Signing in..."
                            : "Sign in"}
                    </button>
                </form>

                <footer className="Signup-navigation">
                    <p>Don't have an account?</p>

                    <Link to="/signup">
                        Create an account
                    </Link>
                </footer>
            </section>
        </main>
    );
}

export default Login;