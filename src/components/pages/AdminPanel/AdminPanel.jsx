import React, {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminPanel.module.css";
import {Helmet} from "react-helmet";
import config from "../../../config";

const AdminPanel = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [moderators, setModerators] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteId, setDeleteId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newModerator, setNewModerator] = useState({
        name: "",
        username: "",
        password: "",
        employeeId: ""
    });
    const [editModerator, setEditModerator] = useState({
        id: null,
        name: "",
        username: "",
        password: "",
        employeeId: ""
    });

    const fetchModerators = () => {
        fetch(`${config.USER_SERVICE}/moderators`)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        setModerators([]);
                    }
                    throw new Error("Failed to fetch moderators");
                }
                return response.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setModerators(data);
                } else {
                    throw new Error("Data is not an array");
                }
            })
            .catch(error => console.error("Fetch error:", error));
    };

    useEffect(() => {
        const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
        const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

        // Проверка роли пользователя
        fetch(`${config.USER_SERVICE}/users/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationToken
            },
        })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error('Failed to fetch user role');
                }
                return response.json();
            })
            .then(data => {
                console.log('User data:', data);
                if (data.role !== 'ADMIN') {
                    console.log('User is not admin, redirecting...');
                    navigate('/');
                    return;
                }
                console.log('User is admin, loading moderators...');
                setIsLoading(false);
                fetchModerators();
            })
            .catch(error => {
                console.error('Error fetching user role:', error);
                navigate('/');
            });
    }, [navigate]);

    if (isLoading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    const searchModerators = () => {
        fetch(`${config.USER_SERVICE}/moderators/search-by-username?username=${searchQuery}`)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        setModerators([]);
                    }
                    throw new Error("Failed to search moderators");
                }
                return response.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setModerators(data);
                } else {
                    throw new Error("Data is not an array");
                }
            })
            .catch(error => console.error("Search error:", error));
    };

    const deleteModerator = (id) => {
        fetch(`${config.USER_SERVICE}/moderators/${id}`, {
            method: "DELETE"
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to delete moderator");
                }
                fetchModerators(); // Refresh the list of moderators
            })
            .catch(error => console.error("Delete error:", error));
    };

    const createModerator = (newModerator) => {
        fetch(`${config.USER_SERVICE}/moderators`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newModerator)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to create moderator");
                }
                fetchModerators();
            })
            .catch(error => console.error("Create error:", error));
    };

    const updateModerator = (editModerator) => {
        fetch(`${config.USER_SERVICE}/moderators/${editModerator.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(editModerator)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to update moderator");
                }
                fetchModerators();
            })
            .catch(error => console.error("Update error:", error));
    };

    const handleDeleteButtonClick = (id) => {
        setDeleteId(id);
        setIsModalOpen(true);
    };

    const handleConfirmDelete = () => {
        deleteModerator(deleteId);
        setIsModalOpen(false);
    };

    const handleCancelDelete = () => {
        setIsModalOpen(false);
    };

    const handleCreateButtonClick = () => {
        setNewModerator({
            name: "",
            username: "",
            password: "",
            employeeId: ""
        });
        setIsCreateModalOpen(true);
    };

    const handleCreateModerator = () => {
        createModerator(newModerator);
        setIsCreateModalOpen(false);
    };

    const handleCancelCreate = () => {
        setIsCreateModalOpen(false);
    };

    const handleEditButtonClick = (moderator) => {
        setEditModerator({
            id: moderator.id,
            name: moderator.name,
            username: moderator.username,
            password: "",
            employeeId: moderator.employeeId
        });
        setIsEditModalOpen(true);
    };

    const handleEditModerator = () => {
        updateModerator(editModerator);
        setIsEditModalOpen(false);
    };

    const handleCancelEdit = () => {
        setIsEditModalOpen(false);
    };

    const handleLogout = () => {
        document.cookie = 'Authorization=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        navigate('/');
    };

    return (
        <div className={styles.adminPanelContainer}>
            <Helmet>
                <title>Панель администратора - StartHub</title>
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            <div className={styles.adminPanel}>
                <div className={styles.headerContainer}>
                    <h2>Список модераторов</h2>
                    <div className={styles.searchBar}>
                        <input
                            type="text"
                            id="searchInput"
                            placeholder="Введите имя пользователя"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        <button onClick={searchModerators} className={styles.button}>Найти</button>
                    </div>
                    <button className={styles.logoutButton} onClick={handleLogout}>
                        Выйти
                    </button>
                </div>
                <div className={styles.moderatorsListContainer}>
                    <div className={styles.moderatorsList}>
                        {Array.isArray(moderators) && moderators.length === 0 ? (
                            <div className={styles.emptyModerators}>
                                Не найдено ни одного модератора
                            </div>
                        ) : (
                            Array.isArray(moderators) && moderators.map(moderator => (
                                <div key={moderator.id} className={styles.moderator}>
                                    <div className={styles.moderatorInfo}>
                                        <div className={styles.info}>ID пользователя: <span
                                            className={styles.value}>{moderator.id}</span></div>
                                        <div className={styles.info}>Имя пользователя: <span
                                            className={styles.value}>{moderator.username}</span></div>
                                        <div className={styles.info}>Номер сотрудника: <span
                                            className={styles.value}>{moderator.employeeId}</span></div>
                                    </div>
                                    <div className={styles.actions}>
                                        <button className={styles.editButton}
                                                onClick={() => handleEditButtonClick(moderator)}>Изменить
                                        </button>
                                        <button className={styles.deleteButton}
                                                onClick={() => handleDeleteButtonClick(moderator.id)}>Удалить
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className={styles.footerContainer}>
                    <button className={`${styles.button} ${styles.createButton}`}
                            onClick={handleCreateButtonClick}>Создать модератора
                    </button>
                </div>
            </div>

            {isModalOpen && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3 className={styles.modalTitle}>Удаление модератора</h3>
                        <p>Вы уверены, что хотите удалить этого модератора?</p>
                        <div>
                            <button className={`${styles.button} ${styles.confirmDeleteButton}`} onClick={handleConfirmDelete}>
                                Удалить
                            </button>
                            <button className={`${styles.button} ${styles.cancelButton}`} onClick={handleCancelDelete}>
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCreateModalOpen && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3 className={styles.modalTitle}>Создание модератора</h3>
                        <div className={styles.modalForm}>
                            <div className={styles.modalFormGroup}>
                                <label className={styles.modalLabel}>Имя сотрудника:</label>
                                <input
                                    type="text"
                                    className={styles.modalInput}
                                    value={newModerator.name}
                                    onChange={(e) => setNewModerator({...newModerator, name: e.target.value})}
                                />
                            </div>
                            <div className={styles.modalFormGroup}>
                                <label className={styles.modalLabel}>Логин:</label>
                                <input
                                    type="text"
                                    className={styles.modalInput}
                                    value={newModerator.username}
                                    onChange={(e) => setNewModerator({...newModerator, username: e.target.value})}
                                />
                            </div>
                            <div className={styles.modalFormGroup}>
                                <label className={styles.modalLabel}>Пароль:</label>
                                <input
                                    type="password"
                                    className={styles.modalInput}
                                    value={newModerator.password}
                                    onChange={(e) => setNewModerator({...newModerator, password: e.target.value})}
                                />
                            </div>
                            <div className={styles.modalFormGroup}>
                                <label className={styles.modalLabel}>ID сотрудника:</label>
                                <input
                                    type="text"
                                    className={styles.modalInput}
                                    value={newModerator.employeeId}
                                    onChange={(e) => setNewModerator({...newModerator, employeeId: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <button className={`${styles.button} ${styles.confirmCreateButton}`} onClick={handleCreateModerator}>
                                Создать
                            </button>
                            <button className={`${styles.button} ${styles.cancelButton}`} onClick={handleCancelCreate}>
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditModalOpen && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3 className={styles.modalTitle}>Редактирование модератора</h3>
                        <div className={styles.modalForm}>
                            <div className={styles.modalFormGroup}>
                                <label className={styles.modalLabel}>Имя</label>
                                <input
                                    type="text"
                                    className={styles.modalInput}
                                    value={editModerator.name}
                                    onChange={(e) => setEditModerator({...editModerator, name: e.target.value})}
                                />
                            </div>
                            <div className={styles.modalFormGroup}>
                                <label className={styles.modalLabel}>Логин</label>
                                <input
                                    type="text"
                                    className={styles.modalInput}
                                    value={editModerator.username}
                                    onChange={(e) => setEditModerator({...editModerator, username: e.target.value})}
                                />
                            </div>
                            <div className={styles.modalFormGroup}>
                                <label className={styles.modalLabel}>Пароль</label>
                                <input
                                    type="password"
                                    className={styles.modalInput}
                                    value={editModerator.password}
                                    onChange={(e) => setEditModerator({...editModerator, password: e.target.value})}
                                />
                            </div>
                            <div className={styles.modalFormGroup}>
                                <label className={styles.modalLabel}>ID сотрудника</label>
                                <input
                                    type="text"
                                    className={styles.modalInput}
                                    value={editModerator.employeeId}
                                    onChange={(e) => setEditModerator({...editModerator, employeeId: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <button className={`${styles.button} ${styles.confirmCreateButton}`} onClick={handleEditModerator}>
                                Сохранить
                            </button>
                            <button className={`${styles.button} ${styles.cancelButton}`} onClick={handleCancelEdit}>
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
