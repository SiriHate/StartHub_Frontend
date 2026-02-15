import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import config from '../../../config';
import AuthContext from '../../security/AuthContext';

const YandexCallback = () => {
    const [status, setStatus] = useState('Обработка...');
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    useEffect(() => {
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');

        if (!accessToken) {
            setStatus('Токен не получен. Вернитесь на страницу входа.');
            return;
        }

        const authYandex = async () => {
            setStatus('Вход в аккаунт...');
            try {
                const response = await fetch(`${config.USER_SERVICE}/members/auth/oauth/yandex`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        token: accessToken,
                        client_secret: config.YANDEX_SECRET_KEY
                    })
                });

                if (response.ok) {
                    const userData = await response.json();
                    login(userData.access_token, userData.refresh_token);
                    navigate('/');
                } else {
                    setStatus('Ошибка авторизации. Попробуйте снова.');
                }
            } catch (err) {
                setStatus('Ошибка. Попробуйте снова.');
            }
        };

        authYandex();
    }, [navigate]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#f5f5f5',
            fontFamily: 'Arial, sans-serif'
        }}>
            <Helmet>
                <title>Авторизация через Яндекс</title>
                <meta charSet="utf-8" />
                <meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, shrink-to-fit=no, viewport-fit=cover'/>
                <meta http-equiv='X-UA-Compatible' content='ie=edge'/>
            </Helmet>
            
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign: 'center',
                maxWidth: '400px',
                width: '90%'
            }}>
                <div style={{
                    marginBottom: '1rem',
                    fontSize: '24px',
                    color: '#333'
                }}>
                    Авторизация через Яндекс
                </div>
                
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid #f3f3f3',
                            borderTop: '3px solid #FC3F1D',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginRight: '1rem'
                        }}></div>
                        <div style={{ fontSize: '16px', color: '#666' }}>{status}</div>
                    </div>
                    {(status.includes('Токен не получен') || status.includes('Ошибка')) && (
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                padding: '8px 16px',
                                background: '#FC3F1D',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Вернуться на страницу входа
                        </button>
                    )}
                </div>
            </div>

            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default YandexCallback; 