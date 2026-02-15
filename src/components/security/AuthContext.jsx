import { createContext, useState, useCallback, useMemo, useRef } from "react";
import config from "../../config";

const AuthContext = createContext();

const getCookie = (name) => {
    const cookies = document.cookie.split("; ");
    const cookie = cookies.find(row => row.startsWith(`${name}=`));
    return cookie ? cookie.split("=")[1] : null;
};

const setCookie = (name, value) => {
    document.cookie = `${name}=${value}; path=/; SameSite=None; Secure`;
};

const removeCookie = (name) => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=None; Secure`;
};

export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(() => getCookie("accessToken"));
    const refreshPromiseRef = useRef(null);

    const isValid = !!accessToken;

    const logout = useCallback(() => {
        removeCookie("accessToken");
        removeCookie("refreshToken");
        setAccessToken(null);
    }, []);

    const login = useCallback((newAccessToken, newRefreshToken) => {
        setCookie("accessToken", newAccessToken);
        setCookie("refreshToken", newRefreshToken);
        setAccessToken(newAccessToken);
    }, []);

    const refreshAccessToken = useCallback(async () => {
        if (refreshPromiseRef.current) {
            return refreshPromiseRef.current;
        }

        refreshPromiseRef.current = (async () => {
            const currentRefreshToken = getCookie("refreshToken");
            if (!currentRefreshToken) {
                logout();
                return null;
            }

            try {
                const response = await fetch(`${config.USER_SERVICE}/auth/refresh`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refresh_token: currentRefreshToken })
                });

                if (!response.ok) {
                    logout();
                    return null;
                }

                const data = await response.json();
                const newAccessToken = data.access_token;
                setCookie("accessToken", newAccessToken);
                setAccessToken(newAccessToken);
                return newAccessToken;
            } catch {
                logout();
                return null;
            } finally {
                refreshPromiseRef.current = null;
            }
        })();

        return refreshPromiseRef.current;
    }, [logout]);

    const authFetch = useCallback(async (url, options = {}) => {
        const currentToken = getCookie("accessToken");

        const makeRequest = (token) => {
            return fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    "Authorization": `Bearer ${token}`
                }
            });
        };

        let response = await makeRequest(currentToken);

        if (response.status === 401) {
            const newToken = await refreshAccessToken();
            if (newToken) {
                response = await makeRequest(newToken);
            }
        }

        return response;
    }, [refreshAccessToken]);

    const value = useMemo(() => ({
        token: accessToken,
        isValid,
        login,
        logout,
        authFetch
    }), [accessToken, isValid, login, logout, authFetch]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
