
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
        // Browser storage may be unavailable.
    }
}

export function AuthProvider({ children }) {
    const sessionVersion = useRef(0);

    const [token, setToken] = useState(readStoredToken);
    const [user, setUser] = useState(readStoredUser);

    const [status, setStatus] = useState(() =>
        readStoredToken() ? "loading" : "anonymous"
    );

    const [authError, setAuthError] = useState("");

    const logout = useCallback(() => {
        sessionVersion.current += 1;

        clearStoredSession();

        setToken(null);
        setUser(null);
        setStatus("anonymous");
        setAuthError("");
    }, []);

    const login = useCallback(({ token: nextToken, user: nextUser }) => {
        if (
            typeof nextToken !== "string" ||
            !nextToken ||
            !nextUser ||
            typeof nextUser !== "object"
        ) {
            throw new Error("The login response is incomplete.");
        }

        // Save both values before updating the authenticated state.
        try {
            localStorage.setItem("token", nextToken);
            localStorage.setItem("user", JSON.stringify(nextUser));
        } catch {
            clearStoredSession();

            throw new Error(
                "Unable to save your session in this browser."
            );
        }

        // Ignore any older session-restoration request.
        sessionVersion.current += 1;

        setToken(nextToken);
        setUser(nextUser);
        setStatus("authenticated");
        setAuthError("");
    }, []);

    const refreshSession = useCallback(async () => {
        const storedToken = readStoredToken();

        if (!storedToken) {
            logout();
            return;
        }

        const versionAtStart = sessionVersion.current;

        setToken(storedToken);
        setStatus("loading");
        setAuthError("");

        try {
            const response = await getCurrentUser();

            // A newer login/logout may have happened while waiting.
            if (versionAtStart !== sessionVersion.current) {
                return;
            }

            const profile = response.data?.data;

            if (!profile || typeof profile !== "object") {
                throw new Error(
                    "The server returned an invalid profile."
                );
            }

            const previousUser = readStoredUser() || {};
            const nextUser = {
                ...previousUser,
                ...profile,
            };

            try {
                localStorage.setItem(
                    "user",
                    JSON.stringify(nextUser)
                );
            } catch {
                // The current in-memory session can still be used.
            }

            setToken(storedToken);
            setUser(nextUser);
            setStatus("authenticated");
        } catch (error) {
            if (versionAtStart !== sessionVersion.current) {
                return;
            }

            if (error.response?.status === 401) {
                logout();
                return;
            }

            // A network failure does not prove the session is invalid.
            setStatus("unavailable");
            setAuthError(
                "We couldn't verify your session. Check your connection and retry."
            );
        }
    }, [logout]);

    useEffect(() => {
        void refreshSession();
    }, [refreshSession]);

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
        }),
        [
            token,
            user,
            status,
            authError,
            login,
            logout,
            refreshSession,
        ]
    );

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