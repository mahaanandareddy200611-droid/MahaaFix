
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "../css/Profile.css";

function Profile() {
    const { user, logout } = useAuth();

    const name = user?.name || "MahaaFix user";
    const initial = name.trim().charAt(0).toUpperCase() || "M";

    const role = String(user?.role || "unknown")
        .toLowerCase()
        .replace(/^./, (character) => character.toUpperCase());

    return (
        <main className="profile-page">
            <section className="profile-shell">
                <header className="profile-topbar">
                    <Link
                        className="profile-brand"
                        to="/dashboard"
                    >
                        MAHAAFIX
                    </Link>

                    <Link
                        className="profile-back-link"
                        to="/dashboard"
                    >
                        Back to dashboard
                    </Link>
                </header>

                <section
                    className="profile-card"
                    aria-labelledby="profile-heading"
                >
                    <div className="profile-identity">
                        <div
                            className="profile-avatar"
                            aria-hidden="true"
                        >
                            {initial}
                        </div>

                        <div className="profile-identity-text">
                            <p className="profile-eyebrow">
                                ACCOUNT SETTINGS
                            </p>

                            <h1 id="profile-heading">
                                {name}
                            </h1>

                            <span className="profile-role">
                                {role}
                            </span>
                        </div>
                    </div>

                    <div className="profile-divider" />

                    <section
                        className="profile-details"
                        aria-labelledby="details-heading"
                    >
                        <div className="profile-section-heading">
                            <h2 id="details-heading">
                                Personal information
                            </h2>

                            <p>
                                Details associated with your account.
                            </p>
                        </div>

                        <dl className="profile-fields">
                            <div className="profile-field">
                                <dt>Full name</dt>
                                <dd>{name}</dd>
                            </div>

                            <div className="profile-field">
                                <dt>Email address</dt>
                                <dd>
                                    {user?.email || "Not available"}
                                </dd>
                            </div>

                            <div className="profile-field">
                                <dt>Mobile number</dt>
                                <dd>
                                    {user?.mobileNumber || "Not available"}
                                </dd>
                            </div>

                            <div className="profile-field">
                                <dt>Age</dt>
                                <dd>
                                    {user?.age ?? "Not available"}
                                </dd>
                            </div>

                            <div className="profile-field">
                                <dt>Account role</dt>
                                <dd>{role}</dd>
                            </div>
                        </dl>
                    </section>

                    <div className="profile-note" role="note">
                        Profile editing isn't available yet.
                        Your details are currently read-only.
                    </div>

                    <footer className="profile-actions">
                        <Link
                            className="profile-primary-button"
                            to="/dashboard"
                        >
                            Return to dashboard
                        </Link>

                        <button
                            className="profile-secondary-button"
                            type="button"
                            onClick={logout}
                        >
                            Sign out
                        </button>
                    </footer>
                </section>
            </section>
        </main>
    );
}

export default Profile;