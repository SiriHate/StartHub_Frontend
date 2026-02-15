import config from "../config";

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

let refreshPromise = null;

const refreshAccessToken = async () => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        const refreshToken = getCookie("refreshToken");
        if (!refreshToken) {
            clearAuth();
            return null;
        }

        try {
            const response = await fetch(`${config.USER_SERVICE}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (!response.ok) {
                clearAuth();
                return null;
            }

            const data = await response.json();
            setCookie("accessToken", data.access_token);
            return data.access_token;
        } catch {
            clearAuth();
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

const clearAuth = () => {
    removeCookie("accessToken");
    removeCookie("refreshToken");
    window.dispatchEvent(new Event("auth:logout"));
};

const apiClient = async (url, options = {}) => {
    const accessToken = getCookie("accessToken");

    const makeRequest = (token) => {
        const headers = { ...options.headers };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return fetch(url, { ...options, headers });
    };

    let response = await makeRequest(accessToken);

    if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            response = await makeRequest(newToken);
        }
    }

    return response;
};

export { getCookie, setCookie, removeCookie, clearAuth };
export default apiClient;
