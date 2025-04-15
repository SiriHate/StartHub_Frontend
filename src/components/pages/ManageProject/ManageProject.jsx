import React, {useEffect, useRef, useState} from "react";
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
    const [categories, setCategories] = useState([]);
    const [hasSurvey, setHasSurvey] = useState(false);
    const navigate = useNavigate();
    const fileInputRef = useRef();
    const [members, setMembers] = useState([]);
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");
    const {projectId} = useParams();
    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${config.MAIN_SERVICE}/project_categories`);
                const data = await response.json();
                if (response.ok) {
                    setCategories(data);
                } else {
                    throw new Error('Failed to fetch categories');
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}`);
                const data = await response.json();
                if (response.ok) {
                    setProjectName(data.projectName);
                    setProjectDescription(data.projectDescription);
                    setMembers(data.members || []);
                    setProjectLogo(`${config.FILE_SERVER}${data.projectLogoUrl}`);
                    setHasSurvey(data.hasSurvey);

                    const matchingCategory = categories.find(cat => cat.name === data.category);
                    setCategory(matchingCategory || null);
                } else {
                    throw new Error('Failed to fetch project data');
                }
            } catch (error) {
                console.error('Error fetching project data:', error);
            }
        };
        fetchData();
    }, [projectId, categories]);

    const addMember = () => {
        if (username && role) {
            setMembers([...members, {username, role}]);
            setUsername("");
            setRole("");
        }
    };

    const removeMember = index => {
        setMembers(members.filter((_, i) => i !== index));
    };

    const handleChange = async (e) => {
        e.preventDefault();

        if (!projectName || !projectDescription || !category) {
            console.error('Please fill out all required fields.');
            return;
        }

        try {
            let projectLogoUrl = projectLogo;

            if (projectLogo instanceof File) {
                const logoFormData = new FormData();
                logoFormData.append('file', projectLogo);

                const logoUploadResponse = await fetch(`${config.FILE_SERVER}/upload/projectLogos`, {
                    method: 'POST',
                    body: logoFormData,
                });

                if (!logoUploadResponse.ok) {
                    throw new Error('Failed to upload project logo');
                }

                const logoUploadData = await logoUploadResponse.json();
                projectLogoUrl = logoUploadData.url;
            } else if (typeof projectLogo === 'string') {
                projectLogoUrl = projectLogo.replace(config.FILE_SERVER, '');
            }

            const projectData = {
                projectLogoUrl: projectLogoUrl,
                projectName: projectName,
                projectDescription: projectDescription,
                category: category,
                members: members
            };

            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken ? ` ${authorizationToken}` : '',
                },
                body: JSON.stringify(projectData),
            });

            if (response.ok) {
                console.log('Project updated successfully');
                navigate(-1);
            } else {
                const errorResponse = await response.json();
                console.error('Error updating project', errorResponse);
            }
        } catch (error) {
            console.error('Error during request:', error);
        }
    };

    const handleLogoUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleDeleteProject = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': authorizationToken ? ` ${authorizationToken}` : ''
                }
            });

            if (response.status !== 204) {
                throw new Error(`Failed to delete the project. Status: ${response.status}`);
            }

            console.log('Project deleted successfully');
            navigate('/my_projects');
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    const handleFeedbackClick = () => {
        if (hasSurvey) {
            navigate(`/project/${projectId}/feedbacks`);
        } else {
            navigate(`/project/${projectId}/create_feedback`);
        }
    };

    return (
        <>
            <Helmet>
                <title>Управление проектом</title>
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            <Menu/>
            <div className={styles.manageProjectPage}>
                <div className={styles.manageProjectContainer}>
                    <button onClick={() => navigate(-1)} className={styles.backButton}>
                        <img src="/back-arrow.png" alt="Назад" className={styles.backIcon} />
                        <span>Назад</span>
                    </button>
                    <h2 className={styles.formTitle}>Управление проектом</h2>
                    <form className={styles.manageProjectForm} onSubmit={handleChange}>
                        <div className={styles.formGroup}>
                            <label htmlFor="projectLogo" className={styles.centerLabel}>Логотип проекта</label>
                            <div className={styles.logoPreview}>
                                <img
                                    src={projectLogo || '/default_list_element_logo.jpg'}
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
                                onChange={(e) => setProjectLogo(e.target.files[0])}
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
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <label htmlFor="projectStage">Команда проекта</label>
                        <div className={styles.memberInputContainer}>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Имя пользователя"
                                className={styles.fullWidthInput}
                            />
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className={styles.uniformHeightSelect}
                            >
                                <option value="">Выберите роль</option>
                                <option value="Разработчик">Разработчик</option>
                                <option value="Дизайнер">Дизайнер</option>
                                <option value="Менеджер">Менеджер</option>
                            </select>
                            <button type="button" onClick={addMember} className={styles.addMemberButton}>+</button>
                        </div>
                        <div className={styles.membersList}>
                            {members.length > 0 ? (members.map((member, index) => (
                                <div key={index} className={styles.memberItem}>
                                    {member.username} ({member.role})
                                    <button onClick={() => removeMember(index)}
                                            className={styles.removeMemberButton}>Удалить</button>
                                </div>))) : (
                                <div className={styles.emptyMessage}>Пока не добавлено ни одного участника</div>)}
                        </div>
                        <div className={styles.buttonGroup}>
                            <button type="submit" className={styles.submitButton}>Сохранить изменения</button>
                            <button 
                                type="button" 
                                className={styles.feedbackButton}
                                onClick={handleFeedbackClick}
                            >
                                {hasSurvey ? 'Посмотреть обратную связь' : 'Создать форму обратной связи'}
                            </button>
                            <button type="button" className={styles.deleteButton} onClick={handleDeleteProject}>Удалить проект</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default ManageProject;