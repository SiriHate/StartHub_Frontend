import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import config from '../../../config';
import styles from './HomePage.module.css';

const getTargetPathByRole = (role) => {
    switch (role) {
        case 'MODERATOR':
            return '/moderator_panel';
        case 'ADMIN':
            return '/admin_panel';
        default:
            return '/articles-and-news';
    }
};

const HomePage = () => {
    const navigate   = useNavigate();
    const location   = useLocation();        // <-- текущий URL
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');

    useEffect(() => {
        let isMounted  = true;                 // предотвращаем setState после размонтирования
        const ctrl     = new AbortController();
        const timeout  = setTimeout(() => ctrl.abort(), 10_000);

        (async () => {
            /* 1. достаём токен из cookie */
            const token = document.cookie
                .split('; ')
                .find((row) => row.startsWith('Authorization='))
                ?.split('=')[1];

            if (!token) {
                if (isMounted) setLoading(false);
                if (location.pathname !== '/login')
                    navigate('/login', { replace: true });
                return;
            }

            try {
                /* 2. валидируем токен */
                const res = await fetch(`${config.USER_SERVICE}/users/me`, {
                    headers: { Authorization: token },
                    signal : ctrl.signal,
                });

                if (!res.ok) throw new Error('unauthorized');

                const { role } = await res.json();
                const target  = getTargetPathByRole(role);

                /* 3. переходим только если ещё не там */
                if (location.pathname !== target) {
                    navigate(target, { replace: true });
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    if (isMounted) {
                        setError('Проблема с авторизацией. Пожалуйста, войдите снова.');
                        setTimeout(() => navigate('/login', { replace: true }), 2000);
                    }
                }
            } finally {
                clearTimeout(timeout);
                if (isMounted) setLoading(false);
            }
        })();

        return () => {
            isMounted = false;
            clearTimeout(timeout);
            ctrl.abort();
        };
    }, []);                                   // effect выполняется ровно один раз

    /* ----------------------- UI-состояния ----------------------- */
    if (loading) {
        return (
            <div className={styles.authChecking}>
                <div className={styles.spinner} />
                <p>Проверка авторизации…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.authError}>
                <p>{error}</p>
            </div>
        );
    }

    return null; // компонент лишь перенаправляет, ничего не отображаем
};

export default HomePage;
