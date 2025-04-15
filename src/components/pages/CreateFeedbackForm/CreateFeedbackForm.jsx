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
        if (questions.length > 1) {
            setQuestions(questions.filter(q => q.id !== id));
        }
    };

    const updateQuestion = (id, text) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Проверяем, что все вопросы заполнены
        if (questions.some(q => !q.text.trim())) {
            alert('Пожалуйста, заполните все вопросы');
            return;
        }

        try {
            const surveyData = {
                questions: questions.map(q => ({
                    questionText: q.text.trim()
                }))
            };

            const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}/surveys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken ? ` ${authorizationToken}` : ''
                },
                body: JSON.stringify(surveyData)
            });

            if (response.ok) {
                navigate(`/manage_project/${projectId}`);
            } else {
                const errorData = await response.json();
                alert(`Ошибка при создании формы: ${errorData.message || 'Неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error('Ошибка при отправке формы:', error);
            alert('Произошла ошибка при отправке формы. Пожалуйста, попробуйте позже.');
        }
    };

    return (
        <>
            <Helmet>
                <title>Создание формы обратной связи - StartHub</title>
                <body className={styles.body} />
            </Helmet>
            <Menu />
            <div className={styles.createFeedbackPage}>
                <div className={styles.createFeedbackContainer} ref={containerRef}>
                    <button 
                        onClick={() => navigate(`/manage_project/${projectId}`)} 
                        className={styles.backButton}
                    >
                        <img src="/back-arrow.png" alt="Назад" className={styles.backIcon} />
                        <span>Назад</span>
                    </button>
                    <h1 className={styles.formTitle}>Создание формы обратной связи</h1>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.questionsList}>
                            {questions.map((question, index) => (
                                <div key={question.id} className={styles.questionItem}>
                                    <div className={styles.questionHeader}>
                                        <span className={styles.questionNumber}>Вопрос {index + 1}</span>
                                        {questions.length > 1 && (
                                            <button
                                                type="button"
                                                className={styles.deleteQuestionBtn}
                                                onClick={() => deleteQuestion(question.id)}
                                            >
                                                Удалить
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
                        <button
                            type="button"
                            className={styles.addQuestionBtn}
                            onClick={addQuestion}
                        >
                            Добавить вопрос
                        </button>
                        <button type="submit" className={styles.submitButton}>
                            Создать форму
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CreateFeedbackForm;
