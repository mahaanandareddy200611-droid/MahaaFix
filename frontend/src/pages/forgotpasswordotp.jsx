
import { useState } from "react";
import { Link } from "react-router-dom";

import {
    Forgotpassword,
    VerifyOTP,
    ChangePassword,
} from "../services/auth.service";

import "../css/ForgotPassword.css";

function ForgotpasswordPage() {
    const [step, setStep] = useState("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    function clearMessages() {
        setErrorMessage("");
        setSuccessMessage("");
    }

    async function handleSendOtp(event) {
        event.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);
        clearMessages();

        try {
            await Forgotpassword({
                email: email.trim().toLowerCase(),
            });

            setStep("otp");
            setSuccessMessage(
                "Request submitted. Check your email for the reset OTP."
            );
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message ||
                "Unable to process the request. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleVerifyOtp(event) {
        event.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);
        clearMessages();

        try {
            await VerifyOTP({
                email: email.trim().toLowerCase(),
                otp,
            });

            setStep("password");
            setSuccessMessage(
                "OTP verified. You can now set a new password."
            );
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message ||
                "OTP verification failed. Check the code and try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleResetPassword(event) {
        event.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);
        clearMessages();

        try {
            await ChangePassword({
                email: email.trim().toLowerCase(),
                password,
            });

            setStep("complete");
            setPassword("");
            setOtp("");
            setSuccessMessage(
                "Your password has been reset successfully."
            );
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message ||
                "Password reset failed. You may need to verify your OTP again."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleBack() {
        clearMessages();

        if (step === "otp") {
            setStep("email");
            setOtp("");
        } else if (step === "password") {
            setStep("otp");
            setOtp("");
        }
    }

    return (
        <main className="password-reset-page">
            <section
                className="password-reset-card"
                aria-labelledby="reset-heading"
            >
                <header className="password-reset-header">
                    <p className="password-reset-eyebrow">
                        MAHAAFIX / ACCOUNT SECURITY
                    </p>

                    <h1 id="reset-heading">
                        {step === "complete"
                            ? "Password updated"
                            : "Reset your password"}
                    </h1>

                    <p>
                        {step === "email" &&
                            "Enter your email address to request a reset code."}

                        {step === "otp" &&
                            "Enter the six-digit code sent to your email."}

                        {step === "password" &&
                            "Choose a new password for your account."}

                        {step === "complete" &&
                            "Your account is ready for you to sign in again."}
                    </p>
                </header>

                <div
                    className="reset-progress"
                    aria-label={`Step ${
                        ["email", "otp", "password", "complete"]
                            .indexOf(step) + 1
                    } of 4`}
                >
                    {["email", "otp", "password", "complete"].map(
                        (item, index) => (
                            <div
                                key={item}
                                className={`reset-progress-item ${
                                    ["email", "otp", "password", "complete"]
                                        .indexOf(step) >= index
                                        ? "is-active"
                                        : ""
                                }`}
                            />
                        )
                    )}
                </div>

                {errorMessage && (
                    <div
                        className="reset-message reset-message--error"
                        role="alert"
                    >
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div
                        className="reset-message reset-message--success"
                        role="status"
                    >
                        {successMessage}
                    </div>
                )}

                {step === "email" && (
                    <form
                        className="reset-form"
                        onSubmit={handleSendOtp}
                        aria-busy={isSubmitting}
                    >
                        <div className="reset-field">
                            <label htmlFor="reset-email">
                                Email address
                            </label>

                            <input
                                id="reset-email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                    clearMessages();
                                }}
                                placeholder="you@example.com"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <button
                            className="reset-primary-button"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? "Sending request..."
                                : "Send reset code"}
                        </button>
                    </form>
                )}

                {step === "otp" && (
                    <form
                        className="reset-form"
                        onSubmit={handleVerifyOtp}
                        aria-busy={isSubmitting}
                    >
                        <div className="reset-field">
                            <label htmlFor="reset-otp">
                                Six-digit verification code
                            </label>

                            <input
                                id="reset-otp"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                pattern="[0-9]{6}"
                                minLength={6}
                                maxLength={6}
                                value={otp}
                                onChange={(event) => {
                                    setOtp(
                                        event.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6)
                                    );
                                    clearMessages();
                                }}
                                placeholder="000000"
                                required
                                disabled={isSubmitting}
                            />

                            <small>
                                The code expires. Request a new one if necessary.
                            </small>
                        </div>

                        <button
                            className="reset-primary-button"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? "Verifying..."
                                : "Verify code"}
                        </button>

                        <button
                            className="reset-secondary-button"
                            type="button"
                            onClick={handleBack}
                            disabled={isSubmitting}
                        >
                            Back to email
                        </button>
                    </form>
                )}

                {step === "password" && (
                    <form
                        className="reset-form"
                        onSubmit={handleResetPassword}
                        aria-busy={isSubmitting}
                    >
                        <div className="reset-field">
                            <label htmlFor="reset-password">
                                New password
                            </label>

                            <input
                                id="reset-password"
                                type="password"
                                autoComplete="new-password"
                                minLength={6}
                                value={password}
                                onChange={(event) => {
                                    setPassword(event.target.value);
                                    clearMessages();
                                }}
                                placeholder="At least 6 characters"
                                required
                                disabled={isSubmitting}
                            />

                            <small>
                                Use a password of at least six characters.
                            </small>
                        </div>

                        <button
                            className="reset-primary-button"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? "Updating password..."
                                : "Set new password"}
                        </button>

                        <button
                            className="reset-secondary-button"
                            type="button"
                            onClick={handleBack}
                            disabled={isSubmitting}
                        >
                            Back to verification
                        </button>
                    </form>
                )}

                {step === "complete" && (
                    <Link
                        className="reset-primary-button reset-login-link"
                        to="/login"
                    >
                        Return to login
                    </Link>
                )}

                {step !== "complete" && (
                    <footer className="reset-footer">
                        <Link to="/login">
                            Back to sign in
                        </Link>
                    </footer>
                )}
            </section>
        </main>
    );
}

export default ForgotpasswordPage;