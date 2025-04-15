import React, {useEffect, useRef, useState} from "react";
import {Helmet} from "react-helmet";
import "quill/dist/quill.snow.css";
import styles from "./CreateNews.module.css";
import Menu from "../../menu/Menu";
import {ReactComponent as GoBackIcon} from '../../../icons/go_back.svg';
import RichTextEditor from "../../editor/RichTextEditor";
import {useNavigate} from "react-router-dom";
import config from "../../../config";

const CreateNews = () => {
    const [newsTitle, setNewsTitle] = useState("");
    const [newsLogo, setNewsLogo] = useState(null);
    const fileInputRef = useRef();
    const [newsContent, setNewsContent] = useState('');
    const [newsCategory, setNewsCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${config.MAIN_SERVICE}/news_categories`);
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

        if (!newsLogo) {
            alert('Пожалуйста, загрузите логотип новости.');
            return;
        }

        const formData = new FormData();
        formData.append('file', newsLogo);

        try {
            const uploadResponse = await fetch(`${config.FILE_SERVER}/upload/newsLogos`, {
                method: 'POST',
                body: formData,
            });

            const uploadResult = await uploadResponse.json();

            if (uploadResponse.ok) {
                const newsData = {
                    title: newsTitle,
                    previewUrl: uploadResult.url,
                    content: newsContent,
                    categoryId: newsCategory // Changed to send the category ID
                };

                const response = await fetch(`${config.MAIN_SERVICE}/news`, {
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
                    navigate('/my_space'); // Redirect to /my_space
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
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            <Menu/>
            <div className={styles.createNewsPage}>
                <div className={styles.createNewsContainer}>
                    <button onClick={() => navigate(-1)} className={styles.backButton}>
                        <img src="/back-arrow.png" alt="Назад" className={styles.backIcon} />
                        <span>Назад</span>
                    </button>
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
                            <label htmlFor="newsTitle">Название новости</label>
                            <input
                                type="text"
                                id="newsTitle"
                                value={newsTitle}
                                onChange={(e) => setNewsTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="newsCategory">Категория новости</label>
                            <select
                                id="newsCategory"
                                value={newsCategory}
                                onChange={(e) => setNewsCategory(e.target.value)}
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
                            <label htmlFor="newsContent">Содержание новости</label>
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