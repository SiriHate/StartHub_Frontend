import React, {useContext, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Helmet} from 'react-helmet';
import styles from './LoginPage.module.css';
import config from '../../../config';
import AuthContext from '../../security/AuthContext';

const getYandexAuthUrl = () => {
    const redirectUri = `${window.location.origin}/yandex-callback`;
    const params = new URLSearchParams({
        response_type: 'token',
        client_id: config.YANDEX_CLIENT_ID
    });
    params.append('redirect_uri', redirectUri);
    return `https://oauth.yandex.ru/authorize?${params.toString()}`;
};

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleYandexLogin = () => {
        window.location.href = getYandexAuthUrl();
    };

    useEffect(() => {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!username || !password) { setError("Пожалуйста, заполните все поля."); return; }

        try {
            const response = await fetch(`${config.USER_SERVICE}/users/auth/login`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, password})
            });

            if (response.status === 401) {
                setError("Неверное имя пользователя или пароль.");
            } else if (!response.ok) {
                setError("Произошла ошибка. Пожалуйста, попробуйте еще раз.");
            } else {
                const data = await response.json();
                login(data.accessToken, data.refreshToken);
                if (rememberMe) {
                    localStorage.setItem('username', username);
                    localStorage.setItem('password', password);
                    localStorage.setItem('rememberMe', rememberMe.toString());
                } else {
                    localStorage.removeItem('username');
                    localStorage.removeItem('password');
                    localStorage.removeItem('rememberMe');
                }
                navigate('/');
            }
        } catch (err) {
            setError("Произошла ошибка. Пожалуйста, попробуйте еще раз.");
        }
    };

    return (
        <>
            <Helmet>
                <title>Авторизация — StartHub</title>
                <body className={styles.body} />
            </Helmet>
            <div className={styles.page}>
                <img src="/logo.png" alt="StartHub" className={styles.logo} />
                <div className={styles.card}>
                    <h1 className={styles.title}>Авторизация</h1>
                    <p className={styles.subtitle}>Войдите в свой аккаунт</p>

                    <form onSubmit={handleLogin} className={styles.form}>
                        <div className={styles.fieldGroup}>
                            <label><i className="fas fa-user"></i> Имя пользователя</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Введите имя пользователя" required autoComplete="username" />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label><i className="fas fa-lock"></i> Пароль</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Введите пароль" required autoComplete="current-password" />
                        </div>

                        {error && <div className={styles.errorMsg}><i className="fas fa-exclamation-circle"></i> {error}</div>}

                        <div className={styles.options}>
                            <label className={styles.checkboxLabel}>
                                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                <span>Запомнить меня</span>
                            </label>
                            <button type="button" className={styles.linkBtn} onClick={() => navigate('/password-recovery')}>Забыли пароль?</button>
                        </div>

                        <button type="submit" className={styles.submitBtn}>Войти</button>

                        <div className={styles.socialLogin}>
                            <div className={styles.divider}>
                                <span>или войти через</span>
                            </div>
                            <button type="button" className={styles.yandexBtn} onClick={handleYandexLogin}>
                                Войти через Яндекс
                            </button>
                        </div>
                    </form>

                    <div className={styles.footer}>
                        Нет аккаунта?{' '}
                        <button className={styles.linkBtn} onClick={() => navigate('/registration')}>Зарегистрироваться</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
