import React, {useEffect, useRef, useState} from "react";
import {Helmet} from "react-helmet";
import {useNavigate, useParams} from "react-router-dom";
import styles from "./ManageProject.module.css";
import {ReactComponent as GoBackIcon} from '../../../icons/go_back.svg';
import Menu from "../../menu/Menu";
import config from "../../../config";

function ManageProject() {
    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [category, setCategory] = useState("");
    const [stage, setStage] = useState("");
    const [projectLogo, setProjectLogo] = useState(null);
    const navigate = useNavigate();
    const fileInputRef = useRef();
    const [members, setMembers] = useState([]);
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");
    const {projectId} = useParams();
    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}`);
                const data = await response.json();
                if (response.ok) {
                    setProjectName(data.projectName);
                    setProjectDescription(data.projectDescription);
                    setCategory(data.category);
                    setStage(data.stage);
                    setMembers(data.members || []);
                    setProjectLogo(`${config.FILE_SERVER}${data.projectLogoUrl}`);
                } else {
                    throw new Error('Failed to fetch project data');
                }
            } catch (error) {
                console.error('Error fetching project data:', error);
            }
        };
        fetchData();
    }, [projectId]);

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

        if (!projectName || !projectDescription || !category || !stage) {
            console.error('Please fill out all required fields.');
            return;
        }

        const logoFormData = new FormData();
        logoFormData.append('file', projectLogo);

        try {
            const logoUploadResponse = await fetch(`${config.FILE_SERVER}/upload/projectLogos`, {
                method: 'POST', body: logoFormData,
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
                stage: stage,
                members: members
            };

            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}`, {
                method: 'PUT',
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

    const handleViewFeedback = () => {
        navigate(`/project/${projectId}/statistics`);
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
                    <button onClick={() => navigate(-1)} className={styles.goBackButton}>
                        <GoBackIcon/>
                    </button>
                    <h2 className={styles.formTitle}>Управление проектом</h2>
                    <form className={styles.manageProjectForm} onSubmit={handleChange}>
                        <div className={styles.formGroup}>
                            <label htmlFor="projectLogo" className={styles.centerLabel}>Логотип проекта</label>
                            <div className={styles.logoPreview}>
                                {projectLogo &&
                                    <img src={projectLogo} alt="Project Logo Preview"/>}
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
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                required
                            >
                                <option value="">Выберите категорию</option>
                                <option value="Technology">Технологии</option>
                                <option value="Science">Наука</option>
                                <option value="Art">Искусство</option>
                                <option value="Business">Бизнес</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="projectStage">Стадия проекта</label>
                            <select
                                id="projectStage"
                                value={stage}
                                onChange={(e) => setStage(e.target.value)}
                                required
                            >
                                <option value="">Выберите стадию</option>
                                <option value="Concept">Концепция</option>
                                <option value="Development">Разработка</option>
                                <option value="Testing">Тестирование</option>
                                <option value="Production">Производство</option>
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
                        <button type="submit" className={styles.submitButton}>Применить изменения</button>
                        <button onClick={handleViewFeedback} className={styles.feedbackButton}>Просмотр обратной связи
                        </button>
                        <button onClick={handleDeleteProject} className={styles.deleteProjectButton}>Удалить проект
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default ManageProject;