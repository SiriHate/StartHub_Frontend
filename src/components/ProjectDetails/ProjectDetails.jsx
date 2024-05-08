import React, { useState } from 'react';
import { Helmet } from "react-helmet";
import NavigationBar from "../NavigationBar/NavigationBar";
import styles from "./ProjectDetails.module.css";

function ProjectDetails() {
    const [likes, setLikes] = useState(0);
    const project = {
        title: "Проект X",
        description: "Открывайте новые горизонты с Проектом X! Наша миссия — преобразовать потенциал искусственного интеллекта в реальные инновационные решения, которые изменят мир к лучшему.",
        team: [
            { name: "Анна Иванова", role: "Ведущий разработчик" },
            { name: "Борис Смирнов", role: "Аналитик" },
            { name: "Виктор Петров", role: "Дизайнер" }
        ],
        category: "Технологии",
        stages: ["Концепция", "Разработка", "Тестирование", "Производство"],
        currentStage: "Разработка",
        logoUrl: "logo-url-here"
    };

    const handleLike = () => setLikes(likes + 1);

    return (
        <>
            <Helmet>
                <title>{project.title}</title>
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            <NavigationBar/>
            <div className={styles.projectCard}>
                <div className={styles.stageContainer}>
                    {project.stages.map((stage, index) => (
                        <div key={index} className={styles.stageBlock}>
                            <div className={stage === project.currentStage ? styles.activeStage : styles.stage}>
                                {stage}
                            </div>
                            {index !== project.stages.length - 1 && <div className={styles.arrow}>↓</div>}
                        </div>
                    ))}
                </div>
                <div className={styles.detailsContainer}>
                    <h1>
                        <img src="/default_project_logo.jpg" alt="Logo"
                             style={{width: "150px", height: "150px", float: "right"}}/>
                        {project.title}
                        <span className={styles.categoryTag}>Категория: {project.category}</span>
                    </h1>
                    <p>{project.description}</p>
                    <div className={styles.likeSection}>
                        <button onClick={handleLike} className={styles.likeButton}>Лайк</button>
                        <span>{likes} лайков</span>
                    </div>
                </div>
                <div className={styles.teamContainer}>
                    <h2>Команда проекта</h2>
                    <ul>{project.team.map(member => (
                        <li key={member.name} className={styles.teamMember}>
                            <span>{member.name} - {member.role}</span>
                        </li>
                    ))}</ul>
                </div>
            </div>
            <div className={styles.projectMenu}>
                <button className={styles.menuButton}>Поддержать проект</button>
                <button className={styles.menuButton}>Обсуждение проекта</button>
                <button className={styles.menuButton}>Ближайшее мероприятие</button>
            </div>
        </>
    );
}

export default ProjectDetails;