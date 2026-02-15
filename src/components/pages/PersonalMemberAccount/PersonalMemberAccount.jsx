import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from './PersonalMemberAccount.module.css';
import Menu from '../../menu/Menu';
import {Helmet} from "react-helmet";
import config from '../../../config';

function PersonalMemberAccount() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const accessTokenCookie = document.cookie.split('; ').find(row => row.startsWith('accessToken='));
    const accessToken = accessTokenCookie ? accessTokenCookie.split('=')[1] : '';
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [birthday, setBirthday] = useState('');
    const [username, setUsername] = useState('');
    const [avatar, setAvatar] = useState('');
    const [about, setAbout] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [profileHiddenFlag, setProfileHiddenFlag] = useState(false);
    const [specializations, setSpecializations] = useState([]);
    const [profileError, setProfileError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [passwordChangeFeedback, setPasswordChangeFeedback] = useState(null);
    const passwordFeedbackTimeoutRef = useRef(null);

    useEffect(() => {
        fetch(`${config.USER_SERVICE}/members/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': accessToken ? `Bearer ${accessToken}` : '',
            },
        })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error('Не удалось загрузить профиль');
                }
                return response.json();
            })
            .then(data => {
                setName(data.name);
                setPhone(data.phone);
                setEmail(data.email);
                setBirthday(data.birthday);
                setUsername(data.username);
                setAbout(data.about);
                let avatarUrl = data.avatarUrl;
                if (avatarUrl) {
                    avatarUrl = avatarUrl.replace(/\\/g, '/');
                }
                setAvatar(avatarUrl || '');
                setProfileHiddenFlag(data.profileHiddenFlag);

                const spec = specializations.find(s => s.name === data.specialization);
                setSpecialization(spec ? spec.id : null);

                setIsLoading(false);
            })
            .catch(error => {
                console.error('Fetch error:', error);
                setProfileError(error.message);
                setIsLoading(false);
            });
    }, [accessToken, specializations]);

    useEffect(() => {
        return () => {
            if (passwordFeedbackTimeoutRef.current) {
                clearTimeout(passwordFeedbackTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        fetch(`${config.USER_SERVICE}/member-specializations`, {
            method: 'GET', headers: {
                'Content-Type': 'application/json', 'Authorization': accessToken ? `Bearer ${accessToken}` : '',
            },
        })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error('Failed to fetch specializations');
                }
                return response.json();
            })
            .then(data => {
                setSpecializations(data);
            })
            .catch(error => console.error('Fetch error:', error));
    }, [accessToken]);

    const handleProfileHiddenChange = (event) => {
        const newProfileHiddenFlag = event.target.checked;
        setProfileHiddenFlag(newProfileHiddenFlag);
        const requestBody = JSON.stringify({profileHiddenFlag: newProfileHiddenFlag});
        fetch(`${config.USER_SERVICE}/members/me/profile-hidden-flag`, {
            method: 'PATCH', headers: {
                'Content-Type': 'application/json', 'Authorization': accessToken ? `Bearer ${accessToken}` : '',
            }, body: requestBody,
        })
            .then(response => {
                if (response.status !== 200) {
                    return response.json().then(error => {
                        throw new Error(error.errorMessage || 'Failed to change profile visibility');
                    });
                }
            })
            .catch(error => console.error('Visibility update error:', error));
    };

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSave = () => {
        if (!isValidEmail(email)) {
            alert('Пожалуйста, введите корректный email.');
            return;
        }

        fetch(`${config.USER_SERVICE}/members/me`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': accessToken ? `Bearer ${accessToken}` : ''
            },
            body: JSON.stringify({
                name: name,
                phone: phone,
                email: email,
                birthday: birthday,
                specializationId: specialization || null,
                about: about,
                profileHiddenFlag: profileHiddenFlag
            }),
        })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error('Failed to update personal information');
                }
                alert('Данные профиля были успешно изменены!');
            })
            .catch(error => console.error('Update error:', error));
    };

    const handleLogout = () => {
        document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure'; document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure';
        navigate('/');
    };

    const showPasswordFeedback = (message, type) => {
        if (passwordFeedbackTimeoutRef.current) {
            clearTimeout(passwordFeedbackTimeoutRef.current);
        }
        setPasswordChangeFeedback({message, type});
        passwordFeedbackTimeoutRef.current = setTimeout(() => {
            setPasswordChangeFeedback(null);
            passwordFeedbackTimeoutRef.current = null;
        }, 3000);
    };

    const handleChangePassword = () => {
        fetch(`${config.USER_SERVICE}/members/me/password`, {
            method: 'PATCH', headers: {
                'Content-Type': 'application/json', 'Authorization': accessToken ? `Bearer ${accessToken}` : '',
            }, body: JSON.stringify({
                currentPassword: currentPassword, newPassword: newPassword,
            }),
        })
            .then(response => {
                if (response.status !== 200) {
                    return response.json().then(body => {
                        throw new Error(body?.message || body?.errorMessage || 'Не удалось сменить пароль');
                    }).catch(e => {
                        if (e.message) throw e;
                        throw new Error('Не удалось сменить пароль');
                    });
                }
                setCurrentPassword('');
                setNewPassword('');
                showPasswordFeedback('Пароль успешно изменён', 'success');
            })
            .catch(error => {
                console.error('Change password error:', error);
                showPasswordFeedback(error?.message || 'Не удалось сменить пароль. Проверьте текущий пароль.', 'error');
            });
    };

    const handleDeleteAccount = () => {
        fetch(`${config.USER_SERVICE}/members/me`, {
            method: 'DELETE', headers: {
                'Content-Type': 'application/json', 'Authorization': accessToken ? `Bearer ${accessToken}` : ''
            },
        })
            .then(response => {
                if (response.status !== 204) {
                    throw new Error('Failed to delete account');
                }
                navigate('/');
            })
            .catch(error => console.error('Delete error:', error));
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
            setAvatar(URL.createObjectURL(file));
            handleSubmitUpload(file);
        } else {
            alert('Выберите изображение формата JPG или PNG.');
        }
    };

    const handleSubmitUpload = (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const headers = accessToken ? {'Authorization': `Bearer ${accessToken}`} : {};
        fetch(`${config.USER_SERVICE}/members/me/avatar`, {
            method: 'PATCH', headers, body: formData,
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to upload avatar');
                }
                if (response.status === 204) {
                    return null;
                }
                return response.json();
            })
            .then(data => {
                if (!data) {
                    window.location.reload();
                    return;
                }
                const rawUrl = data.avatarUrl || data.url;
                if (!rawUrl) {
                    window.location.reload();
                    return;
                }
                let normalizedUrl = rawUrl.replace(/\\/g, '/');
                normalizedUrl += (normalizedUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
                setAvatar(normalizedUrl);
            })
            .catch(error => {
                console.error('Upload error:', error);
            });
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    if (isLoading) {
        return (
            <>
                <Helmet>
                    <title>Личный кабинет — StartHub</title>
                    <body className={styles.body}/>
                </Helmet>
                <Menu/>
                <div className={styles.page}>
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Загрузка профиля...</p>
                    </div>
                </div>
            </>
        );
    }

    if (profileError) {
        return (
            <>
                <Helmet>
                    <title>Личный кабинет — StartHub</title>
                    <body className={styles.body}/>
                </Helmet>
                <Menu/>
                <div className={styles.page}>
                    <div className={styles.errorState}>
                        <i className="fas fa-exclamation-triangle"></i>
                        <p>Не удалось загрузить профиль</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Helmet>
                <title>Личный кабинет — StartHub</title>
                <body className={styles.body}/>
            </Helmet>
            <Menu/>
            <div className={styles.page}>
                <div className={styles.container}>
                    {/* Header Card */}
                    <div className={styles.headerCard}>
                        <div className={styles.avatarBlock}>
                            <img
                                src={avatar ? avatar : '/default_user_avatar.jpg'}
                                alt="User Avatar"
                                onError={e => {
                                    e.target.onerror = null;
                                    e.target.src = '/default_user_avatar.jpg';
                                }}
                                className={styles.avatar}
                            />
                            <input type="file" onChange={handleFileUpload} ref={fileInputRef}
                                   style={{display: 'none'}} accept="image/jpeg,image/png"/>
                            <button className={styles.uploadBtn} onClick={handleUploadClick}>
                                <i className="fas fa-camera"></i> Загрузить фото
                            </button>
                        </div>
                        <div className={styles.headerInfo}>
                            <h1 className={styles.usernameTitle}>{username}</h1>
                            <div className={styles.hideToggle}>
                                <label className={styles.toggleLabel}>
                                    <input
                                        type="checkbox"
                                        checked={profileHiddenFlag}
                                        onChange={handleProfileHiddenChange}
                                        className={styles.toggleInput}
                                    />
                                    <span className={styles.toggleSwitch}></span>
                                    <span className={styles.toggleText}>Скрыть профиль</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Personal Info Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <i className="fas fa-user-edit"></i>
                            <h2>Личная информация</h2>
                        </div>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Имя</label>
                                <input type="text" className={styles.formInput} value={name}
                                       onChange={(e) => setName(e.target.value)} placeholder="Введите имя"/>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Телефон</label>
                                <input type="text" className={styles.formInput} value={phone}
                                       onChange={(e) => setPhone(e.target.value)} placeholder="+7 (999) 999-99-99"/>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Email</label>
                                <input type="email" className={styles.formInput} value={email}
                                       onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com"/>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Дата рождения</label>
                                <input type="date" className={styles.formInput} value={birthday}
                                       onChange={(e) => setBirthday(e.target.value)}/>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Специализация</label>
                                <select
                                    className={styles.formInput}
                                    value={specialization || ''}
                                    onChange={e => setSpecialization(e.target.value ? Number(e.target.value) : null)}
                                >
                                    <option value="">Выберите специализацию</option>
                                    {specializations.map(spec => (
                                        <option key={spec.id} value={spec.id}>{spec.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                <label className={styles.formLabel}>О себе</label>
                                <textarea className={styles.formTextarea} value={about}
                                          onChange={(e) => setAbout(e.target.value)}
                                          placeholder="Расскажите о себе..." rows={4}/>
                            </div>
                        </div>
                        <button className={styles.primaryBtn} onClick={handleSave}>
                            <i className="fas fa-save"></i> Сохранить изменения
                        </button>
                    </div>

                    {/* Password Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <i className="fas fa-lock"></i>
                            <h2>Смена пароля</h2>
                        </div>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Текущий пароль</label>
                                <input type="password" className={styles.formInput} value={currentPassword}
                                       onChange={(e) => setCurrentPassword(e.target.value)}
                                       placeholder="Введите текущий пароль"/>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Новый пароль</label>
                                <input type="password" className={styles.formInput} value={newPassword}
                                       onChange={(e) => setNewPassword(e.target.value)}
                                       placeholder="Введите новый пароль"/>
                            </div>
                        </div>
                        <button className={styles.primaryBtn} onClick={handleChangePassword}>
                            <i className="fas fa-key"></i> Сменить пароль
                        </button>
                        {passwordChangeFeedback && (
                            <div
                                className={
                                    passwordChangeFeedback.type === 'success'
                                        ? styles.feedbackSuccess
                                        : styles.feedbackError
                                }
                            >
                                <i className={`fas ${passwordChangeFeedback.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                                {passwordChangeFeedback.message}
                            </div>
                        )}
                    </div>

                    {/* Actions Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <i className="fas fa-cog"></i>
                            <h2>Действия</h2>
                        </div>
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

            {/* Delete Confirmation Modal */}
            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalIcon}>
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3 className={styles.modalTitle}>Удаление аккаунта</h3>
                        <p className={styles.modalText}>
                            Вы уверены, что хотите удалить аккаунт? Это действие невозможно отменить.
                        </p>
                        <div className={styles.modalActions}>
                            <button className={styles.modalCancel} onClick={() => setIsModalOpen(false)}>
                                Отмена
                            </button>
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
