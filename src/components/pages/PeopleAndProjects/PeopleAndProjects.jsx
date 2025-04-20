import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import styles from "./PeopleAndProjects.module.css";
import Menu from "../../menu/Menu";
import Pagination from "../../pagination/Pagination";
import config from "../../../config";

const PeopleAndProjects = () => {
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentTab, setCurrentTab] = useState("project");
    const [filters, setFilters] = useState(["Все"]);
    const [selectedFilter, setSelectedFilter] = useState("Все");
    const [appliedFilter, setAppliedFilter] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [size, setSize] = useState(1); // Количество элементов на странице
    const navigate = useNavigate();

    const fetchCategories = async (tab) => {
        try {
            const url = tab === "project"
                ? `${config.MAIN_SERVICE}/project_categories`
                : `${config.USER_SERVICE}/specialist_specializations`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.json();
            const categoryNames = data.map(category => category.name);
            setFilters(["Все", ...categoryNames]);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            setFilters(["Все"]);
        }
    };

    const fetchItems = async (searchQuery, filter, currentTab, page, size) => {
        try {
            const serviceUrl = currentTab === "project" ? config.MAIN_SERVICE : config.USER_SERVICE;
            const filterParam = filter ? (currentTab === "project" ? `&category=${filter}` : `&specialization=${filter}`) : "";
            const queryParam = searchQuery ? (currentTab === "project" ? `&query=${searchQuery}` : `&username=${searchQuery}`) : "";
            const moderationParam = currentTab === "project" ? "&moderationPassed=true" : "";
            const url = `${serviceUrl}/${currentTab === "project" ? "projects/search" : "members"}?page=${page}&size=${size}${moderationParam}${filterParam}${queryParam}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Network response was not ok");
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
        fetchCategories(currentTab);
        fetchItems("", "", currentTab, 0, size);
    }, [currentTab, size]);

    const handleSearch = () => {
        setPage(0);
        fetchItems(searchQuery, appliedFilter, currentTab, 0, size);
    };

    const applyFilter = () => {
        setPage(0);
        setSearchQuery("");
        const filterToApply = selectedFilter === "Все" ? "" : selectedFilter;
        setAppliedFilter(filterToApply);
        fetchItems("", filterToApply, currentTab, 0, size);
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
            fetchItems(searchQuery, appliedFilter, currentTab, newPage, size);
        }
    };

    const handlePreviousPage = () => {
        if (page > 0) {
            const newPage = page - 1;
            setPage(newPage);
            fetchItems(searchQuery, appliedFilter, currentTab, newPage, size);
        }
    };

    const handleSizeChange = (event) => {
        const newSize = parseInt(event.target.value, 10);
        setSize((prevSize) => {
            fetchItems(searchQuery, appliedFilter || (selectedFilter === "Все" ? "" : selectedFilter), currentTab, 0, newSize);
            return newSize;
        });
        setPage(0);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        fetchItems(searchQuery, appliedFilter, currentTab, newPage, size);
    };

    const handleTabChange = (tab) => {
        setCurrentTab(tab);
        setPage(0);
        fetchCategories(tab);
        fetchItems(searchQuery, appliedFilter, tab, 0, size);
    };

    return (
        <>
            <Helmet>
                <title>{currentTab === "project" ? "Проекты" : "Специалисты"}</title>
                <body className={styles.body} />
            </Helmet>
            <Menu />
            <div className={styles.peopleAndProjectsPage}>
                <div className={styles.sidebar}>
                    <div className={styles.filters}>
                        {filters.map(filter => (
                            <div
                                key={filter}
                                className={`${styles.filter} ${selectedFilter === filter ? styles.activeFilter : ""}`}
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
                                className={`${styles.tabButton} ${currentTab === "project" ? styles.activeTab : ""}`}>
                            Проекты
                        </button>
                        <button onClick={() => handleTabChange("member")}
                                className={`${styles.tabButton} ${currentTab === "member" ? styles.activeTab : ""}`}>
                            Специалисты
                        </button>
                        <div className={styles.searchBar}>
                            <input
                                type="text"
                                placeholder={currentTab === "project" ? "Введите название проекта" : "Введите имя пользователя"}
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
                                <div key={item.id || item.username} className={styles.item}
                                     onClick={() => openItem(item.id || item.username)}>
                                    <img
                                        src={`${config.FILE_SERVER}${item.projectLogoUrl || item.avatarUrl || ""}`}
                                        alt={item.projectName || item.username}
                                        className={styles.itemImage}
                                        onError={(e) => {
                                            e.target.src = currentTab === "project" ? "/default_list_element_logo.jpg" : "/default_user_avatar.jpg";
                                        }}
                                    />
                                    <div className={styles.itemContent}>
                                        <div className={styles.itemName}>
                                            {currentTab === "project" ? item.projectName : (
                                                <>
                                                    {item.name}
                                                    <span className={styles.itemUsername}> ({item.username})</span>
                                                </>
                                            )}
                                        </div>
                                        <div className={styles.itemDetail}>
                                            {currentTab === "project" ? item.category : item.specialization}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {items.length > 0 && (
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            size={size}
                            onPreviousPage={handlePreviousPage}
                            onNextPage={handleNextPage}
                            onSizeChange={handleSizeChange}
                            onPageChange={handlePageChange}
                        />
                    )}
                </div>
            </div>
        </>
    );
};

export default PeopleAndProjects;
