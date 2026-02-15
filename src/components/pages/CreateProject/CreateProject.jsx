import React, {useEffect, useRef, useState} from "react";
import {Helmet} from "react-helmet";
import {useNavigate} from "react-router-dom";
import styles from "./CreateProject.module.css";
import Menu from "../../menu/Menu";
import config from "../../../config";
import apiClient from "../../../api/apiClient";

const SEARCH_TYPES = [
    { key: 'employees', label: 'Сотрудник', icon: 'fa-briefcase' },
    { key: 'founders', label: 'Сооснователь / Партнер', icon: 'fa-handshake' },
    { key: 'investors', label: 'Инвестор', icon: 'fa-chart-line' },
    { key: 'mentors', label: 'Ментор', icon: 'fa-graduation-cap' },
];

function CreateProject() {
    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [category, setCategory] = useState(null);
    const [projectLogo, setProjectLogo] = useState('/default_list_element_logo.jpg');
    const [projectLogoPreview, setProjectLogoPreview] = useState('/default_list_element_logo.jpg');
    const fileInputRef = useRef();
    const [members, setMembers] = useState([]);
    const [username, setUsername] = useState("");
    const [roleName, setRoleName] = useState("");
    const [categories, setCategories] = useState([]);
    const [specializations, setSpecializations] = useState([]);
    const [domains, setDomains] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const searchTimeoutRef = useRef(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const [searches, setSearches] = useState([]);
    const [editingSearch, setEditingSearch] = useState(null);

    useEffect(() => {
        apiClient(`${config.MAIN_SERVICE}/project-categories`, {
            headers: { 'Content-Type': 'application/json' }
        })
            .then(r => r.json()).then(setCategories).catch(console.error);

        apiClient(`${config.USER_SERVICE}/member-specializations`, {
            headers: { 'Content-Type': 'application/json' }
        })
            .then(r => r.json()).then(setSpecializations).catch(console.error);

        apiClient(`${config.USER_SERVICE}/domains`, {
            headers: { 'Content-Type': 'application/json' }
        })
            .then(r => r.json()).then(setDomains).catch(console.error);
    }, []);

    const searchUsers = async (query) => {
        if (query.length < 2) { setSearchResults([]); setShowDropdown(false); return; }
        try {
            const response = await apiClient(`${config.USER_SERVICE}/members?username=${query}`, {
                headers: { 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                const data = await response.json();
                setSearchResults((data.content || []).slice(0, 5));
                setShowDropdown(true);
            }
        } catch (e) { setSearchResults([]); setShowDropdown(false); }
    };

    const handleUsernameChange = (e) => {
        const value = e.target.value;
        setUsername(value); setSelectedUser(null);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => searchUsers(value), 300);
    };

    const handleUserSelect = (user) => { setUsername(user.username); setSelectedUser(user); setShowDropdown(false); };
    const addMember = () => {
        if (selectedUser && roleName) {
            setMembers([...members, {username: selectedUser.username, role: roleName}]);
            setUsername(""); setRoleName(""); setSelectedUser(null);
        }
    };
    const removeMember = index => setMembers(members.filter((_, i) => i !== index));

    const openSearchForm = (type) => {
        if (editingSearch) return;
        setEditingSearch({ type, about: '', ...(type === 'employees' ? { specialization: '' } : { domain: '' }) });
    };
    const saveEditingSearch = () => {
        if (!editingSearch) return;
        setSearches(prev => [...prev, { ...editingSearch }]);
        setEditingSearch(null);
    };
    const cancelEditingSearch = () => setEditingSearch(null);
    const removeSearch = (index) => setSearches(prev => prev.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!projectName || !projectDescription || !category) return;
        const projectData = { name: projectName, description: projectDescription, categoryId: category.id, members: members.map(m => ({ username: m.username, role: m.role })) };
        const formData = new FormData();
        formData.append('project', new Blob([JSON.stringify(projectData)], { type: 'application/json' }));
        if (projectLogo instanceof File) formData.append('logo', projectLogo);
        try {
            const response = await apiClient(`${config.MAIN_SERVICE}/projects`, {
                method: 'POST', body: formData
            });
            if (!response.ok) { console.error('Ошибка при создании проекта'); return; }
            const created = await response.json();
            const pid = created.id;

            if (pid && searches.length > 0) {
                await Promise.all(searches.map(s => {
                    const body = s.type === 'employees'
                        ? { specialization: s.specialization, about: s.about }
                        : { domain: s.domain, about: s.about };
                    return apiClient(`${config.MAIN_SERVICE}/projects/${pid}/searches/${s.type}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                    }).catch(() => {});
                }));
            }
            navigate(-1);
        } catch (error) { console.error('Ошибка при отправке:', error); }
    };

    const handleLogoUploadClick = () => fileInputRef.current.click();
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) { setProjectLogo(file); setProjectLogoPreview(URL.createObjectURL(file)); }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            <Helmet>
                <title>Создание проекта — StartHub</title>
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
                            <i className="fas fa-rocket"></i>
                            <h1>Создание проекта</h1>
                        </div>

                        <form className={styles.form} onSubmit={handleSubmit}>
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

                            <button type="submit" className={styles.submitBtn}>
                                <i className="fas fa-paper-plane"></i> Создать проект
                            </button>
                        </form>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <i className="fas fa-users"></i>
                            <h1>Команда проекта</h1>
                        </div>
                        <div className={styles.teamAddRow}>
                            <div className={styles.userSearch} ref={dropdownRef}>
                                <input type="text" value={username} onChange={handleUsernameChange} placeholder="Поиск пользователя..." autoComplete="off" />
                                {showDropdown && searchResults.length > 0 && (
                                    <div className={styles.dropdown}>
                                        {searchResults.map(user => (
                                            <div key={user.id} className={styles.dropdownItem} onClick={() => handleUserSelect(user)}>
                                                <i className="fas fa-user-circle"></i> {user.username}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <select value={roleName} onChange={(e) => setRoleName(e.target.value)} className={styles.roleSelect}>
                                <option value="">Роль</option>
                                {specializations.map(spec => <option key={spec.id} value={spec.name}>{spec.name}</option>)}
                            </select>
                            <button type="button" onClick={addMember} className={styles.addMemberBtn} disabled={!selectedUser || !roleName}>
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
                                        <button type="button" className={styles.saveSearchBtn} onClick={saveEditingSearch}>
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
                                            <button type="button" onClick={() => removeSearch(idx)} className={styles.removeMemberBtn}>
                                                <i className="fas fa-times"></i>
                                            </button>
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
                </div>
            </div>
        </>
    );
}

export default CreateProject;
