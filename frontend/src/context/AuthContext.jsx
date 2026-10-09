
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { getCurrentUser } from "../services/user.service";

import {
    goWorkerOnline,
    goWorkerOffline,
    sendWorkerHeartbeat,
} from "../services/workerPresence.service";

const AuthContext = createContext(null);

function readStoredToken() {
    try {
        return localStorage.getItem("token");
    } catch {
        return null;
    }
}

function readStoredUser() {
    try {
        const value = localStorage.getItem("user");
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

function clearStoredSession() {
    try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    } catch {
        // Storage might be unavailable.
    }
}

function isWorker(user) {
    return String(user?.role || "").toLowerCase() === "worker";
}

function initialPresenceStatus() {
    const user = readStoredUser();

    return isWorker(user) && user?.isOnline === true
        ? "online"
        : "offline";
}

export function AuthProvider({ children }) {
    const sessionVersion = useRef(0);
    const heartbeatEnabled = useRef(false);
    const heartbeatInFlight = useRef(null);

    const [token, setToken] = useState(readStoredToken);
    const [user, setUser] = useState(readStoredUser);

    const [status, setStatus] = useState(() =>
        readStoredToken() ? "loading" : "anonymous"
    );

    const [
        workerPresenceStatus,
        setWorkerPresenceStatus,
    ] = useState(initialPresenceStatus);

    const [lastHeartbeatAt, setLastHeartbeatAt] = useState(
        () => readStoredUser()?.lastHeartbeat || null
    );

    const [authError, setAuthError] = useState("");
    const [presenceError, setPresenceError] = useState("");

    const login = useCallback(({ token: nextToken, user: nextUser }) => {
        if (
            typeof nextToken !== "string" ||
            !nextToken ||
            !nextUser ||
            typeof nextUser !== "object"
        ) {
            throw new Error("The login response is incomplete.");
        }

        try {
            localStorage.setItem("token", nextToken);
            localStorage.setItem("user", JSON.stringify(nextUser));
        } catch {
            clearStoredSession();

            throw new Error(
                "Unable to save your session in this browser."
            );
        }

        sessionVersion.current += 1;

        setToken(nextToken);
        setUser(nextUser);
        setStatus("authenticated");
        setAuthError("");
        setPresenceError("");

        setWorkerPresenceStatus(
            isWorker(nextUser) && nextUser.isOnline === true
                ? "online"
                : "offline"
        );

        setLastHeartbeatAt(nextUser.lastHeartbeat || null);
    }, []);

    
const refreshSession = useCallback(async () => {
    const storedToken = readStoredToken();

    if (!storedToken) {
        sessionVersion.current += 1;
        clearStoredSession();

        setToken(null);
        setUser(null);
        setStatus("anonymous");
        setWorkerPresenceStatus("offline");
        setLastHeartbeatAt(null);
        setAuthError("");
        setPresenceError("");
        return;
    }

    const versionAtStart = sessionVersion.current;

    setToken(storedToken);
    setStatus("loading");
    setAuthError("");

    try {
        const response = await getCurrentUser();

        if (versionAtStart !== sessionVersion.current) {
            return;
        }

        const profile = response.data?.data;

        if (!profile || typeof profile !== "object") {
            throw new Error("Invalid profile response.");
        }

        const previousUser = readStoredUser() || {};
        const nextUser = {
            ...previousUser,
            ...profile,
        };

        try {
            localStorage.setItem("user", JSON.stringify(nextUser));
        } catch {
            // Continue using the in-memory user.
        }

        setToken(storedToken);
        setUser(nextUser);
        setStatus("authenticated");

        const online =
            String(nextUser.role || "").toLowerCase() === "worker" &&
            nextUser.isOnline === true;

        setWorkerPresenceStatus(online ? "online" : "offline");
        setLastHeartbeatAt(nextUser.lastHeartbeat || null);
        setPresenceError("");
    } catch (error) {
        if (versionAtStart !== sessionVersion.current) {
            return;
        }

        if (error.response?.status === 401) {
            sessionVersion.current += 1;
            clearStoredSession();

            setToken(null);
            setUser(null);
            setStatus("anonymous");
            setWorkerPresenceStatus("offline");
            setLastHeartbeatAt(null);
            setAuthError("");
            setPresenceError("");
            return;
        }

        setStatus("unavailable");
        setAuthError(
            "We couldn't verify your session. Check your connection and retry."
        );
    }
}, []);
    const goOnline = useCallback(async () => {
        if (!isWorker(user)) {
            throw new Error("Only workers can change presence.");
        }

        heartbeatEnabled.current = false;
        setWorkerPresenceStatus("starting");
        setPresenceError("");

        try {
            const response = await goWorkerOnline(
                crypto.randomUUID()
            );

            const timestamp =
                response.data?.lastHeartbeat ||
                new Date().toISOString();

            setUser((current) => {
                if (!current) return current;

                const updated = {
                    ...current,
                    isOnline: true,
                    lastHeartbeat: timestamp,
                };

                try {
                    localStorage.setItem(
                        "user",
                        JSON.stringify(updated)
                    );
                } catch {
                    // Keep in-memory state.
                }

                return updated;
            });

            setLastHeartbeatAt(timestamp);
            setWorkerPresenceStatus("online");
        } catch (error) {
            // We don't know whether the server committed the change.
            setWorkerPresenceStatus("unknown");
            setPresenceError(
                "The online result is uncertain. Refresh your presence status before trying again."
            );

            throw error;
        }
    }, [user]);

    const goOffline = useCallback(async () => {
        if (!isWorker(user)) {
            throw new Error("Only workers can change presence.");
        }

        // Stop scheduling heartbeats before requesting offline.
        heartbeatEnabled.current = false;
        setWorkerPresenceStatus("stopping");
        setPresenceError("");

        try {
            if (heartbeatInFlight.current) {
                await heartbeatInFlight.current;
            }

            await goWorkerOffline(crypto.randomUUID());

            const timestamp = new Date().toISOString();

            setUser((current) => {
                if (!current) return current;

                const updated = {
                    ...current,
                    isOnline: false,
                    lastSeen: timestamp,
                };

                try {
                    localStorage.setItem(
                        "user",
                        JSON.stringify(updated)
                    );
                } catch {
                    // Keep in-memory state.
                }

                return updated;
            });

            setWorkerPresenceStatus("offline");
        } catch (error) {
            setWorkerPresenceStatus("unknown");
            setPresenceError(
                "The offline result is uncertain. Refresh your presence status before trying again."
            );

            throw error;
        }
    }, [user]);

    const logout = useCallback(async () => {
        const shouldSetOffline =
            isWorker(user) &&
            workerPresenceStatus === "online";

        heartbeatEnabled.current = false;

        if (shouldSetOffline) {
            setWorkerPresenceStatus("stopping");

            try {
                if (heartbeatInFlight.current) {
                    await heartbeatInFlight.current;
                }

                await goWorkerOffline(crypto.randomUUID());
            } catch {
                // Logout must still work if the server is unreachable.
            }
        }

        sessionVersion.current += 1;
        clearStoredSession();

        setToken(null);
        setUser(null);
        setStatus("anonymous");
        setWorkerPresenceStatus("offline");
        setLastHeartbeatAt(null);
        setAuthError("");
        setPresenceError("");
    }, [user, workerPresenceStatus]);

    // Heartbeats persist across navigation because AuthProvider is
    // mounted above the application's route components.
    useEffect(() => {
        if (
            status !== "authenticated" ||
            !isWorker(user) ||
            workerPresenceStatus !== "online"
        ) {
            heartbeatEnabled.current = false;
            return undefined;
        }

        heartbeatEnabled.current = true;

        const interval = setInterval(() => {
            if (
                !heartbeatEnabled.current ||
                heartbeatInFlight.current
            ) {
                return;
            }

            const request = sendWorkerHeartbeat()
                .then(() => {
                    const timestamp = new Date().toISOString();

                    setLastHeartbeatAt(timestamp);
                    setPresenceError("");

                    setUser((current) => {
                        if (!current) return current;

                        const updated = {
                            ...current,
                            isOnline: true,
                            lastHeartbeat: timestamp,
                        };

                        try {
                            localStorage.setItem(
                                "user",
                                JSON.stringify(updated)
                            );
                        } catch {
                            // Keep in-memory state.
                        }

                        return updated;
                    });
                })
                .catch(() => {
                    // A missed heartbeat should be visible, not silently
                    // treated as a confirmed offline state.
                    setPresenceError(
                        "The last heartbeat failed. MahaaFix will try again."
                    );
                })
                .finally(() => {
                    heartbeatInFlight.current = null;
                });

            heartbeatInFlight.current = request;
        }, 45000);

        return () => {
            heartbeatEnabled.current = false;
            clearInterval(interval);
        };
    }, [status, user?.role, workerPresenceStatus]);

    const value = useMemo(
        () => ({
            token,
            user,
            status,
            authError,
            isAuthenticated: status === "authenticated",

            login,
            logout,
            refreshSession,

            workerPresenceStatus,
            lastHeartbeatAt,
            presenceError,
            goOnline,
            goOffline,
        }),
        [
            token,
            user,
            status,
            authError,
            login,
            logout,
            refreshSession,
            workerPresenceStatus,
            lastHeartbeatAt,
            presenceError,
            goOnline,
            goOffline,
        ]
    );

    useEffect(() => {
        void refreshSession();
    }, [refreshSession]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === null) {
        throw new Error(
            "useAuth must be used inside AuthProvider."
        );
    }

    return context;
}