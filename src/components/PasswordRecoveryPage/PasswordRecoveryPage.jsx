import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Global.css';
import './PasswordRecoveryPage.css';
import {Helmet} from "react-helmet";

const PasswordRecoveryPage = () => {
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(String(email).toLowerCase());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            alert('Пожалуйста, введите ваш email адрес.');
            return;
        }

        if (!validateEmail(email)) {
            alert('Введите корректный email адрес.');
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:8081/api/v1/users/member/password_recovery/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();
            console.log('Success:', result);
            alert('Запрос на восстановление пароля отправлен!');
        } catch (error) {
            console.error('Error:', error);
            alert('Произошла ошибка при отправке запроса на восстановление пароля.');
        }
    };

    return (
        <div>
            <Helmet>
                <title>Восстановление пароля</title>
            </Helmet>
            <img src="/logo.png" alt="Логотип компании" id="logo" />
            <div className="form-container">
                <div className="wrapper">
                    <div className="title">
                        Восстановление пароля
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="field">
                            <input type="text" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            <label htmlFor="email">Email</label>
                        </div>
                        <div className="field">
                            <input type="submit" value="Восстановить пароль" />
                        </div>
                        <div className="signup-link">
                            Перейти к <button onClick={() => navigate('/')} className="link-button">Авторизации</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PasswordRecoveryPage;
