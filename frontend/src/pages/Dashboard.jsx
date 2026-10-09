
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "../css/Dashboard.css";

const roleDetails = {
    customer: {
        label: "Customer",
        description:
            "Manage your account and discover records of completed work.",
    },
    worker: {
        label: "Worker",
        description:
            "Manage your work records and explore records published on MahaaFix.",
    },
    admin: {
        label: "Administrator",
        description:
            "Access your account and the work records available in MahaaFix.",
    },
    operator: {
        label: "Operator",
        description:
            "Access your account and the work records available in MahaaFix.",
    },
};

function Dashboard() {
    const { user, logout } = useAuth();

    const role = String(user?.role || "").toLowerCase();
    const roleInfo = roleDetails[role] || {
        label: "Member",
        description:
            "Access your MahaaFix account and available features.",
    };

    const name =
        typeof user?.name === "string" && user.name.trim()
            ? user.name.trim()
            : "there";

    const initial = name.charAt(0).toUpperCase();

    const actions = [
        {
            title: "Browse Work Records",
            description:
                "Explore records of work, services and completed projects.",
            icon: "▤",
            to: "/work-records",
            label: "Explore records",
        },
        {
            title: "Your Profile",
            description:
                "Review your account details and registered information.",
            icon: "◉",
            to: "/profile",
            label: "View profile",
        },
        {
            title: "Jobs",
            description:
                "Browse available work and review jobs associated with your account.",
            icon: "▦",
            to: "/jobs",
            label: "View jobs",
        },
        {
            title: "Create a Job",
            description:
                "Describe a service you need and submit a new job request.",
            icon: "+",
            to: "/create-job",
            label: "Create a request",
},
    ];

    if (role === "worker") {
        actions.unshift({
            title: "Create Work Record",
            description:
                "Document work you've completed and create a professional record.",
            icon: "+",
            to: "/create-work-record",
            label: "Create a record",
        });
        actions.unshift({
            title: "Availability",
            description:
                "Control your online status and keep worker presence updated.",
            icon: "◉",
            to: "/worker-presence",
            label: "Manage availability",
});
    }

    if (["admin", "operator"].includes(role)) {
    actions.unshift({
        title: "Operations",
        description:
            "Review available jobs and monitor assignment operations.",
        icon: "▦",
        to: "/operations",
        label: "Open operations",
    });
}

    const visibleActions = actions.filter((action) => {
    if (action.to === "/create-job") {
        return role === "customer";
    }

    return true;
});

    return (
        <main className="dashboard-page">
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <Link
                        to="/dashboard"
                        className="dashboard-brand"
                        aria-label="MahaaFix home"
                    >
                        MAHAAFIX
                    </Link>

                    <div className="dashboard-header-actions">
                        <Link
                            to="/profile"
                            className="dashboard-profile-link"
                        >
                            My profile
                        </Link>

                        <button
                            type="button"
                            className="dashboard-logout"
                            onClick={logout}
                        >
                            Sign out
                        </button>
                    </div>
                </header>

                <section
                    className="dashboard-hero"
                    aria-labelledby="dashboard-heading"
                >
                    <div className="dashboard-hero-content">
                        <span className="dashboard-eyebrow">
                            YOUR WORKSPACE
                        </span>

                        <h1 id="dashboard-heading">
                            Welcome back, {name}
                        </h1>

                        <p className="dashboard-intro">
                            {roleInfo.description}
                        </p>

                        <div className="dashboard-role">
                            <span
                                className="dashboard-role-dot"
                                aria-hidden="true"
                            />

                            {roleInfo.label} account
                        </div>
                    </div>

                    <div
                        className="dashboard-avatar"
                        aria-hidden="true"
                    >
                        {initial}
                    </div>
                </section>

                <section
                    className="dashboard-workspace"
                    aria-labelledby="workspace-heading"
                >
                    <div className="dashboard-section-heading">
                        <div>
                            <h2 id="workspace-heading">
                                Your workspace
                            </h2>

                            <p>
                                Choose what you want to work on.
                            </p>
                        </div>
                    </div>

                    <div className="dashboard-action-grid">
                        {actions.map((action) => (
                            <Link
                                key={action.title}
                                to={action.to}
                                className="dashboard-action-card"
                            >
                                <span
                                    className="dashboard-action-icon"
                                    aria-hidden="true"
                                >
                                    {action.icon}
                                </span>

                                <h3>{action.title}</h3>

                                <p>{action.description}</p>

                                <span className="dashboard-action-link">
                                    {action.label}
                                    <span aria-hidden="true">
                                        {" "}→
                                    </span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                <footer className="dashboard-footer">
                    <span>MahaaFix</span>
                    <span>
                        Your work. Your records. Your history.
                    </span>
                </footer>
            </div>
        </main>
    );
}

export default Dashboard;