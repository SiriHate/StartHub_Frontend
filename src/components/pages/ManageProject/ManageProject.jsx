import React, {useEffect, useRef, useState, useCallback} from "react";
import {Helmet} from "react-helmet";
import {useNavigate, useParams} from "react-router-dom";
import styles from "./ManageProject.module.css";
import Menu from "../../menu/Menu";
import config from "../../../config";
import apiClient from "../../../api/apiClient";

const SEARCH_TYPES = [
    { key: 'employees', label: 'Сотрудник', icon: 'fa-briefcase', field: 'employeeSearches' },
    { key: 'founders', label: 'Сооснователь / Партнер', icon: 'fa-handshake', field: 'founderSearches' },
    { key: 'investors', label: 'Инвестор', icon: 'fa-chart-line', field: 'investorSearches' },
    { key: 'mentors', label: 'Ментор', icon: 'fa-graduation-cap', field: 'mentorSearches' },
];

function ManageProject() {
    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [category, setCategory] = useState(null);
    const [projectLogo, setProjectLogo] = useState(null);
    const [projectLogoPreview, setProjectLogoPreview] = useState('/default_list_element_logo.jpg');
    const [categories, setCategories] = useState([]);
    const [specializations, setSpecializations] = useState([]);
    const [domains, setDomains] = useState([]);
    const [hasSurvey, setHasSurvey] = useState(false);
    const navigate = useNavigate();
    const fileInputRef = useRef();
    const [members, setMembers] = useState([]);
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");
    const {projectId} = useParams();
    const [foundUsers, setFoundUsers] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const searchTimeoutRef = useRef(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searches, setSearches] = useState([]);
    const [editingSearch, setEditingSearch] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try { const r = await apiClient(`${config.MAIN_SERVICE}/project-categories`); const d = await r.json(); if (r.ok) setCategories(d); } catch (e) { console.error(e); }
        };
        const fetchSpecializations = async () => {
            try { const r = await apiClient(`${config.USER_SERVICE}/member-specializations`); const d = await r.json(); if (r.ok) setSpecializations(d); } catch (e) { console.error(e); }
        };
        const fetchDomains = async () => {
            try { const r = await apiClient(`${config.USER_SERVICE}/domains`); const d = await r.json(); if (r.ok) setDomains(d); } catch (e) { console.error(e); }
        };
        fetchCategories(); fetchSpecializations(); fetchDomains();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiClient(`${config.MAIN_SERVICE}/projects/${projectId}`);
                const data = await response.json();
                if (response.ok) {
                    setProjectName(data.name || '');
                    setProjectDescription(data.description || '');
                    setMembers((data.members || []).map(m => ({ memberId: m.memberId, username: m.username, role: m.role })));
                    if (data.logoUrl) { setProjectLogo(data.logoUrl); setProjectLogoPreview(data.logoUrl); }
                    setHasSurvey(data.hasSurvey);
                    const matchingCategory = categories.find(cat => cat.name === data.category);
                    setCategory(matchingCategory || null);

                    const loaded = [];
                    SEARCH_TYPES.forEach(st => {
                        (data[st.field] || []).forEach(item => {
                            if (st.key === 'employees') {
                                loaded.push({ id: item.id, type: st.key, specialization: item.specialization || '', about: item.about || '', _saved: true });
                            } else {
                                loaded.push({ id: item.id, type: st.key, domain: item.domain || '', about: item.about || '', _saved: true });
                            }
                        });
                    });
                    setSearches(loaded);
                }
            } catch (error) { console.error('Error fetching project data:', error); }
        };
        fetchData();
    }, [projectId, categories]);

    const handleChange = async (e) => {
        e.preventDefault();
        if (!projectName || !projectDescription || !category) return;
        try {
            const projectData = { name: projectName, description: projectDescription, categoryId: category ? category.id : null };
            const formData = new FormData();
            formData.append('project', new Blob([JSON.stringify(projectData)], { type: 'application/json' }));
            if (projectLogo instanceof File) formData.append('logo', projectLogo);
            const response = await apiClient(`${config.MAIN_SERVICE}/projects/${projectId}`, {
                method: 'PATCH', body: formData
            });
            if (response.ok) navigate(-1);
            else console.error('Error updating project');
        } catch (error) { console.error('Error during request:', error); }
    };

    const handleLogoUploadClick = () => fileInputRef.current.click();
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) { setProjectLogo(file); const reader = new FileReader(); reader.onloadend = () => setProjectLogoPreview(reader.result); reader.readAsDataURL(file); }
    };

    const handleDeleteProject = async () => {
        if (!window.confirm('Вы уверены, что хотите удалить проект?')) return;
        try {
            const response = await apiClient(`${config.MAIN_SERVICE}/projects/${projectId}`, {
                method: 'DELETE'
            });
            if (response.status === 204 || response.ok) navigate('/my_space');
        } catch (error) { console.error('Error deleting project:', error); }
    };

    const handleFeedbackClick = () => {
        if (hasSurvey) navigate(`/project/${projectId}/feedbacks`);
        else navigate(`/project/${projectId}/create_feedback`);
    };

    const handleDeleteSurvey = async () => {
        if (!window.confirm('Вы уверены, что хотите удалить форму обратной связи?')) return;
        try {
            const response = await apiClient(`${config.MAIN_SERVICE}/projects/${projectId}/surveys`, { method: 'DELETE' });
            if (response.status === 204 || response.ok) setHasSurvey(false);
        } catch (error) { console.error('Error deleting survey:', error); }
    };

    const searchUsers = useCallback(async (searchTerm) => {
        if (!searchTerm) { setFoundUsers([]); return; }
        try {
            const response = await apiClient(`${config.USER_SERVICE}/members?username=${encodeURIComponent(searchTerm)}&page=0&size=5`);
            if (response.ok) { const data = await response.json(); setFoundUsers(data.content || []); }
        } catch (e) { setFoundUsers([]); }
    }, []);

    const handleUsernameChange = (e) => {
        const value = e.target.value; setUsername(value); setSelectedUser(null);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => searchUsers(value), 300);
    };

    const openSearchForm = (type) => {
        if (editingSearch) return;
        setEditingIndex(null);
        setEditingSearch({ type, about: '', ...(type === 'employees' ? { specialization: '' } : { domain: '' }) });
    };
    const openEditForm = (index) => {
        if (editingSearch) return;
        const s = searches[index];
        setEditingIndex(index);
        setEditingSearch({ ...s });
    };
    const cancelEditingSearch = () => { setEditingSearch(null); setEditingIndex(null); };
    const handleSaveSearch = async () => {
        if (!editingSearch) return;
        const body = editingSearch.type === 'employees'
            ? { specialization: editingSearch.specialization, about: editingSearch.about }
            : { domain: editingSearch.domain, about: editingSearch.about };
        try {
            if (editingIndex !== null && editingSearch.id) {
                const res = await apiClient(`${config.MAIN_SERVICE}/projects/${projectId}/searches/${editingSearch.type}/${editingSearch.id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                if (res.ok) {
                    const updated = await res.json();
                    setSearches(prev => prev.map((item, i) => i === editingIndex ? { ...item, ...editingSearch, id: updated.id } : item));
                }
            } else {
                const res = await apiClient(`${config.MAIN_SERVICE}/projects/${projectId}/searches/${editingSearch.type}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                if (res.ok) {
                    const created = await res.json();
                    setSearches(prev => [...prev, { ...editingSearch, id: created.id, _saved: true }]);
                }
            }
        } catch {}
        setEditingSearch(null);
        setEditingIndex(null);
    };
    const handleDeleteSearch = async (index) => {
        const s = searches[index];
        if (s._saved && s.id) {
            try { await apiClient(`${config.MAIN_SERVICE}/projects/${projectId}/searches/${s.type}/${s.id}`, { method: 'DELETE' }); } catch {}
        }
        setSearches(prev => prev.filter((_, i) => i !== index));
    };

    const handleUserSelect = (user) => { setUsername(user.username); setSelectedUser(user); setFoundUsers([]); setIsDropdownOpen(false); };
    const addMember = async () => {
        if (!selectedUser || !role) return;
        if (members.some(m => m.username === selectedUser.username)) { alert('Этот пользователь уже добавлен'); return; }
        try {
            const res = await apiClient(`${config.MAIN_SERVICE}/projects/${projectId}/members`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: selectedUser.username, role }),
            });
            if (res.ok) {
                const created = await res.json();
                setMembers(prev => [...prev, { memberId: created.memberId, username: created.username, role: created.role }]);
            }
        } catch {}
        setUsername(""); setRole(""); setSelectedUser(null);
    };
    const removeMember = async (index) => {
        const m = members[index];
        if (m.memberId) {
            try { await apiClient(`${config.MAIN_SERVICE}/projects/${projectId}/members/${m.memberId}`, { method: 'DELETE' }); } catch {}
        }
        setMembers(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <>
            <Helmet>
                <title>Управление проектом — StartHub</title>
                <body className={styles.body} />
            </Helmet>
            <Menu />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.topBar}>
                        <button className={styles.backBtn} onClick={() => navigate(-1)}>
                            <i className="fas fa-arrow-left"></i> Назад
                        </button>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <i className="fas fa-cog"></i>
                            <h1>Управление проектом</h1>
                        </div>

                        <form className={styles.form} onSubmit={handleChange}>
                            <div className={styles.logoSection}>
                                <div className={styles.logoPreview} onClick={handleLogoUploadClick}>
                                    <img src={projectLogoPreview} alt="Превью" onError={(e) => e.target.src = '/default_list_element_logo.jpg'} />
                                    <div className={styles.logoOverlay}><i className="fas fa-camera"></i></div>
                                </div>
                                <button type="button" className={styles.uploadBtn} onClick={handleLogoUploadClick}>
                                    <i className="fas fa-upload"></i> Загрузить фото
                                </button>
                                <input type="file" ref={fileInputRef} accept="image/*" style={{display: 'none'}} onChange={handleLogoChange} />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label>Название проекта</label>
                                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Введите название..." required />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label>Описание проекта</label>
                                <textarea value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} placeholder="Опишите ваш проект..." required />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label>Категория</label>
                                <select value={category ? category.id : ''} onChange={(e) => { const s = categories.find(c => c.id === Number(e.target.value)); setCategory(s || null); }} required>
                                    <option value="">Выберите категорию</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>

                            <div className={styles.buttonsRow}>
                                <button type="submit" className={styles.submitBtn}>
                                    <i className="fas fa-save"></i> Сохранить
                                </button>
                                <button type="button" className={styles.deleteBtn} onClick={handleDeleteProject}>
                                    <i className="fas fa-trash-alt"></i> Удалить проект
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <i className="fas fa-users"></i>
                            <h1>Команда проекта</h1>
                        </div>
                        <div className={styles.teamAddRow}>
                            <div className={styles.userSearch}>
                                <input type="text" value={username} onChange={handleUsernameChange} onFocus={() => setIsDropdownOpen(true)} placeholder="Поиск пользователя..." autoComplete="off" />
                                {isDropdownOpen && username.length > 0 && foundUsers.length > 0 && (
                                    <div className={styles.dropdown}>
                                        {foundUsers.map(user => (
                                            <div key={user.id} className={styles.dropdownItem} onClick={() => handleUserSelect(user)}>
                                                <i className="fas fa-user-circle"></i> {user.username}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {isDropdownOpen && username.length > 0 && foundUsers.length === 0 && (
                                    <div className={styles.dropdown}>
                                        <div className={`${styles.dropdownItem} ${styles.noResults}`}>Пользователи не найдены</div>
                                    </div>
                                )}
                            </div>
                            <select value={role} onChange={(e) => setRole(e.target.value)} className={styles.roleSelect}>
                                <option value="">Роль</option>
                                {specializations.map(spec => <option key={spec.id} value={spec.name}>{spec.name}</option>)}
                            </select>
                            <button type="button" onClick={addMember} className={styles.addMemberBtn} disabled={!selectedUser || !role}>
                                <i className="fas fa-plus"></i>
                            </button>
                        </div>
                        <div className={styles.membersList}>
                            {members.length > 0 ? members.map((member, index) => (
                                <div key={index} className={styles.memberItem}>
                                    <div className={styles.memberInfo}>
                                        <i className="fas fa-user"></i>
                                        <span className={styles.memberName}>{member.username}</span>
                                        <span className={styles.memberRole}>{member.role}</span>
                                    </div>
                                    <button type="button" onClick={() => removeMember(index)} className={styles.removeMemberBtn} title="Удалить">
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            )) : (
                                <div className={styles.emptyMembers}>
                                    <i className="fas fa-user-plus"></i>
                                    <span>Добавьте участников в команду</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <i className="fas fa-bullhorn"></i>
                            <h1>Объявления о поиске</h1>
                        </div>
                        {!editingSearch && (
                            <div className={styles.searchTypeRow}>
                                {SEARCH_TYPES.map(st => (
                                    <button key={st.key} type="button" className={styles.addSearchBtn} onClick={() => openSearchForm(st.key)}>
                                        <i className={`fas ${st.icon}`}></i> {st.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        {editingSearch && (() => {
                            const st = SEARCH_TYPES.find(t => t.key === editingSearch.type);
                            const isEmployee = editingSearch.type === 'employees';
                            return (
                                <div className={styles.searchItem}>
                                    <div className={styles.searchItemHeader}>
                                        <span className={styles.searchBadge}>
                                            <i className={`fas ${st?.icon}`}></i> {st?.label}
                                        </span>
                                    </div>
                                    {isEmployee ? (
                                        <select value={editingSearch.specialization || ''}
                                                onChange={e => setEditingSearch(prev => ({ ...prev, specialization: e.target.value }))}
                                                className={styles.searchFieldInput}>
                                            <option value="">Выберите специализацию</option>
                                            {specializations.map(sp => <option key={sp.id} value={sp.name}>{sp.name}</option>)}
                                        </select>
                                    ) : (
                                        <select value={editingSearch.domain || ''}
                                                onChange={e => setEditingSearch(prev => ({ ...prev, domain: e.target.value }))}
                                                className={styles.searchFieldInput}>
                                            <option value="">Выберите область</option>
                                            {domains.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                        </select>
                                    )}
                                    <textarea value={editingSearch.about}
                                              onChange={e => setEditingSearch(prev => ({ ...prev, about: e.target.value }))}
                                              placeholder="Описание требований..." className={styles.searchFieldTextarea} rows={2}/>
                                    <div className={styles.searchFormActions}>
                                        <button type="button" className={styles.saveSearchBtn} onClick={handleSaveSearch}>
                                            <i className="fas fa-check"></i> Сохранить
                                        </button>
                                        <button type="button" className={styles.cancelSearchBtn} onClick={cancelEditingSearch}>
                                            <i className="fas fa-times"></i> Отмена
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                        <div className={styles.membersList}>
                            {searches.length > 0 ? searches.map((s, idx) => {
                                const st = SEARCH_TYPES.find(t => t.key === s.type);
                                return (
                                    <div key={idx} className={styles.searchItemSaved}>
                                        <div className={styles.searchItemHeader}>
                                            <span className={styles.searchBadge}>
                                                <i className={`fas ${st?.icon}`}></i> {st?.label}
                                            </span>
                                            <span className={styles.searchSubLabel}>{s.specialization || s.domain}</span>
                                            <div className={styles.searchItemActions}>
                                                <button type="button" onClick={() => openEditForm(idx)} className={styles.editSearchBtn} disabled={!!editingSearch}>
                                                    <i className="fas fa-pen"></i>
                                                </button>
                                                <button type="button" onClick={() => handleDeleteSearch(idx)} className={styles.removeMemberBtn}>
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </div>
                                        {s.about && <p className={styles.searchAboutText}>{s.about}</p>}
                                    </div>
                                );
                            }) : !editingSearch && (
                                <div className={styles.emptyMembers}>
                                    <i className="fas fa-bullhorn"></i>
                                    <span>Добавьте объявления о поиске</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <i className="fas fa-comment-dots"></i>
                            <h1>Обратная связь</h1>
                        </div>
                        <div className={styles.buttonsRow}>
                            <button type="button" className={styles.feedbackBtn} onClick={handleFeedbackClick}>
                                <i className={`fas ${hasSurvey ? 'fa-chart-bar' : 'fa-plus-circle'}`}></i>
                                {hasSurvey ? 'Просмотреть результаты' : 'Создать форму'}
                            </button>
                            {hasSurvey && (
                                <button type="button" className={styles.deleteBtn} onClick={handleDeleteSurvey}>
                                    <i className="fas fa-trash-alt"></i> Удалить форму
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ManageProject;
