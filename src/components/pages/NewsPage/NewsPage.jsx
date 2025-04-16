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

        fetchNews();
    }, [newsId]);

    const handleApprove = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/news/${newsId}/moderationPassed`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken
                },
                body: JSON.stringify(true)
            });

            if (!response.ok) {
                throw new Error('Ошибка при одобрении новости');
            }

            setNews(prev => ({...prev, moderationPassed: true}));
        } catch (error) {
            console.error('Ошибка при одобрении новости:', error);
        }
    };

    const handleBlock = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/news/${newsId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при блокировке новости');
            }

            navigate('/articles-and-news');
        } catch (error) {
            console.error('Ошибка при блокировке новости:', error);
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
                <title>{news.title}</title>
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            {isMember && <Menu/>}
            {isModerator && (
                <div className={styles.moderatorPanel}>
                    <h3 className={styles.moderatorPanelTitle}>Действия модератора</h3>
                    <div className={styles.moderatorPanelActions}>
                        {!news.moderationPassed && (
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
