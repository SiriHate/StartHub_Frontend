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
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const accessTokenCookie = document.cookie.split('; ').find(row => row.startsWith('accessToken='));
    const accessToken = accessTokenCookie ? accessTokenCookie.split('=')[1] : '';

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`${config.USER_SERVICE}/users/me`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                });
                if (response.status !== 200) throw new Error('Failed to fetch user role');
                const data = await response.json();
                setIsModerator(data.role === 'MODERATOR');
            } catch (error) {
                console.error('Error fetching user role:', error);
            }
        };

        fetchUserData();

        fetch(`${config.USER_SERVICE}/members/by-username/${username}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
        })
            .then(response => {
                if (response.status !== 200) throw new Error('Failed to fetch user information');
                return response.json();
            })
            .then(data => {
                setName(data.name);
                setPhone(data.phone);
                setEmail(data.email);
                setBirthday(data.birthday);
                setSpecialization(data.specialization);
                setAbout(data.about);
                const raw = data.avatarUrl ?? data.avatar_url;
                const avatarSrc = !raw ? "/default_user_avatar.jpg"
                    : (raw.startsWith('http://') || raw.startsWith('https://')) ? raw
                        : `${config.FILE_SERVER || ''}${raw}`;
                setAvatar(avatarSrc);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Fetch error:', error);
                setRedirect(true);
            });
    }, [username, accessToken]);

    const handleBlockUser = async () => {
        try {
            const response = await fetch(`${config.USER_SERVICE}/members/by-username/${username}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
            });
            if (response.ok) {
                setIsBlocked(true);
            } else {
                throw new Error('Не удалось заблокировать пользователя');
            }
        } catch (error) {
            console.error('Ошибка при блокировке пользователя:', error);
        }
    };

    const handleSendMessage = async () => {
        try {
            const chatRequest = {
                isGroup: false,
                participants: [{ username, role: 'MEMBER' }]
            };
            const response = await fetch(`${config.CHAT_SERVICE}/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(chatRequest)
            });
            await response.json();
            navigate('/chats');
        } catch (error) {
            console.error('Ошибка при создании чата:', error);
        }
    };

    if (redirect) {
        return <Navigate to="/not-found" replace />;
    }

    if (isLoading) {
        return (
            <>
                <Helmet>
                    <title>Профиль — StartHub</title>
                    <body className={styles.body} />
                </Helmet>
                {!isModerator && <NavigationBar />}
                <div className={styles.page}>
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Загрузка профиля...</p>
                    </div>
                </div>
            </>
        );
    }

    const infoFields = [
        { icon: 'fa-user', label: 'Имя', value: name },
        { icon: 'fa-phone', label: 'Телефон', value: phone },
        { icon: 'fa-envelope', label: 'Email', value: email },
        { icon: 'fa-calendar', label: 'Дата рождения', value: birthday },
        { icon: 'fa-briefcase', label: 'Специализация', value: specialization },
    ];

    return (
        <>
            <Helmet>
                <title>{username} — StartHub</title>
                <body className={styles.body} />
            </Helmet>

            {!isModerator && <NavigationBar />}

            {isModerator && (
                <div className={styles.moderatorBar}>
                    <span className={styles.moderatorLabel}>
                        <i className="fas fa-shield-alt"></i> Модерация профиля
                    </span>
                    <div className={styles.moderatorActions}>
                        <button
                            onClick={handleBlockUser}
                            className={styles.blockBtn}
                            disabled={isBlocked}
                        >
                            <i className={`fas ${isBlocked ? 'fa-check' : 'fa-ban'}`}></i>
                            {isBlocked ? 'Заблокирован' : 'Заблокировать'}
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.page}>
                <div className={styles.container}>
                    {/* Top Bar */}
                    <div className={styles.topBar}>
                        <button className={styles.backBtn} onClick={() => navigate(-1)}>
                            <i className="fas fa-arrow-left"></i> Назад
                        </button>
                    </div>

                    {/* Header Card */}
                    <div className={styles.headerCard}>
                        <div className={styles.avatarBlock}>
                            <img
                                src={avatar}
                                alt={`Аватар ${username}`}
                                className={styles.avatar}
                                onError={e => { e.target.onerror = null; e.target.src = '/default_user_avatar.jpg'; }}
                            />
                        </div>
                        <div className={styles.headerInfo}>
                            <h1 className={styles.usernameTitle}>{username}</h1>
                            {specialization && (
                                <span className={styles.specBadge}>
                                    <i className="fas fa-briefcase"></i> {specialization}
                                </span>
                            )}
                            <button className={styles.messageBtn} onClick={handleSendMessage}>
                                <i className="fas fa-comments"></i> Написать сообщение
                            </button>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <i className="fas fa-id-card"></i>
                            <h2>Информация</h2>
                        </div>
                        <div className={styles.infoGrid}>
                            {infoFields.map((field, idx) => (
                                field.value ? (
                                    <div key={idx} className={styles.infoItem}>
                                        <div className={styles.infoIcon}>
                                            <i className={`fas ${field.icon}`}></i>
                                        </div>
                                        <div className={styles.infoContent}>
                                            <span className={styles.infoLabel}>{field.label}</span>
                                            <span className={styles.infoValue}>{field.value}</span>
                                        </div>
                                    </div>
                                ) : null
                            ))}
                        </div>
                    </div>

                    {/* About Section */}
                    {about && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <i className="fas fa-align-left"></i>
                                <h2>О себе</h2>
                            </div>
                            <p className={styles.aboutText}>{about}</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default MemberProfile;
