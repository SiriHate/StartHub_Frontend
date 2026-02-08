import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from './PasswordRecoveryPage.module.css';
import {Helmet} from "react-helmet";
import config from '../../../config';

const PasswordRecoveryPage = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const validateEmail = (email) => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(String(email).toLowerCase());

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(false);
        if (!email) { setError('Пожалуйста, введите ваш email адрес.'); return; }
        if (!validateEmail(email)) { setError('Введите корректный email адрес.'); return; }

        try {
            const response = await fetch(`${config.USER_SERVICE}/members/password_recovery_requests`, {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email})
            });
            if (response.ok) { setSuccess(true); setTimeout(() => navigate('/'), 3000); }
            else { const data = await response.json(); setError(data.message || 'Произошла ошибка.'); }
        } catch (err) { setError('Произошла ошибка при подключении к серверу.'); }
    };

    return (
        <>
            <Helmet>
                <title>Восстановление пароля — StartHub</title>
                <body className={styles.body} />
            </Helmet>
            <div className={styles.page}>
                <img src="/logo.png" alt="StartHub" className={styles.logo} />
                <div className={styles.card}>
                    <h1 className={styles.title}>Восстановление пароля</h1>
                    <p className={styles.subtitle}>Введите email для получения ссылки</p>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.fieldGroup}>
                            <label><i className="fas fa-envelope"></i> Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required />
                        </div>

                        {error && <div className={styles.errorMsg}><i className="fas fa-exclamation-circle"></i> {error}</div>}
                        {success && <div className={styles.successMsg}><i className="fas fa-check-circle"></i> Запрос отправлен! Проверьте почту.</div>}

                        <button type="submit" className={styles.submitBtn}>Восстановить пароль</button>
                    </form>

                    <div className={styles.footer}>
                        <button className={styles.linkBtn} onClick={() => navigate('/')}>Вернуться к авторизации</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PasswordRecoveryPage;
