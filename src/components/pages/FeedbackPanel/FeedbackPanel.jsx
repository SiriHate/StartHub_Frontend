import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Menu from "../../menu/Menu";
import styles from './FeedbackPanel.module.css';
import config from "../../../config";

const FeedbackPanel = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState('desc');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const itemsPerPage = 5;

    const sortOptions = [
        { value: 'desc', label: 'Более новые' },
        { value: 'asc', label: 'Более старые' }
    ];

    const handleDeleteSurvey = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/surveys`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                navigate(`/project/${projectId}`);
            } else {
                console.error('Ошибка при удалении формы обратной связи');
            }
        } catch (error) {
            console.error('Ошибка при отправке запроса:', error);
        }
    };

    const fetchFeedbacks = async () => {
        try {
            setLoading(true);
            const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
            const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/surveys/submissions?sort=${sortBy}`, {
                headers: {
                    'Authorization': authorizationToken
                }
            });

            if (!response.ok) {
                throw new Error('Не удалось загрузить отзывы');
            }

            const data = await response.json();
            setFeedbacks(data);
            setTotalPages(Math.ceil(data.length / itemsPerPage));
            setError(null);
        } catch (err) {
            console.error('Ошибка при загрузке отзывов:', err);
            setError('Не удалось загрузить отзывы');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, [projectId, sortBy]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
        setCurrentPage(1);
    };

    const getSortedFeedbacks = () => {
        let sortedFeedbacks = [...feedbacks];
        
        switch (sortBy) {
            case 'desc':
                sortedFeedbacks.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
                break;
            case 'asc':
                sortedFeedbacks.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
                break;
            default:
                break;
        }
        
        return sortedFeedbacks;
    };

    const getCurrentFeedbacks = () => {
        const sortedFeedbacks = getSortedFeedbacks();
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return sortedFeedbacks.slice(startIndex, endIndex);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <>
                <Helmet>
                    <title>Загрузка... - StartHub</title>
                    <body className={styles.body} />
                </Helmet>
                <Menu />
                <div className={styles.feedbackPanelPage}>
                    <div className={styles.feedbackPanelContainer}>
                        <h1 className={styles.panelTitle}>Загрузка...</h1>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Helmet>
                    <title>Ошибка - StartHub</title>
                    <body className={styles.body} />
                </Helmet>
                <Menu />
                <div className={styles.feedbackPanelPage}>
                    <div className={styles.feedbackPanelContainer}>
                        <h1 className={styles.panelTitle}>Ошибка</h1>
                        <p className={styles.errorMessage}>{error}</p>
                        <button 
                            className={styles.backButton}
                            onClick={() => navigate(`/project/${projectId}`)}
                        >
                            <img src="/back-arrow.png" alt="Назад" className={styles.backIcon} />
                            Вернуться к проекту
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Helmet>
                <title>Обратная связь - StartHub</title>
                <body className={styles.body} />
            </Helmet>
            <Menu />
            {showDeleteConfirm && (
                <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h3>Подтверждение удаления</h3>
                        <p>Вы уверены, что хотите удалить форму обратной связи? Это действие нельзя отменить.</p>
                        <div className={styles.modalButtons}>
                            <button 
                                className={styles.cancelButton}
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Отмена
                            </button>
                            <button 
                                className={styles.confirmDeleteButton}
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    handleDeleteSurvey();
                                }}
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className={styles.feedbackPanelPage}>
                <div className={styles.feedbackPanelContainer}>
                    <div className={styles.headerButtons}>
                        <button 
                            className={styles.backButton}
                            onClick={() => navigate(`/project/${projectId}`)}
                        >
                            <img src="/back-arrow.png" alt="Назад" className={styles.backIcon} />
                            Вернуться к проекту
                        </button>
                        <button 
                            className={styles.deleteButton}
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            Удалить форму
                        </button>
                    </div>

                    <h1 className={styles.panelTitle}>Обратная связь</h1>

                    {feedbacks.length > 0 ? (
                        <>
                            <div className={styles.feedbackControls}>
                                <select 
                                    className={styles.sortSelect}
                                    value={sortBy}
                                    onChange={handleSortChange}
                                >
                                    {sortOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.feedbackList}>
                                {getCurrentFeedbacks().map((feedback) => (
                                    <div key={feedback.id} className={styles.feedbackItem}>
                                        <div className={styles.feedbackHeader}>
                                            <div className={styles.feedbackUser}>{feedback.respondentUsername}</div>
                                            <div className={styles.feedbackDate}>{formatDate(feedback.submittedAt)}</div>
                                            {feedback.averageRating !== undefined && (
                                                <div className={styles.feedbackRating}>
                                                    <div className={styles.feedbackRatingStars}>
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <span 
                                                                key={star} 
                                                                className={`${styles.feedbackRatingStar} ${star <= feedback.averageRating ? styles.active : ''}`}
                                                            >
                                                                ★
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.feedbackAnswers}>
                                            {feedback.answers.map((answer) => (
                                                <div key={answer.id} className={styles.feedbackAnswer}>
                                                    <div className={styles.feedbackQuestion}>{answer.questionText}</div>
                                                    <div className={styles.feedbackText}>{answer.answerText}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.pagination}>
                                <button
                                    className={styles.paginationButton}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Назад
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        className={`${styles.paginationButton} ${currentPage === page ? styles.active : ''}`}
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    className={styles.paginationButton}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Вперед
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyStateIcon}>📝</div>
                            <h2 className={styles.emptyStateTitle}>Пока нет отзывов</h2>
                            <p className={styles.emptyStateText}>
                                Форма обратной связи активна, но пока никто не оставил свой отзыв.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default FeedbackPanel;
