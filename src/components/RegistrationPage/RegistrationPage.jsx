import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Global.css';
import './RegistrationPage.css';

const RegistrationPage = () => {
    const navigate = useNavigate();

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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { name, email, phone, dateOfBirth, username, password, confirmPassword } = formData;

        if (!name || !email || !phone || !dateOfBirth || !username || !password || !confirmPassword) {
            alert('Пожалуйста, заполните все поля.');
            return;
        }

        if (!validateEmail(email)) {
            alert('Введите корректный email адрес.');
            return;
        }

        if (password.length < 8) {
            alert('Пароль должен содержать 8 или более символов.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Пароли не совпадают.');
            return;
        }

        const data = {
            name,
            email,
            phone,
            birthDay: dateOfBirth,
            username,
            password,
        };

        try {
            const response = await fetch('http://127.0.0.1:8081/api/v1/users/member/registration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Success:', result);
                alert('Регистрация прошла успешно!');
                navigate('/');
            } else {
                console.error('Error response:', response);
                alert('Произошла ошибка при регистрации.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Произошла ошибка при регистрации.');
        }
    };

    const validateEmail = (email) => {
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(String(email).toLowerCase());
    };

    return (
        <div className="form-container">
            <div className="wrapper">
                <div className="title">
                    Регистрация
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                        <label htmlFor="name">Имя</label>
                    </div>
                    <div className="field">
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                        <label htmlFor="email">Email</label>
                    </div>
                    <div className="field">
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                        <label htmlFor="phone">Телефон</label>
                    </div>
                    <div className="field">
                        <input type="date" id="date-of-birth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
                        <label htmlFor="date-of-birth" className="always-float-label">Дата рождения</label>
                    </div>
                    <div className="field">
                        <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
                        <label htmlFor="username">Имя пользователя</label>
                    </div>
                    <div className="field">
                        <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
                        <label htmlFor="password">Пароль</label>
                    </div>
                    <div className="field">
                        <input type="password" id="confirm-password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                        <label htmlFor="confirm-password">Подтверждение пароля</label>
                    </div>
                    <div className="field">
                        <input type="submit" value="Зарегистрироваться" />
                    </div>
                    <div className="signup-link">
                        Перейти к <button onClick={() => navigate('/')} className="link-button">Авторизация</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegistrationPage;
