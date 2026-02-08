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
        if (tokenParam) setToken(tokenParam);
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!newPassword || !confirmNewPassword) { setError('Пожалуйста, заполните все поля.'); return; }
        if (newPassword.length < 8) { setError('Пароль должен содержать не менее 8 символов.'); return; }
        if (newPassword !== confirmNewPassword) { setError('Пароли не совпадают.'); return; }

        try {
            const response = await fetch(`${config.USER_SERVICE}/members/password_recovery_confirmations`, {
                method: 'PATCH', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({token, newPassword})
            });
            if (response.ok) { alert('Ваш пароль успешно изменён.'); navigate('/'); }
            else { setError('Ошибка. Токен может быть недействительным.'); navigate('/'); }
        } catch (err) { setError('Произошла ошибка при изменении пароля.'); navigate('/'); }
    };

    return (
        <>
            <Helmet>
                <title>Новый пароль — StartHub</title>
                <body className={styles.body} />
            </Helmet>
            <div className={styles.page}>
                <img src="/logo.png" alt="StartHub" className={styles.logo} />
                <div className={styles.card}>
                    <h1 className={styles.title}>Новый пароль</h1>
                    <p className={styles.subtitle}>Введите новый пароль для вашего аккаунта</p>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.fieldGroup}>
                            <label><i className="fas fa-lock"></i> Новый пароль</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Минимум 8 символов" required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label><i className="fas fa-lock"></i> Подтверждение пароля</label>
                            <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Повторите пароль" required />
                        </div>

                        {error && <div className={styles.errorMsg}><i className="fas fa-exclamation-circle"></i> {error}</div>}

                        <button type="submit" className={styles.submitBtn}>Сохранить пароль</button>
                    </form>

                    <div className={styles.footer}>
                        <button className={styles.linkBtn} onClick={() => navigate('/')}>Вернуться к авторизации</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PasswordChangePage;
