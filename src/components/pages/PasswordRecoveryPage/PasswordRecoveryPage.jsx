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

    const validateEmail = (email) => {
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(String(email).toLowerCase());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!email) {
            setError('Пожалуйста, введите ваш email адрес.');
            return;
        }

        if (!validateEmail(email)) {
            setError('Введите корректный email адрес.');
            return;
        }

        try {
            const response = await fetch(`${config.USER_SERVICE}/members/password_recovery_requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({email}),
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } else {
                const data = await response.json();
                setError(data.message || 'Произошла ошибка при отправке запроса на восстановление пароля.');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Произошла ошибка при подключении к серверу.');
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
                            <input type="text" id="email" name="email" value={email}
                                   onChange={(e) => setEmail(e.target.value)} required/>
                            <label htmlFor="email">Email</label>
                        </div>
                        {error && <div className={styles.error}>{error}</div>}
                        {success && <div className={styles.success}>Запрос на восстановление пароля отправлен!</div>}
                        <div className={styles.field}>
                            <input type="submit" value="Восстановить пароль"/>
                        </div>
                        <div className={styles.signupLink}>
                            Вернуться к <span onClick={() => navigate('/')} className={styles.linkText}>Авторизации</span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PasswordRecoveryPage;
