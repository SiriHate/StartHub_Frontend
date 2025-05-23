import React, {useEffect, useRef, useState} from "react";
import {Helmet} from "react-helmet";
import styles from "./ManageArticle.module.css";
import Menu from "../../menu/Menu";
import RichTextEditor from "../../editor/RichTextEditor";
import {useNavigate, useParams} from "react-router-dom";
import config from "../../../config";

const ManageArticle = () => {
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
    const {articleId} = useParams();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${config.MAIN_SERVICE}/article_categories`);
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
                const response = await fetch(`${config.MAIN_SERVICE}/articles/${articleId}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setArticleTitle(data.title);
                setExistingLogoUrl(`${config.FILE_SERVER}${data.previewUrl}`);
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

        let logoUrl = existingLogoUrl;
        if (articleLogo) {
            const formData = new FormData();
            formData.append('file', articleLogo);

            try {
                const uploadResponse = await fetch(`${config.FILE_SERVER}/upload/articleLogos`, {
                    method: 'POST',
                    body: formData,
                });

                const uploadResult = await uploadResponse.json();
                if (uploadResponse.ok) {
                    logoUrl = uploadResult.url;
                } else {
                    throw new Error('Ошибка загрузки файла: ' + uploadResult.message);
                }
            } catch (error) {
                console.error('Ошибка при выполнении запроса:', error);
                return;
            }
        }

        const articleData = {
            title: articleTitle,
            previewUrl: logoUrl,
            content: articleContent,
            category: articleCategory
        };

        try {
            const response = await fetch(`${config.MAIN_SERVICE}/articles/${articleId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken ? `Bearer ${authorizationToken}` : ''
                },
                body: JSON.stringify(articleData)
            });

            if (response.ok) {
                console.log('Статья успешно отредактирована!');
                navigate(`/article/${articleId}`);
            } else {
                throw new Error('Ошибка при редактировании статьи: ' + response.statusText);
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
        if (window.confirm('Вы уверены, что хотите удалить эту статью?')) {
            try {
                const response = await fetch(`${config.MAIN_SERVICE}/articles/${articleId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': authorizationToken ? `Bearer ${authorizationToken}` : ''
                    }
                });

                if (response.ok) {
                    console.log('Статья успешно удалена!');
                    navigate('/my_space');
                } else {
                    throw new Error('Ошибка при удалении статьи: ' + response.statusText);
                }
            } catch (error) {
                console.error('Ошибка при выполнении запроса:', error);
            }
        }
    };

    return (
        <>
            <Helmet>
                <title>Редактировать статью</title>
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            <Menu/>
            <div className={styles.editArticlePage}>
                <div className={styles.editArticleContainer}>
                    <button onClick={() => navigate(-1)} className={styles.backButton}>
                        <img src="/back-arrow.png" alt="Назад" className={styles.backIcon} />
                        <span>Назад</span>
                    </button>
                    <h2 className={styles.formTitle}>Редактирование статьи</h2>
                    <form className={styles.editArticleForm} onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="articleLogo" className={styles.centerLabel}>
                                Логотип статьи
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
                            <label htmlFor="articleTitle">Название статьи</label>
                            <input
                                type="text"
                                id="articleTitle"
                                value={articleTitle}
                                onChange={(e) => setArticleTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="articleCategory">Категория статьи</label>
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
                            <label htmlFor="articleContent">Содержание статьи</label>
                            <RichTextEditor content={articleContent} setContent={setArticleContent}/>
                        </div>
                        <button type="submit" className={styles.submitButton}>
                            Редактировать статью
                        </button>
                        <button type="button" className={styles.deleteButton} onClick={handleDelete}>
                            Удалить статью
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ManageArticle;