import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Helmet} from 'react-helmet';
import styles from './LoginPage.module.css';
import config from '../../../config';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Загрузка скрипта Yandex ID
        const script = document.createElement('script');
        script.src = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-with-polyfills-latest.js';
        script.async = true;
        script.onload = () => {
            // Инициализация кнопки Яндекс
            const oauthQueryParams = {
                client_id: `${config.YANDEX_CLIENT_ID}`,
                response_type: 'token',
                redirect_uri: `https://localhost/yandex-callback`
            };

            window.YaAuthSuggest.init(
                oauthQueryParams,
                window.location.origin,
                {
                    view: "button",
                    parentId: "buttonContainerId",
                    buttonSize: 'm',
                    buttonView: 'icon',
                    buttonTheme: 'light',
                    buttonBorderRadius: "0",
                    buttonIcon: 'ya',
                }
            )
            .then(({handler}) => handler())
            .then(async (data) => {
                console.log('Получен токен от Яндекс:', data);
                if (data && data.access_token) {
                    try {
                        const response = await fetch(`${config.USER_SERVICE}/users/auth/yandex`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                token: data.access_token,
                                client_secret: `${config.YANDEX_SECRET_KEY}`
                            })
                        });

                        if (response.ok) {
                            const userData = await response.json();
                            document.cookie = `Authorization=Bearer ${userData.token}; path=/; SameSite=None; Secure`;

                            const userRole = userData.role;
                            if (userRole === 'MODERATOR') {
                                navigate('/moderator_panel');
                            } else if (userRole === 'ADMIN') {
                                navigate('/admin_panel');
                            } else {
                                navigate('/articles-and-news');
                            }
                        } else {
                            setError('Ошибка авторизации через Яндекс');
                        }
                    } catch (error) {
                        console.error('Ошибка при обработке токена:', error);
                        setError('Ошибка авторизации через Яндекс');
                    }
                }
            })
            .catch(error => {
                console.error('Ошибка авторизации через Яндекс:', error);
                setError('Ошибка авторизации через Яндекс');
            });
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, [navigate]);

    useEffect(() => {
        const savedUsername = localStorage.getItem('username') || '';
        const savedPassword = localStorage.getItem('password') || '';
        const savedRememberMe = localStorage.getItem('rememberMe') === 'true';

        if (savedRememberMe) {
            setUsername(savedUsername);
            setPassword(savedPassword);
            setRememberMe(true);
        }
    }, []);

    // Новый эффект для прокрутки страницы вниз
    useEffect(() => {
        window.scrollTo({top: 50, behavior: 'smooth'});
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (username === '' || password === '') {
            setError("Пожалуйста, заполните все поля.");
            return;
        }

        try {
            const response = await fetch(`${config.USER_SERVICE}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({username, password})
            });

            if (response.status === 401) {
                setError("Неверное имя пользователя или пароль.");
            } else if (!response.ok) {
                console.error('Network response was not ok');
                setError("Произошла ошибка. Пожалуйста, попробуйте еще раз.");
            } else {
                const data = await response.json();
                document.cookie = `Authorization=Bearer ${data.token}; path=/; SameSite=None; Secure`;

                if (rememberMe) {
                    localStorage.setItem('username', username);
                    localStorage.setItem('password', password);
                    localStorage.setItem('rememberMe', rememberMe.toString());
                } else {
                    localStorage.removeItem('username');
                    localStorage.removeItem('password');
                    localStorage.removeItem('rememberMe');
                }

                // Проверяем роль пользователя и перенаправляем соответственно
                const userRole = data.role;
                if (userRole === 'MODERATOR') {
                    navigate('/moderator_panel');
                } else if (userRole === 'ADMIN') {
                    navigate('/admin_panel');
                } else {
                    navigate('/articles-and-news');
                }
            }
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
            setError("Произошла ошибка. Пожалуйста, попробуйте еще раз.");
        }
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        navigate('/password-recovery');
    };

    const redirectToRegistration = (e) => {
        e.preventDefault();
        navigate('/registration');
    };

    return (
        <div className={styles.loginPage}>
            <Helmet>
                <title>Авторизация</title>
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            <div className={styles.loginPageContainer}>
                <img src="/logo.png" alt="Логотип" className={styles.logo}/>
                <div className={styles.formContainer}>
                    <div className={styles.wrapper}>
                        <div className={styles.title}>
                            Авторизация
                        </div>
                        <form onSubmit={handleLogin}>
                            <div className={styles.field}>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={username}
                                    className={styles.fieldInput}
                                    placeholder=" "
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                                <label htmlFor="username" className={styles.fieldLabel}>Имя пользователя</label>
                            </div>
                            <div className={styles.field}>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={password}
                                    className={styles.fieldInput}
                                    placeholder=" "
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <label htmlFor="password" className={styles.fieldLabel}>Пароль</label>
                            </div>
                            {error && <div className={styles.errorMessage}>{error}</div>}
                            <div className={styles.content}>
                                <div className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        id="remember-me"
                                        checked={rememberMe}
                                        className={styles.checkboxInput}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <label htmlFor="remember-me" className={styles.checkboxLabel}>Запомнить меня</label>
                                </div>
                                <div className={styles.passLink}>
                                    <button
                                        onClick={handleForgotPassword}
                                        id="forgot-password-link"
                                        className={styles.linkButton}
                                    >
                                        Забыли пароль?
                                    </button>
                                </div>
                            </div>
                            <div className={styles.field}>
                                <input type="submit" value="Войти" className={styles.submitButton}/>
                            </div>
                            <div className={styles.socialLogin}>
                                <div className={styles.divider}>
                                    <span>или войти через</span>
                                </div>
                                <div id="buttonContainerId" className={styles.yandexButton}></div>
                            </div>
                            <div className={styles.signupLink}>
                                Еще нет аккаунта?{' '}
                                <button
                                    onClick={redirectToRegistration}
                                    id="registration-link"
                                    className={styles.linkButton}
                                >
                                    Регистрация
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
