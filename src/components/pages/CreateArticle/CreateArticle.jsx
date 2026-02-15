import React, {useEffect, useRef, useState} from "react";
import {Helmet} from "react-helmet";
import styles from "./CreateArticle.module.css";
import Menu from "../../menu/Menu";
import RichTextEditor from "../../editor/RichTextEditor";
import {useNavigate} from "react-router-dom";
import config from "../../../config";
import apiClient from "../../../api/apiClient";

const CreateArticle = () => {
    const [articleTitle, setArticleTitle] = useState("");
    const [articleLogo, setArticleLogo] = useState('/default_list_element_logo.jpg');
    const [articleLogoPreview, setArticleLogoPreview] = useState('/default_list_element_logo.jpg');
    const fileInputRef = useRef();
    const [articleContent, setArticleContent] = useState('');
    const [articleCategory, setArticleCategory] = useState(null);
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await apiClient(`${config.MAIN_SERVICE}/article-categories`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setCategories(data);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!articleLogo || !(articleLogo instanceof File)) {
            alert('Пожалуйста, загрузите логотип статьи.');
            return;
        }
        const formData = new FormData();
        const articleData = {
            title: articleTitle,
            content: articleContent || '',
            categoryId: articleCategory
        };
        formData.append('article', new Blob([JSON.stringify(articleData)], { type: 'application/json' }));
        formData.append('logo', articleLogo);

        try {
            const response = await apiClient(`${config.MAIN_SERVICE}/articles`, {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                navigate('/my_space');
            } else {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Ошибка при создании статьи');
            }
        } catch (error) {
            console.error('Ошибка при отправке формы:', error);
        }
    };

    const handleLogoUploadClick = () => fileInputRef.current.click();

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setArticleLogo(file);
            setArticleLogoPreview(URL.createObjectURL(file));
        }
    };

    return (
        <>
            <Helmet>
                <title>Создать статью — StartHub</title>
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
                            <i className="fas fa-pen-fancy"></i>
                            <h1>Публикация статьи</h1>
                        </div>

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.logoSection}>
                                <div className={styles.logoPreview} onClick={handleLogoUploadClick}>
                                    <img
                                        src={articleLogoPreview}
                                        alt="Превью"
                                        onError={(e) => e.target.src = '/default_list_element_logo.jpg'}
                                    />
                                    <div className={styles.logoOverlay}>
                                        <i className="fas fa-camera"></i>
                                    </div>
                                </div>
                                <button type="button" className={styles.uploadBtn} onClick={handleLogoUploadClick}>
                                    <i className="fas fa-upload"></i> Загрузить фото
                                </button>
                                <input
                                    type="file" ref={fileInputRef} accept="image/*"
                                    style={{display: "none"}} onChange={handleLogoChange}
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label>Название статьи</label>
                                <input
                                    type="text" value={articleTitle}
                                    onChange={(e) => setArticleTitle(e.target.value)}
                                    placeholder="Введите название..." required
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label>Категория</label>
                                <select
                                    value={articleCategory || ''}
                                    onChange={(e) => setArticleCategory(Number(e.target.value))}
                                    required
                                >
                                    <option value="">Выберите категорию</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label>Содержание</label>
                                <RichTextEditor content={articleContent} setContent={setArticleContent} />
                            </div>

                            <button type="submit" className={styles.submitBtn}>
                                <i className="fas fa-paper-plane"></i> Опубликовать статью
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateArticle;
