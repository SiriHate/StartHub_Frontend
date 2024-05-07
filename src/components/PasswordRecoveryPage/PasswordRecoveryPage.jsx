import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PasswordRecoveryPage.module.css';
import { Helmet } from "react-helmet";

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
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            <img src="/logo.png" alt="Логотип компании" className={styles.logo}/>
            <div className={styles.formContainer}>
                <div className={styles.wrapper}>
                    <div className={styles.title}>
                        Восстановление пароля
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.field}>
                            <input type="text" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            <label htmlFor="email">Email</label>
                        </div>
                        <div className={styles.field}>
                            <input type="submit" value="Восстановить пароль" />
                        </div>
                        <div className={styles.signupLink}>
                            Перейти к <span onClick={() => navigate('/')} className={styles.linkText}>Авторизации</span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PasswordRecoveryPage;
