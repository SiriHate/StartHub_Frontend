import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import styles from "./AdminPanel.module.css";
import {Helmet} from "react-helmet";
import Pagination from "../../pagination/Pagination";
import config from "../../../config";
import apiClient, { clearAuth } from "../../../api/apiClient";

const AdminPanel = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [moderators, setModerators] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [size, setSize] = useState(5);
    const [deleteId, setDeleteId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newModerator, setNewModerator] = useState({ name: "", username: "", password: "", employeeId: "" });
    const [editModerator, setEditModerator] = useState({ id: null, name: "", username: "", password: "", employeeId: "" });

    const fetchModerators = (pageNum, pageSize, usernameQuery) => {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("size", String(pageSize));
        if (usernameQuery) params.set("usernameQuery", usernameQuery);
        apiClient(`${config.USER_SERVICE}/moderators?${params.toString()}`)
            .then(r => { if (!r.ok) { if (r.status === 404) { setModerators([]); setTotalPages(0); } throw new Error(); } return r.json(); })
            .then(data => { setModerators(data.content || []); setTotalPages(data.totalPages ?? 1); })
            .catch(() => {});
    };

    useEffect(() => {
        apiClient(`${config.USER_SERVICE}/users/me`, { headers: { 'Content-Type': 'application/json' } })
            .then(r => { if (r.status !== 200) throw new Error(); return r.json(); })
            .then(data => { if (data.role !== 'ADMIN') { navigate('/'); return; } setIsLoading(false); fetchModerators(0, size, ""); })
            .catch(() => navigate('/'));
    }, [navigate]);

    if (isLoading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.spinner}></div>
                <span>Загрузка...</span>
            </div>
        );
    }

    const searchModerators = () => { setPage(0); fetchModerators(0, size, searchQuery); };
    const deleteModerator = (id) => { apiClient(`${config.USER_SERVICE}/moderators/${id}`, { method: "DELETE" }).then(r => { if (!r.ok) throw new Error(); fetchModerators(page, size, searchQuery); }).catch(() => {}); };
    const createModerator = (m) => { apiClient(`${config.USER_SERVICE}/moderators`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(m) }).then(r => { if (!r.ok) throw new Error(); fetchModerators(page, size, searchQuery); }).catch(() => {}); };
    const updateModerator = (m) => { apiClient(`${config.USER_SERVICE}/moderators/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(m) }).then(r => { if (!r.ok) throw new Error(); fetchModerators(page, size, searchQuery); }).catch(() => {}); };

    const handleLogout = () => { clearAuth(); navigate('/'); };
    const handleNextPage = () => { if (page < totalPages - 1) { setPage(page + 1); fetchModerators(page + 1, size, searchQuery); } };
    const handlePreviousPage = () => { if (page > 0) { setPage(page - 1); fetchModerators(page - 1, size, searchQuery); } };
    const handleSizeChange = (e) => { const s = parseInt(e.target.value, 10); setSize(s); setPage(0); fetchModerators(0, s, searchQuery); };
    const handlePageChange = (p) => { setPage(p); fetchModerators(p, size, searchQuery); };

    return (
        <>
            <Helmet>
                <title>Панель администратора — StartHub</title>
            </Helmet>
            <div className={styles.page}>
                <div className={styles.container}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <i className="fas fa-user-shield"></i>
                            <h1>Панель администратора</h1>
                        </div>
                        <button className={styles.logoutBtn} onClick={handleLogout}>
                            <i className="fas fa-sign-out-alt"></i> Выйти
                        </button>
                    </div>

                    {/* Card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardTitle}>
                                <i className="fas fa-users-cog"></i>
                                <h2>Модераторы</h2>
                                <span className={styles.badge}>{moderators.length}</span>
                            </div>
                            <button className={styles.createBtn} onClick={() => { setNewModerator({ name: "", username: "", password: "", employeeId: "" }); setIsCreateModalOpen(true); }}>
                                <i className="fas fa-plus"></i> Создать
                            </button>
                        </div>

                        {/* Search */}
                        <div className={styles.searchRow}>
                            <div className={styles.searchWrap}>
                                <i className="fas fa-search"></i>
                                <input type="text" placeholder="Поиск по имени пользователя..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchModerators()} />
                            </div>
                            <button className={styles.searchBtn} onClick={searchModerators}>Найти</button>
                        </div>

                        {/* List */}
                        <div className={styles.list}>
                            {moderators.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <i className="fas fa-inbox"></i>
                                    <span>Модераторы не найдены</span>
                                </div>
                            ) : (
                                moderators.map(mod => (
                                    <div key={mod.id} className={styles.listItem}>
                                        <div className={styles.itemBody}>
                                            <div className={styles.itemMain}>
                                                <span className={styles.itemName}>{mod.username}</span>
                                                <span className={styles.itemId}>ID: {mod.id}</span>
                                            </div>
                                            <div className={styles.itemDetails}>
                                                {mod.name && <span><i className="fas fa-id-badge"></i> {mod.name}</span>}
                                                {mod.employeeId && <span><i className="fas fa-hashtag"></i> Сотрудник: {mod.employeeId}</span>}
                                            </div>
                                        </div>
                                        <div className={styles.itemActions}>
                                            <button className={styles.editBtn} onClick={() => { setEditModerator({ id: mod.id, name: mod.name, username: mod.username, password: "", employeeId: mod.employeeId }); setIsEditModalOpen(true); }} title="Изменить">
                                                <i className="fas fa-pen"></i>
                                            </button>
                                            <button className={styles.deleteBtn} onClick={() => { setDeleteId(mod.id); setIsModalOpen(true); }} title="Удалить">
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {(moderators.length > 0 || totalPages > 1) && (
                            <div className={styles.paginationWrap}>
                                <Pagination page={page} totalPages={totalPages > 0 ? totalPages : 1} size={size} onPreviousPage={handlePreviousPage} onNextPage={handleNextPage} onSizeChange={handleSizeChange} onPageChange={handlePageChange} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete modal */}
            {isModalOpen && (
                <div className={styles.overlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalIcon + ' ' + styles.modalDanger}><i className="fas fa-exclamation-triangle"></i></div>
                        <h3>Удаление модератора</h3>
                        <p>Вы уверены, что хотите удалить этого модератора? Это действие нельзя отменить.</p>
                        <div className={styles.modalActions}>
                            <button className={styles.modalCancelBtn} onClick={() => setIsModalOpen(false)}>Отмена</button>
                            <button className={styles.modalDeleteBtn} onClick={() => { deleteModerator(deleteId); setIsModalOpen(false); }}>Удалить</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create modal */}
            {isCreateModalOpen && (
                <div className={styles.overlay} onClick={() => setIsCreateModalOpen(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalIcon}><i className="fas fa-user-plus"></i></div>
                        <h3>Создание модератора</h3>
                        <div className={styles.modalForm}>
                            <div className={styles.fieldGroup}><label>Имя сотрудника</label><input type="text" value={newModerator.name} onChange={(e) => setNewModerator({...newModerator, name: e.target.value})} placeholder="Иван Иванов" /></div>
                            <div className={styles.fieldGroup}><label>Логин</label><input type="text" value={newModerator.username} onChange={(e) => setNewModerator({...newModerator, username: e.target.value})} placeholder="username" /></div>
                            <div className={styles.fieldGroup}><label>Пароль</label><input type="password" value={newModerator.password} onChange={(e) => setNewModerator({...newModerator, password: e.target.value})} placeholder="••••••••" /></div>
                            <div className={styles.fieldGroup}><label>ID сотрудника</label><input type="text" value={newModerator.employeeId} onChange={(e) => setNewModerator({...newModerator, employeeId: e.target.value})} placeholder="EMP-001" /></div>
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.modalCancelBtn} onClick={() => setIsCreateModalOpen(false)}>Отмена</button>
                            <button className={styles.modalConfirmBtn} onClick={() => { createModerator(newModerator); setIsCreateModalOpen(false); }}>Создать</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {isEditModalOpen && (
                <div className={styles.overlay} onClick={() => setIsEditModalOpen(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalIcon}><i className="fas fa-user-edit"></i></div>
                        <h3>Редактирование модератора</h3>
                        <div className={styles.modalForm}>
                            <div className={styles.fieldGroup}><label>Имя</label><input type="text" value={editModerator.name} onChange={(e) => setEditModerator({...editModerator, name: e.target.value})} /></div>
                            <div className={styles.fieldGroup}><label>Логин</label><input type="text" value={editModerator.username} onChange={(e) => setEditModerator({...editModerator, username: e.target.value})} /></div>
                            <div className={styles.fieldGroup}><label>Пароль</label><input type="password" value={editModerator.password} onChange={(e) => setEditModerator({...editModerator, password: e.target.value})} placeholder="Оставьте пустым, если не меняете" /></div>
                            <div className={styles.fieldGroup}><label>ID сотрудника</label><input type="text" value={editModerator.employeeId} onChange={(e) => setEditModerator({...editModerator, employeeId: e.target.value})} /></div>
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.modalCancelBtn} onClick={() => setIsEditModalOpen(false)}>Отмена</button>
                            <button className={styles.modalConfirmBtn} onClick={() => { updateModerator(editModerator); setIsEditModalOpen(false); }}>Сохранить</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminPanel;
