import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import '../Global.css';
import './LoginPage.css';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Load saved credentials when the component mounts
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
            const response = await fetch(`http://localhost:8081/api/v1/users/member/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.status === 401) {
                setError("Неверное имя пользователя или пароль.");
            } else if (!response.ok) {
                console.error('Network response was not ok');
                setError("Произошла ошибка. Пожалуйста, попробуйте еще раз.");
            } else {
                const token = await response.text();
                console.log({ username, password });
                document.cookie = `Authorization=Bearer ${token}; path=/`;

                if (rememberMe) {
                    try {
                        localStorage.setItem('username', username);
                        localStorage.setItem('password', password);
                        localStorage.setItem('rememberMe', rememberMe.toString());
                    } catch (error) {
                        console.error('Failed to save to localStorage:', error);
                    }
                } else {
                    localStorage.removeItem('username');
                    localStorage.removeItem('password');
                    localStorage.removeItem('rememberMe');
                }
                navigate('/home');
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
        <div>
            <Helmet>
                <title>Авторизация - Ваша компания</title>
            </Helmet>

            <div>
                <img src="/logo.png" alt="Логотип компании" id="logo" />
            </div>

            <div className="form-container">
                <div className="wrapper">
                    <div className="title">
                        Авторизация
                    </div>
                    <form onSubmit={handleLogin}>
                        <div className="field">
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            <label htmlFor="username">Имя пользователя</label>
                        </div>
                        <div className="field">
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <label htmlFor="password">Пароль</label>
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <div className="content">
                            <div className="checkbox">
                                <input
                                    type="checkbox"
                                    id="remember-me"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <label htmlFor="remember-me">Запомнить меня</label>
                            </div>
                            <div className="pass-link">
                                <button
                                    onClick={handleForgotPassword}
                                    id="forgot-password-link"
                                    className="link-button"
                                >
                                    Забыли пароль?
                                </button>
                            </div>
                        </div>
                        <div className="field">
                            <input type="submit" value="Войти" />
                        </div>
                        <div className="signup-link">
                            Еще нет аккаунта?{' '}
                            <button
                                onClick={redirectToRegistration}
                                id="registration-link"
                                className="link-button"
                            >
                                Регистрация
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
