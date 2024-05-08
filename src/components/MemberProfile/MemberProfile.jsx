import React, {useState, useEffect} from 'react';
import {useParams} from 'react-router-dom';
import styles from './MemberProfile.module.css';
import NavigationBar from '../NavigationBar/NavigationBar';
import {Helmet} from "react-helmet";

function MemberProfile() {
    const {username} = useParams();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [birthday, setBirthday] = useState('');
    const [avatar, setAvatar] = useState('');
    const [fetchedUsername, setFetchedUsername] = useState('');
    const [about, setAbout] = useState('');

    useEffect(() => {
        fetch(`http://localhost:8081/api/v1/users/member/by-username/${username}`, {
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
                setName(data.name);
                setPhone(data.phone);
                setEmail(data.email);
                setBirthday(data.birthday);
                setFetchedUsername(data.username);
                setAbout(data.about);
                const avatarSrc = data.avatar ? `data:image/jpeg;base64,${data.avatar}` : "/default_avatar.jpg";
                setAvatar(avatarSrc);
            })
            .catch(error => console.error('Fetch error:', error));
    }, [username]);

    return (
        <div>
            <NavigationBar/>
            <div className={styles.profilePage}>
                <Helmet>
                    <title>Профиль пользователя - {username}</title>
                    <html className={styles.html}/>
                    <body className={styles.body}/>
                </Helmet>
                <div className={styles.profileCard}>
                    <div className={styles.profileCardHeader}>
                        <img src={avatar} alt="Аватар пользователя" className={styles.avatar}/>
                        <div className={styles.username}>{username}</div>
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
