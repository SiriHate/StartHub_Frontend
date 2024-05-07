import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './ConfirmRegistrationPage.css';

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
                const response = await fetch('http://127.0.0.1:8081/api/v1/users/confirmation/confirm-registration', {
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
            {loading ? <h2>Загрузка...</h2> : <h2>{message}</h2>}
        </div>
    );
};

export default ConfirmRegistrationPage;