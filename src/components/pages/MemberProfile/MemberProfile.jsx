import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import styles from './MemberProfile.module.css';
import NavigationBar from '../../menu/Menu';
import { Helmet } from "react-helmet";
import config from '../../../config';
import apiClient from '../../../api/apiClient';

function MemberProfile() {
    const { username } = useParams();
    const [profile, setProfile] = useState(null);
    const [redirect, setRedirect] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [isModerator, setIsModerator] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const [roleRes, memberRes] = await Promise.all([
                    apiClient(`${config.USER_SERVICE}/users/me`, { headers: { 'Content-Type': 'application/json' } }).catch(() => null),
                    apiClient(`${config.USER_SERVICE}/members/by-username/${username}`, { headers: { 'Content-Type': 'application/json' } }),
                ]);

                if (roleRes && roleRes.ok) {
                    const roleData = await roleRes.json();
                    setIsModerator(roleData.role === 'MODERATOR');
                }

                if (!memberRes.ok) { setRedirect(true); return; }
                const memberData = await memberRes.json();

                const raw = memberData.avatarUrl ?? memberData.avatar_url;
                const avatarSrc = !raw ? "/default_user_avatar.jpg"
                    : (raw.startsWith('http://') || raw.startsWith('https://')) ? raw
                        : `${config.FILE_SERVER || ''}${raw}`;
                setProfile({ ...memberData, avatarSrc });
                setIsLoading(false);
            } catch {
                setRedirect(true);
            }
        };

        load();
    }, [username]);

    const handleBlockUser = async () => {
        try {
            const response = await apiClient(`${config.USER_SERVICE}/members/by-username/${username}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) setIsBlocked(true);
        } catch {}
    };

    const handleSendMessage = async () => {
        try {
            const response = await apiClient(`${config.CHAT_SERVICE}/chats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isGroup: false, participants: [{ username, role: 'MEMBER' }] })
            });
            await response.json();
            navigate('/chats');
        } catch {}
    };

    if (redirect) return <Navigate to="/not-found" replace />;

    if (isLoading || !profile) {
        return (
            <>
                <Helmet><title>Профиль — StartHub</title><body className={styles.body} /></Helmet>
                {!isModerator && <NavigationBar />}
                <div className={styles.page}>
                    <div className={styles.loadingState}><div className={styles.spinner}></div><p>Загрузка профиля...</p></div>
                </div>
            </>
        );
    }

    const location = [profile.city, profile.country].filter(Boolean).join(', ');

    const infoFields = [
        { icon: 'fa-user', label: 'Имя', value: profile.name },
        { icon: 'fa-phone', label: 'Телефон', value: profile.phone },
        { icon: 'fa-envelope', label: 'Email', value: profile.email },
        { icon: 'fa-calendar', label: 'Дата рождения', value: profile.birthday },
        { icon: 'fa-globe', label: 'Страна', value: profile.country },
        { icon: 'fa-city', label: 'Город', value: profile.city },
    ];

    const activeRoles = [
        profile.jobSeekerProfile && {
            icon: 'fa-briefcase',
            label: 'Соискатель',
            desc: profile.jobSeekerProfile.about,
            extra: profile.jobSeekerProfile.specialization && (
                <span className={styles.roleBadge}><i className="fas fa-code"></i> {profile.jobSeekerProfile.specialization}</span>
            ),
        },
        profile.investorProfile && {
            icon: 'fa-chart-line',
            label: 'Инвестор',
            desc: profile.investorProfile.about,
            domains: profile.investorProfile.domains,
        },
        profile.founderProfile && {
            icon: 'fa-rocket',
            label: 'Предприниматель',
            desc: profile.founderProfile.about,
            domains: profile.founderProfile.domains,
        },
        profile.mentorProfile && {
            icon: 'fa-graduation-cap',
            label: 'Ментор',
            desc: profile.mentorProfile.about,
            domains: profile.mentorProfile.domains,
        },
    ].filter(Boolean);

    return (
        <>
            <Helmet><title>{username} — StartHub</title><body className={styles.body} /></Helmet>

            {!isModerator && <NavigationBar />}

            {isModerator && (
                <div className={styles.moderatorBar}>
                    <span className={styles.moderatorLabel}><i className="fas fa-shield-alt"></i> Модерация профиля</span>
                    <div className={styles.moderatorActions}>
                        <button onClick={handleBlockUser} className={styles.blockBtn} disabled={isBlocked}>
                            <i className={`fas ${isBlocked ? 'fa-check' : 'fa-ban'}`}></i>
                            {isBlocked ? 'Заблокирован' : 'Заблокировать'}
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.topBar}>
                        <button className={styles.backBtn} onClick={() => navigate(-1)}>
                            <i className="fas fa-arrow-left"></i> Назад
                        </button>
                    </div>

                    <div className={styles.headerCard}>
                        <div className={styles.avatarBlock}>
                            <img src={profile.avatarSrc} alt={`Аватар ${username}`} className={styles.avatar}
                                 onError={e => { e.target.onerror = null; e.target.src = '/default_user_avatar.jpg'; }}/>
                        </div>
                        <div className={styles.headerInfo}>
                            <span className={styles.usernameLabel}>@{username}</span>
                            {profile.name && <h1 className={styles.displayName}>{profile.name}</h1>}
                            {location && (
                                <span className={styles.locationBadge}><i className="fas fa-map-marker-alt"></i> {location}</span>
                            )}
                            <button className={styles.messageBtn} onClick={handleSendMessage}>
                                <i className="fas fa-comments"></i> Написать сообщение
                            </button>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}><i className="fas fa-id-card"></i><h2>Информация</h2></div>
                        <div className={styles.infoGrid}>
                            {infoFields.map((field, idx) => (
                                field.value ? (
                                    <div key={idx} className={styles.infoItem}>
                                        <div className={styles.infoIcon}><i className={`fas ${field.icon}`}></i></div>
                                        <div className={styles.infoContent}>
                                            <span className={styles.infoLabel}>{field.label}</span>
                                            <span className={styles.infoValue}>{field.value}</span>
                                        </div>
                                    </div>
                                ) : null
                            ))}
                        </div>
                    </div>

                    {profile.about && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}><i className="fas fa-align-left"></i><h2>О себе</h2></div>
                            <p className={styles.aboutText}>{profile.about}</p>
                        </div>
                    )}

                    {activeRoles.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}><i className="fas fa-id-badge"></i><h2>Деятельность</h2></div>
                            <div className={styles.roleList}>
                                {activeRoles.map((role, idx) => (
                                    <div key={idx} className={styles.roleCard}>
                                        <div className={styles.roleHeader}>
                                            <i className={`fas ${role.icon}`}></i>
                                            <span>{role.label}</span>
                                        </div>
                                        {role.extra}
                                        {role.domains && role.domains.length > 0 && (
                                            <div className={styles.roleAreas}>
                                                {role.domains.map((name, i) => (
                                                    <span key={i} className={styles.areaTag}>{name}</span>
                                                ))}
                                            </div>
                                        )}
                                        {role.desc && <p className={styles.roleDesc}>{role.desc}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default MemberProfile;
