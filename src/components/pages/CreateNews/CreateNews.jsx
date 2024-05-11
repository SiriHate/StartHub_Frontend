import React, { useState, useRef } from "react";
import { Helmet } from "react-helmet";
import "react-quill/dist/quill.snow.css";
import styles from "./CreateNews.module.css";
import NavigationBar from "../../navigation_bar/NavigationBar";
import RichTextEditor from "../../editor/RichTextEditor";

const CreateNews = () => {
    const [newsTitle, setNewsTitle] = useState("");
    const [newsLogo, setNewsLogo] = useState(null);
    const fileInputRef = useRef();
    const [newsContent, setNewsContent] = useState('');
    const [newsCategory, setNewsCategory] = useState('');
    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!newsLogo) {
            alert('Пожалуйста, загрузите логотип новости.');
            return;
        }

        const formData = new FormData();
        formData.append('file', newsLogo);

        try {
            const uploadResponse = await fetch('http://localhost:3001/upload/newsLogos', {
                method: 'POST',
                body: formData,
            });

            const uploadResult = await uploadResponse.json();

            if (uploadResponse.ok) {
                const newsData = {
                    title: newsTitle,
                    previewUrl: uploadResult.url,
                    content: newsContent,
                    category: newsCategory
                };

                const response = await fetch('http://localhost:8083/api/v1/main/news', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authorizationToken ? ` ${authorizationToken}` : ''
                    },
                    body: JSON.stringify(newsData)
                });

                if (response.ok) {
                    console.log('Новость успешно создана!');
                    setNewsTitle('');
                    setNewsLogo(null);
                    setNewsContent('');
                    setNewsCategory('');
                } else {
                    throw new Error('Ошибка при создании новости: ' + response.statusText);
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
                <title>Создать новость</title>
                <html className={styles.html} />
                <body className={styles.body} />
            </Helmet>
            <NavigationBar />
            <div className={styles.createNewsPage}>
                <div className={styles.createNewsContainer}>
                    <h2 className={styles.formTitle}>Публикация новости</h2>
                    <form className={styles.createNewsForm} onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="logoUpload" className={styles.centerLabel}>
                                Логотип новостной публикации
                            </label>
                            <div className={styles.logoPreview}>
                                {newsLogo &&
                                    <img src={URL.createObjectURL(newsLogo)} alt="News Logo Preview"/>}
                                <button type="button" className={styles.uploadButton} onClick={handleLogoUploadClick}>
                                    Загрузить фото
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    id="logoUpload"
                                    accept="image/*"
                                    style={{display: "none"}}
                                    onChange={(e) => setNewsLogo(e.target.files[0])}
                                />
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="articleTitle">Название новости</label>
                            <input
                                type="text"
                                id="articleTitle"
                                value={newsTitle}
                                onChange={(e) => setNewsTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="articleCategory">Категория новости</label>
                            <select
                                id="articleCategory"
                                value={newsCategory}
                                onChange={(e) => setNewsCategory(e.target.value)}
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
                            <label htmlFor="articleContent">Содержание новости</label>
                            <RichTextEditor content={newsContent} setContent={setNewsContent}/>
                        </div>
                        <button type="submit" className={styles.submitButton}>
                            Опубликовать новость
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CreateNews;