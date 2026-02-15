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
    const accessTokenCookie = document.cookie.split('; ').find(row => row.startsWith('accessToken='));
    const accessToken = accessTokenCookie ? accessTokenCookie.split('=')[1] : '';
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${config.MAIN_SERVICE}/news-categories`);
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
                headers: { 'Authorization': accessToken ? `Bearer ${accessToken}` : '' },
                body: formData
            });
            if (response.ok) {
                navigate('/my_space');
            } else {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Ошибка при создании новости');
            }
        } catch (error) {
            console.error('Ошибка при выполнении запроса:', error);
        }
    };

    const handleLogoUploadClick = () => fileInputRef.current.click();

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
                <title>Создать новость — StartHub</title>
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
                            <i className="fas fa-newspaper"></i>
                            <h1>Публикация новости</h1>
                        </div>

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.logoSection}>
                                <div className={styles.logoPreview} onClick={handleLogoUploadClick}>
                                    <img
                                        src={newsLogoPreview}
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
                                <label>Название новости</label>
                                <input
                                    type="text" value={newsTitle}
                                    onChange={(e) => setNewsTitle(e.target.value)}
                                    placeholder="Введите название..." required
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label>Категория</label>
                                <select
                                    value={newsCategory}
                                    onChange={(e) => setNewsCategory(e.target.value)}
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
                                <RichTextEditor content={newsContent} setContent={setNewsContent} />
                            </div>

                            <button type="submit" className={styles.submitBtn}>
                                <i className="fas fa-paper-plane"></i> Опубликовать новость
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateNews;
