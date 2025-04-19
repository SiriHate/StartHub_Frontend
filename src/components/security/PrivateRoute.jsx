import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthProvider from "./AuthContext";

const PrivateRoute = () => {
    const { isValid } = useContext(AuthProvider);
    
    if (!isValid) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;