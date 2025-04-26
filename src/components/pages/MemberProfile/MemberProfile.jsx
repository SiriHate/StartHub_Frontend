import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import styles from './MemberProfile.module.css';
import NavigationBar from '../../menu/Menu';
import { Helmet } from "react-helmet";
import config from '../../../config';

function MemberProfile() {
    const { username } = useParams();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [birthday, setBirthday] = useState('');
    const [avatar, setAvatar] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [about, setAbout] = useState('');
    const [redirect, setRedirect] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [isModerator, setIsModerator] = useState(false);
    const navigate = useNavigate();

    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

    useEffect(() => {
        // Проверка роли пользователя
        fetch(`${config.USER_SERVICE}/users/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationToken
            },
        })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error('Failed to fetch user role');
                }
                return response.json();
            })
            .then(data => {
                setIsModerator(data.role === 'MODERATOR');
            })
            .catch(error => {
                console.error('Error fetching user role:', error);
            });

        // Загрузка данных профиля
        fetch(`${config.USER_SERVICE}/members/by-username/${username}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationToken
            },
        })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error('Failed to fetch user information');
                }
                return response.json();
            })
            .then(data => {
                setName(data.name);
                setPhone(data.phone);
                setEmail(data.email);
                setBirthday(data.birthday);
                setSpecialization(data.specialization);
                setAbout(data.about);
                const avatarSrc = data.avatarUrl ? `${config.FILE_SERVER}${data.avatarUrl}` : "/default_avatar.jpg";
                setAvatar(avatarSrc);
            })
            .catch(error => {
                console.error('Fetch error:', error);
                setRedirect(true);
            });
    }, [username, authorizationToken]);

    const handleBlockUser = async () => {
        try {
            const response = await fetch(`${config.USER_SERVICE}/members/by-username/${username}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken
                },
            });

            if (response.ok) {
                setIsBlocked(true);
                alert('Пользователь успешно заблокирован');
            } else {
                throw new Error('Не удалось заблокировать пользователя');
            }
        } catch (error) {
            console.error('Ошибка при блокировке пользователя:', error);
            alert('Произошла ошибка при блокировке пользователя');
        }
    };

    if (redirect) {
        return <Navigate to="/not-found" replace />;
    }

    return (
        <div>
            {!isModerator && <NavigationBar />}
            <div className={styles.profilePage}>
                <Helmet>
                    <title>Профиль пользователя - {username}</title>
                    <html className={styles.html} />
                    <body className={styles.body} />
                </Helmet>
                <div className={styles.profileCard}>
                    <button onClick={() => navigate(-1)} className={styles.backButton}>
                        <img src="/back-arrow.png" alt="Назад" className={styles.backIcon} />
                        <span>Назад</span>
                    </button>
                    {isModerator && (
                        <button 
                            onClick={handleBlockUser} 
                            className={styles.blockButton}
                            disabled={isBlocked}
                        >
                            {isBlocked ? 'Заблокирован' : 'Заблокировать'}
                        </button>
                    )}
                    <div className={styles.profileCardHeader}>
                        <img src={avatar} alt="Аватар пользователя" className={styles.avatar} onError={e => { e.target.onerror = null; e.target.src = '/default_user_avatar.jpg'; }} />
                        <div className={styles.username}>{username}</div>
                    </div>
                    <div className={styles.infoSection}>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Полное имя:</span>
                            <span className={styles.infoText}>{name}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Номер телефона:</span>
                            <span className={styles.infoText}>{phone}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Email-адрес:</span>
                            <span className={styles.infoText}>{email}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Дата рождения:</span>
                            <span className={styles.infoText}>{birthday}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Специализация:</span>
                            <span className={styles.infoText}>{specialization}</span>
                        </div>
                    </div>
                    <div className={styles.infoSection}>
                        <div className={styles.infoItem}>
                            <span className={styles.aboutLabel}>О себе:</span>
                        </div>
                        <div className={styles.aboutSection}>
                            <div className={styles.aboutText}>{about}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MemberProfile;