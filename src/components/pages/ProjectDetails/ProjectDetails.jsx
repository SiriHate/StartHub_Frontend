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
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [likes, setLikes] = useState(0);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isModerator, setIsModerator] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const navigate = useNavigate();

    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

    useEffect(() => {
        const checkUserRole = async () => {
            try {
                if (!authorizationToken) {
                    return;
                }

                const response = await fetch(`${config.USER_SERVICE}/users/me`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authorizationToken
                    }
                });

                if (response.ok) {
                    const data = await response.json();
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
        const checkSubscription = async () => {
            try {
                if (!authorizationToken) {
                    return;
                }

                const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/subscriptions`, {
                    headers: {
                        'Authorization': authorizationToken
                    }
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
    }, [projectId, authorizationToken]);

    const fetchLikesCount = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/likes/count`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) {
                throw new Error('Не удалось получить количество лайков');
            }
            const data = await response.json();
            setLikes(data);
        } catch (err) {
            console.error('Ошибка при получении количества лайков:', err);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/comments`);
            if (!response.ok) {
                throw new Error('Не удалось загрузить комментарии');
            }
            const data = await response.json();
            const formattedComments = data.map(comment => ({
                id: comment.id,
                author: {
                    username: comment.username
                },
                text: comment.text,
                createdDate: comment.createdDate
            }));
            setComments(formattedComments);
        } catch (err) {
            console.error('Ошибка при загрузке комментариев:', err);
        }
    };

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}`);
                if (!response.ok) {
                    throw new Error('Проект не найден');
                }
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

    const toggleFeedbackForm = () => {
        setFeedbackVisible(!feedbackVisible);
    };

    const handleLike = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/likes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Не удалось поставить лайк');
            }

            await fetchLikesCount();
        } catch (err) {
            console.error('Ошибка при отправке лайка:', err);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !authorizationToken) return;

        try {
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken
                },
                body: JSON.stringify({ text: newComment })
            });

            if (!response.ok) {
                throw new Error('Не удалось создать комментарий');
            }

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
                headers: {
                    'Authorization': authorizationToken
                }
            });

            if (!response.ok) {
                throw new Error('Не удалось удалить комментарий');
            }

            await fetchComments();
        } catch (err) {
            console.error('Ошибка при удалении комментария:', err);
        }
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleMemberClick = (username) => {
        navigate(`/members/profile/${username}`);
    };

    const handleCommentClick = (username) => {
        navigate(`/members/profile/${username}`);
    };

    const getLikesText = (count) => {
        const lastDigit = count % 10;
        const lastTwoDigits = count % 100;

        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
            return 'человек оценили проект';
        }

        switch (lastDigit) {
            case 1:
                return 'человек оценил проект';
            case 2:
            case 3:
            case 4:
                return 'человека оценили проект';
            default:
                return 'человек оценили проект';
        }
    };

    const handleFeedbackClick = () => {
        if (project.hasSurvey) {
            navigate(`/project/${projectId}/leave_feedback`);
        }
    };

    const handleApprove = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/moderationPassed`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken
                },
                body: JSON.stringify(true)
            });

            if (!response.ok) {
                throw new Error('Ошибка при одобрении проекта');
            }

            setProject(prev => ({...prev, moderationPassed: true}));
        } catch (error) {
            console.error('Ошибка при одобрении проекта:', error);
        }
    };

    const handleBlock = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при блокировке проекта');
            }

            navigate('/projects');
        } catch (error) {
            console.error('Ошибка при блокировке проекта:', error);
        }
    };

    const handleSubscription = async () => {
        try {
            const endpoint = isSubscribed ? 'DELETE' : 'POST';
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/subscriptions`, {
                method: endpoint,
                headers: {
                    'Authorization': authorizationToken
                }
            });

            if (response.ok) {
                setIsSubscribed(!isSubscribed);
            }
        } catch (error) {
            console.error('Ошибка при изменении подписки:', error);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    if (!project) {
        return <div className={styles.error}>Проект не найден</div>;
    }

    return (
        <>
            <Helmet>
                <title>{project.projectName} - Детали проекта</title>
                <html className={styles.html} />
                <body className={styles.body} />
            </Helmet>
            {!isModerator && <Menu />}
            {isModerator && (
                <div className={styles.moderatorPanel}>
                    <h3 className={styles.moderatorPanelTitle}>Действия модератора</h3>
                    <div className={styles.moderatorPanelActions}>
                        {!project.moderationPassed && (
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
            <div className={styles.projectDetailsPage}>
                <div className={styles.projectCard}>
                    <div className={styles.header}>
                        <button className={styles.backButton} onClick={handleGoBack}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Назад
                        </button>
                        {!isModerator && (
                            <button 
                                className={`${styles.backButton} ${isSubscribed ? styles.active : ''}`} 
                                onClick={handleSubscription}
                            >
                                {isSubscribed ? 'Отписаться' : 'Подписаться'}
                            </button>
                        )}
                    </div>
                    <div className={styles.projectCardHeader}>
                        <h1 className={styles.projectTitle}>{project.projectName}</h1>
                        <img
                            src={project.projectLogoUrl ? `${config.FILE_SERVER}${project.projectLogoUrl}` : "/default_list_element_logo.jpg"}
                            alt={project.projectName}
                            className={styles.projectImage}
                            onError={e => { e.target.onerror = null; e.target.src = "/default_list_element_logo.jpg"; }}
                        />
                    </div>

                    <div className={styles.projectMeta}>
                        <div className={styles.projectCategory}>
                            Категория:
                            <span className={styles.categoryBadge}>{project.category}</span>
                        </div>
                    </div>

                    <div className={styles.projectDescription}>
                        <h2>Описание проекта</h2>
                        <p>{project.projectDescription}</p>
                    </div>

                    <div className={styles.projectTeam}>
                        <h2>Команда проекта</h2>
                        <div className={styles.teamList}>
                            <div 
                                className={styles.teamMember} 
                                onClick={() => project.projectOwner && handleMemberClick(project.projectOwner.username)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className={styles.memberInfo}>
                                    <h3 className={styles.memberName}>{project.projectOwner?.username || 'Неизвестный пользователь'}</h3>
                                    <p className={styles.memberRole}>Владелец проекта</p>
                                </div>
                            </div>
                            {project.members && project.members.map((member) => (
                                <div 
                                    key={member.id} 
                                    className={styles.teamMember}
                                    onClick={() => member && handleMemberClick(member.username)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className={styles.memberInfo}>
                                        <h3 className={styles.memberName}>{member?.username || 'Неизвестный пользователь'}</h3>
                                        <p className={styles.memberRole}>{member?.role || 'Участник'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {!isModerator && (
                        <>
                            <div className={styles.projectActionsCentered}>
                                <div className={styles.actionButtonsContainer}>
                                    {project.hasSurvey && (
                                        <button 
                                            className={styles.feedbackBtn}
                                            onClick={handleFeedbackClick}
                                        >
                                            <img src="/feedback.png" alt="Фидбек" className={styles.actionIcon}/>
                                            <span>Обратная связь</span>
                                        </button>
                                    )}
                                    <button className={styles.likeBtn} onClick={handleLike}>
                                        <img src="/like.png" alt="Лайк" className={styles.actionIcon}/>
                                        <span>Поддержать</span>
                                    </button>
                                </div>
                                <div className={styles.likesInfo}>
                                    <span className={styles.likesCount}>{likes}</span>
                                    <span className={styles.likesText}>{getLikesText(likes)}</span>
                                </div>
                            </div>

                            {feedbackVisible && (
                                <div className={styles.feedbackForm}>
                                    <h3>Форма обратной связи</h3>
                                    <textarea
                                        className={styles.feedbackInput}
                                        placeholder="Ваш отзыв..."
                                    ></textarea>
                                    <button className={styles.submitFeedbackBtn}>Отправить</button>
                                </div>
                            )}

                            <div className={styles.commentsSection}>
                                <h2 className={styles.commentsTitle}>Комментарии</h2>
                                {authorizationToken ? (
                                    <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Напишите ваш комментарий..."
                                            className={styles.commentInput}
                                        />
                                        <button type="submit" className={styles.commentSubmitButton}>
                                            Отправить
                                        </button>
                                    </form>
                                ) : (
                                    <p className={styles.loginPrompt}>Войдите, чтобы оставить комментарий</p>
                                )}
                                
                                {comments.length > 0 ? (
                                    <div className={styles.commentsList}>
                                        {comments.map((comment) => (
                                            <div 
                                                key={comment.id} 
                                                className={styles.commentItem}
                                                onClick={() => comment.author && handleCommentClick(comment.author.username)}
                                            >
                                                <div className={styles.commentHeader}>
                                                    <div>
                                                        <span className={styles.commentAuthor}>{comment.author?.username || 'Неизвестный пользователь'}</span>
                                                        {comment.createdDate && (
                                                            <div className={styles.commentDate}>
                                                                {new Date(comment.createdDate).toLocaleDateString('ru-RU', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {currentUser && (currentUser.username === comment.author.username || isModerator) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteComment(comment.id);
                                                            }}
                                                            className={styles.deleteCommentButton}
                                                        >
                                                            Удалить
                                                        </button>
                                                    )}
                                                </div>
                                                <p className={styles.commentText}>{comment.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={styles.noComments}>Комментариев пока нет</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

export default ProjectDetails;