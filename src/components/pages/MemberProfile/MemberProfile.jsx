import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import styles from './MemberProfile.module.css';
import { ReactComponent as GoBackIcon } from '../../../icons/go_back.svg';
import NavigationBar from '../../navigation_bar/NavigationBar';
import { Helmet } from "react-helmet";
import config from '../../../config';

function MemberProfile() {
    const { userId } = useParams();
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [birthday, setBirthday] = useState('');
    const [avatar, setAvatar] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [about, setAbout] = useState('');
    const [redirect, setRedirect] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${config.USER_SERVICE}/members/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error('Failed to fetch user information');
                }
                return response.json();
            })
            .then(data => {
                setUsername(data.username);
                setName(data.name);
                setPhone(data.phone);
                setEmail(data.email);
                setBirthday(data.birthday);
                setSpecialization(data.specialization);
                setAbout(data.about);
                const avatarSrc = data.avatarUrl ? `${config.FILE_SERVER}${data.avatarUrl}` : "/default_user_avatar.jpg";
                setAvatar(avatarSrc);
            })
            .catch(error => {
                console.error('Fetch error:', error);
                setRedirect(true);
            });
    }, [userId]);

    const handleSendMessage = () => {
        alert(`Message sent to ${username}`);
    };

    if (redirect) {
        return <Navigate to="/not-found" replace />;
    }

    return (
        <div>
            <NavigationBar />
            <div className={styles.profilePage}>
                <Helmet>
                    <title>Профиль пользователя - {username}</title>
                    <html className={styles.html} />
                    <body className={styles.body} />
                </Helmet>
                <div className={styles.profileCard}>
                    <button onClick={() => navigate('/people_and_projects')} className={styles.goBackButton}>
                        <GoBackIcon />
                    </button>
                    <div className={styles.profileCardHeader}>
                        <img src={avatar} alt="Аватар пользователя" className={styles.avatar} />
                        <div className={styles.username}>{username}</div>
                        <button onClick={handleSendMessage} className={styles.sendMessageButton}>Отправить сообщение</button>
                    </div>
                    <div className={styles.infoSection}>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Имя:</span>
                            <span className={styles.infoText}>{name}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Телефон:</span>
                            <span className={styles.infoText}>{phone}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Email:</span>
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
