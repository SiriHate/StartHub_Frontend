import { useContext, useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import AuthProvider from "./AuthContext";

const PrivateRoute = () => {
    const { isValid } = useContext(AuthProvider);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isValid) {
            navigate("/");
        }
    }, [isValid, navigate]);

    return isValid ? <Outlet /> : null;
};

export default PrivateRoute;