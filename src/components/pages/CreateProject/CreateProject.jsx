import React, {useEffect, useRef, useState} from "react";
import {Helmet} from "react-helmet";
import {useNavigate} from "react-router-dom";
import styles from "./CreateProject.module.css";
import Menu from "../../menu/Menu";
import config from "../../../config";

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
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const searchTimeoutRef = useRef(null);
    const dropdownRef = useRef(null);
    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';
    const navigate = useNavigate();

    useEffect(() => {
        
        fetch(`${config.MAIN_SERVICE}/project_categories`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationToken ? `${authorizationToken}` : '',
            },
        })
            .then(response => response.json())
            .then(data => setCategories(data))
            .catch(error => console.error('Error fetching categories:', error));

        fetch(`${config.USER_SERVICE}/specialist_specializations`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationToken ? `${authorizationToken}` : '',
            },
        })
            .then(response => response.json())
            .then(data => setSpecializations(data))
            .catch(error => console.error('Error fetching specializations:', error));
    }, [authorizationToken]);

    const handleUserSelect = (user) => {
        setUsername(user.username);
        setSelectedUser(user);
        setShowDropdown(false);
    };

    const addMember = () => {
        if (selectedUser && roleName) {
            setMembers([...members, {username: selectedUser.username, role: roleName}]);
            setUsername("");
            setRoleName("");
            setSelectedUser(null);
        }
    };

    const removeMember = index => {
        setMembers(members.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!projectName || !projectDescription || !category) {
            console.error('Please fill out all required fields.');
            return;
        }

        const logoFormData = new FormData();
        logoFormData.append('file', projectLogo);

        try {
            const logoUploadResponse = await fetch(`${config.FILE_SERVER}/upload/projectLogos`, {
                method: 'POST',
                body: logoFormData,
            });

            if (!logoUploadResponse.ok) {
                throw new Error('Failed to upload project logo');
            }

            const logoUploadData = await logoUploadResponse.json();
            const projectLogoUrl = logoUploadData.url;

            const projectData = {
                projectLogoUrl: projectLogoUrl,
                projectName: projectName,
                projectDescription: projectDescription,
                category: category,
                members: members.map(member => ({
                    username: member.username,
                    role: member.role
                }))
            };

            const response = await fetch(`${config.MAIN_SERVICE}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken ? ` ${authorizationToken}` : '',
                },
                body: JSON.stringify(projectData),
            });

            if (response.ok) {
                console.log('Проект успешно создан');
                navigate(-1);
            } else {
                const errorResponse = await response.json();
                console.error('Ошибка при создании проекта', errorResponse);
            }
        } catch (error) {
            console.error('Ошибка при отправке запроса:', error);
        }
    };

    const handleGoBack = () => {
        navigate('/my_projects');
    };

    const handleLogoUploadClick = () => {
        fileInputRef.current.click();
    };

    const searchUsers = async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        try {
            const response = await fetch(`${config.USER_SERVICE}/members?username=${query}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken ? `${authorizationToken}` : '',
                },
            });

            if (response.ok) {
                const data = await response.json();
                const users = data.content || [];
                setSearchResults(users.slice(0, 5));
                setShowDropdown(true);
            }
        } catch (error) {
            console.error('Ошибка при поиске пользователей:', error);
            setSearchResults([]);
            setShowDropdown(false);
        }
    };

    const handleUsernameChange = (e) => {
        const value = e.target.value;
        setUsername(value);
        setSelectedUser(null);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            searchUsers(value);
        }, 300);
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProjectLogo(file);
            setProjectLogoPreview(URL.createObjectURL(file));
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <>
            <Helmet>
                <title>Создание проекта</title>
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            <Menu/>
            <div className={styles.createProjectPage}>
                <div className={styles.createProjectContainer}>
                    <button onClick={() => navigate(-1)} className={styles.backButton}>
                        <img src="/back-arrow.png" alt="Назад" className={styles.backIcon} />
                        <span>Назад</span>
                    </button>
                    <h2 className={styles.formTitle}>Создание проекта</h2>
                    <form className={styles.createProjectForm} onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="projectLogo" className={styles.centerLabel}>Логотип проекта</label>
                            <div className={styles.logoPreview}>
                                <img
                                    src={projectLogoPreview}
                                    alt="Project Logo Preview"
                                    className={styles.logoImage}
                                    onError={(e) => e.target.src = '/default_list_element_logo.jpg'}
                                />
                            </div>
                            <button
                                type="button"
                                className={styles.uploadButton}
                                onClick={handleLogoUploadClick}
                            >
                                Загрузить фото
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                id="logoUpload"
                                accept="image/*"
                                style={{display: 'none'}}
                                onChange={handleLogoChange}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="projectName">Название проекта</label>
                            <input
                                type="text"
                                id="projectName"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="projectDescription">Описание проекта</label>
                            <textarea
                                id="projectDescription"
                                value={projectDescription}
                                onChange={(e) => setProjectDescription(e.target.value)}
                                required
                            ></textarea>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="projectCategory">Категория проекта</label>
                            <select
                                id="projectCategory"
                                value={category ? category.id : ''}
                                onChange={(e) => {
                                    const selected = categories.find(c => c.id === Number(e.target.value));
                                    setCategory(selected || null);
                                }}
                                required
                            >
                                <option value="">Выберите категорию</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <label htmlFor="projectStage">Команда проекта</label>
                        <div className={styles.memberInputContainer}>
                            <div className={styles.usernameInputContainer} ref={dropdownRef}>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={handleUsernameChange}
                                    placeholder="Имя пользователя"
                                    className={styles.fullWidthInput}
                                />
                                {showDropdown && searchResults.length > 0 && (
                                    <div className={styles.dropdown}>
                                        {searchResults.map((user) => (
                                            <div
                                                key={user.id}
                                                className={styles.dropdownItem}
                                                onClick={() => handleUserSelect(user)}
                                            >
                                                {user.username}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <select
                                value={roleName}
                                onChange={(e) => setRoleName(e.target.value)}
                                className={styles.uniformHeightSelect}
                            >
                                <option value="">Выберите роль</option>
                                {specializations.map(spec => (
                                    <option key={spec.id} value={spec.name}>{spec.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={addMember}
                                className={styles.addMemberButton}
                                disabled={!selectedUser || !roleName}
                            >+</button>
                        </div>
                        <div className={styles.membersList}>
                            {members.length > 0 ? (
                                members.map((member, index) => (
                                    <div key={index} className={styles.memberItem}>
                                        {member.username} ({member.role})
                                        <button onClick={() => removeMember(index)}
                                                className={styles.removeMemberButton}>Удалить</button>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.emptyMessage}>Пока не добавлено ни одного участника</div>
                            )}
                        </div>
                        <button type="submit" className={styles.submitButton}>Создать проект</button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default CreateProject;