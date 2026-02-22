import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Menu from "../../menu/Menu";
import styles from './FeedbackPanel.module.css';
import config from "../../../config";
import apiClient from "../../../api/apiClient";

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
        { value: 'desc', label: 'Сначала новые' },
        { value: 'asc', label: 'Сначала старые' }
    ];

    const handleDeleteSurvey = async () => {
        try {
            const response = await apiClient(`${config.MAIN_SERVICE}/projects/${projectId}/surveys`, {
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

            const response = await apiClient(`${config.MAIN_SERVICE}/projects/${projectId}/surveys/submissions?sort=${sortBy}`);

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
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <span>Загрузка отзывов...</span>
                        </div>
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
                        <div className={styles.errorState}>
                            <i className="fas fa-exclamation-triangle"></i>
                            <p>{error}</p>
                            <button 
                                className={styles.backButton}
                                onClick={() => navigate(`/project/${projectId}`)}
                            >
                                <img src="/back-arrow.png" alt="Назад" className={styles.backIcon} />
                                Вернуться к проекту
                            </button>
                        </div>
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
                        <div className={styles.modalIcon}>
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3>Удалить форму обратной связи?</h3>
                        <p>Все собранные отзывы будут удалены. Это действие нельзя отменить.</p>
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
                                <i className="fas fa-trash-alt"></i> Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.feedbackPanelPage}>
                <div className={styles.feedbackPanelContainer}>
                    <div className={styles.headerRow}>
                        <button 
                            className={styles.backButton}
                            onClick={() => navigate(`/project/${projectId}`)}
                        >
                            <img src="/back-arrow.png" alt="Назад" className={styles.backIcon} />
                            <span>Назад</span>
                        </button>
                        <button 
                            className={styles.deleteButton}
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            <i className="fas fa-trash-alt"></i> Удалить форму
                        </button>
                    </div>

                    <div className={styles.titleBlock}>
                        <h1 className={styles.panelTitle}>Обратная связь</h1>
                        <span className={styles.feedbackCount}>
                            Отзывов: {feedbacks.length}
                        </span>
                    </div>

                    {feedbacks.length > 0 ? (
                        <>
                            <div className={styles.toolbar}>
                                <div className={styles.sortGroup}>
                                    <i className="fas fa-sort-amount-down"></i>
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
                            </div>

                            <div className={styles.feedbackList}>
                                {getCurrentFeedbacks().map((feedback) => (
                                    <div key={feedback.id} className={styles.feedbackCard}>
                                        <div className={styles.cardHeader}>
                                            <div className={styles.cardUser}>
                                                <i className="fas fa-user-circle"></i>
                                                <span>{feedback.respondentUsername}</span>
                                            </div>
                                            <div className={styles.cardMeta}>
                                                {feedback.rating != null && feedback.rating > 0 && (
                                                    <div className={styles.cardRating}>
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <span
                                                                key={star}
                                                                className={`${styles.star} ${star <= feedback.rating ? styles.starActive : ''}`}
                                                            >
                                                                ★
                                                            </span>
                                                        ))}
                                                        
                                                    </div>
                                                )}
                                                <span className={styles.cardDate}>
                                                    <i className="fas fa-clock"></i>
                                                    {formatDate(feedback.submittedAt)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles.cardAnswers}>
                                            {feedback.answers.map((answer) => (
                                                <div key={answer.id} className={styles.answerBlock}>
                                                    <div className={styles.answerQuestion}>
                                                        <span className={styles.qLabel}><i className="fas fa-question-circle"></i> Вопрос</span>
                                                        {answer.questionText}
                                                    </div>
                                                    <div className={styles.answerText}>
                                                        <span className={styles.aLabel}><i className="fas fa-comment"></i> Ответ</span>
                                                        {answer.answerText}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        className={styles.pageBtn}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <i className="fas fa-chevron-left"></i>
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        className={styles.pageBtn}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <i className="fas fa-inbox"></i>
                            <h2>Пока нет отзывов</h2>
                            <p>Форма обратной связи активна, но пока никто не оставил свой отзыв.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default FeedbackPanel;
