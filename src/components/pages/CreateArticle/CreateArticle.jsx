    import React, {useEffect, useRef, useState} from "react";
    import {Helmet} from "react-helmet";
    import styles from "./CreateArticle.module.css";
    import Menu from "../../menu/Menu";
    import RichTextEditor from "../../editor/RichTextEditor";
    import {useNavigate} from "react-router-dom";
    import config from "../../../config";

    const CreateArticle = () => {
        const [articleTitle, setArticleTitle] = useState("");
        const [articleLogo, setArticleLogo] = useState('/default_list_element_logo.jpg');
        const [articleLogoPreview, setArticleLogoPreview] = useState('/default_list_element_logo.jpg');
        const fileInputRef = useRef();
        const [articleContent, setArticleContent] = useState('');
        const [articleCategory, setArticleCategory] = useState(null);
        const [categories, setCategories] = useState([]);
        const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
        const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';
        const navigate = useNavigate();

        useEffect(() => {
            const fetchCategories = async () => {
                try {
                    const response = await fetch(`${config.MAIN_SERVICE}/article-categories`);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
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
                const response = await fetch(`${config.MAIN_SERVICE}/articles`, {
                    method: 'POST',
                    headers: {
                        'Authorization': authorizationToken ? ` ${authorizationToken}` : ''
                    },
                    body: formData
                });

                if (response.ok) {
                    const createdArticle = await response.json();
                    console.log('Статья успешно создана:', createdArticle);
                    setArticleTitle('');
                    setArticleLogo('/default_list_element_logo.jpg');
                    setArticleLogoPreview('/default_list_element_logo.jpg');
                    setArticleContent('');
                    setArticleCategory(null);
                    navigate('/my_space');
                } else {
                    const error = await response.json();
                    throw new Error(error.message || 'Ошибка при создании статьи');
                }
            } catch (error) {
                console.error('Ошибка при отправке формы:', error);
            }
        };

        const handleLogoUploadClick = () => {
            fileInputRef.current.click();
        };

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
                    <title>Создать статью</title>
                    <html className={styles.html}/>
                    <body className={styles.body}/>
                </Helmet>
                <Menu/>
                <div className={styles.createArticlePage}>
                    <div className={styles.createArticleContainer}>
                        <button onClick={() => navigate(-1)} className={styles.backButton}>
                            <img src="/back-arrow.png" alt="Назад" className={styles.backIcon} />
                            <span>Назад</span>
                        </button>
                        <h2 className={styles.formTitle}>Публикация статьи</h2>
                        <form className={styles.createArticleForm} onSubmit={handleSubmit}>
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
                                    value={articleCategory || ''}
                                    onChange={(e) => setArticleCategory(Number(e.target.value))}
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
                                Опубликовать статью
                            </button>
                        </form>
                    </div>
                </div>
            </>
        );
    };

    export default CreateArticle;