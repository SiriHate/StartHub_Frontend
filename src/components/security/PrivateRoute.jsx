import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthContext from "./AuthContext"; // <-- правильный импорт

const PrivateRoute = () => {
    const { isValid } = useContext(AuthContext); // <-- правильное использование

    if (!isValid) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;
