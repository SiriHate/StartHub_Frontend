import { createContext, useState, useEffect } from "react";
import config from "../../config";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const getTokenFromCookies = () => {
        const cookies = document.cookie.split("; ");
        const tokenCookie = cookies.find(row => row.startsWith("Authorization="));
        return tokenCookie ? tokenCookie.split("=")[1] : null;
    };

    const [token, setToken] = useState(getTokenFromCookies());
    const [isValid, setIsValid] = useState(!!token);

    const validateToken = async (token) => {
        if (!token) {
            logout();
            return;
        }

        try {
            const response = await fetch(`${config.USER_SERVICE}/auth/token/validate`, {
                method: "GET",
                headers: {
                    "Authorization": `${token}`
                }
            });

            if (!response.ok) {
                console.error("Ошибка валидации токена: сервер вернул код", response.status);
                logout();
                return;
            }

            const isValidToken = await response.json();
            if (isValidToken !== true) {
                console.error("Ошибка валидации токена: ответ сервера не true");
                logout();
                return;
            }

            setIsValid(true);
        } catch (error) {
            console.error("Ошибка при проверке токена:", error);
            logout();
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            const currentToken = getTokenFromCookies();
            if (!currentToken) {
                logout();
                return;
            }
            setToken(currentToken);
            validateToken(currentToken);
        }, 1800000);

        return () => clearInterval(interval);
    }, []);

    const login = (newToken) => {
        document.cookie = `Authorization=${newToken}; path=/; SameSite=None; Secure`;
        setToken(newToken);
        validateToken(newToken);
    };

    const logout = () => {
        document.cookie = "Authorization=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=None; Secure";
        setToken(null);
        setIsValid(false);
    };

    return (
        <AuthContext.Provider value={{ token, isValid, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
