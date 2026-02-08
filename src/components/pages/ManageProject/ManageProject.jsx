import React, {useEffect, useRef, useState, useCallback} from "react";
import {Helmet} from "react-helmet";
import {useNavigate, useParams} from "react-router-dom";
import styles from "./ManageProject.module.css";
import Menu from "../../menu/Menu";
import config from "../../../config";

function ManageProject() {
    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [category, setCategory] = useState(null);
    const [projectLogo, setProjectLogo] = useState(null);
    const [projectLogoPreview, setProjectLogoPreview] = useState('/default_list_element_logo.jpg');
    const [categories, setCategories] = useState([]);
    const [specializations, setSpecializations] = useState([]);
    const [hasSurvey, setHasSurvey] = useState(false);
    const navigate = useNavigate();
    const fileInputRef = useRef();
    const [members, setMembers] = useState([]);
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");
    const {projectId} = useParams();
    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';
    const [foundUsers, setFoundUsers] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const searchTimeoutRef = useRef(null);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try { const r = await fetch(`${config.MAIN_SERVICE}/project-categories`); const d = await r.json(); if (r.ok) setCategories(d); } catch (e) { console.error(e); }
        };
        const fetchSpecializations = async () => {
            try { const r = await fetch(`${config.USER_SERVICE}/member-specializations`); const d = await r.json(); if (r.ok) setSpecializations(d); } catch (e) { console.error(e); }
        };
        fetchCategories(); fetchSpecializations();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}`);
                const data = await response.json();
                if (response.ok) {
                    setProjectName(data.name || '');
                    setProjectDescription(data.description || '');
                    setMembers(data.members || []);
                    if (data.logoUrl) { setProjectLogo(data.logoUrl); setProjectLogoPreview(data.logoUrl); }
                    setHasSurvey(data.hasSurvey);
                    const matchingCategory = categories.find(cat => cat.name === data.category);
                    setCategory(matchingCategory || null);
                }
            } catch (error) { console.error('Error fetching project data:', error); }
        };
        fetchData();
    }, [projectId, categories]);

    const handleChange = async (e) => {
        e.preventDefault();
        if (!projectName || !projectDescription || !category) return;
        try {
            const projectData = { name: projectName, description: projectDescription, categoryId: category ? category.id : null, members: members.map(m => ({ username: m.username, role: m.role })) };
            const formData = new FormData();
            formData.append('project', new Blob([JSON.stringify(projectData)], { type: 'application/json' }));
            if (projectLogo instanceof File) formData.append('logo', projectLogo);
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}`, {
                method: 'PATCH', headers: { 'Authorization': authorizationToken ? ` ${authorizationToken}` : '' }, body: formData
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
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}`, {
                method: 'DELETE', headers: { 'Authorization': authorizationToken ? ` ${authorizationToken}` : '' }
            });
            if (response.status === 204 || response.ok) navigate('/my_space');
        } catch (error) { console.error('Error deleting project:', error); }
    };

    const handleFeedbackClick = () => {
        if (hasSurvey) navigate(`/project/${projectId}/feedbacks`);
        else navigate(`/project/${projectId}/create_feedback`);
    };

    const searchUsers = useCallback(async (searchTerm) => {
        if (!searchTerm) { setFoundUsers([]); return; }
        try {
            const response = await fetch(`${config.USER_SERVICE}/members?username=${encodeURIComponent(searchTerm)}&page=0&size=5`, {
                headers: { 'Authorization': authorizationToken ? ` ${authorizationToken}` : '' }
            });
            if (response.ok) { const data = await response.json(); setFoundUsers(data.content || []); }
        } catch (e) { setFoundUsers([]); }
    }, [authorizationToken]);

    const handleUsernameChange = (e) => {
        const value = e.target.value; setUsername(value); setSelectedUser(null);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => searchUsers(value), 300);
    };

    const handleUserSelect = (user) => { setUsername(user.username); setSelectedUser(user); setFoundUsers([]); setIsDropdownOpen(false); };
    const addMember = () => {
        if (selectedUser && role) {
            if (members.some(m => m.username === selectedUser.username)) { alert('Этот пользователь уже добавлен'); return; }
            setMembers([...members, { username: selectedUser.username, role }]); setUsername(""); setRole(""); setSelectedUser(null);
        }
    };
    const removeMember = index => setMembers(members.filter((_, i) => i !== index));

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

                            {/* Team section */}
                            <div className={styles.teamSection}>
                                <div className={styles.teamHeader}>
                                    <i className="fas fa-users"></i>
                                    <h2>Команда проекта</h2>
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

                            {/* Bottom buttons */}
                            <div className={styles.buttonsRow}>
                                <button type="submit" className={styles.submitBtn}>
                                    <i className="fas fa-save"></i> Сохранить
                                </button>
                                <button type="button" className={styles.feedbackBtn} onClick={handleFeedbackClick}>
                                    <i className={`fas ${hasSurvey ? 'fa-chart-bar' : 'fa-plus-circle'}`}></i>
                                    {hasSurvey ? 'Обратная связь' : 'Создать форму'}
                                </button>
                            </div>
                            <button type="button" className={styles.deleteBtn} onClick={handleDeleteProject}>
                                <i className="fas fa-trash-alt"></i> Удалить проект
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ManageProject;
