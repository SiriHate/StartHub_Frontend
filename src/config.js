const config = {
    USER_SERVICE: process.env.REACT_APP_USER_SERVICE_API_BASE_URL,
    NOTIFICATION_SERVICE: process.env.REACT_APP_NOTIFICATION_SERVICE_API_BASE_URL,
    MAIN_SERVICE: process.env.REACT_APP_MAIN_SERVICE_API_BASE_URL,
    CHAT_SERVICE: process.env.REACT_APP_CHAT_SERVICE_API_BASE_URL,
    CHAT_SERVICE_WEB_SOCKET: process.env.REACT_APP_CHAT_SERVICE_WEB_SOCKET_BASE_URL,
    FILE_SERVER: process.env.REACT_APP_FILE_SERVER_API_BASE_URL,
    YANDEX_CLIENT_ID: process.env.REACT_APP_YANDEX_CLIENT_ID,
    YANDEX_SECRET_KEY: process.env.REACT_APP_YANDEX_SECRET_KEY
};

export default config;