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
    const [currentUserUsername, setCurrentUserUsername] = useState('');
    const navigate = useNavigate();

    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`${config.USER_SERVICE}/users/me`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authorizationToken
                    },
                });
                if (response.status !== 200) {
                    throw new Error('Failed to fetch user role');
                }
                const data = await response.json();
                setIsModerator(data.role === 'MODERATOR');
                setCurrentUserUsername(data.username);
            } catch (error) {
                console.error('Error fetching user role:', error);
            }
        };

        fetchUserData();

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

    const handleSendMessage = async () => {
        try {
            const chatRequest = {
                secondUsername: username
            };

            const response = await fetch(`${config.CHAT_SERVICE}/private_chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken
                },
                body: JSON.stringify(chatRequest)
            });

            if (!response.ok) {
                throw new Error('Не удалось создать чат');
            }

            const createdChat = await response.json();
            navigate('/chats');
        } catch (error) {
            console.error('Ошибка при создании чата:', error);
            alert('Произошла ошибка при создании чата');
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
                        <button onClick={handleSendMessage} className={styles.sendMessageButton}>
                            <i className="fas fa-comments"></i> Написать сообщение
                        </button>
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