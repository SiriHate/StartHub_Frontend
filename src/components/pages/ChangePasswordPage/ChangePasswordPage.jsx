import React, {useEffect, useState} from 'react';
import {Helmet} from 'react-helmet';
import {useLocation, useNavigate} from 'react-router-dom';
import styles from "./ChangePasswordPage.module.css";
import config from "../../../config";

const PasswordChangePage = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        }
    }, [location]);

    useEffect(() => {
        window.scrollTo({ top: 50, behavior: 'smooth' });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!newPassword || !confirmNewPassword) {
            setError('Пожалуйста, заполните все поля для ввода пароля.');
            return;
        }

        if (newPassword.length < 8) {
            setError('Пароль должен содержать не менее 8 символов.');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setError('Пароли не совпадают.');
            return;
        }

        const data = {
            token,
            newPassword
        };

        try {
            const response = await fetch(`${config.USER_SERVICE}/members/password_recovery_confirmations`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                alert('Ваш пароль успешно изменён.');
                navigate('/');
            } else {
                setError('Произошла ошибка при изменении пароля. Токен может быть недействительным или срок его действия истек.');
                navigate('/');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Произошла ошибка при изменении пароля.');
            navigate('/');
        }
    };

    return (
        <div className={styles.loginPage}>
            <Helmet>
                <title>Восстановление пароля</title>
                <html className={styles.html} />
                <body className={styles.body} />
            </Helmet>
            <div className={styles.loginPageContainer}>
                <img src="/logo.png" alt="Логотип" className={styles.logo} />
                <div className={styles.formContainer}>
                    <div className={styles.wrapper}>
                        <div className={styles.title}>Восстановление пароля</div>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.field}>
                                <input
                                    type="password"
                                    id="new-password"
                                    name="new-password"
                                    value={newPassword}
                                    className={styles.fieldInput}
                                    placeholder=" "
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                                <label htmlFor="new-password" className={styles.fieldLabel}>Новый пароль</label>
                            </div>
                            <div className={styles.field}>
                                <input
                                    type="password"
                                    id="confirm-new-password"
                                    name="confirm-new-password"
                                    value={confirmNewPassword}
                                    className={styles.fieldInput}
                                    placeholder=" "
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    required
                                />
                                <label htmlFor="confirm-new-password" className={styles.fieldLabel}>Подтверждение пароля</label>
                            </div>
                            {error && <div className={styles.errorMessage}>{error}</div>}
                            <div className={styles.field}>
                                <input type="submit" value="Восстановить пароль" className={styles.submitButton} />
                            </div>
                            <div className={styles.signupLink}>
                                <button
                                    onClick={() => navigate('/')}
                                    className={styles.linkButton}
                                >
                                    Вернуться к авторизации
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordChangePage;