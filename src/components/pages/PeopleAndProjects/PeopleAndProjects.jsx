import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import styles from "./PeopleAndProjects.module.css";
import NavigationBar from "../../navigation_bar/NavigationBar";
import config from '../../../config';

const projectCategories = ["Все", "Разработка", "Дизайн", "Маркетинг", "Администрация"];
const specialistSpecializations = ["Все", "Frontend", "Backend", "UI/UX", "Product Manager"];

const PeopleAndProjects = () => {
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentTab, setCurrentTab] = useState("project");
    const [selectedFilter, setSelectedFilter] = useState("Все");
    const [page, setPage] = useState(0); // Current page number
    const [totalPages, setTotalPages] = useState(1); // Total number of pages
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            let url = currentTab === "project"
                ? `${config.MAIN_SERVICE}/projects?page=${page}&size=1`
                : `${config.USER_SERVICE}/members/visible?page=${page}&size=1`;
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setItems(data.content); // Assuming the API returns a pageable response
                setTotalPages(data.totalPages); // Update total pages based on the response
            } catch (error) {
                console.error("Failed to fetch data:", error);
                setItems([]); // Ensuring items is always an array
            }
        };
        fetchData();
    }, [currentTab, page]);

    const handleSearch = () => {
        const filteredItems = items.filter(item =>
            item[currentTab === "project" ? "projectName" : "username"].toLowerCase().includes(searchQuery.toLowerCase())
        );
        setItems(filteredItems);
    };

    const selectFilter = (filter) => {
        setSelectedFilter(filter);
    };

    const openItem = (id) => {
        const path = currentTab === "project" ? `/project/${id}` : `/members/profile/${id}`;
        navigate(path);
    };

    const getEmptyMessage = () => {
        return currentTab === "project" ? "Не найдено ни одного проекта" : "Не найдено ни одного специалиста";
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

    const handleTabChange = (tab) => {
        setCurrentTab(tab);
        setPage(0); // Reset page to 0 when switching tabs
    };

    return (
        <>
            <Helmet>
                <title>{currentTab === "project" ? "Проекты" : "Специалисты"}</title>
                <body className={styles.body}/>
            </Helmet>
            <NavigationBar />
            <div className={styles.peopleAndProjectsPage}>
                <div className={styles.sidebar}>
                    {(currentTab === "project" ? projectCategories : specialistSpecializations).map(filter => (
                        <div
                            key={filter}
                            className={`${styles.filter} ${selectedFilter === filter ? styles.activeFilter : ''}`}
                            onClick={() => selectFilter(filter)}
                        >
                            {filter}
                        </div>
                    ))}
                </div>
                <div className={styles.content}>
                    <div className={styles.controls}>
                        <button onClick={() => handleTabChange("project")} className={`${styles.tabButton} ${currentTab === "project" ? styles.activeTab : ''}`}>
                            Проекты
                        </button>
                        <button onClick={() => handleTabChange("member")} className={`${styles.tabButton} ${currentTab === "member" ? styles.activeTab : ''}`}>
                            Специалисты
                        </button>
                        <div className={styles.searchBar}>
                            <input
                                type="text"
                                placeholder={currentTab === "project" ? "Введите название проекта" : "Введите имя специалиста"}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                            <button onClick={handleSearch} className={styles.searchButton}>Поиск</button>
                        </div>
                    </div>
                    <h2 className={styles.title}>{currentTab === "project" ? "Проекты" : "Специалисты"}</h2>
                    <div className={styles.itemsList}>
                        {items.length === 0 ? (
                            <div className={styles.emptyItems}>{getEmptyMessage()}</div>
                        ) : (
                            items.map(item => (
                                <div key={item.id || item.username} className={styles.item} onClick={() => openItem(item.id || item.username)}>
                                    <img src={`${config.FILE_SERVER}${item.projectLogoUrl || item.avatarUrl}`} alt={item.projectName || item.username} className={styles.itemImage}/>
                                    <div className={styles.itemContent}>
                                        <div className={styles.itemName}>{item.projectName || item.name}</div>
                                        <div className={styles.itemDetail}>
                                            {currentTab === "project" ? item.category : item.specialization}
                                        </div>
                                    </div>
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

export default PeopleAndProjects;
