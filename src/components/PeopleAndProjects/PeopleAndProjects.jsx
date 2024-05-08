import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { IoCloseCircleOutline } from "react-icons/io5"; // Ensure you have 'react-icons' installed
import styles from "./PeopleAndProjects.module.css";
import NavigationBar from "../NavigationBar/NavigationBar";

const projectsData = [
    { id: 1, name: "Project One", image: "project1.jpg", category: "Technology" },
    { id: 2, name: "Project Two", image: "project2.jpg", category: "Healthcare" },
];

const PeopleAndProjects = () => {
    const [activeTab, setActiveTab] = useState("Projects");
    const [projects, setProjects] = useState(projectsData);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("");

    const handleSearch = () => {
        setProjects(
            projectsData.filter(project =>
                project.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                (!activeCategory || project.category === activeCategory)
            )
        );
    };

    const selectCategory = (category) => {
        if (activeCategory === category) {
            setActiveCategory(""); // Deselect if the same category is clicked
        } else {
            setActiveCategory(category); // Set new category
        }
        handleSearch();
    };

    return (
        <>
            <Helmet>
                <title>Проекты и специалисты</title>
                <body className={styles.body} />
            </Helmet>
            <NavigationBar />
            <div className={styles.peopleAndProjectsPage}>
                <div className={styles.sidebar}>
                    <div className={styles.toggleSwitch}>
                        <button className={`${styles.toggleButton} ${activeTab === "Projects" ? styles.active : ""}`} onClick={() => setActiveTab("Projects")}>Проекты</button>
                        <button className={`${styles.toggleButton} ${activeTab === "Specialists" ? styles.active : ""}`} onClick={() => setActiveTab("Specialists")}>Специалисты</button>
                    </div>
                    <div className={styles.filters}>
                        <h3 className={styles.categoryTitle}>Категории</h3>
                        {["Technology", "Healthcare"].map((category) => (
                            <button
                                key={category}
                                onClick={() => selectCategory(category)}
                                className={`${styles.categoryButton} ${activeCategory === category ? styles.activeCategory : ""}`}
                            >
                                {category} {activeCategory === category && <IoCloseCircleOutline />}
                            </button>
                        ))}
                    </div>
                </div>
                <div className={styles.content}>
                    <h2>Мои проекты</h2>
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
                    </div>
                    <div className={styles.projectsList}>
                        {projects.length === 0 ? (
                            <div className={styles.emptyProjects}>Не найдено ни одного проекта</div>
                        ) : (
                            projects.map(project => (
                                <div key={project.id} className={styles.project}>
                                    <img src={`/images/${project.image}`} alt={project.name}
                                         className={styles.projectImage}/>
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

export default PeopleAndProjects;
