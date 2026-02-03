import React, {useEffect, useRef, useState} from "react";
import {Helmet} from "react-helmet";
import "quill/dist/quill.snow.css";
import styles from "./CreateNews.module.css";
import Menu from "../../menu/Menu";
import RichTextEditor from "../../editor/RichTextEditor";
import {useNavigate} from "react-router-dom";
import config from "../../../config";

const CreateNews = () => {
    const [newsTitle, setNewsTitle] = useState("");
    const [newsLogo, setNewsLogo] = useState('/default_list_element_logo.jpg');
    const [newsLogoPreview, setNewsLogoPreview] = useState('/default_list_element_logo.jpg');
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
                const response = await fetch(`${config.MAIN_SERVICE}/news-categories`);
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

        if (!newsLogo || typeof newsLogo === 'string') {
            alert('Пожалуйста, загрузите логотип новости.');
            return;
        }

        const formData = new FormData();
        const newsData = {
            title: newsTitle,
            content: newsContent || '',
            categoryId: newsCategory ? Number(newsCategory) : null
        };
        formData.append('news', new Blob([JSON.stringify(newsData)], { type: 'application/json' }));
        formData.append('logo', newsLogo);

        try {
            const response = await fetch(`${config.MAIN_SERVICE}/news`, {
                method: 'POST',
                headers: {
                    'Authorization': authorizationToken ? ` ${authorizationToken}` : ''
                },
                body: formData
            });

            if (response.ok) {
                console.log('Новость успешно создана!');
                setNewsTitle('');
                setNewsLogo('/default_list_element_logo.jpg');
                setNewsLogoPreview('/default_list_element_logo.jpg');
                setNewsContent('');
                setNewsCategory('');
                navigate('/my_space');
            } else {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Ошибка при создании новости');
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
            setNewsLogo(file);
            setNewsLogoPreview(URL.createObjectURL(file));
        }
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
                            <div className={styles.logoPreview}>
                                <img
                                    src={newsLogoPreview}
                                    alt="News Logo Preview"
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