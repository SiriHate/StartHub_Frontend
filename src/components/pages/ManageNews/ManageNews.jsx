import React, {useEffect, useRef, useState} from "react";
import {Helmet} from "react-helmet";
import styles from "./ManageNews.module.css";
import Menu from "../../menu/Menu";
import RichTextEditor from "../../editor/RichTextEditor";
import {useNavigate, useParams} from "react-router-dom";
import config from "../../../config";

const ManageNews = () => {
    const [articleTitle, setArticleTitle] = useState("");
    const [articleLogo, setArticleLogo] = useState(null);
    const [articleLogoPreview, setArticleLogoPreview] = useState('/default_list_element_logo.jpg');
    const [existingLogoUrl, setExistingLogoUrl] = useState("");
    const fileInputRef = useRef();
    const [articleContent, setArticleContent] = useState('');
    const [articleCategory, setArticleCategory] = useState(null);
    const [categories, setCategories] = useState([]);
    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';
    const navigate = useNavigate();
    const {newsId} = useParams();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${config.MAIN_SERVICE}/news-categories`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
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
                const response = await fetch(`${config.MAIN_SERVICE}/news/${newsId}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
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
    }, [newsId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newsData = {
            title: articleTitle,
            content: articleContent || '',
            categoryId: articleCategory ? articleCategory.id : null
        };

        const formData = new FormData();
        formData.append('news', new Blob([JSON.stringify(newsData)], { type: 'application/json' }));
        if (articleLogo instanceof File) {
            formData.append('logo', articleLogo);
        }

        try {
            const response = await fetch(`${config.MAIN_SERVICE}/news/${newsId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': authorizationToken ? `Bearer ${authorizationToken}` : ''
                },
                body: formData
            });

            if (response.ok) {
                console.log('Новость успешно отредактирована!');
                navigate(`/news/${newsId}`);
            } else {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Ошибка при редактировании новости');
            }
        } catch (error) {
            console.error('Ошибка при выполнении запроса:', error);
        }
    };

    const handleLogoUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setArticleLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setArticleLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Вы уверены, что хотите удалить эту новость?')) {
            try {
                const response = await fetch(`${config.MAIN_SERVICE}/news/${newsId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': authorizationToken ? `Bearer ${authorizationToken}` : ''
                    }
                });

                if (response.ok) {
                    console.log('Новость успешно удалена!');
                    navigate('/my_space');
                } else {
                    throw new Error('Ошибка при удалении новости: ' + response.statusText);
                }
            } catch (error) {
                console.error('Ошибка при выполнении запроса:', error);
            }
        }
    };

    return (
        <>
            <Helmet>
                <title>Редактировать новость</title>
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            <Menu/>
            <div className={styles.editArticlePage}>
                <div className={styles.editArticleContainer}>
                    <button onClick={() => navigate(-1)} className={styles.backButton}>
                        <img src="/back-arrow.png" alt="Назад" className={styles.backIcon}/>
                        <span>Назад</span>
                    </button>
                    <h2 className={styles.formTitle}>Редактирование новости</h2>
                    <form className={styles.editArticleForm} onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="articleLogo" className={styles.centerLabel}>
                                Логотип новости
                            </label>
                            <div className={styles.logoPreview}>
                                <img
                                    src={articleLogoPreview}
                                    alt="Article Logo Preview"
                                    className={styles.logoImage}
                                    onError={(e) => e.target.src = '/default_list_element_logo.jpg'}
                                />
                            </div>
                            <button type="button" className={styles.uploadButton} onClick={handleLogoUploadClick}>
                                Загрузить фото
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                id="logoUpload"
                                accept="image/*"
                                style={{display: "none"}}
                                onChange={handleLogoChange}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="articleTitle">Название новости</label>
                            <input
                                type="text"
                                id="articleTitle"
                                value={articleTitle}
                                onChange={(e) => setArticleTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="articleCategory">Категория новости</label>
                            <select
                                id="articleCategory"
                                value={articleCategory ? articleCategory.id : ''}
                                onChange={(e) => {
                                    const selected = categories.find(cat => cat.id === Number(e.target.value));
                                    setArticleCategory(selected || null);
                                }}
                                required
                                className={styles.selectInput}
                            >
                                <option value="">Выберите категорию</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="articleContent">Содержание новости</label>
                            <RichTextEditor content={articleContent} setContent={setArticleContent}/>
                        </div>
                        <button type="submit" className={styles.submitButton}>
                            Редактировать новость
                        </button>
                        <button type="button" className={styles.deleteButton} onClick={handleDelete}>
                            Удалить новость
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ManageNews;
