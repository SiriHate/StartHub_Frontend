import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import Menu from "../../menu/Menu";
import styles from './CreateFeedbackForm.module.css';
import config from "../../../config";

const CreateFeedbackForm = () => {
    const [questions, setQuestions] = useState([{ id: 1, text: '' }]);
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const { projectId } = useParams();
    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

    const addQuestion = () => {
        const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
        setQuestions([...questions, { id: newId, text: '' }]);
    };

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [questions]);

    const deleteQuestion = (id) => {
        if (questions.length > 1) setQuestions(questions.filter(q => q.id !== id));
    };

    const updateQuestion = (id, text) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (questions.some(q => !q.text.trim())) { alert('Пожалуйста, заполните все вопросы'); return; }

        try {
            const surveyData = { questions: questions.map(q => ({ questionText: q.text.trim() })) };
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/surveys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': authorizationToken ? ` ${authorizationToken}` : '' },
                body: JSON.stringify(surveyData)
            });
            if (response.ok) { navigate(`/manage_project/${projectId}`); }
            else { const d = await response.json(); alert(`Ошибка: ${d.message || 'Неизвестная ошибка'}`); }
        } catch (error) { alert('Произошла ошибка при отправке формы.'); }
    };

    return (
        <>
            <Helmet>
                <title>Создание формы обратной связи — StartHub</title>
                <body className={styles.body} />
            </Helmet>
            <Menu />
            <div className={styles.page}>
                <div className={styles.container} ref={containerRef}>
                    {/* Top bar */}
                    <div className={styles.topBar}>
                        <button className={styles.backBtn} onClick={() => navigate(`/manage_project/${projectId}`)}>
                            <i className="fas fa-arrow-left"></i> Назад
                        </button>
                    </div>

                    {/* Card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <i className="fas fa-clipboard-list"></i>
                            <h1>Форма обратной связи</h1>
                        </div>
                        <p className={styles.cardSubtitle}>Добавьте вопросы, которые увидят участники проекта</p>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.questionsList}>
                                {questions.map((question, index) => (
                                    <div key={question.id} className={styles.questionCard}>
                                        <div className={styles.questionHeader}>
                                            <span className={styles.questionBadge}>
                                                <i className="fas fa-question-circle"></i> Вопрос {index + 1}
                                            </span>
                                            {questions.length > 1 && (
                                                <button type="button" className={styles.removeBtn} onClick={() => deleteQuestion(question.id)} title="Удалить вопрос">
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            )}
                                        </div>
                                        <textarea
                                            className={styles.questionInput}
                                            value={question.text}
                                            onChange={(e) => updateQuestion(question.id, e.target.value)}
                                            placeholder="Введите текст вопроса..."
                                            required
                                        />
                                    </div>
                                ))}
                            </div>

                            <button type="button" className={styles.addBtn} onClick={addQuestion}>
                                <i className="fas fa-plus"></i> Добавить вопрос
                            </button>

                            <button type="submit" className={styles.submitBtn}>
                                <i className="fas fa-paper-plane"></i> Создать форму
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateFeedbackForm;
