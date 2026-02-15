import React, {useEffect, useRef, useState} from "react";
import {Helmet} from "react-helmet";
import styles from "./ManageArticle.module.css";
import Menu from "../../menu/Menu";
import RichTextEditor from "../../editor/RichTextEditor";
import {useNavigate, useParams} from "react-router-dom";
import config from "../../../config";
import apiClient from "../../../api/apiClient";

const ManageArticle = () => {
    const [articleTitle, setArticleTitle] = useState("");
    const [articleLogo, setArticleLogo] = useState(null);
    const [articleLogoPreview, setArticleLogoPreview] = useState('/default_list_element_logo.jpg');
    const [existingLogoUrl, setExistingLogoUrl] = useState("");
    const fileInputRef = useRef();
    const [articleContent, setArticleContent] = useState('');
    const [articleCategory, setArticleCategory] = useState(null);
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();
    const {articleId} = useParams();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await apiClient(`${config.MAIN_SERVICE}/article-categories`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setCategories(data);
                return data;
            } catch (error) {
                console.error("Failed to fetch categories:", error);
                return [];
            }
        };

        const fetchArticle = async (categoriesList) => {
            try {
                const response = await apiClient(`${config.MAIN_SERVICE}/articles/${articleId}`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setArticleTitle(data.title);
                setExistingLogoUrl(data.logoUrl || (data.previewUrl ? `${config.FILE_SERVER}${data.previewUrl}` : ""));
                if (data.logoUrl || data.previewUrl) {
                    setArticleLogoPreview(data.logoUrl || `${config.FILE_SERVER}${data.previewUrl}`);
                }
                setArticleContent(data.content);
                const matchingCategory = (categoriesList || categories).find(cat => cat.name === data.category);
                setArticleCategory(matchingCategory || null);
            } catch (error) {
                console.error("Failed to fetch article:", error);
            }
        };

        (async () => {
            const cats = await fetchCategories();
            await fetchArticle(cats);
        })();
    }, [articleId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const articleData = {
            title: articleTitle,
            content: articleContent || '',
            categoryId: articleCategory ? articleCategory.id : null
        };
        const formData = new FormData();
        formData.append('article', new Blob([JSON.stringify(articleData)], { type: 'application/json' }));
        if (articleLogo instanceof File) formData.append('logo', articleLogo);

        try {
            const response = await apiClient(`${config.MAIN_SERVICE}/articles/${articleId}`, {
                method: 'PATCH',
                body: formData
            });
            if (response.ok) {
                navigate(`/article/${articleId}`);
            } else {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Ошибка при редактировании статьи');
            }
        } catch (error) {
            console.error('Ошибка при выполнении запроса:', error);
        }
    };

    const handleLogoUploadClick = () => fileInputRef.current.click();

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setArticleLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => setArticleLogoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Вы уверены, что хотите удалить эту статью?')) {
            try {
                const response = await apiClient(`${config.MAIN_SERVICE}/articles/${articleId}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    navigate('/my_space');
                } else {
                    throw new Error('Ошибка при удалении статьи');
                }
            } catch (error) {
                console.error('Ошибка при выполнении запроса:', error);
            }
        }
    };

    return (
        <>
            <Helmet>
                <title>Редактировать статью — StartHub</title>
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
                            <i className="fas fa-edit"></i>
                            <h1>Редактирование статьи</h1>
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
                                    value={articleCategory ? articleCategory.id : ''}
                                    onChange={(e) => {
                                        const selected = categories.find(cat => cat.id === Number(e.target.value));
                                        setArticleCategory(selected || null);
                                    }}
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

                            <div className={styles.buttonsRow}>
                                <button type="submit" className={styles.submitBtn}>
                                    <i className="fas fa-save"></i> Сохранить изменения
                                </button>
                                <button type="button" className={styles.deleteBtn} onClick={handleDelete}>
                                    <i className="fas fa-trash-alt"></i> Удалить статью
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ManageArticle;
