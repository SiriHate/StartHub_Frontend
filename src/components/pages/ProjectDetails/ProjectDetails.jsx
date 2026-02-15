import React, { useState, useEffect } from 'react';
import styles from './ProjectDetails.module.css';
import { Helmet } from 'react-helmet';
import Menu from '../../menu/Menu';
import { useNavigate, useParams } from 'react-router-dom';
import config from '../../../config';

function ProjectDetails() {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [likes, setLikes] = useState(0);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isModerator, setIsModerator] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const navigate = useNavigate();

    const accessTokenCookie = document.cookie.split('; ').find(row => row.startsWith('accessToken='));
    const accessToken = accessTokenCookie ? accessTokenCookie.split('=')[1] : '';

    useEffect(() => {
        const checkUserRole = async () => {
            try {
                if (!accessToken) return;
                const response = await fetch(`${config.USER_SERVICE}/users/me`, {
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setIsModerator(data.role === 'MODERATOR');
                    setCurrentUser(data);
                }
            } catch (error) {
                console.error('Ошибка при проверке роли:', error);
            }
        };
        checkUserRole();
    }, []);

    useEffect(() => {
        const checkSubscription = async () => {
            try {
                if (!accessToken) return;
                const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/subscriptions`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setIsSubscribed(data);
                }
            } catch (error) {
                console.error('Ошибка при проверке подписки:', error);
            }
        };
        checkSubscription();
    }, [projectId, accessToken]);

    const fetchLikesCount = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/likes/count`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) throw new Error('Не удалось получить количество лайков');
            const data = await response.json();
            setLikes(data);
        } catch (err) {
            console.error('Ошибка при получении лайков:', err);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/comments`);
            if (!response.ok) throw new Error('Не удалось загрузить комментарии');
            const data = await response.json();
            setComments(data.map(c => ({
                id: c.id,
                author: c.author || { username: c.username },
                text: c.text,
                createdAt: c.createdAt || c.createdDate
            })));
        } catch (err) {
            console.error('Ошибка при загрузке комментариев:', err);
        }
    };

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}`);
                if (!response.ok) throw new Error('Проект не найден');
                const data = await response.json();
                setProject(data);
                await fetchLikesCount();
                await fetchComments();
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchProject();
    }, [projectId]);

    const handleLike = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/likes`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error('Не удалось поставить лайк');
            await fetchLikesCount();
        } catch (err) {
            console.error('Ошибка при отправке лайка:', err);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !accessToken) return;
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify({ text: newComment })
            });
            if (!response.ok) throw new Error('Не удалось создать комментарий');
            setNewComment('');
            await fetchComments();
        } catch (err) {
            console.error('Ошибка при создании комментария:', err);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) throw new Error('Не удалось удалить комментарий');
            await fetchComments();
        } catch (err) {
            console.error('Ошибка при удалении комментария:', err);
        }
    };

    const handleGoBack = () => navigate(-1);
    const handleMemberClick = (username) => navigate(`/members/profile/${username}`);

    const getLikesText = (count) => {
        const d1 = count % 10;
        const d2 = count % 100;
        if (d2 >= 11 && d2 <= 19) return 'человек оценили проект';
        if (d1 === 1) return 'человек оценил проект';
        if (d1 >= 2 && d1 <= 4) return 'человека оценили проект';
        return 'человек оценили проект';
    };

    const handleFeedbackClick = () => {
        if (project.hasSurvey) navigate(`/project/${projectId}/leave_feedback`);
    };

    const handleApprove = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/moderationPassed`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                body: JSON.stringify(true)
            });
            if (!response.ok) throw new Error('Ошибка при одобрении проекта');
            setProject(prev => ({...prev, moderationPassed: true}));
        } catch (error) {
            console.error('Ошибка при одобрении проекта:', error);
        }
    };

    const handleBlock = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) throw new Error('Ошибка при блокировке проекта');
            navigate('/projects');
        } catch (error) {
            console.error('Ошибка при блокировке проекта:', error);
        }
    };

    const handleSubscription = async () => {
        try {
            const method = isSubscribed ? 'DELETE' : 'POST';
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/subscriptions`, {
                method,
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (response.ok) setIsSubscribed(!isSubscribed);
        } catch (error) {
            console.error('Ошибка при изменении подписки:', error);
        }
    };

    const canDeleteComment = (comment) => {
        if (!currentUser) return false;
        if (isModerator) return true;
        return currentUser.username === comment.author?.username;
    };

    if (loading) {
        return (
            <>
                <Helmet><title>Проект — StartHub</title><body className={styles.body} /></Helmet>
                <Menu />
                <div className={styles.page}>
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Загрузка проекта...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error || !project) {
        return (
            <>
                <Helmet><title>Ошибка — StartHub</title><body className={styles.body} /></Helmet>
                <Menu />
                <div className={styles.page}>
                    <div className={styles.errorState}>
                        <i className="fas fa-exclamation-triangle"></i>
                        <p>{error || 'Проект не найден'}</p>
                        <button className={styles.backBtn} onClick={handleGoBack}>
                            <i className="fas fa-arrow-left"></i> Назад
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Helmet>
                <title>{project.name} — StartHub</title>
                <body className={styles.body} />
            </Helmet>

            {!isModerator && <Menu />}

            {isModerator && (
                <div className={styles.moderatorBar}>
                    <span className={styles.moderatorLabel}>
                        <i className="fas fa-shield-alt"></i> Модерация
                    </span>
                    <div className={styles.moderatorActions}>
                        {!project.moderationPassed && (
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

                    {/* Top bar */}
                    <div className={styles.topBar}>
                        <button className={styles.backBtn} onClick={handleGoBack}>
                            <i className="fas fa-arrow-left"></i> Назад
                        </button>
                        {!isModerator && accessToken && (
                            <button
                                className={`${styles.subscribeBtn} ${isSubscribed ? styles.subscribed : ''}`}
                                onClick={handleSubscription}
                            >
                                <i className={`fas ${isSubscribed ? 'fa-bell-slash' : 'fa-bell'}`}></i>
                                {isSubscribed ? 'Отписаться' : 'Подписаться'}
                            </button>
                        )}
                    </div>

                    {/* Hero + Description */}
                    <div className={styles.hero}>
                        <div className={styles.heroTop}>
                            <img
                                src={project.logoUrl || "/default_list_element_logo.jpg"}
                                alt={project.name}
                                className={styles.heroImage}
                                onError={e => { e.target.onerror = null; e.target.src = "/default_list_element_logo.jpg"; }}
                            />
                            <div className={styles.heroInfo}>
                                <h1 className={styles.heroTitle}>{project.name}</h1>
                                <div className={styles.metaRow}>
                                    <span className={styles.categoryBadge}>
                                        <i className="fas fa-tag"></i> {project.category}
                                    </span>
                                    {project.owner && (
                                        <span
                                            className={styles.ownerBadge}
                                            onClick={() => handleMemberClick(project.owner.username)}
                                        >
                                            <i className="fas fa-user"></i> {project.owner.username}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {project.description && (
                            <div className={styles.descriptionBlock}>
                                <p className={styles.descriptionText}>{project.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Team */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <i className="fas fa-users"></i>
                            <h2>Команда</h2>
                        </div>
                        <div className={styles.teamGrid}>
                            <div
                                className={styles.teamCard}
                                onClick={() => project.owner && handleMemberClick(project.owner.username)}
                            >
                                <div className={`${styles.teamAvatar} ${styles.teamAvatarOwner}`}>
                                    <i className="fas fa-crown"></i>
                                </div>
                                <div className={styles.teamInfo}>
                                    <span className={styles.teamName}>{project.owner?.username || 'Неизвестный'}</span>
                                    <span className={styles.teamRole}>Владелец</span>
                                </div>
                            </div>
                            {project.members && project.members.map((member) => (
                                <div
                                    key={member.id}
                                    className={styles.teamCard}
                                    onClick={() => member && handleMemberClick(member.username)}
                                >
                                    <div className={styles.teamAvatar}>
                                        <i className="fas fa-user"></i>
                                    </div>
                                    <div className={styles.teamInfo}>
                                        <span className={styles.teamName}>{member?.username || 'Неизвестный'}</span>
                                        <span className={styles.teamRole}>{member?.role || 'Участник'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions + Comments (non-moderator) */}
                    {!isModerator && (
                        <div className={styles.section}>
                            <div className={styles.actionsBar}>
                                <div className={styles.actionsRow}>
                                    <button className={styles.likeBtn} onClick={handleLike}>
                                        <i className="fas fa-heart"></i> Поддержать
                                    </button>
                                    {project.hasSurvey && (
                                        <button className={styles.feedbackBtn} onClick={handleFeedbackClick}>
                                            <i className="fas fa-comment-dots"></i> Обратная связь
                                        </button>
                                    )}
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

                            {accessToken ? (
                                <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Напишите комментарий..."
                                        className={styles.commentInput}
                                    />
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
                                                <div
                                                    className={styles.commentAuthorRow}
                                                    onClick={() => comment.author && handleMemberClick(comment.author.username)}
                                                >
                                                    <div className={styles.commentAvatarIcon}>
                                                        <i className="fas fa-user-circle"></i>
                                                    </div>
                                                    <div className={styles.commentMeta}>
                                                        <span className={styles.commentAuthor}>
                                                            {comment.author?.username || 'Неизвестный'}
                                                        </span>
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
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className={styles.deleteCommentBtn}
                                                        title="Удалить комментарий"
                                                    >
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
}

export default ProjectDetails;
