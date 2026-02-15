import React, { useEffect, useState, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../config';
import AuthContext from '../../security/AuthContext';
import apiClient, { getCookie } from '../../../api/apiClient';

const HomePage = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [isChecking, setIsChecking] = useState(true);
    const [redirected, setRedirected] = useState(false);
    const [userData, setUserData] = useState(null);

    const checkAuth = useCallback(async () => {
        if (!getCookie('accessToken')) {
            setIsChecking(false);
            if (!redirected) {
                setRedirected(true);
                navigate('/login', { replace: true });
            }
            return;
        }

        try {
            const response = await apiClient(`${config.USER_SERVICE}/users/me`);

            if (response.ok) {
                const data = await response.json();
                setUserData(data);

                login(getCookie('accessToken'));

                const userRole = data.role;
                setIsChecking(false);

                if (!redirected) {
                    setRedirected(true);
                    if (userRole === 'MODERATOR') {
                        navigate('/moderator_panel', { replace: true });
                    } else if (userRole === 'ADMIN') {
                        navigate('/admin_panel', { replace: true });
                    } else {
                        navigate('/articles-and-news', { replace: true });
                    }
                }
            } else {
                setIsChecking(false);
                if (!redirected) {
                    setRedirected(true);
                    navigate('/login', { replace: true });
                }
            }
        } catch (error) {
            console.error('Ошибка при проверке авторизации:', error);
            setIsChecking(false);
            if (!redirected) {
                setRedirected(true);
                navigate('/login', { replace: true });
            }
        }
    }, [navigate, redirected, login]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isChecking) {
        return <div>Проверка авторизации...</div>;
    }

    return null;
};

export default HomePage;
