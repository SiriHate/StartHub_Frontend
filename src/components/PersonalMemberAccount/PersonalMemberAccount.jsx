import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PersonalMemberAccount.module.css';
import NavigationBar from '../NavigationBar/NavigationBar';
import {Helmet} from "react-helmet";

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

    useEffect(() => {
        fetch('http://localhost:8081/api/v1/users/member/personInfo', {
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
                setUsername(data.username);
                setAbout(data.about)
                if (data.avatar) {
                    const avatarSrc = `data:image/jpeg;base64,${data.avatar}`;
                    setAvatar(avatarSrc);
                } else {
                    setAvatar("/default_avatar.jpg");
                }
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

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSave = () => {
        if (!isValidEmail(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        fetch('http://localhost:8081/api/v1/users/member/change_personal_info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationToken ? `${authorizationToken}` : ''
            },
            body: JSON.stringify({
                name: name,
                phone: phone,
                email: email,
                birthday: birthday,
                about: about
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

        fetch('http://localhost:8081/api/v1/users/member/change_password', {
            method: 'POST',
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
        fetch('http://localhost:8081/api/v1/users/member/delete_my_account', {
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
        formData.append('avatar', file);

        fetch('http://localhost:8081/api/v1/users/member/change_avatar', {
            method: 'POST',
            headers: {
                'Authorization': authorizationToken ? `${authorizationToken}` : ''
            },
            body: formData,
        })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error('Failed to upload photo');
                }
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return response.json();
                } else {
                    return response.text();
                }
            })
            .then(data => {
                console.log('Upload success:', data);
                window.location.reload();
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

    return (
        <div className={styles.profilePage}>
            <Helmet>
                <title>Личный кабинет</title>
            </Helmet>
            <NavigationBar/>
            <div className={styles.profileCard}>
                <div className={styles.profileCardHeader}>
                    <img src={avatar} alt="User Avatar" className={styles.avatar}/>
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
                        <button className={styles.deleteAccountBtn} onClick={handleOpenDeleteModal}>Удалить аккаунт</button>
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