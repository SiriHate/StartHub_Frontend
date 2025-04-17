import React, {useEffect, useState} from "react";
import {Helmet} from "react-helmet";
import {Navigate, useNavigate, useParams} from "react-router-dom";
import styles from "./ArticlePage.module.css";
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
        content: "",
        moderationPassed: false
    });
    const [loading, setLoading] = useState(true);
    const [redirect, setRedirect] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [isModerator, setIsModerator] = useState(false);

    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

    useEffect(() => {
        const checkUserRole = async () => {
            try {
                const response = await fetch(`${config.USER_SERVICE}/users/me`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authorizationToken
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setIsMember(data.role === 'MEMBER');
                    setIsModerator(data.role === 'MODERATOR');
                }
            } catch (error) {
                console.error('Ошибка при проверке роли пользователя:', error);
            }
        };

        checkUserRole();
    }, [authorizationToken]);

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
                        content: data.content,
                        moderationPassed: data.moderationPassed
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

    const handleApprove = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/articles/${articleId}/moderationPassed`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken
                },
                body: JSON.stringify(true)
            });

            if (!response.ok) {
                throw new Error('Ошибка при одобрении статьи');
            }

            setArticle(prev => ({...prev, moderationPassed: true}));
        } catch (error) {
            console.error('Ошибка при одобрении статьи:', error);
        }
    };

    const handleBlock = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/articles/${articleId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при блокировке статьи');
            }

            navigate('/articles-and-news');
        } catch (error) {
            console.error('Ошибка при блокировке статьи:', error);
        }
    };

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
            {isMember && <Menu/>}
            {isModerator && (
                <div className={styles.moderatorPanel}>
                    <h3 className={styles.moderatorPanelTitle}>Действия модератора</h3>
                    <div className={styles.moderatorPanelActions}>
                        {!article.moderationPassed && (
                            <button onClick={handleApprove} className={styles.approveButton}>
                                Одобрить
                            </button>
                        )}
                        <button onClick={handleBlock} className={styles.blockButton}>
                            Заблокировать
                        </button>
                    </div>
                </div>
            )}
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