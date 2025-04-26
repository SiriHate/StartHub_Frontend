import React, { useEffect, useState, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../config';
import AuthContext from '../../security/AuthContext'; // <-- импортируем контекст

const HomePage = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext); // <-- достаем функцию login
    const [isChecking, setIsChecking] = useState(true);
    const [redirected, setRedirected] = useState(false);
    const [userData, setUserData] = useState(null);

    const checkAuth = useCallback(async () => {
        const token = document.cookie.split('; ')
            .find(row => row.startsWith('Authorization='))?.split('=')[1];

        if (!token) {
            setIsChecking(false);
            if (!redirected) {
                setRedirected(true);
                navigate('/login', { replace: true });
            }
            return;
        }

        try {
            const response = await fetch(`${config.USER_SERVICE}/users/me`, {
                headers: { 'Authorization': token }
            });

            if (response.ok) {
                const data = await response.json();
                setUserData(data);

                login(token); // <-- обязательно авторизуем пользователя глобально

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
