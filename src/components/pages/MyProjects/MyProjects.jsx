import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from 'react-router-dom';
import styles from "./MyProjects.module.css";
import NavigationBar from "../../navigation_bar/NavigationBar";

const MyProjects = () => {
    const [projects, setProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

    useEffect(() => {
        const fetchProjectsByOwner = async () => {

            try {
                const response = await fetch(`http://localhost:8083/api/v1/main/projects/find-my-projects`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': ` ${authorizationToken}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setProjects(data);
                } else {
                    console.error('Failed to fetch projects:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        };

        fetchProjectsByOwner();
    }, []);

    const handleSearch = async () => {
        try {
            const response = await fetch(`http://localhost:8083/api/v1/main/project/find-my-projects`);
            if (response.ok) {
                const data = await response.json();
                setProjects(data);
            } else {
                console.error('Failed to fetch projects:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const handleCreateProject = (e) => {
        e.preventDefault();
        navigate('/create_project');
    };

    return (
        <>
            <Helmet>
                <title>Мои проекты</title>
                <body className={styles.body} />
            </Helmet>
            <NavigationBar />
            <div className={styles.myProjectsPage}>
                <div className={styles.content}>
                    <div className={styles.controls}>
                        <div className={styles.searchBar}>
                            <input
                                type="text"
                                placeholder="Введите название пользователя"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                            <button onClick={handleSearch} className={styles.button}>Поиск</button>
                        </div>
                        <button onClick={handleCreateProject} className={`${styles.button} ${styles.createButton}`}>
                            Создать проект
                        </button>
                    </div>
                    <h2 className={`${styles.myProjectsTitle}`}>Мои проекты</h2>
                    <div className={styles.projectsList}>
                        {projects.length === 0 ? (
                            <div className={styles.emptyProjects}>Не найдено ни одного проекта</div>
                        ) : (
                            projects.map(project => (
                                <div key={project.id} className={styles.project}>
                                    <img src={`http://localhost:3001${project.projectLogoUrl}`} alt={project.projectName} className={styles.projectImage} />
                                    <div className={styles.projectName}>{project.projectName}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default MyProjects;
