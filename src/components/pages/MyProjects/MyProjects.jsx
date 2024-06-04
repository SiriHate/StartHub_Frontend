import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from 'react-router-dom';
import styles from "./MyProjects.module.css";
import NavigationBar from "../../navigation_bar/NavigationBar";
import config from '../../../config';

const MyProjects = () => {
    const [projects, setProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();
    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

    useEffect(() => {
        const fetchProjectsByOwner = async () => {
            try {
                const response = await fetch(`${config.MAIN_SERVICE}/projects/find-my-projects?page=${page}&size=15`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': ` ${authorizationToken}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setProjects(Array.isArray(data.content) ? data.content : []);
                    setTotalPages(data.totalPages || 1);
                } else {
                    console.error('Failed to fetch projects:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        };

        fetchProjectsByOwner();
    }, [authorizationToken, page]);

    const handleSearch = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/projects/find-my-projects?page=${page}&size=15`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': ` ${authorizationToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setProjects(Array.isArray(data.content) ? data.content : []);
                setTotalPages(data.totalPages || 1);
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

    const openProject = (projectId) => {
        navigate(`/project/${projectId}`);
    };

    const handleNextPage = () => {
        if (page < totalPages - 1) {
            setPage(page + 1);
        }
    };

    const handlePreviousPage = () => {
        if (page > 0) {
            setPage(page - 1);
        }
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
                    <h2 className={`${styles.myProjectsTitle}`}>Мои проекты</h2>
                    <div className={styles.projectsList}>
                        {projects.length === 0 ? (
                            <div className={styles.emptyProjects}>Не найдено ни одного проекта</div>
                        ) : (
                            projects.map(project => (
                                <div key={project.id} className={styles.project} onClick={() => openProject(project.id)}>
                                    <img src={`${config.FILE_SERVER}${project.projectLogoUrl}`} alt={project.projectName} className={styles.projectImage} />
                                    <div className={styles.projectName}>{project.projectName}</div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/manage_project/${project.id}`);
                                        }}
                                        className={styles.manageButton}
                                    >
                                        Управление
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    <div className={styles.paginationControls}>
                        <button onClick={handlePreviousPage} disabled={page === 0} className={styles.pageButton}>
                            Предыдущая
                        </button>
                        <span className={styles.pageNumber}>Страница {page + 1}</span>
                        <button onClick={handleNextPage} disabled={page === totalPages - 1} className={styles.pageButton}>
                            Следующая
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MyProjects;
