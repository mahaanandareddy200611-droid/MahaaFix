
import { useState } from "react";
import { Link } from "react-router-dom";

import { Signup as signupUser } from "../services/auth.service";
import "../css/Signup.css";

const initialFormData = {
    name: "",
    email: "",
    password: "",
    age: "",
    mobileNumber: "",
    role: "customer",
};

function Signup() {
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((currentData) => ({
            ...currentData,
            [name]: value,
        }));

        setErrorMessage("");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (isSubmitting || isRegistered) {
            return;
        }

        const payload = {
            ...formData,
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            age: Number(formData.age),
            mobileNumber: formData.mobileNumber.trim(),
        };

        setIsSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const response = await signupUser(payload);

            setIsRegistered(true);
            setSuccessMessage(
                response.data?.message ||
                    "Your account has been created successfully."
            );
        } catch (error) {
            const status = error.response?.status;
            const serverMessage = error.response?.data?.message;

            if (status === 409) {
                setErrorMessage(
                    "An account may already exist with these details. Try logging in."
                );
            } else if (status === 400) {
                setErrorMessage(
                    typeof serverMessage === "string"
                        ? serverMessage
                        : "Please check your details and try again."
                );
            } else if (status === 429) {
                setErrorMessage(
                    "Too many requests. Please try again later."
                );
            } else if (status >= 500) {
                setErrorMessage(
                    "The server encountered a problem. Please try again later."
                );
            } else if (error.request) {
                setErrorMessage(
                    "Could not reach MahaaFix. Check your connection and try again."
                );
            } else {
                setErrorMessage(
                    "Unable to submit the signup form. Please try again."
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    const fieldsDisabled = isSubmitting || isRegistered;

    return (
        <main className="signup-page">
            <section
                className="signup-card"
                aria-labelledby="signup-heading"
            >
                <header className="signup-header">
                    <p className="signup-eyebrow">
                        MAHAAFIX
                    </p>

                    <h1 id="signup-heading">
                        Create your account
                    </h1>

                    <p>
                        Join MahaaFix to manage your work and records.
                    </p>
                </header>

                {errorMessage && (
                    <div className="signup-message signup-message--error"
                        role="alert"
                    >
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div className="signup-message signup-message--success"
                        role="status"
                    >
                        {successMessage}
                    </div>
                )}

                <form
                    className="signup-form"
                    onSubmit={handleSubmit}
                    aria-busy={isSubmitting}
                >
                    <div className="form-group form-group--full">
                        <label htmlFor="signup-name">
                            Full name
                        </label>

                        <input
                            id="signup-name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            autoComplete="name"
                            placeholder="Enter your full name"
                            required
                            disabled={fieldsDisabled}
                        />
                    </div>

                    <div className="form-group form-group--full">
                        <label htmlFor="signup-email">
                            Email address
                        </label>

                        <input
                            id="signup-email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                            placeholder="you@example.com"
                            required
                            disabled={fieldsDisabled}
                        />
                    </div>

                    <div className="form-group form-group--full">
                        <label htmlFor="signup-password">
                            Password
                        </label>

                        <input
                            id="signup-password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                            minLength={6}
                            placeholder="At least 6 characters"
                            required
                            disabled={fieldsDisabled}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="signup-mobile">
                            Mobile number
                        </label>

                        <input
                            id="signup-mobile"
                            name="mobileNumber"
                            type="tel"
                            inputMode="numeric"
                            value={formData.mobileNumber}
                            onChange={handleChange}
                            autoComplete="tel-national"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            placeholder="10-digit number"
                            title="Enter exactly 10 digits"
                            required
                            disabled={fieldsDisabled}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="signup-age">
                            Age
                        </label>

                        <input
                            id="signup-age"
                            name="age"
                            type="number"
                            inputMode="numeric"
                            min={18}
                            step={1}
                            value={formData.age}
                            onChange={handleChange}
                            placeholder="18 or older"
                            required
                            disabled={fieldsDisabled}
                        />
                    </div>

                    <div className="form-group form-group--full">
                        <label htmlFor="signup-role">
                            Account type
                        </label>

                        <select
                            id="signup-role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            disabled={fieldsDisabled}
                        >
                            <option value="customer">
                                Customer
                            </option>

                            <option value="worker">
                                Worker
                            </option>
                        </select>

                        <small>
                            Choose how you will use MahaaFix.
                        </small>
                    </div>

                    <div className="signup-actions">
                        <button
                            className="signup-button"
                            type="submit"
                            disabled={fieldsDisabled}
                        >
                            {isSubmitting
                                ? "Creating account..."
                                : isRegistered
                                    ? "Account created"
                                    : "Create account"}
                        </button>
                    </div>
                </form>

                <footer className="signup-footer">
                    <span>Already have an account?</span>
                    <Link to="/login">Sign in</Link>
                </footer>
            </section>
        </main>
    );
}

export default Signup;