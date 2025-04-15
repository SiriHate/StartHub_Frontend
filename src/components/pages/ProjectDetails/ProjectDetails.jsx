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
    const navigate = useNavigate();

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

            // После успешной отправки лайка обновляем счетчик
            await fetchLikesCount();
        } catch (err) {
            console.error('Ошибка при отправке лайка:', err);
            // Здесь можно добавить отображение ошибки пользователю
        }
    };

    const handleCommentChange = (e) => {
        setNewComment(e.target.value);
    };

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (newComment.trim()) {
            const newCommentObject = {
                id: comments.length + 1,
                author: 'Аноним',
                text: newComment,
            };
            setComments([...comments, newCommentObject]);
            setNewComment('');
        }
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleMemberClick = (memberId) => {
        navigate(`/members/profile/${memberId}`);
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
                <body className={styles.body} />
            </Helmet>
            <Menu />
            <div className={styles.projectDetailsPage}>
                <div className={styles.projectCard}>
                    <button className={styles.backButton} onClick={handleGoBack}>
                        <img src="/back-arrow.png" alt="Назад" className={styles.backIcon} />
                        <span>Назад</span>
                    </button>
                    <div className={styles.projectCardHeader}>
                        <h1 className={styles.projectTitle}>{project.projectName}</h1>
                        <img
                            src={project.projectLogoUrl || "path_to_image.jpg"}
                            alt="Фото проекта"
                            className={styles.projectImage}
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
                                onClick={() => handleMemberClick(project.projectOwner.id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className={styles.memberAvatar}>
                                    <img src={project.projectOwner.avatarUrl || "/developer.png"} alt="Владелец проекта" className={styles.memberIcon}/>
                                </div>
                                <div className={styles.memberInfo}>
                                    <h3 className={styles.memberName}>{project.projectOwner.username}</h3>
                                    <p className={styles.memberRole}>Владелец проекта</p>
                                </div>
                            </div>
                            {project.members && project.members.map((member) => (
                                <div 
                                    key={member.id} 
                                    className={styles.teamMember}
                                    onClick={() => handleMemberClick(member.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className={styles.memberAvatar}>
                                        <img src={member.avatarUrl || "/developer.png"} alt={member.username} className={styles.memberIcon}/>
                                    </div>
                                    <div className={styles.memberInfo}>
                                        <h3 className={styles.memberName}>{member.username}</h3>
                                        <p className={styles.memberRole}>{member.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

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
                        <div className={styles.commentsWrapper}>
                            <div className={styles.commentsDivider}>
                                <span className={styles.dividerLine}></span>
                                <span className={styles.dividerText}>Комментарии</span>
                                <span className={styles.dividerLine}></span>
                            </div>
                            <form className={styles.commentForm} onSubmit={handleCommentSubmit}>
                                <textarea
                                    className={styles.commentInput}
                                    value={newComment}
                                    onChange={handleCommentChange}
                                    placeholder="Добавьте комментарий..."
                                ></textarea>
                                <button type="submit" className={styles.submitCommentBtn}>Отправить комментарий</button>
                            </form>
                            <div className={styles.commentList}>
                                {comments.map((comment) => (
                                    <div key={comment.id} className={styles.comment}>
                                        <strong>{comment.author}</strong>
                                        <p>{comment.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ProjectDetails;