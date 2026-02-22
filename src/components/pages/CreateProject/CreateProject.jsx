import React, {useEffect, useRef, useState} from "react";
import {Helmet} from "react-helmet";
import {useNavigate} from "react-router-dom";
import styles from "./CreateProject.module.css";
import Menu from "../../menu/Menu";
import config from "../../../config";
import apiClient from "../../../api/apiClient";

function CreateProject() {
    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [category, setCategory] = useState(null);
    const [projectLogo, setProjectLogo] = useState('/default_list_element_logo.jpg');
    const [projectLogoPreview, setProjectLogoPreview] = useState('/default_list_element_logo.jpg');
    const fileInputRef = useRef();
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        apiClient(`${config.MAIN_SERVICE}/project-categories`, {
            headers: { 'Content-Type': 'application/json' }
        })
            .then(r => r.json()).then(setCategories).catch(console.error);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!projectName || !projectDescription || !category) return;
        const projectData = { name: projectName, description: projectDescription, categoryId: category.id };
        const formData = new FormData();
        formData.append('project', new Blob([JSON.stringify(projectData)], { type: 'application/json' }));
        if (projectLogo instanceof File) formData.append('logo', projectLogo);
        try {
            const response = await apiClient(`${config.MAIN_SERVICE}/projects`, {
                method: 'POST', body: formData
            });
            if (!response.ok) { console.error('Ошибка при создании проекта'); return; }
            const created = await response.json();
            navigate(`/manage_project/${created.id}`, { replace: true });
        } catch (error) { console.error('Ошибка при отправке:', error); }
    };

    const handleLogoUploadClick = () => fileInputRef.current.click();
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) { setProjectLogo(file); setProjectLogoPreview(URL.createObjectURL(file)); }
    };

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
                </div>
            </div>
        </>
    );
}

export default CreateProject;
