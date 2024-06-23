import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PersonalMemberAccount.module.css';
import NavigationBar from '../../navigation_bar/NavigationBar';
import { Helmet } from "react-helmet";
import config from '../../../config';

function PersonalMemberAccount() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';
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

    useEffect(() => {
        fetch(`${config.USER_SERVICE}/members/me/personal_info`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationToken ? `${authorizationToken}` : '',
            },
        })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error('Failed to fetch personal information');
                }
                return response.json();
            })
            .then(data => {
                setName(data.name);
                setPhone(data.phone);
                setEmail(data.email);
                setBirthday(data.birthday);
                setSpecialization(data.specializationId);
                setUsername(data.username);
                setAbout(data.about);
                setAvatar(`${config.FILE_SERVER}${data.avatarUrl}` || "/default_user_avatar.jpg");
                setProfileHiddenFlag(data.profileHiddenFlag);
            })
            .catch(error => console.error('Fetch error:', error));
    }, [authorizationToken]);

    useEffect(() => {
        fetch(`${config.USER_SERVICE}/specialist_specializations`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationToken ? `${authorizationToken}` : '',
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
    }, [authorizationToken]);

    const handleAboutChange = (event) => {
        setAbout(event.target.value);
    };

    const handleNameChange = (event) => {
        setName(event.target.value);
    };

    const handlePhoneChange = (event) => {
        setPhone(event.target.value);
    };

    const handleEmailChange = (event) => {
        setEmail(event.target.value);
    };

    const handleBirthdayChange = (event) => {
        setBirthday(event.target.value);
    };

    const handleProfileHiddenChange = (event) => {
        const newProfileHiddenFlag = event.target.checked;
        setProfileHiddenFlag(newProfileHiddenFlag);

        const requestBody = JSON.stringify({
            profileHiddenFlag: newProfileHiddenFlag
        });

        fetch(`${config.USER_SERVICE}/members/me/profile_hidden_flag`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationToken ? `${authorizationToken}` : '',
            },
            body: requestBody,
        })
            .then(response => {
                if (response.status !== 200) {
                    return response.json().then(error => {
                        throw new Error(error.errorMessage || 'Failed to change profile visibility');
                    });
                }
                alert('Profile visibility updated successfully.');
            })
            .catch(error => console.error('Visibility update error:', error));
    };

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSave = () => {
        if (!isValidEmail(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        fetch(`${config.USER_SERVICE}/members/me/personal_info`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationToken ? `${authorizationToken}` : ''
            },
            body: JSON.stringify({
                name: name,
                phone: phone,
                email: email,
                birthday: birthday,
                specializationId: Number(specialization),
                about: about,
                profileHiddenFlag: profileHiddenFlag
            }),
        })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error('Failed to update personal information');
                }
                alert('Personal information updated successfully.');
            })
            .catch(error => console.error('Update error:', error));
    };

    const handleLogout = () => {
        document.cookie = 'Authorization=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        navigate('/');
    };

    const handleCurrentPasswordChange = (event) => {
        setCurrentPassword(event.target.value);
    };

    const handleNewPasswordChange = (event) => {
        setNewPassword(event.target.value);
    };

    const handleChangePassword = () => {
        if (newPassword.length < 8) {
            alert('The new password must be at least 8 characters long.');
            return;
        }

        fetch(`${config.USER_SERVICE}/members/me/password`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationToken ? `${authorizationToken}` : '',
                'Cache-Control': 'public'
            },
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword,
            }),
            credentials: 'include'
        })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error('Failed to change password');
                }
                alert('Password changed successfully.');
            })
            .catch(error => console.error('Change password error:', error));
    };

    const handleDeleteAccount = () => {
        fetch(`${config.USER_SERVICE}/members/me`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationToken ? `${authorizationToken}` : ''
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

    const handleCancelDelete = () => {
        setIsModalOpen(false);
    };

    const handleOpenDeleteModal = () => {
        setIsModalOpen(true);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
            setSelectedFile(file);
            handleSubmitUpload(file);
        } else {
            alert('Please select a JPG or PNG image.');
        }
    };

    const handleSubmitUpload = (file) => {
        const formData = new FormData();
        formData.append('file', file);

        fetch(`${config.FILE_SERVER}/members/me/avatar`, {
            method: 'POST',
            body: formData,
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to upload photo');
                }
                return response.json();
            })
            .then(data => {
                const avatarUrl = data.url;
                console.log('Upload success:', avatarUrl);
                return sendAvatarUrlToBackend(avatarUrl);
            })
            .catch(error => {
                console.error('Upload error:', error);
            });
    };

    const sendAvatarUrlToBackend = (avatarUrl) => {
        fetch(`${config.USER_SERVICE}/members/me/avatar`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationToken ? ` ${authorizationToken}` : ''
            },
            body: JSON.stringify({ avatarUrl: avatarUrl })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update avatar URL');
                }
                return response.json();
            })
            .then(data => {
                console.log('Avatar URL update success:', data);
                window.location.reload();
            })
            .catch(error => {
                console.error('Error updating avatar URL:', error);
            });
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className={styles.profilePage}>
            <Helmet>
                <title>Личный кабинет</title>
            </Helmet>
            <NavigationBar />
            <div className={styles.profileCard}>
                <div className={styles.profileCardHeader}>
                    <div className={styles.hideProfileWrapper}>
                        <span className={styles.label}>Скрыть профиль</span>
                        <input
                            type="checkbox"
                            className={styles.infoInput}
                            checked={profileHiddenFlag}
                            onChange={handleProfileHiddenChange}
                        />
                    </div>
                    <img src={`${avatar}`} alt="User Avatar" className={styles.avatar}/>
                    <input
                        type="file"
                        className={styles.uploadInput}
                        onChange={handleFileUpload}
                        ref={fileInputRef}
                        style={{display: 'none'}}
                    />
                    <div className={styles.username}>{username}</div>
                    <button
                        className={styles.uploadBtn}
                        onClick={handleUploadClick}>
                        Загрузить фото
                    </button>
                </div>
                <div className={styles.infoSection}>
                    <div className={styles.infoItem}>
                        <span className={styles.label}>Имя:</span>
                        <input
                            type="text"
                            className={styles.infoInput}
                            value={name}
                            onChange={handleNameChange}
                        />
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.label}>Телефон:</span>
                        <input
                            type="text"
                            className={styles.infoInput}
                            value={phone}
                            onChange={handlePhoneChange}
                        />
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.label}>Email:</span>
                        <input
                            type="email"
                            className={styles.infoInput}
                            value={email}
                            onChange={handleEmailChange}
                        />
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.label}>Дата рождения:</span>
                        <input
                            type="date"
                            className={styles.infoInput}
                            value={birthday}
                            onChange={handleBirthdayChange}
                        />
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.label}>Специализация:</span>
                        <select
                            className={styles.infoInput}
                            value={specialization}
                            onChange={e => setSpecialization(e.target.value)}
                        >
                            <option value="">Выберите специализацию</option>
                            {specializations.map(spec => (
                                <option key={spec.id} value={spec.id}>{spec.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.label}>О себе:</span>
                        <textarea
                            className={styles.infoInputTextArea}
                            value={about}
                            onChange={handleAboutChange}
                            placeholder="Расскажите о себе..."
                        />
                    </div>
                    <button
                        className={styles.editBtn}
                        onClick={handleSave}
                    >
                        Редактировать
                    </button>
                </div>
                <div className={styles.passwordSection}>
                    <div className={styles.passwordItem}>
                        <span className={styles.label}>Текущий пароль:</span>
                        <input
                            type="password"
                            className={styles.passwordInput}
                            value={currentPassword}
                            onChange={handleCurrentPasswordChange}
                        />
                    </div>
                    <div className={styles.passwordItem}>
                        <span className={styles.label}>Новый пароль:</span>
                        <input
                            type="password"
                            className={styles.passwordInput}
                            value={newPassword}
                            onChange={handleNewPasswordChange}
                        />
                    </div>
                    <button
                        className={styles.changePasswordBtn}
                        onClick={handleChangePassword}
                    >
                        Сменить пароль
                    </button>
                </div>
                <div className={styles.actionsSection}>
                    <div className={styles.buttonWrapper}>
                        <button className={styles.logoutBtn} onClick={handleLogout}>Выйти</button>
                        <button className={styles.deleteAccountBtn} onClick={handleOpenDeleteModal}>Удалить аккаунт
                        </button>
                    </div>
                </div>
            </div>
            {isModalOpen && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <p>Вы уверены, что хотите удалить аккаунт?</p>
                        <div>
                            <button className={`${styles.confirmButton} ${styles.confirmButton}`}
                                    onClick={handleDeleteAccount}>Удалить
                            </button>
                            <button className={`${styles.cancelButton} ${styles.cancelButton}`}
                                    onClick={handleCancelDelete}>Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PersonalMemberAccount;
