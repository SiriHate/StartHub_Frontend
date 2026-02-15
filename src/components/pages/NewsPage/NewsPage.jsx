import React, {useEffect, useState} from "react";
import {Helmet} from "react-helmet";
import {Navigate, useNavigate, useParams} from "react-router-dom";
import styles from "./NewsPage.module.css";
import Menu from "../../menu/Menu";
import config from '../../../config';

const NewsPage = () => {
    const {newsId} = useParams();
    const navigate = useNavigate();
    const [news, setNews] = useState({
        title: "",
        owner: "",
        logoUrl: "",
        category: "",
        content: "",
        moderationPassed: false
    });
    const [loading, setLoading] = useState(true);
    const [redirect, setRedirect] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [isModerator, setIsModerator] = useState(false);

    const accessTokenCookie = document.cookie.split('; ').find(row => row.startsWith('accessToken='));
    const accessToken = accessTokenCookie ? accessTokenCookie.split('=')[1] : '';

    useEffect(() => {
        const checkUserRole = async () => {
            try {
                const response = await fetch(`${config.USER_SERVICE}/users/me`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
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
    }, [accessToken]);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch(`${config.MAIN_SERVICE}/news/${newsId}`);
                if (response.ok) {
                    const data = await response.json();
                    setNews({
                        title: data.title,
                        owner: data.owner,
                        logoUrl: data.logoUrl || (data.previewUrl ? `${config.FILE_SERVER}${data.previewUrl}` : ""),
                        category: data.category,
                        content: data.content,
                        moderationPassed: data.moderationPassed
                    });
                    setLoading(false);
                } else {
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
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify(true)
            });
            if (!response.ok) throw new Error('Ошибка при одобрении новости');
            setNews(prev => ({...prev, moderationPassed: true}));
        } catch (error) {
            console.error('Ошибка при одобрении новости:', error);
        }
    };

    const handleBlock = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/news/${newsId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) throw new Error('Ошибка при блокировке новости');
            navigate('/articles-and-news');
        } catch (error) {
            console.error('Ошибка при блокировке новости:', error);
        }
    };

    if (redirect) {
        return <Navigate to="/not-found" replace />;
    }

    if (loading) {
        return (
            <>
                <Helmet><title>Новость — StartHub</title><body className={styles.body} /></Helmet>
                <Menu />
                <div className={styles.page}>
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Загрузка новости...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Helmet>
                <title>{news.title} — StartHub</title>
                <body className={styles.body} />
            </Helmet>

            {isMember && <Menu />}

            {isModerator && (
                <div className={styles.moderatorBar}>
                    <span className={styles.moderatorLabel}>
                        <i className="fas fa-shield-alt"></i> Модерация
                    </span>
                    <div className={styles.moderatorActions}>
                        {!news.moderationPassed && (
                            <button onClick={handleApprove} className={styles.approveBtn}>
                                <i className="fas fa-check"></i> Одобрить
                            </button>
                        )}
                        <button onClick={handleBlock} className={styles.blockBtn}>
                            <i className="fas fa-ban"></i> Заблокировать
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.topBar}>
                        <button className={styles.backBtn} onClick={() => navigate(-1)}>
                            <i className="fas fa-arrow-left"></i> Назад
                        </button>
                    </div>

                    <div className={styles.hero}>
                        {news.logoUrl && (
                            <img
                                src={news.logoUrl}
                                alt={news.title}
                                className={styles.heroImage}
                                onError={e => { e.target.onerror = null; e.target.src = '/default_list_element_logo.jpg'; }}
                            />
                        )}
                        <div className={styles.heroInfo}>
                            <h1 className={styles.heroTitle}>{news.title}</h1>
                            <div className={styles.metaRow}>
                                {news.category && (
                                    <span className={styles.categoryBadge}>
                                        <i className="fas fa-tag"></i> {news.category}
                                    </span>
                                )}
                                {news.owner && (
                                    <span className={styles.ownerBadge}>
                                        <i className="fas fa-user"></i> {news.owner}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <i className="fas fa-align-left"></i>
                            <h2>Содержание</h2>
                        </div>
                        <div className={styles.contentBody} dangerouslySetInnerHTML={{__html: news.content}} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default NewsPage;
