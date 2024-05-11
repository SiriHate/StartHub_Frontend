import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useParams, Navigate } from "react-router-dom";
import styles from "./ArticlePage.module.css";
import NavigationBar from "../../navigation_bar/NavigationBar";

const ArticlePage = () => {
    const { articleId } = useParams();
    const [article, setArticle] = useState({
        title: "",
        owner: "",
        previewUrl: "",
        category: "",
        content: ""
    });

    const [redirect, setRedirect] = useState(false);  // State to handle redirection

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const response = await fetch(`http://localhost:8083/api/v1/main/article/${articleId}`);
                if (response.ok) {
                    const data = await response.json();
                    setArticle({
                        title: data.title,
                        owner: data.owner,
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

        fetchArticle();
    }, [articleId]);

    if (redirect) {
        return <Navigate to="/not-found" replace />;
    }

    return (
        <>
            <Helmet>
                <title>{article.title}</title>
                <html className={styles.html} />
                <body className={styles.body} />
            </Helmet>
            <NavigationBar />
            <div className={styles.articleContainer}>
                <h1 className={styles.articleTitle}>{article.title}</h1>
                <div className={styles.articleMetadata}>
                    Автор: <span className={styles.articleAuthor}>{article.owner}</span> | Категория: <span
                    className={styles.articleCategory}>{article.category}</span>
                </div>
                <img src={article.previewUrl} alt="Логотип статьи" className={styles.articlePreview}/>
                <div className={styles.articleText} dangerouslySetInnerHTML={{__html: article.content}}/>
            </div>
        </>
    );
};

export default ArticlePage;
