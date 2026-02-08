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
        name: '', email: '', phone: '', dateOfBirth: '', username: '', password: '', confirmPassword: ''
    });

    const handleChange = (e) => { setFormData({...formData, [e.target.name]: e.target.value}); setError(''); };

    const validateEmail = (email) => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(String(email).toLowerCase());

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(false);
        const {name, email, phone, dateOfBirth, username, password, confirmPassword} = formData;
        if (!name || !email || !phone || !dateOfBirth || !username || !password || !confirmPassword) { setError('Пожалуйста, заполните все поля.'); return; }
        if (!validateEmail(email)) { setError('Введите корректный email адрес.'); return; }
        if (password !== confirmPassword) { setError('Пароли не совпадают.'); return; }

        try {
            const response = await fetch(`${config.USER_SERVICE}/members/register`, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name, email, phone, birthday: dateOfBirth, username, password})
            });
            if (response.ok) { setSuccess(true); setTimeout(() => navigate('/'), 3000); }
            else { const d = await response.json(); setError(d.message || 'Произошла ошибка при регистрации.'); }
        } catch (err) { setError('Произошла ошибка при подключении к серверу.'); }
    };

    return (
        <>
            <Helmet>
                <title>Регистрация — StartHub</title>
                <body className={styles.body} />
            </Helmet>
            <div className={styles.page}>
                <img src="/logo.png" alt="StartHub" className={styles.logo} />
                <div className={styles.card}>
                    <h1 className={styles.title}>Регистрация</h1>
                    <p className={styles.subtitle}>Создайте новый аккаунт</p>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && <div className={styles.errorMsg}><i className="fas fa-exclamation-circle"></i> {error}</div>}
                        {success && <div className={styles.successMsg}><i className="fas fa-check-circle"></i> Регистрация прошла успешно! Перенаправление...</div>}

                        <div className={styles.fieldGroup}>
                            <label>Имя</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ваше имя" required />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label>Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" required />
                        </div>
                        <div className={styles.row}>
                            <div className={styles.fieldGroup}>
                                <label>Телефон</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+7..." required />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Дата рождения</label>
                                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className={styles.fieldGroup}>
                            <label>Имя пользователя</label>
                            <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="username" required />
                        </div>
                        <div className={styles.row}>
                            <div className={styles.fieldGroup}>
                                <label>Пароль</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Пароль" required />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Подтверждение</label>
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Повторите пароль" required />
                            </div>
                        </div>

                        <button type="submit" className={styles.submitBtn}>Зарегистрироваться</button>
                    </form>

                    <div className={styles.footer}>
                        Уже есть аккаунт?{' '}
                        <button className={styles.linkBtn} onClick={() => navigate('/')}>Войти</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RegistrationPage;
