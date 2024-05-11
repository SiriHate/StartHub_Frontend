import React, { useState, useRef } from "react";
import { Helmet } from "react-helmet";
import "react-quill/dist/quill.snow.css";
import styles from "./CreateArticle.module.css";
import NavigationBar from "../../navigation_bar/NavigationBar";
import RichTextEditor from "../../editor/RichTextEditor";

const CreateArticle = () => {
    const [articleTitle, setArticleTitle] = useState("");
    const [articleLogo, setArticleLogo] = useState(null);
    const fileInputRef = useRef();
    const [articleContent, setArticleContent] = useState('');
    const [articleCategory, setArticleCategory] = useState('');
    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!articleLogo) {
            alert('Пожалуйста, загрузите логотип статьи.');
            return;
        }

        // Сначала загружаем логотип на сервер
        const formData = new FormData();
        formData.append('file', articleLogo);

        try {
            const uploadResponse = await fetch('http://localhost:3001/upload/articleLogos', {
                method: 'POST',
                body: formData,
            });

            const uploadResult = await uploadResponse.json();
            if (uploadResponse.ok) {
                const articleData = {
                    title: articleTitle,
                    previewUrl: uploadResult.url,
                    content: articleContent,
                    category: articleCategory
                };

                const response = await fetch('http://localhost:8083/api/v1/main/article', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authorizationToken ? ` ${authorizationToken}` : ''
                    },
                    body: JSON.stringify(articleData)
                });

                if (response.ok) {
                    console.log('Статья успешно создана!');
                    setArticleTitle('');
                    setArticleLogo(null);
                    setArticleContent('');
                    setArticleCategory('');
                } else {
                    throw new Error('Ошибка при создании статьи: ' + response.statusText);
                }
            } else {
                throw new Error('Ошибка загрузки файла: ' + uploadResult.message);
            }
        } catch (error) {
            console.error('Ошибка при выполнении запроса:', error);
        }
    };

    const handleLogoUploadClick = () => {
        fileInputRef.current.click();
    };

    return (
        <>
            <Helmet>
                <title>Создать статью</title>
                <html className={styles.html} />
                <body className={styles.body} />
            </Helmet>
            <NavigationBar />
            <div className={styles.createArticlePage}>
                <div className={styles.createArticleContainer}>
                    <h2 className={styles.formTitle}>Публикация статьи</h2>
                    <form className={styles.createArticleForm} onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="articleLogo" className={styles.centerLabel}>
                                Логотип статьи
                            </label>
                            <div className={styles.logoPreview}>
                                {articleLogo &&
                                    <img src={URL.createObjectURL(articleLogo)} alt="Article Logo Preview"/>}
                                <button type="button" className={styles.uploadButton} onClick={handleLogoUploadClick}>
                                    Загрузить фото
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    id="logoUpload"
                                    accept="image/*"
                                    style={{display: "none"}} // Скрыть стандартный input
                                    onChange={(e) => setArticleLogo(e.target.files[0])}
                                />
                            </div>
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
                                value={articleCategory}
                                onChange={(e) => setArticleCategory(e.target.value)}
                                required
                                className={styles.selectInput}
                            >
                                <option value="">Выберите категорию</option>
                                <option value="Технологии">Технологии</option>
                                <option value="Наука">Наука</option>
                                <option value="Спорт">Спорт</option>
                                <option value="Искусство">Искусство</option>
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
