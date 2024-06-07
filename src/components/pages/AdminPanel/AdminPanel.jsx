import React, { useEffect, useState } from "react";
import styles from "./AdminPanel.module.css";
import { Helmet } from "react-helmet";
import config from "../../../config";

const AdminPanel = () => {
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

    useEffect(() => {
        fetchModerators();
    }, []);

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
            method: "PUT",
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

    return (
        <div className={styles.adminPanelContainer}>
            <Helmet>
                <title>Панель администратора</title>
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
                                                onClick={() => handleEditButtonClick(moderator)}>Изменить</button>
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
                    <button className={`${styles.button} ${styles.createButton}`} onClick={handleCreateButtonClick}>Создать модератора</button>
                </div>
            </div>

            {isModalOpen && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <p>Вы уверены, что хотите удалить модератора?</p>
                        <div>
                            <button className={`${styles.button} ${styles.confirmDeleteButton}`}
                                    onClick={handleConfirmDelete}>Удалить
                            </button>
                            <button className={`${styles.button} ${styles.cancelButton}`}
                                    onClick={handleCancelDelete}>Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCreateModalOpen && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalTitle}>Создать модератора</div>
                        <label className={styles.modalLabel}>Имя сотрудника</label>
                        <input
                            type="text"
                            value={newModerator.name}
                            onChange={(e) => setNewModerator({...newModerator, name: e.target.value})}
                            className={styles.modalInput}
                        />
                        <label className={styles.modalLabel}>Имя пользователя</label>
                        <input
                            type="text"
                            value={newModerator.username}
                            onChange={(e) => setNewModerator({...newModerator, username: e.target.value})}
                            className={styles.modalInput}
                        />
                        <label className={styles.modalLabel}>Пароль</label>
                        <input
                            type="password"
                            value={newModerator.password}
                            onChange={(e) => setNewModerator({...newModerator, password: e.target.value})}
                            className={styles.modalInput}
                        />
                        <label className={styles.modalLabel}>Номер сотрудника</label>
                        <input
                            type="text"
                            value={newModerator.employeeId}
                            onChange={(e) => setNewModerator({...newModerator, employeeId: e.target.value})}
                            className={styles.modalInput}
                        />
                        <div>
                            <button className={`${styles.button} ${styles.confirmCreateButton}`}
                                    onClick={handleCreateModerator}>Создать
                            </button>
                            <button className={`${styles.button} ${styles.cancelButton}`}
                                    onClick={handleCancelCreate}>Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditModalOpen && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalTitle}>Изменить модератора</div>
                        <label className={styles.modalLabel}>Имя сотрудника</label>
                        <input
                            type="text"
                            value={editModerator.name}
                            onChange={(e) => setEditModerator({...editModerator, name: e.target.value})}
                            className={styles.modalInput}
                        />
                        <label className={styles.modalLabel}>Имя пользователя</label>
                        <input
                            type="text"
                            value={editModerator.username}
                            onChange={(e) => setEditModerator({...editModerator, username: e.target.value})}
                            className={styles.modalInput}
                        />
                        <label className={styles.modalLabel}>Пароль</label>
                        <input
                            type="password"
                            value={editModerator.password}
                            onChange={(e) => setEditModerator({...editModerator, password: e.target.value})}
                            className={styles.modalInput}
                        />
                        <label className={styles.modalLabel}>Номер сотрудника</label>
                        <input
                            type="text"
                            value={editModerator.employeeId}
                            onChange={(e) => setEditModerator({...editModerator, employeeId: e.target.value})}
                            className={styles.modalInput}
                        />
                        <div>
                            <button className={`${styles.button} ${styles.confirmCreateButton}`}
                                    onClick={handleEditModerator}>Изменить
                            </button>
                            <button className={`${styles.button} ${styles.cancelButton}`}
                                    onClick={handleCancelEdit}>Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
