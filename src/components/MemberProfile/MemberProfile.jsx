import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MemberProfile.css';

function MemberProfilePage() {
    const navigate = useNavigate();

    useEffect(() => {
        const logoutButton = document.querySelector(".logout-btn");
        const deleteAccountButton = document.querySelector(".delete-account-btn");

        const handleLogout = () => {
            document.cookie = 'Authorization=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            navigate('/');
        };

        logoutButton.addEventListener("click", handleLogout);
        deleteAccountButton.addEventListener("click", handleLogout);

        return () => {
            logoutButton.removeEventListener("click", handleLogout);
            deleteAccountButton.removeEventListener("click", handleLogout);
        };
    }, [navigate]);

    return (
        <div className="profile-page">
            <div className="header">
                <img src="/default_avatar.jpg" alt="User Avatar" className="avatar" />
                <div className="username">Иван Иванов</div>
                <button className="upload-btn">Загрузить фото</button>
            </div>
            <div className="info-section">
                <div className="info-item">
                    <span className="label">Имя:</span>
                    <span className="value">Иван Иванов</span>
                </div>
                <div className="info-item">
                    <span className="label">Телефон:</span>
                    <span className="value">+7 900 123 45 67</span>
                </div>
                <div className="info-item">
                    <span className="label">Email:</span>
                    <span className="value">ivanov@example.com</span>
                </div>
                <div className="info-item">
                    <span className="label">Дата рождения:</span>
                    <span className="value">12.04.1986</span>
                </div>
                <button className="edit-btn">Редактировать</button>
            </div>
            <div className="password-section">
                <div className="password-item">
                    <span className="label">Текущий пароль:</span>
                    <input type="password" className="password-input" />
                </div>
                <div className="password-item">
                    <span className="label">Новый пароль:</span>
                    <input type="password" className="password-input" />
                </div>
                <button className="change-password-btn">Сменить пароль</button>
            </div>
            <div className="actions-section">
                <div className="button-wrapper">
                    <button className="logout-btn">Выйти</button>
                    <button className="delete-account-btn">Удалить аккаунт</button>
                </div>
            </div>
        </div>
    );
}

export default MemberProfilePage;
