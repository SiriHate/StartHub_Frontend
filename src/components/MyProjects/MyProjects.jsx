import React, { useState } from "react";
import { Helmet } from "react-helmet";
import styles from "./MyProjects.module.css";
import NavigationBar from "../NavigationBar/NavigationBar";

const projectsData = [
    { id: 1, name: "Project One", image: "project1.jpg" },
    { id: 2, name: "Project Two", image: "project2.jpg" },
    // Add more projects as needed
];

const MyProjects = () => {
    const [projects, setProjects] = useState(projectsData);
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = () => {
        setProjects(
            projectsData.filter(project =>
                project.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    };

    const handleCreateProject = () => {
        console.log("Create Project button clicked");
        // Add your create project logic here
    };

    return (
        <>
            <Helmet>
                <html className={styles.html} />
                <body className={styles.body} />
            </Helmet>
            <div className={styles.myProjectsPage}>
                <NavigationBar />
                <h2>Мои проекты</h2>
                <div className={styles.content}>
                    <div className={styles.controls}>
                        <div className={styles.searchBar}>
                            <input
                                type="text"
                                placeholder="Введите название проекта"
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
                    <div className={styles.projectsList}>
                        {projects.length === 0 ? (
                            <div className={styles.emptyProjects}>Не найдено ни одного проекта</div>
                        ) : (
                            projects.map(project => (
                                <div key={project.id} className={styles.project}>
                                    <img src={project.image} alt={project.name} className={styles.projectImage} />
                                    <div className={styles.projectName}>{project.name}</div>
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
