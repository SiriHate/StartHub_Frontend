import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Menu from "../../menu/Menu";
import styles from './LeaveFeedback.module.css';
import config from '../../../config';

const LeaveFeedback = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSurveyData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/surveys`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const surveyData = await response.json();
            
            setProject({
                id: surveyData.projectId
            });
            
            const formattedQuestions = surveyData.questions.map(question => ({
                id: question.id,
                text: question.questionText
            }));
            
            setQuestions(formattedQuestions);
            setError(null);
        } catch (err) {
            console.error('Ошибка при получении данных опроса:', err);
            setError('Не удалось загрузить форму обратной связи');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSurveyData();
    }, [projectId]);

    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleRatingChange = (value) => {
        setRating(value);
    };

    const handleMouseEnter = (value) => {
        setHoverRating(value);
    };

    const handleMouseLeave = () => {
        setHoverRating(0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
            const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';
            
            if (!authorizationToken) {
                setError('Необходима авторизация');
                return;
            }

            const surveyData = {
                answers: questions.map(question => ({
                    questionId: question.id,
                    answerText: answers[question.id] || ''
                }))
            };

            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/surveys/submissions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken
                },
                body: JSON.stringify(surveyData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            navigate(`/project/${projectId}`);
        } catch (error) {
            console.error('Ошибка при отправке ответов:', error);
            setError('Не удалось отправить отзыв. Пожалуйста, попробуйте позже.');
        }
    };

    if (loading) {
        return (
            <>
                <Helmet>
                    <title>Загрузка... - StartHub</title>
                    <body className={styles.body} />
                </Helmet>
                <Menu />
                <div className={styles.leaveFeedbackPage}>
                    <div className={styles.leaveFeedbackContainer}>
                        <h1 className={styles.formTitle}>Загрузка...</h1>
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
                <div className={styles.leaveFeedbackPage}>
                    <div className={styles.leaveFeedbackContainer}>
                        <h1 className={styles.formTitle}>Ошибка</h1>
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
                <title>Оставить отзыв - StartHub</title>
                <body className={styles.body} />
            </Helmet>
            <Menu />
            <div className={styles.leaveFeedbackPage}>
                <div className={styles.leaveFeedbackContainer}>
                    <button 
                        className={styles.backButton}
                        onClick={() => navigate(`/project/${projectId}`)}
                    >
                        <img src="/back-arrow.png" alt="Назад" className={styles.backIcon} />
                        Вернуться к проекту
                    </button>

                    <h1 className={styles.formTitle}>Форма обратной связи</h1>

                    <form onSubmit={handleSubmit}>
                        <div className={styles.questionsList}>
                            {questions.map((question) => (
                                <div 
                                    key={question.id} 
                                    className={`${styles.questionItem} ${answers[question.id]?.trim() ? styles.filled : ''}`}
                                >
                                    <div className={styles.questionText}>
                                        {question.text}
                                    </div>
                                    <textarea
                                        className={styles.answerInput}
                                        value={answers[question.id] || ''}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                        placeholder="Введите ваш ответ..."
                                    />
                                </div>
                            ))}
                        </div>

                        <div className={styles.ratingContainer}>
                            <div className={styles.ratingTitle}>Оцените проект</div>
                            <div 
                                className={styles.ratingStars}
                                onMouseLeave={handleMouseLeave}
                            >
                                {[5, 4, 3, 2, 1].map((value) => (
                                    <span
                                        key={value}
                                        className={`${styles.star} ${(hoverRating || rating) >= value ? styles.active : ''}`}
                                        onClick={() => handleRatingChange(value)}
                                        onMouseEnter={() => handleMouseEnter(value)}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className={styles.submitButton}>
                            Отправить обратную связь
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default LeaveFeedback;
