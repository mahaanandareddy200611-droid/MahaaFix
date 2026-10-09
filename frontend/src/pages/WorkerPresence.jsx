
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "../css/WorkerPresence.css";

const statusLabels = {
    online: "Online",
    offline: "Offline",
    starting: "Going online...",
    stopping: "Going offline...",
    unknown: "Status needs verification",
};

function WorkerPresence() {
    const {
        user,
        workerPresenceStatus,
        lastHeartbeatAt,
        presenceError,
        goOnline,
        goOffline,
        refreshSession,
    } = useAuth();

    const isWorker =
        String(user?.role || "").toLowerCase() === "worker";

    const busy = ["starting", "stopping"].includes(
        workerPresenceStatus
    );

    const knownState = ["online", "offline"].includes(
        workerPresenceStatus
    );

    const timestamp = lastHeartbeatAt
        ? new Date(lastHeartbeatAt)
        : null;

    const formattedHeartbeat =
        timestamp && !Number.isNaN(timestamp.getTime())
            ? timestamp.toLocaleString()
            : "Not recorded";

    async function handleOnline() {
        try {
            await goOnline();
        } catch {
            // Error feedback is maintained in AuthContext.
        }
    }

    async function handleOffline() {
        try {
            await goOffline();
        } catch {
            // Error feedback is maintained in AuthContext.
        }
    }

    return (
        <main className="worker-presence-page">
            <div className="worker-presence-shell">
                <header className="worker-presence-topbar">
                    <Link
                        to="/dashboard"
                        className="worker-presence-brand"
                    >
                        MAHAAFIX
                    </Link>

                    <Link
                        to="/dashboard"
                        className="worker-presence-back"
                    >
                        Back to dashboard
                    </Link>
                </header>

                <section className="worker-presence-card">
                    <p className="worker-presence-eyebrow">
                        WORKER WORKSPACE
                    </p>

                    <h1>Your availability</h1>

                    <p className="worker-presence-description">
                        Control whether MahaaFix considers you available
                        for new job assignments.
                    </p>

                    {!isWorker && (
                        <div
                            className="presence-message presence-message--error"
                            role="alert"
                        >
                            Only worker accounts can manage availability.
                        </div>
                    )}

                    <div
                        className={`presence-status presence-status--${workerPresenceStatus}`}
                        role="status"
                        aria-live="polite"
                    >
                        <span
                            className="presence-status-dot"
                            aria-hidden="true"
                        />

                        <span>
                            {statusLabels[workerPresenceStatus] ||
                                "Presence unavailable"}
                        </span>
                    </div>

                    <div className="presence-info">
                        <div>
                            <span>Signed-in worker</span>
                            <strong>{user?.name || "Worker"}</strong>
                        </div>

                        <div>
                            <span>Last successful heartbeat</span>
                            <strong>{formattedHeartbeat}</strong>
                        </div>
                    </div>

                    {presenceError && (
                        <div
                            className="presence-message presence-message--error"
                            role="alert"
                        >
                            {presenceError}
                        </div>
                    )}

                    <div className="presence-actions">
                        <button
                            type="button"
                            className="presence-button presence-button--online"
                            onClick={() => void handleOnline()}
                            disabled={
                                !isWorker ||
                                busy ||
                                workerPresenceStatus === "online"
                            }
                        >
                            Go online
                        </button>

                        <button
                            type="button"
                            className="presence-button presence-button--offline"
                            onClick={() => void handleOffline()}
                            disabled={
                                !isWorker ||
                                busy ||
                                workerPresenceStatus === "offline"
                            }
                        >
                            Go offline
                        </button>

                        <button
                            type="button"
                            className="presence-button presence-button--refresh"
                            onClick={() => void refreshSession()}
                            disabled={busy}
                        >
                            Refresh status
                        </button>
                    </div>

                    <div className="presence-note">
                        <strong>How availability works</strong>

                        <p>
                            When you go online, MahaaFix records your presence.
                            The application sends heartbeats while you stay
                            signed in. Going offline stops the timer and tells
                            the backend that you are unavailable.
                        </p>

                        <p>
                            Keep MahaaFix open while available for work.
                            Browser throttling or connectivity issues can delay
                            heartbeats.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default WorkerPresence;