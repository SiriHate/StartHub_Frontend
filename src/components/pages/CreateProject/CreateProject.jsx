import React, { useState, useRef } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import styles from "./CreateProject.module.css";
import NavigationBar from "../../navigation_bar/NavigationBar";

function CreateProject() {
    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [category, setCategory] = useState("");
    const [stage, setStage] = useState("");
    const [projectLogo, setProjectLogo] = useState(null); // Updated state name
    const navigate = useNavigate();
    const fileInputRef = useRef();
    const [members, setMembers] = useState([]);
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");
    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

    const addMember = () => {
        if (username && role) {
            setMembers([...members, { username, role }]);
            setUsername("");
            setRole("");
        }
    };

    const removeMember = index => {
        setMembers(members.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!projectName || !projectDescription || !category || !stage) {
            console.error('Please fill out all required fields.');
            return;
        }

        const logoFormData = new FormData();
        logoFormData.append('file', projectLogo);

        try {
            const logoUploadResponse = await fetch('http://localhost:3001/upload/projectLogos', {
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

            const response = await fetch('http://localhost:8083/api/v1/main/projects', {
                method: 'POST', headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken ? ` ${authorizationToken}` : '',
                }, body: JSON.stringify(projectData),
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

    return (<>
        <Helmet>
            <title>Создание проекта</title>
            <html className={styles.html} />
            <body className={styles.body} />
        </Helmet>
        <NavigationBar />
        <div className={styles.createProjectPage}>
            <button type="button" className={styles.goBackButton} onClick={handleGoBack}>Вернуться</button>
            <div className={styles.createProjectContainer}>
                <h2 className={styles.formTitle}>Создание проекта</h2>
                <form className={styles.createProjectForm} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="projectLogo" className={styles.centerLabel}>Логотип проекта</label>
                        <div className={styles.logoPreview}>
                            {projectLogo &&
                                <img src={URL.createObjectURL(projectLogo)} alt="Project Logo Preview" />}
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
                                style={{ display: 'none' }} // Скрыть стандартный input
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
                    <button type="submit" className={styles.submitButton}>Создать проект</button>
                </form>
            </div>
        </div>
    </>);
}

export default CreateProject;
