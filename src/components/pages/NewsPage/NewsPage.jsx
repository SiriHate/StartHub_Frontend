import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useParams, Navigate } from "react-router-dom";
import styles from "./NewsPage.module.css";
import NavigationBar from "../../navigation_bar/NavigationBar";

const NewsPage = () => {
    const { newsId } = useParams();
    const [news, setNews] = useState({
        title: "",
        reporter: "",
        previewUrl: "",
        category: "",
        content: ""
    });
    const [redirect, setRedirect] = useState(false);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch(`http://localhost:8083/api/v1/main/news/${newsId}`);
                if (response.ok) {
                    const data = await response.json();
                    setNews({
                        title: data.title,
                        reporter: data.reporter,
                        previewUrl: `http://localhost:3001${data.previewUrl}`,
                        category: data.category,
                        content: data.content
                    });
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

    if (redirect) {
        return <Navigate to="/not-found" replace />;
    }

    return (
        <>
            <Helmet>
                <title>{news.title}</title>
                <html className={styles.html} />
                <body className={styles.body} />
            </Helmet>
            <NavigationBar />
            <div className={styles.newsContainer}>
                <h1 className={styles.newsTitle}>{news.title}</h1>
                <div className={styles.newsMetadata}>
                    Автор: <span className={styles.newsReporter}>{news.reporter}</span> | Категория: <span
                    className={styles.newsCategory}>{news.category}</span>
                </div>
                <img src={news.previewUrl} alt="Логотип новости" className={styles.newsPreview}/>
                <div className={styles.newsText} dangerouslySetInnerHTML={{__html: news.content}}/>
            </div>
        </>
    );
};

export default NewsPage;
