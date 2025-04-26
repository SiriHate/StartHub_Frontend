import React, {useEffect, useState, useRef} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Helmet} from "react-helmet";
import styles from "./ConfirmRegistrationPage.css";
import config from "../../../config";

const ConfirmRegistrationPage = () => {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const isInitialized = useRef(false);

    useEffect(() => {
        if (isInitialized.current || !token) {
            if (!token) {
                setMessage('Отсутствует токен подтверждения.');
                setLoading(false);
            }
            return;
        }

        isInitialized.current = true;

        const confirmRegistration = async () => {
            try {
                const response = await fetch(`${config.USER_SERVICE}/confirmations/confirm-registration`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({token}),
                });

                if (response.status === 200) {
                    setMessage('Ваш аккаунт успешно подтвержден!');
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else {
                    try {
                        const data = await response.json();
                        if (response.status === 400) {
                            setMessage(data.message || 'Недействительная ссылка.');
                        } else if (response.status === 404) {
                            setMessage('Ссылка для подтверждения не найдена.');
                        } else {
                            setMessage(data.message || 'Произошла ошибка при подтверждении аккаунта.');
                        }
                    } catch (parseError) {
                        console.error('Error parsing response:', parseError);
                        setMessage('Произошла ошибка при обработке ответа сервера.');
                    }
                }
            } catch (error) {
                console.error('Network error:', error);
                setMessage('Произошла ошибка при подключении к серверу.');
            } finally {
                setLoading(false);
            }
        };

        confirmRegistration();
    }, [token, navigate]);

    return (
        <div className="confirm-registration-container">
            <Helmet>
                <title>Подтверждение регистрации</title>
                <body className={styles.body}/>
            </Helmet>
            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <h2>Подтверждение регистрации...</h2>
                </div>
            ) : (
                <div className="message-container">
                    <h2>{message}</h2>
                </div>
            )}
        </div>
    );
};

export default ConfirmRegistrationPage;