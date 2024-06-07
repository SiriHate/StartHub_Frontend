import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import styles from "./PeopleAndProjects.module.css";
import NavigationBar from "../../navigation_bar/NavigationBar";
import config from "../../../config";

const projectCategories = ["Все", "Разработка", "Дизайн", "Маркетинг", "Администрация"];
const specialistSpecializations = ["Все", "Frontend", "Backend", "UI/UX", "Product Manager"];

const PeopleAndProjects = () => {
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentTab, setCurrentTab] = useState("project");
    const [selectedFilter, setSelectedFilter] = useState("Все");
    const [appliedFilter, setAppliedFilter] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();

    const fetchItems = async (searchQuery, filter, currentTab, page) => {
        try {
            const serviceUrl = currentTab === "project" ? config.MAIN_SERVICE : config.USER_SERVICE;
            const filterParam = filter ? (currentTab === "project" ? `&category=${filter}` : `&specialization=${filter}`) : "";
            const queryParam = searchQuery ? (currentTab === "project" ? `&query=${searchQuery}` : `&username=${searchQuery}`) : "";
            const url = `${serviceUrl}/${currentTab === "project" ? "projects/search" : "members/visible/search"}?page=${page}&size=10${filterParam}${queryParam}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setItems(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Failed to fetch items:", error);
            setItems([]);
        }
    };

    useEffect(() => {
        fetchItems("", "", currentTab, 0);  // Initial fetch with default values
    }, [currentTab]);

    const handleSearch = () => {
        setPage(0);  // Reset page to 0 when performing a new search
        fetchItems(searchQuery, appliedFilter, currentTab, 0);
    };

    const applyFilter = () => {
        setPage(0);  // Reset page to 0 when applying filters
        setSearchQuery("");  // Reset search query when applying filters
        const filterToApply = selectedFilter === "Все" ? "" : selectedFilter;
        setAppliedFilter(filterToApply);
        fetchItems("", filterToApply, currentTab, 0);
    };

    const selectFilter = (filter) => {
        setSelectedFilter(filter);
    };

    const openProject = (id) => {
        navigate(`/project/${id}`);
    };

    const openMember = (id) => {
        navigate(`/members/profile/${id}`);
    };

    const openItem = (id) => {
        if (currentTab === "project") {
            openProject(id);
        } else {
            openMember(id);
        }
    };

    const getEmptyMessage = () => {
        return currentTab === "project" ? "Не найдено ни одного проекта" : "Не найдено ни одного специалиста";
    };

    const handleNextPage = () => {
        if (page < totalPages - 1) {
            const newPage = page + 1;
            setPage(newPage);
            fetchItems(searchQuery, appliedFilter, currentTab, newPage);
        }
    };

    const handlePreviousPage = () => {
        if (page > 0) {
            const newPage = page - 1;
            setPage(newPage);
            fetchItems(searchQuery, appliedFilter, currentTab, newPage);
        }
    };

    const handleTabChange = (tab) => {
        setCurrentTab(tab);
        setPage(0);  // Reset page to 0 when switching tabs
        fetchItems(searchQuery, appliedFilter, tab, 0);
    };

    return (
        <>
            <Helmet>
                <title>{currentTab === "project" ? "Проекты" : "Специалисты"}</title>
                <body className={styles.body} />
            </Helmet>
            <NavigationBar />
            <div className={styles.peopleAndProjectsPage}>
                <div className={styles.sidebar}>
                    <div className={styles.filters}>
                        {(currentTab === "project" ? projectCategories : specialistSpecializations).map(filter => (
                            <div
                                key={filter}
                                className={`${styles.filter} ${selectedFilter === filter ? styles.activeFilter : ''}`}
                                onClick={() => selectFilter(filter)}
                            >
                                {filter}
                            </div>
                        ))}
                        <button onClick={applyFilter} className={styles.applyButton}>Применить</button>
                    </div>
                </div>
                <div className={styles.content}>
                    <div className={styles.controls}>
                        <button onClick={() => handleTabChange("project")}
                                className={`${styles.tabButton} ${currentTab === "project" ? styles.activeTab : ''}`}>
                            Проекты
                        </button>
                        <button onClick={() => handleTabChange("member")}
                                className={`${styles.tabButton} ${currentTab === "member" ? styles.activeTab : ''}`}>
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
                                    <img
                                        src={`${config.FILE_SERVER}${item.projectLogoUrl || item.avatarUrl || ''}`}
                                        alt={item.projectName || item.username}
                                        className={styles.itemImage}
                                        onError={(e) => {
                                            e.target.src = currentTab === "project" ? "/default_list_element_logo.jpg" : "/default_user_avatar.jpg";
                                        }}
                                    />
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
