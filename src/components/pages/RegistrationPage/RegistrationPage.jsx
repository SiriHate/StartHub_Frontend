import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from './RegistrationPage.module.css';
import {Helmet} from "react-helmet";
import config from '../../../config';

const RegistrationPage = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        username: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        const {name, email, phone, dateOfBirth, username, password, confirmPassword} = formData;

        if (!name || !email || !phone || !dateOfBirth || !username || !password || !confirmPassword) {
            setError('Пожалуйста, заполните все поля.');
            return;
        }

        if (!validateEmail(email)) {
            setError('Введите корректный email адрес.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Пароли не совпадают.');
            return;
        }

        const data = {
            name,
            email,
            phone,
            birthday: dateOfBirth,
            username,
            password,
        };

        try {
            const response = await fetch(`${config.USER_SERVICE}/members/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Произошла ошибка при регистрации.');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Произошла ошибка при подключении к серверу.');
        }
    };

    const validateEmail = (email) => {
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(String(email).toLowerCase());
    };

    return (
        <div className={styles.registrationPage}>
            <Helmet>
                <title>Регистрация</title>
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            <img src="/logo.png" alt="Логотип" className={styles.logo}/>
            <div className={styles.formContainer}>
                <div className={styles.wrapper}>
                    <div className={styles.title}>
                        Регистрация
                    </div>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && <div className={styles.error}>{error}</div>}
                        {success && <div className={styles.success}>Регистрация прошла успешно!</div>}
                        <div className={styles.field}>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange}
                                   required className={styles.input}/>
                            <label htmlFor="name" className={styles.label}>Имя</label>
                        </div>
                        <div className={styles.field}>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                                   required className={styles.input}/>
                            <label htmlFor="email" className={styles.label}>Email</label>
                        </div>
                        <div className={styles.field}>
                            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange}
                                   required className={styles.input}/>
                            <label htmlFor="phone" className={styles.label}>Телефон</label>
                        </div>
                        <div className={styles.field}>
                            <input type="date" id="date-of-birth" name="dateOfBirth" value={formData.dateOfBirth}
                                   onChange={handleChange} required className={styles.input}/>
                            <label htmlFor="date-of-birth" className={`${styles.label} ${styles.alwaysFloatLabel}`}>Дата
                                рождения</label>
                        </div>
                        <div className={styles.field}>
                            <input type="text" id="username" name="username" value={formData.username}
                                   onChange={handleChange} required className={styles.input}/>
                            <label htmlFor="username" className={styles.label}>Имя пользователя</label>
                        </div>
                        <div className={styles.field}>
                            <input type="password" id="password" name="password" value={formData.password}
                                   onChange={handleChange} required className={styles.input}/>
                            <label htmlFor="password" className={styles.label}>Пароль</label>
                        </div>
                        <div className={styles.field}>
                            <input type="password" id="confirm-password" name="confirmPassword"
                                   value={formData.confirmPassword} onChange={handleChange} required
                                   className={styles.input}/>
                            <label htmlFor="confirm-password" className={styles.label}>Подтверждение пароля</label>
                        </div>
                        <div className={styles.field}>
                            <input type="submit" value="Зарегистрироваться" className={styles.submitButton}/>
                        </div>
                        <div className={styles.signupLink}>
                            Вернуться к <button onClick={() => navigate('/')}
                                              className={styles.linkButton}>Авторизации</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegistrationPage;