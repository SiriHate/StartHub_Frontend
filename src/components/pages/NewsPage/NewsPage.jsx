import React, {useEffect, useState} from "react";
import {Helmet} from "react-helmet";
import {Navigate, useNavigate, useParams} from "react-router-dom";
import styles from "./NewsPage.module.css";
import {ReactComponent as GoBackIcon} from '../../../icons/go_back.svg';
import Menu from "../../menu/Menu";
import config from '../../../config';

const NewsPage = () => {
    const {newsId} = useParams();
    const navigate = useNavigate();
    const [news, setNews] = useState({
        title: "",
        owner: "",
        previewUrl: "",
        category: "",
        content: ""
    });
    const [loading, setLoading] = useState(true);
    const [redirect, setRedirect] = useState(false);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch(`${config.MAIN_SERVICE}/news/${newsId}`);
                if (response.ok) {
                    const data = await response.json();
                    setNews({
                        title: data.title,
                        owner: data.owner,
                        previewUrl: `${config.FILE_SERVER}${data.previewUrl}`,
                        category: data.category,
                        content: data.content
                    });
                    setLoading(false);
                } else {
                    console.error('Ошибка при получении данных:', response.status);
                    setRedirect(true);
                }
            } catch (error) {
                console.error('Ошибка при выполнении запроса:', error);
                setRedirect(true);
            }
        };

        fetchNews();
    }, [newsId]);

    if (loading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    if (redirect) {
        return <Navigate to="/not-found" replace/>;
    }

    return (
        <>
            <Helmet>
                <title>{news.title}</title>
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            <Menu/>
            <div className={styles.newsContainer}>
                <button onClick={() => navigate(-1)} className={styles.backButton}>
                    <img src="/back-arrow.png" alt="Назад" className={styles.backIcon} />
                    <span>Назад</span>
                </button>
                <div className={styles.projectCardHeader}>
                    <h1 className={styles.newsTitle}>{news.title}</h1>
                    <img src={news.previewUrl} alt="News preview" className={styles.newsPreview}/>
                </div>
                <div className={styles.newsMetadata}>
                    <div className={styles.projectCategory}>
                        Автор: <span className={styles.newsOwner}>{news.owner}</span>
                    </div>
                    <div className={styles.projectCategory}>
                        Категория: <span className={styles.categoryBadge}>{news.category}</span>
                    </div>
                </div>
                <div className={styles.projectDescription}>
                    <div className={styles.newsText} dangerouslySetInnerHTML={{__html: news.content}}/>
                </div>
            </div>
        </>
    );
};

export default NewsPage;
