import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {Helmet} from "react-helmet";
import styles from "./ConfirmRegistrationPage.css";
import config from "../../../config";

const ConfirmRegistrationPage = () => {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [hasAttempted, setHasAttempted] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    useEffect(() => {
        if (hasAttempted || !token) {
            return;
        }

        const confirmRegistration = async () => {
            try {
                const response = await fetch(`${config.USER_SERVICE}/api/v1/users/confirmation/confirm-registration`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                });

                if (response.ok) {
                    setMessage('Ваш аккаунт подтвержден!');
                    setTimeout(() => {
                        navigate('/');
                    }, 5000);
                } else {
                    setMessage('Недействительная ссылка.');
                }
            } catch (error) {
                console.error('Error:', error);
                setMessage('Произошла ошибка при подтверждении аккаунта.');
            } finally {
                setLoading(false);
            }
        };

        confirmRegistration();
        setHasAttempted(true);
    }, [token, navigate, hasAttempted]);

    return (
        <div className="confirm-registration-container">
            <Helmet>
                <title>Подтверждение регистрации</title>
                <body className={styles.body}/>
            </Helmet>
            {loading ? <h2>Загрузка...</h2> : <h2>{message}</h2>}
        </div>
    );
};

export default ConfirmRegistrationPage;