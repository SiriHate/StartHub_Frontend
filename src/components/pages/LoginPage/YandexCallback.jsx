import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';

const YandexCallback = () => {
    const [status, setStatus] = useState('Загрузка...');

    useEffect(() => {
        // Создаем скрипт для загрузки SDK
        const script = document.createElement('script');
        script.src = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-token-with-polyfills-latest.js';
        script.async = true;
        
        // Обработчик загрузки скрипта
        script.onload = () => {
            setStatus('Получение токена...');
            // Добавляем небольшую задержку перед отправкой токена
            setTimeout(() => {
                window.YaSendSuggestToken(window.location.origin, {
                    flag: true
                });
                setStatus('Токен отправлен, перенаправление...');
            }, 1000);
        };

        // Обработчик ошибки загрузки скрипта
        script.onerror = (error) => {
            console.error('Ошибка загрузки скрипта Yandex ID:', error);
            setStatus('Ошибка загрузки сервиса Яндекс');
        };

        // Добавляем скрипт на страницу
        document.body.appendChild(script);

        // Очистка при размонтировании компонента
        return () => {
            document.body.removeChild(script);
        };
    }, []);

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
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
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
                    <div style={{
                        fontSize: '16px',
                        color: '#666'
                    }}>
                        {status}
                    </div>
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