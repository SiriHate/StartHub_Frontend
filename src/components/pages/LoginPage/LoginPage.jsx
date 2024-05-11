import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Helmet} from 'react-helmet';
import { FormattedMessage, useIntl } from 'react-intl';
import styles from './LoginPage.module.css';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

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

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (username === '' || password === '') {
            setError("Пожалуйста, заполните все поля.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:8081/api/v1/users/user/login`, {
                method: 'POST', headers: {
                    'Content-Type': 'application/json'
                }, body: JSON.stringify({username, password})
            });

            if (response.status === 401) {
                setError("Неверное имя пользователя или пароль.");
            } else if (!response.ok) {
                console.error('Network response was not ok');
                setError("Произошла ошибка. Пожалуйста, попробуйте еще раз.");
            } else {
                const token = await response.text();
                document.cookie = `Authorization=Bearer ${token}; path=/; SameSite=None; Secure`;

                if (rememberMe) {
                    localStorage.setItem('username', username);
                    localStorage.setItem('password', password);
                    localStorage.setItem('rememberMe', rememberMe.toString());
                } else {
                    localStorage.removeItem('username');
                    localStorage.removeItem('password');
                    localStorage.removeItem('rememberMe');
                }
                navigate('/articles-and-news');
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
                                placeholder=" " // placeholder for triggering the :placeholder-shown pseudo-class
                                onChange={(e) => setUsername(e.target.value)}
                                required
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
                                placeholder=" " // placeholder for triggering the :placeholder-shown pseudo-class
                                onChange={(e) => setPassword(e.target.value)}
                                required
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
        </div>);
};

export default LoginPage;
