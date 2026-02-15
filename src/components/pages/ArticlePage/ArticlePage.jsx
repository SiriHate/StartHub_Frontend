import React, {useEffect, useState} from "react";
import {Helmet} from "react-helmet";
import {Navigate, useNavigate, useParams} from "react-router-dom";
import styles from "./ArticlePage.module.css";
import Menu from "../../menu/Menu";
import config from "../../../config";
import apiClient, { getCookie } from "../../../api/apiClient";

const ArticlePage = () => {
    const {articleId} = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState({
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
    const [currentUser, setCurrentUser] = useState(null);
    const [likes, setLikes] = useState(0);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        const checkUserRole = async () => {
            try {
                const response = await apiClient(`${config.USER_SERVICE}/users/me`, {
                    headers: { 'Content-Type': 'application/json' }
                });
                if (response.ok) {
                    const data = await response.json();
                    setIsMember(data.role === 'MEMBER');
                    setIsModerator(data.role === 'MODERATOR');
                    setCurrentUser(data);
                }
            } catch (error) {
                console.error('Ошибка при проверке роли пользователя:', error);
            }
        };
        checkUserRole();
    }, []);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const response = await apiClient(`${config.MAIN_SERVICE}/articles/${articleId}`);
                if (response.ok) {
                    const data = await response.json();
                    setArticle({
                        title: data.title,
                        owner: data.owner,
                        logoUrl: data.logoUrl || (data.previewUrl ? `${config.FILE_SERVER}${data.previewUrl}` : ""),
                        category: data.category,
                        content: data.content,
                        moderationPassed: data.moderationPassed
                    });
                    await fetchLikesCount();
                    await fetchComments();
                    setLoading(false);
                } else {
                    setRedirect(true);
                }
            } catch (error) {
                console.error('Ошибка при выполнении запроса:', error);
                setRedirect(true);
            }
        };
        fetchArticle();
    }, [articleId]);

    const fetchLikesCount = async () => {
        try {
            const response = await apiClient(`${config.MAIN_SERVICE}/articles/${articleId}/likes/count`);
            if (response.ok) { const data = await response.json(); setLikes(data); }
        } catch (err) { console.error(err); }
    };

    const fetchComments = async () => {
        try {
            const response = await apiClient(`${config.MAIN_SERVICE}/articles/${articleId}/comments`);
            if (response.ok) {
                const data = await response.json();
                setComments(data.map(c => ({
                    id: c.id,
                    author: c.author || { username: c.username },
                    text: c.text,
                    createdAt: c.createdAt || c.createdDate
                })));
            }
        } catch (err) { console.error(err); }
    };

    const handleLike = async () => {
        try {
            const response = await apiClient(`${config.MAIN_SERVICE}/articles/${articleId}/likes`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }
            });
            if (response.ok) await fetchLikesCount();
        } catch (err) { console.error(err); }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !getCookie('accessToken')) return;
        try {
            const response = await apiClient(`${config.MAIN_SERVICE}/articles/${articleId}/comments`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newComment })
            });
            if (response.ok) { setNewComment(''); await fetchComments(); }
        } catch (err) { console.error(err); }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const response = await apiClient(`${config.MAIN_SERVICE}/article-comments/${commentId}`, { method: 'DELETE' });
            if (response.ok) await fetchComments();
        } catch (err) { console.error(err); }
    };

    const canDeleteComment = (comment) => {
        if (!currentUser) return false;
        if (isModerator) return true;
        return currentUser.username === comment.author?.username;
    };

    const getLikesText = (count) => {
        const d1 = count % 10;
        const d2 = count % 100;
        if (d2 >= 11 && d2 <= 19) return 'человек оценили';
        if (d1 === 1) return 'человек оценил';
        if (d1 >= 2 && d1 <= 4) return 'человека оценили';
        return 'человек оценили';
    };

    const handleApprove = async () => {
        try {
            const response = await apiClient(`${config.MAIN_SERVICE}/articles/${articleId}/moderationPassed`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(true)
            });
            if (!response.ok) throw new Error('Ошибка при одобрении статьи');
            setArticle(prev => ({...prev, moderationPassed: true}));
        } catch (error) {
            console.error('Ошибка при одобрении статьи:', error);
        }
    };

    const handleBlock = async () => {
        try {
            const response = await apiClient(`${config.MAIN_SERVICE}/articles/${articleId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error('Ошибка при блокировке статьи');
            navigate('/articles-and-news');
        } catch (error) {
            console.error('Ошибка при блокировке статьи:', error);
        }
    };

    if (redirect) {
        return <Navigate to="/not-found" replace />;
    }

    if (loading) {
        return (
            <>
                <Helmet><title>Статья — StartHub</title><body className={styles.body} /></Helmet>
                <Menu />
                <div className={styles.page}>
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Загрузка статьи...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Helmet>
                <title>{article.title} — StartHub</title>
                <body className={styles.body} />
            </Helmet>

            {isMember && <Menu />}

            {isModerator && (
                <div className={styles.moderatorBar}>
                    <span className={styles.moderatorLabel}>
                        <i className="fas fa-shield-alt"></i> Модерация
                    </span>
                    <div className={styles.moderatorActions}>
                        {!article.moderationPassed && (
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
                        {article.logoUrl && (
                            <img
                                src={article.logoUrl}
                                alt={article.title}
                                className={styles.heroImage}
                                onError={e => { e.target.onerror = null; e.target.src = '/default_list_element_logo.jpg'; }}
                            />
                        )}
                        <div className={styles.heroInfo}>
                            <h1 className={styles.heroTitle}>{article.title}</h1>
                            <div className={styles.metaRow}>
                                {article.category && (
                                    <span className={styles.categoryBadge}>
                                        <i className="fas fa-tag"></i> {article.category}
                                    </span>
                                )}
                                {article.owner && (
                                    <span className={styles.ownerBadge}>
                                        <i className="fas fa-user"></i> {article.owner}
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
                        <div className={styles.contentBody} dangerouslySetInnerHTML={{__html: article.content}} />
                    </div>

                    {!isModerator && (
                        <div className={styles.section}>
                            <div className={styles.actionsBar}>
                                <div className={styles.actionsRow}>
                                    <button className={styles.likeBtn} onClick={handleLike}>
                                        <i className="fas fa-heart"></i> Поддержать
                                    </button>
                                </div>
                                <div className={styles.likesChip}>
                                    <span className={styles.likesNumber}>{likes}</span>
                                    <span className={styles.likesText}>{getLikesText(likes)}</span>
                                </div>
                            </div>

                            <div className={styles.commentsDivider}>
                                <div className={styles.sectionHeader}>
                                    <i className="fas fa-comments"></i>
                                    <h2>Комментарии</h2>
                                    <span className={styles.commentCount}>{comments.length}</span>
                                </div>
                            </div>

                            {getCookie('accessToken') ? (
                                <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)}
                                              placeholder="Напишите комментарий..." className={styles.commentInput} />
                                    <button type="submit" className={styles.commentSendBtn} disabled={!newComment.trim()}>
                                        <i className="fas fa-paper-plane"></i> Отправить
                                    </button>
                                </form>
                            ) : (
                                <p className={styles.loginPrompt}>Войдите, чтобы оставить комментарий</p>
                            )}

                            {comments.length > 0 ? (
                                <div className={styles.commentsList}>
                                    {comments.map((comment) => (
                                        <div key={comment.id} className={styles.commentCard}>
                                            <div className={styles.commentTop}>
                                                <div className={styles.commentAuthorRow}
                                                     onClick={() => comment.author && navigate(`/members/profile/${comment.author.username}`)}>
                                                    <div className={styles.commentAvatarIcon}>
                                                        <i className="fas fa-user-circle"></i>
                                                    </div>
                                                    <div className={styles.commentMeta}>
                                                        <span className={styles.commentAuthor}>{comment.author?.username || 'Неизвестный'}</span>
                                                        {comment.createdAt && (
                                                            <span className={styles.commentDate}>
                                                                {new Date(comment.createdAt).toLocaleDateString('ru-RU', {
                                                                    year: 'numeric', month: 'short', day: 'numeric',
                                                                    hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {canDeleteComment(comment) && (
                                                    <button onClick={() => handleDeleteComment(comment.id)} className={styles.deleteCommentBtn}>
                                                        <i className="fas fa-trash-alt"></i>
                                                    </button>
                                                )}
                                            </div>
                                            <p className={styles.commentText}>{comment.text}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyComments}>
                                    <i className="fas fa-comment-slash"></i>
                                    <p>Комментариев пока нет</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ArticlePage;
