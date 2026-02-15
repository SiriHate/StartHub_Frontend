import React, {useEffect, useRef, useState, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from './PersonalMemberAccount.module.css';
import Menu from '../../menu/Menu';
import {Helmet} from "react-helmet";
import config from '../../../config';
import apiClient, { clearAuth } from '../../../api/apiClient';

const ROLE_PROFILE_TYPES = {
    lookingForJob: 'job-seeker',
    investor: 'investor',
    entrepreneur: 'founder',
    mentor: 'mentor',
};

function PersonalMemberAccount() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [birthday, setBirthday] = useState('');
    const [username, setUsername] = useState('');
    const [avatar, setAvatar] = useState('');
    const [about, setAbout] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [memberId, setMemberId] = useState(null);

    const [specializations, setSpecializations] = useState([]);
    const [domains, setDomains] = useState([]);

    const [roleProfiles, setRoleProfiles] = useState({
        lookingForJob: { active: false, exists: false, about: '', specializationId: null },
        investor: { active: false, exists: false, about: '', domainIds: [] },
        entrepreneur: { active: false, exists: false, about: '', domainIds: [] },
        mentor: { active: false, exists: false, about: '', domainIds: [] },
    });

    const [activeRole, setActiveRole] = useState(null);
    const [profileError, setProfileError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [passwordChangeFeedback, setPasswordChangeFeedback] = useState(null);
    const passwordFeedbackTimeoutRef = useRef(null);

    const updateRoleProfile = useCallback((key, updates) => {
        setRoleProfiles(prev => ({ ...prev, [key]: { ...prev[key], ...updates } }));
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [memberRes, specRes, domainRes] = await Promise.all([
                    apiClient(`${config.USER_SERVICE}/members/me`, { headers: { 'Content-Type': 'application/json' } }),
                    apiClient(`${config.USER_SERVICE}/member-specializations`, { headers: { 'Content-Type': 'application/json' } }),
                    apiClient(`${config.USER_SERVICE}/domains`, { headers: { 'Content-Type': 'application/json' } }),
                ]);

                if (!memberRes.ok) throw new Error('Не удалось загрузить профиль');

                const memberData = await memberRes.json();
                setMemberId(memberData.id);
                setName(memberData.name || '');
                setPhone(memberData.phone || '');
                setEmail(memberData.email || '');
                setBirthday(memberData.birthday || '');
                setUsername(memberData.username || '');
                setAbout(memberData.about || '');
                setCountry(memberData.country || '');
                setCity(memberData.city || '');
                let avatarUrl = memberData.avatarUrl;
                if (avatarUrl) avatarUrl = avatarUrl.replace(/\\/g, '/');
                setAvatar(avatarUrl || '');

                let specList = [];
                if (specRes.ok) {
                    specList = await specRes.json();
                    setSpecializations(specList);
                }

                let domainList = [];
                if (domainRes.ok) {
                    domainList = await domainRes.json();
                    setDomains(domainList);
                }

                const domainNameToId = Object.fromEntries(domainList.map(d => [d.name, d.id]));
                const specNameToId = Object.fromEntries(specList.map(s => [s.name, s.id]));

                const parseDomainNames = (names) => (names || []).map(n => domainNameToId[n]).filter(Boolean);

                const newProfiles = {};

                if (memberData.jobSeekerProfile) {
                    const p = memberData.jobSeekerProfile;
                    newProfiles.lookingForJob = { active: true, exists: true, about: p.about || '', specializationId: specNameToId[p.specialization] || null };
                } else {
                    newProfiles.lookingForJob = { active: false, exists: false, about: '', specializationId: null };
                }

                if (memberData.investorProfile) {
                    const p = memberData.investorProfile;
                    newProfiles.investor = { active: true, exists: true, about: p.about || '', domainIds: parseDomainNames(p.domains) };
                } else {
                    newProfiles.investor = { active: false, exists: false, about: '', domainIds: [] };
                }

                if (memberData.founderProfile) {
                    const p = memberData.founderProfile;
                    newProfiles.entrepreneur = { active: true, exists: true, about: p.about || '', domainIds: parseDomainNames(p.domains) };
                } else {
                    newProfiles.entrepreneur = { active: false, exists: false, about: '', domainIds: [] };
                }

                if (memberData.mentorProfile) {
                    const p = memberData.mentorProfile;
                    newProfiles.mentor = { active: true, exists: true, about: p.about || '', domainIds: parseDomainNames(p.domains) };
                } else {
                    newProfiles.mentor = { active: false, exists: false, about: '', domainIds: [] };
                }

                setRoleProfiles(newProfiles);
                setIsLoading(false);
            } catch (error) {
                setProfileError(error.message || 'Ошибка загрузки');
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        return () => {
            if (passwordFeedbackTimeoutRef.current) clearTimeout(passwordFeedbackTimeoutRef.current);
        };
    }, []);

    const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

    const handleSaveProfile = () => {
        if (!isValidEmail(email)) {
            alert('Пожалуйста, введите корректный email.');
            return;
        }
        apiClient(`${config.USER_SERVICE}/members/me`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, email, birthday, about, country, city }),
        })
            .then(res => { if (!res.ok) throw new Error(); alert('Данные профиля сохранены!'); })
            .catch(() => alert('Ошибка при сохранении профиля'));
    };

    const handleSaveRole = async (roleKey) => {
        const profile = roleProfiles[roleKey];
        const endpoint = `${config.USER_SERVICE}/members/${memberId}/profiles/${ROLE_PROFILE_TYPES[roleKey]}`;

        let body;
        if (roleKey === 'lookingForJob') {
            body = { memberId, about: profile.about, specializationId: profile.specializationId };
        } else {
            body = { memberId, about: profile.about, domainIds: profile.domainIds };
        }

        try {
            const res = await apiClient(endpoint, {
                method: profile.exists ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error();
            updateRoleProfile(roleKey, { exists: true });
            setActiveRole(null);
            alert('Сохранено!');
        } catch {
            alert('Ошибка при сохранении');
        }
    };

    const handleDeleteRole = async (roleKey) => {
        const endpoint = `${config.USER_SERVICE}/members/${memberId}/profiles/${ROLE_PROFILE_TYPES[roleKey]}`;
        try {
            await apiClient(endpoint, { method: 'DELETE' });
        } catch {}

        if (roleKey === 'lookingForJob') {
            updateRoleProfile(roleKey, { active: false, exists: false, about: '', specializationId: null });
        } else {
            updateRoleProfile(roleKey, { active: false, exists: false, about: '', domainIds: [] });
        }
        setActiveRole(null);
    };

    const handleToggleRole = (roleKey, checked) => {
        if (checked) {
            updateRoleProfile(roleKey, { active: true });
            setActiveRole(roleKey);
        } else {
            if (roleProfiles[roleKey].exists) {
                handleDeleteRole(roleKey);
            } else {
                updateRoleProfile(roleKey, { active: false });
                setActiveRole(null);
            }
        }
    };

    const handleCancelRole = (roleKey) => {
        if (!roleProfiles[roleKey].exists) {
            updateRoleProfile(roleKey, { active: false });
        }
        setActiveRole(null);
    };

    const toggleDomain = (domainId, roleKey) => {
        const profile = roleProfiles[roleKey];
        const ids = profile.domainIds || [];
        const updated = ids.includes(domainId) ? ids.filter(id => id !== domainId) : [...ids, domainId];
        updateRoleProfile(roleKey, { domainIds: updated });
    };

    const handleLogout = () => { clearAuth(); navigate('/'); };

    const showPasswordFeedback = (message, type) => {
        if (passwordFeedbackTimeoutRef.current) clearTimeout(passwordFeedbackTimeoutRef.current);
        setPasswordChangeFeedback({ message, type });
        passwordFeedbackTimeoutRef.current = setTimeout(() => {
            setPasswordChangeFeedback(null);
            passwordFeedbackTimeoutRef.current = null;
        }, 3000);
    };

    const handleChangePassword = () => {
        apiClient(`${config.USER_SERVICE}/members/me/password`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword }),
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(body => {
                        throw new Error(body?.message || body?.errorMessage || 'Не удалось сменить пароль');
                    }).catch(e => { if (e.message) throw e; throw new Error('Не удалось сменить пароль'); });
                }
                setCurrentPassword('');
                setNewPassword('');
                showPasswordFeedback('Пароль успешно изменён', 'success');
            })
            .catch(error => showPasswordFeedback(error?.message || 'Не удалось сменить пароль.', 'error'));
    };

    const handleDeleteAccount = () => {
        apiClient(`${config.USER_SERVICE}/members/me`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        })
            .then(res => { if (res.status !== 204) throw new Error(); navigate('/'); })
            .catch(() => {});
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
            setAvatar(URL.createObjectURL(file));
            const formData = new FormData();
            formData.append('file', file);
            apiClient(`${config.USER_SERVICE}/members/me/avatar`, { method: 'PATCH', body: formData })
                .then(res => { if (!res.ok) throw new Error(); if (res.status === 204) return null; return res.json(); })
                .then(data => {
                    if (!data) { window.location.reload(); return; }
                    const rawUrl = data.avatarUrl || data.url;
                    if (!rawUrl) { window.location.reload(); return; }
                    let url = rawUrl.replace(/\\/g, '/');
                    url += (url.includes('?') ? '&' : '?') + 't=' + Date.now();
                    setAvatar(url);
                })
                .catch(() => {});
        } else {
            alert('Выберите изображение формата JPG или PNG.');
        }
    };

    const rolesConfig = [
        { key: 'lookingForJob', label: 'Я соискатель', icon: 'fa-briefcase', placeholder: 'Опишите, какую работу вы ищете, ваш опыт и навыки...', hasDomains: false },
        { key: 'investor', label: 'Я инвестор', icon: 'fa-chart-line', placeholder: 'Опишите ваш инвестиционный опыт, интересующие направления...', hasDomains: true },
        { key: 'entrepreneur', label: 'Я предприниматель', icon: 'fa-rocket', placeholder: 'Расскажите о ваших проектах и предпринимательском опыте...', hasDomains: true },
        { key: 'mentor', label: 'Я ментор', icon: 'fa-graduation-cap', placeholder: 'Опишите, в чём вы можете помочь, ваша экспертиза...', hasDomains: true },
    ];

    if (isLoading) {
        return (
            <>
                <Helmet><title>Личный кабинет — StartHub</title><body className={styles.body}/></Helmet>
                <Menu/>
                <div className={styles.page}>
                    <div className={styles.loadingState}><div className={styles.spinner}></div><p>Загрузка профиля...</p></div>
                </div>
            </>
        );
    }

    if (profileError) {
        return (
            <>
                <Helmet><title>Личный кабинет — StartHub</title><body className={styles.body}/></Helmet>
                <Menu/>
                <div className={styles.page}>
                    <div className={styles.errorState}><i className="fas fa-exclamation-triangle"></i><p>Не удалось загрузить профиль</p></div>
                </div>
            </>
        );
    }

    return (
        <>
            <Helmet><title>Личный кабинет — StartHub</title><body className={styles.body}/></Helmet>
            <Menu/>
            <div className={styles.page}>
                <div className={styles.container}>

                    <div className={styles.headerCard}>
                        <div className={styles.avatarBlock}>
                            <img src={avatar || '/default_user_avatar.jpg'} alt="User Avatar"
                                 onError={e => { e.target.onerror = null; e.target.src = '/default_user_avatar.jpg'; }}
                                 className={styles.avatar}/>
                            <input type="file" onChange={handleFileUpload} ref={fileInputRef}
                                   style={{display: 'none'}} accept="image/jpeg,image/png"/>
                            <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                                <i className="fas fa-camera"></i> Загрузить фото
                            </button>
                        </div>
                        <div className={styles.headerInfo}>
                            <span className={styles.usernameLabel}>@{username}</span>
                            {name && <h1 className={styles.displayName}>{name}</h1>}
                            {(country || city) && (
                                <span className={styles.locationBadge}>
                                    <i className="fas fa-map-marker-alt"></i>
                                    {[city, country].filter(Boolean).join(', ')}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}><i className="fas fa-user-edit"></i><h2>Личная информация</h2></div>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Имя</label>
                                <input type="text" className={styles.formInput} value={name} onChange={e => setName(e.target.value)} placeholder="Введите имя"/>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Телефон</label>
                                <input type="text" className={styles.formInput} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 (999) 999-99-99"/>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Email</label>
                                <input type="email" className={styles.formInput} value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com"/>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Дата рождения</label>
                                <input type="date" className={styles.formInput} value={birthday} onChange={e => setBirthday(e.target.value)}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Страна</label>
                                <input type="text" className={styles.formInput} value={country} onChange={e => setCountry(e.target.value)} placeholder="Введите страну"/>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Город</label>
                                <input type="text" className={styles.formInput} value={city} onChange={e => setCity(e.target.value)} placeholder="Введите город"/>
                            </div>
                            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                <label className={styles.formLabel}>О себе</label>
                                <textarea className={styles.formTextarea} value={about} onChange={e => setAbout(e.target.value)} placeholder="Расскажите о себе..." rows={4}/>
                            </div>
                        </div>
                        <button className={styles.primaryBtn} onClick={handleSaveProfile}>
                            <i className="fas fa-save"></i> Сохранить изменения
                        </button>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}><i className="fas fa-id-badge"></i><h2>Роли и деятельность</h2></div>
                        <div className={styles.roleList}>
                            {rolesConfig.map(rc => {
                                const profile = roleProfiles[rc.key];
                                const isActive = activeRole === rc.key;
                                const isOtherActive = activeRole !== null && activeRole !== rc.key;
                                return (
                                    <div key={rc.key} className={`${styles.roleCard} ${isActive ? styles.roleCardActive : ''} ${isOtherActive ? styles.roleCardDimmed : ''}`}>
                                        <label className={styles.roleToggle}>
                                            <input type="checkbox" checked={profile.active}
                                                   onChange={e => handleToggleRole(rc.key, e.target.checked)}
                                                   className={styles.toggleInput} disabled={isOtherActive}/>
                                            <span className={styles.toggleSwitch}></span>
                                            <span className={styles.roleLabel}><i className={`fas ${rc.icon}`}></i>{rc.label}</span>
                                        </label>
                                        {profile.active && profile.exists && !isActive && (
                                            <div className={styles.roleDescWrap}>
                                                <button className={styles.editRoleBtn} onClick={() => setActiveRole(rc.key)} disabled={isOtherActive}>
                                                    <i className="fas fa-pen"></i> Редактировать
                                                </button>
                                            </div>
                                        )}
                                        {profile.active && isActive && (
                                            <div className={styles.roleDescWrap}>
                                                {rc.key === 'lookingForJob' && (
                                                    <div className={styles.roleField}>
                                                        <label className={styles.formLabel}>Специализация</label>
                                                        <select className={styles.formInput} value={profile.specializationId || ''}
                                                                onChange={e => updateRoleProfile(rc.key, { specializationId: e.target.value ? Number(e.target.value) : null })}>
                                                            <option value="">Выберите специализацию</option>
                                                            {specializations.map(spec => (
                                                                <option key={spec.id} value={spec.id}>{spec.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                                {rc.hasDomains && (
                                                    <div className={styles.roleField}>
                                                        <label className={styles.formLabel}>Области</label>
                                                        <div className={styles.areaChips}>
                                                            {domains.map(domain => {
                                                                const selected = (profile.domainIds || []).includes(domain.id);
                                                                return (
                                                                    <button key={domain.id} type="button"
                                                                            className={`${styles.areaChip} ${selected ? styles.areaChipSelected : ''}`}
                                                                            onClick={() => toggleDomain(domain.id, rc.key)}>
                                                                        {domain.name}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                                <textarea className={styles.formTextarea} value={profile.about}
                                                          onChange={e => updateRoleProfile(rc.key, { about: e.target.value })}
                                                          placeholder={rc.placeholder} rows={3}/>
                                                <div className={styles.roleActions}>
                                                    <button className={styles.primaryBtn} onClick={() => handleSaveRole(rc.key)}>
                                                        <i className="fas fa-save"></i> Сохранить
                                                    </button>
                                                    <button className={styles.cancelBtn} onClick={() => handleCancelRole(rc.key)}>Отмена</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}><i className="fas fa-lock"></i><h2>Смена пароля</h2></div>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Текущий пароль</label>
                                <input type="password" className={styles.formInput} value={currentPassword}
                                       onChange={e => setCurrentPassword(e.target.value)} placeholder="Введите текущий пароль"/>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Новый пароль</label>
                                <input type="password" className={styles.formInput} value={newPassword}
                                       onChange={e => setNewPassword(e.target.value)} placeholder="Введите новый пароль"/>
                            </div>
                        </div>
                        <button className={styles.primaryBtn} onClick={handleChangePassword}>
                            <i className="fas fa-key"></i> Сменить пароль
                        </button>
                        {passwordChangeFeedback && (
                            <div className={passwordChangeFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
                                <i className={`fas ${passwordChangeFeedback.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                                {passwordChangeFeedback.message}
                            </div>
                        )}
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}><i className="fas fa-cog"></i><h2>Действия</h2></div>
                        <div className={styles.actionsRow}>
                            <button className={styles.logoutBtn} onClick={handleLogout}>
                                <i className="fas fa-sign-out-alt"></i> Выйти из аккаунта
                            </button>
                            <button className={styles.deleteBtn} onClick={() => setIsModalOpen(true)}>
                                <i className="fas fa-trash-alt"></i> Удалить аккаунт
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalIcon}><i className="fas fa-exclamation-triangle"></i></div>
                        <h3 className={styles.modalTitle}>Удаление аккаунта</h3>
                        <p className={styles.modalText}>Вы уверены, что хотите удалить аккаунт? Это действие невозможно отменить.</p>
                        <div className={styles.modalActions}>
                            <button className={styles.modalCancel} onClick={() => setIsModalOpen(false)}>Отмена</button>
                            <button className={styles.modalConfirm} onClick={handleDeleteAccount}>
                                <i className="fas fa-trash-alt"></i> Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default PersonalMemberAccount;
