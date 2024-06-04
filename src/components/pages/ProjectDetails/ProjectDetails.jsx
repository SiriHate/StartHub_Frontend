import React, { useEffect, useState } from 'react';
import { Helmet } from "react-helmet";
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Provider, LikeButton } from "@lyket/react";
import { ReactComponent as GoBackIcon } from '../../../icons/go_back.svg';
import NavigationBar from "../../navigation_bar/NavigationBar";
import styles from "./ProjectDetails.module.css";
import config from '../../../config';

function ProjectDetails() {
    const { projectId } = useParams();
    const [project, setProject] = useState({
        projectName: "",
        category: "",
        stage: "",
        projectDescription: "",
        projectLogoUrl: "",
        likes: 0,
        members: [],
        stages: []
    });
    const [redirect, setRedirect] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${config.MAIN_SERVICE}/projects/${projectId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch project details');
                }
                const data = await response.json();
                setProject(prev => ({
                    ...prev,
                    projectName: data.projectName,
                    category: data.category,
                    stage: data.stage,
                    projectDescription: data.projectDescription,
                    projectLogoUrl: `${config.FILE_SERVER}${data.projectLogoUrl}`,
                    likes: data.likes,
                    members: data.members,
                    stages: ["Концепция", "Разработка", "Тестирование", "Производство"]
                }));
            } catch (error) {
                console.error('Fetch error:', error);
                setRedirect(true);
            }
        };

        fetchData();
    }, [projectId]);

    if (redirect) {
        return <Navigate to="/not-found" replace />;
    }

    return (
        <>
            <Helmet>
                <title>{project.projectName}</title>
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            <NavigationBar/>
            <div className={styles.projectCard}>
                <div className={styles.header}>
                    <div className={styles.titleContainer}>
                        <button onClick={() => navigate(-1)} className={styles.goBackButton}>
                            <GoBackIcon/>
                        </button>
                        <h1>{project.projectName}</h1>
                        <span className={styles.categoryTag}>Категория: {project.category}</span>
                    </div>
                    <img src={project.projectLogoUrl || "/default_avatar.jpg"} alt="Logo" className={styles.logo}/>
                </div>
                <div className={styles.stageContainer}>
                    {project.stages.map((stage, index) => (
                        <React.Fragment key={index}>
                            <div className={stage === project.stage ? styles.activeStage : styles.stage}>
                                {stage}
                            </div>
                            {index < project.stages.length - 1 && <span className={styles.arrow}>→</span>}
                        </React.Fragment>
                    ))}
                </div>
                <div className={styles.descriptionCard}>
                    <p className={styles.descriptionText}>{project.projectDescription}</p>
                </div>
                <div className={styles.teamContainer}>
                    <h2>Команда проекта</h2>
                    <ul className={styles.teamList}>
                        {project.members.map(member => (
                            <li key={member.username} className={styles.teamMember}>
                                {member.username} - {member.role}
                            </li>
                        ))}
                    </ul>
                </div>
                <Provider apiKey="acc0dbccce8e557db5ebbe6d605aaa">
                    <div className={styles.likeSection}>
                        <LikeButton
                            namespace="testing-react"
                            id="everybody-like-now"
                            likes={project.likes}
                        />
                    </div>
                </Provider>
                <div className={styles.projectMenu}>
                    <button className={styles.menuButton}>Поддержать проект</button>
                    <button className={styles.menuButton}>Обсуждение проекта</button>
                    <button className={styles.menuButton}>Ближайшее мероприятие</button>
                </div>
            </div>
        </>
    );
}

export default ProjectDetails;
