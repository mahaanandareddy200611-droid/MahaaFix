import { createContext, useEffect, useMemo, useState } from "react";

export const AuthContext = createContext(null);

function readStoredUser() {
    try {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            return null;
        }

        return JSON.parse(storedUser);
    } catch {
        localStorage.removeItem("user");
        return null;
    }
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => {
        return localStorage.getItem("token");
    });

    const [user, setUser] = useState(() => {
        return readStoredUser();
    });

    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUser = readStoredUser();

        setToken(storedToken);
        setUser(storedUser);
        setIsInitializing(false);
    }, []);

    const login = ({ token: newToken, user: newUser }) => {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));

        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setToken(null);
        setUser(null);
    };

    const value = useMemo(
        () => ({
            token,
            user,
            isAuthenticated: Boolean(token && user),
            isInitializing,
            login,
            logout,
        }),
        [token, user, isInitializing]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}