import React, {useEffect, useState} from "react";
import {Helmet} from "react-helmet";
import {Navigate, useNavigate, useParams} from "react-router-dom";
import styles from "./ArticlePage.module.css";
import {ReactComponent as GoBackIcon} from '../../../icons/go_back.svg';
import Menu from "../../menu/Menu";
import config from "../../../config";

const ArticlePage = () => {
    const {articleId} = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState({
        title: "",
        owner: "",
        previewUrl: "",
        category: "",
        content: ""
    });
    const [loading, setLoading] = useState(true);
    const [redirect, setRedirect] = useState(false);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const response = await fetch(`${config.MAIN_SERVICE}/articles/${articleId}`);
                if (response.ok) {
                    const data = await response.json();
                    setArticle({
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

        fetchArticle();
    }, [articleId]);

    if (loading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    if (redirect) {
        return <Navigate to="/not-found" replace/>;
    }

    return (
        <>
            <Helmet>
                <title>{article.title}</title>
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            <Menu/>
            <div className={styles.articleContainer}>
                <button onClick={() => navigate(-1)} className={styles.backButton}>
                    <img src="/back-arrow.png" alt="Назад" className={styles.backIcon} />
                    <span>Назад</span>
                </button>
                <div className={styles.projectCardHeader}>
                    <h1 className={styles.articleTitle}>{article.title}</h1>
                    <img src={article.previewUrl} alt="Article preview" className={styles.articlePreview}/>
                </div>
                <div className={styles.articleMetadata}>
                    <div className={styles.projectCategory}>
                        Автор: <span className={styles.articleAuthor}>{article.owner}</span>
                    </div>
                    <div className={styles.projectCategory}>
                        Категория: <span className={styles.categoryBadge}>{article.category}</span>
                    </div>
                </div>
                <div className={styles.projectDescription}>
                    <div className={styles.articleText} dangerouslySetInnerHTML={{__html: article.content}}/>
                </div>
            </div>
        </>
    );
};

export default ArticlePage;