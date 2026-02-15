import { createContext, useState, useCallback, useMemo, useEffect } from "react";
import { getCookie, setCookie, removeCookie } from "../../api/apiClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(() => getCookie("accessToken"));

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

    useEffect(() => {
        const handleLogout = () => setAccessToken(null);
        window.addEventListener("auth:logout", handleLogout);
        return () => window.removeEventListener("auth:logout", handleLogout);
    }, []);

    const value = useMemo(() => ({
        token: accessToken,
        isValid,
        login,
        logout
    }), [accessToken, isValid, login, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
