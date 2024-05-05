import React, {useState, useEffect} from 'react';
import {Helmet} from 'react-helmet';
import '../Global.css';
import './ChangePasswordPage.css';
import {useLocation, useNavigate} from 'react-router-dom';

const PasswordChangePage = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [token, setToken] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!newPassword || !confirmNewPassword) {
            alert('Пожалуйста, заполните все поля для ввода пароля.');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            alert('Пароли не совпадают.');
            return;
        }

        const data = {
            newPassword,
            token
        };

        try {
            const response = await fetch('http://localhost:8081/api/v1/users/member/password_recovery/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const responseData = await response.json();
            console.log('Success:', responseData);
            alert('Ваш пароль успешно изменён.');
        } catch (error) {
            console.error('Error:', error);
            alert('Произошла ошибка при изменении пароля.');
        }
    };

    const redirectToAuthorization = () => {
        navigate('/');
    };

    return (
        <div>
            <Helmet>
                <title>Изменение пароля</title>
            </Helmet>
            <img src="/logo.png" alt="Логотип компании" id="logo"/>
            <div className="form-container">
                <div className="wrapper">
                    <div className="title">
                        Восстановление пароля
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="field">
                            <input type="password" id="new-password" name="new-password" value={newPassword}
                                   onChange={(e) => setNewPassword(e.target.value)} required/>
                            <label htmlFor="new-password">Новый пароль</label>
                        </div>
                        <div className="field">
                            <input type="password" id="confirm-new-password" name="confirm-new-password"
                                   value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
                                   required/>
                            <label htmlFor="confirm-new-password">Подтверждение пароля</label>
                        </div>
                        <div className="field">
                            <input type="submit" value="Восстановить пароль"/>
                        </div>
                        <div className="signup-link">
                            Перейти к <button className="login-link"
                                              onClick={redirectToAuthorization}>Авторизации</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PasswordChangePage;
