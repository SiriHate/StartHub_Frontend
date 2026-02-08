import React, {useEffect, useState, useRef} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Helmet} from "react-helmet";
import styles from "./ConfirmRegistrationPage.module.css";
import config from "../../../config";

const ConfirmRegistrationPage = () => {
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const isInitialized = useRef(false);

    useEffect(() => {
        if (isInitialized.current || !token) {
            if (!token) { setMessage('Отсутствует токен подтверждения.'); setLoading(false); }
            return;
        }
        isInitialized.current = true;

        const confirmRegistration = async () => {
            try {
                const response = await fetch(`${config.USER_SERVICE}/confirmations/confirm-registration`, {
                    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({token})
                });
                if (response.status === 200) {
                    setMessage('Ваш аккаунт успешно подтвержден!');
                    setIsSuccess(true);
                    setTimeout(() => navigate('/login'), 3000);
                } else {
                    const data = await response.json().catch(() => ({}));
                    setMessage(data.message || 'Произошла ошибка при подтверждении аккаунта.');
                }
            } catch (err) {
                setMessage('Произошла ошибка при подключении к серверу.');
            } finally {
                setLoading(false);
            }
        };
        confirmRegistration();
    }, [token, navigate]);

    return (
        <>
            <Helmet>
                <title>Подтверждение регистрации — StartHub</title>
                <body className={styles.body} />
            </Helmet>
            <div className={styles.page}>
                <img src="/logo.png" alt="StartHub" className={styles.logo} />
                <div className={styles.card}>
                    {loading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <p>Подтверждение регистрации...</p>
                        </div>
                    ) : (
                        <div className={styles.resultState}>
                            <i className={`fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-triangle'} ${isSuccess ? styles.successIcon : styles.errorIcon}`}></i>
                            <h2 className={styles.resultTitle}>{message}</h2>
                            {isSuccess && <p className={styles.resultHint}>Перенаправление на страницу входа...</p>}
                            {!isSuccess && (
                                <button className={styles.linkBtn} onClick={() => navigate('/')}>Вернуться на главную</button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ConfirmRegistrationPage;
