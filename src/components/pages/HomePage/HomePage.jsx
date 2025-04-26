import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../config';

const HomePage = () => {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(true);
    const [userData, setUserData] = useState(null);

    const checkAuth = useCallback(async () => {
        const token = document.cookie.split('; ')
            .find(row => row.startsWith('Authorization='))
            ?.split('=')[1];

        if (!token) {
            setIsChecking(false);
            navigate('/login', { replace: true });
            return;
        }

        try {
            const response = await fetch(`${config.USER_SERVICE}/users/me`, {
                headers: {
                    'Authorization': token
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUserData(data);
                const userRole = data.role;

                setIsChecking(false);
                if (userRole === 'MODERATOR') {
                    navigate('/moderator_panel', { replace: true });
                } else if (userRole === 'ADMIN') {
                    navigate('/admin_panel', { replace: true });
                } else {
                    navigate('/articles-and-news', { replace: true });
                }
            } else {
                setIsChecking(false);
                navigate('/login', { replace: true });
            }
        } catch (error) {
            console.error('Ошибка при проверке авторизации:', error);
            setIsChecking(false);
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isChecking) {
        return <div>Проверка авторизации...</div>;
    }

    return null;
};

export default HomePage; 