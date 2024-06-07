import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from "./ChangePasswordPage.module.css";
import config from "../../../config";

const PasswordChangePage = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [token, setToken] = useState('');
    const [tokenValid, setTokenValid] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            checkTokenValidity(tokenParam);
        }
    }, [location]);

    const checkTokenValidity = async (token) => {
        try {
            const response = await fetch(`${config.USER_SERVICE}/confirmation/check_confirmation_token?token=${token}`);
            if (response.ok) {
                setToken(token);
                setTokenValid(true);
            } else {
                setTokenValid(false);
            }
        } catch (error) {
            console.error('Error:', error);
            setTokenValid(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!newPassword || !confirmNewPassword) {
            alert('Пожалуйста, заполните все поля для ввода пароля.');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            alert('Пароли не совпадают.');
            return;
        }

        const data = {
            newPassword,
            token
        };

        try {
            const response = await fetch(`${config.USER_SERVICE}/members/password_recovery/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                alert('Ваш пароль успешно изменён.');
                setTimeout(() => {
                    navigate('/');
                }, 5000);
            } else {
                alert('Произошла ошибка при изменении пароля.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Произошла ошибка при изменении пароля.');
        }
    };

    const redirectToAuthorization = () => {
        navigate('/');
    };

    return (
        <div>
            <Helmet>
                <title>Подтверждение регистрации</title>
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            <img src="/logo.png" alt="Логотип компании" id="logo"/>
            <div className="form-container">
                <div className="wrapper">
                    <div className="title">
                        {tokenValid ? 'Восстановление пароля' : 'Ссылка недействительна'}
                    </div>
                    {tokenValid && (
                        <form onSubmit={handleSubmit}>
                            <div className="field">
                                <input type="password" id="new-password" name="new-password" value={newPassword}
                                       onChange={(e) => setNewPassword(e.target.value)} required/>
                                <label htmlFor="new-password">Новый пароль</label>
                            </div>
                            <div className="field">
                                <input type="password" id="confirm-new-password" name="confirm-new-password"
                                       value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
                                       required/>
                                <label htmlFor="confirm-new-password">Подтверждение пароля</label>
                            </div>
                            <div className="field">
                                <input type="submit" value="Восстановить пароль"/>
                            </div>
                            <div className="signup-link">
                                Перейти к <button className="login-link"
                                                  onClick={redirectToAuthorization}>Авторизации</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PasswordChangePage;