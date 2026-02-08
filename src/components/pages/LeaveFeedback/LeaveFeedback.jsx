import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Menu from "../../menu/Menu";
import styles from './LeaveFeedback.module.css';
import config from '../../../config';

const LeaveFeedback = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
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
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const surveyData = await response.json();
            setQuestions(surveyData.questions.map(q => ({ id: q.id, text: q.questionText })));
            setError(null);
        } catch (err) {
            console.error('Ошибка при получении данных опроса:', err);
            setError('Не удалось загрузить форму обратной связи');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSurveyData(); }, [projectId]);

    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
            const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';
            if (!authorizationToken) { setError('Необходима авторизация'); return; }

            const surveyData = {
                answers: questions.map(q => ({ questionId: q.id, answerText: answers[q.id] || '' }))
            };

            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/surveys/submissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': authorizationToken },
                body: JSON.stringify(surveyData)
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            navigate(`/project/${projectId}`);
        } catch (error) {
            console.error('Ошибка при отправке ответов:', error);
            setError('Не удалось отправить отзыв. Попробуйте позже.');
        }
    };

    if (loading) {
        return (
            <>
                <Helmet><title>Загрузка... - StartHub</title><body className={styles.body} /></Helmet>
                <Menu />
                <div className={styles.page}>
                    <div className={styles.container}>
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <span>Загрузка формы...</span>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Helmet><title>Ошибка - StartHub</title><body className={styles.body} /></Helmet>
                <Menu />
                <div className={styles.page}>
                    <div className={styles.container}>
                        <div className={styles.errorState}>
                            <i className="fas fa-exclamation-triangle"></i>
                            <p>{error}</p>
                            <button className={styles.backBtn} onClick={() => navigate(`/project/${projectId}`)}>
                                <i className="fas fa-arrow-left"></i> Вернуться к проекту
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const answeredCount = questions.filter(q => answers[q.id]?.trim()).length;

    return (
        <>
            <Helmet>
                <title>Оставить отзыв - StartHub</title>
                <body className={styles.body} />
            </Helmet>
            <Menu />
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.topBar}>
                        <button className={styles.backBtn} onClick={() => navigate(`/project/${projectId}`)}>
                            <i className="fas fa-arrow-left"></i> Назад
                        </button>
                        <span className={styles.progress}>
                            {answeredCount} / {questions.length} вопросов
                        </span>
                    </div>

                    <div className={styles.titleBlock}>
                        <i className="fas fa-comment-dots"></i>
                        <h1>Обратная связь</h1>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className={styles.questionsList}>
                            {questions.map((question, idx) => (
                                <div
                                    key={question.id}
                                    className={`${styles.questionCard} ${answers[question.id]?.trim() ? styles.answered : ''}`}
                                >
                                    <div className={styles.questionHeader}>
                                        <span className={styles.questionNum}>{idx + 1}</span>
                                        <span className={styles.questionText}>{question.text}</span>
                                    </div>
                                    <textarea
                                        className={styles.answerInput}
                                        value={answers[question.id] || ''}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                        placeholder="Введите ваш ответ..."
                                        rows={3}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className={styles.ratingSection}>
                            <span className={styles.ratingLabel}>Оцените проект</span>
                            <div
                                className={styles.stars}
                                onMouseLeave={() => setHoverRating(0)}
                            >
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <span
                                        key={value}
                                        className={`${styles.star} ${(hoverRating || rating) >= value ? styles.starActive : ''}`}
                                        onClick={() => setRating(value)}
                                        onMouseEnter={() => setHoverRating(value)}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                            {rating > 0 && <span className={styles.ratingValue}>{rating} из 5</span>}
                        </div>

                        <button type="submit" className={styles.submitBtn}>
                            <i className="fas fa-paper-plane"></i> Отправить отзыв
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default LeaveFeedback;
