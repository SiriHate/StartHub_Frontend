import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import styles from "./Projects.module.css";
import Menu from "../../menu/Menu";
import Pagination from "../../pagination/Pagination";
import config from "../../../config";

const Projects = () => {
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState(["Все"]);
    const [selectedFilter, setSelectedFilter] = useState("Все");
    const [appliedFilter, setAppliedFilter] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [size, setSize] = useState(4);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/project-categories`);
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();
            const categoryNames = data.map(category => category.name);
            setFilters(["Все", ...categoryNames]);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            setFilters(["Все"]);
        }
    };

    const fetchItems = async (query, filter, pg, sz) => {
        try {
            setLoading(true);
            const filterParam = filter ? `&category=${filter}` : "";
            const queryParam = query ? `&query=${query}` : "";
            const url = `${config.MAIN_SERVICE}/projects?page=${pg}&size=${sz}&moderationPassed=true${filterParam}${queryParam}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();
            setItems(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchItems("", "", 0, size);
    }, []);

    const handleSearch = () => {
        setPage(0);
        fetchItems(searchQuery, appliedFilter, 0, size);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };

    const applyFilter = () => {
        setPage(0);
        setSearchQuery("");
        const filterToApply = selectedFilter === "Все" ? "" : selectedFilter;
        setAppliedFilter(filterToApply);
        fetchItems("", filterToApply, 0, size);
    };

    const resetFilters = () => {
        setSelectedFilter("Все");
        setAppliedFilter("");
        setSearchQuery("");
        setPage(0);
        fetchItems("", "", 0, size);
    };

    const getImageUrl = (item) => {
        const url = item.logoUrl ?? item.logo_url ?? item.projectLogoUrl ?? "";
        if (!url || typeof url !== "string") return "";
        const trimmed = url.trim();
        if (!trimmed) return "";
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
        return `${config.FILE_SERVER || ""}${trimmed}`;
    };

    const handleNextPage = () => {
        if (page < totalPages - 1) {
            const newPage = page + 1;
            setPage(newPage);
            fetchItems(searchQuery, appliedFilter, newPage, size);
        }
    };

    const handlePreviousPage = () => {
        if (page > 0) {
            const newPage = page - 1;
            setPage(newPage);
            fetchItems(searchQuery, appliedFilter, newPage, size);
        }
    };

    const handleSizeChange = (event) => {
        const newSize = parseInt(event.target.value, 10);
        setSize(newSize);
        setPage(0);
        fetchItems(searchQuery, appliedFilter, 0, newSize);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        fetchItems(searchQuery, appliedFilter, newPage, size);
    };

    return (
        <>
            <Helmet>
                <title>Проекты — StartHub</title>
                <body className={styles.body} />
            </Helmet>
            <Menu />
            <div className={styles.page}>
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <i className="fas fa-filter"></i>
                        <span>Категории</span>
                    </div>
                    <div className={styles.filterList}>
                        {filters.map(filter => (
                            <div
                                key={filter}
                                className={`${styles.filterItem} ${selectedFilter === filter ? styles.filterActive : ""}`}
                                onClick={() => setSelectedFilter(filter)}
                            >
                                {filter}
                            </div>
                        ))}
                    </div>
                    <div className={styles.sidebarActions}>
                        <button onClick={applyFilter} className={styles.applyBtn}>
                            <i className="fas fa-check"></i> Применить
                        </button>
                        <button onClick={resetFilters} className={styles.resetBtn}>
                            <i className="fas fa-undo"></i> Сбросить
                        </button>
                    </div>
                </aside>

                <main className={styles.content}>
                    <div className={styles.topBar}>
                        <h1 className={styles.pageTitle}>
                            <i className="fas fa-rocket"></i> Проекты
                        </h1>
                        <div className={styles.searchBar}>
                            <input
                                type="text"
                                placeholder="Поиск проектов..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                className={styles.searchInput}
                            />
                            <button onClick={handleSearch} className={styles.searchBtn}>
                                <i className="fas fa-search"></i>
                            </button>
                        </div>
                    </div>

                    {appliedFilter && (
                        <div className={styles.activeFilterBadge}>
                            <span>Категория: {appliedFilter}</span>
                            <button onClick={resetFilters} className={styles.clearFilter}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <p>Загрузка проектов...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className={styles.emptyState}>
                            <i className="fas fa-folder-open"></i>
                            <p>Не найдено ни одного проекта</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.grid}>
                                {items.map(item => (
                                    <div
                                        key={item.id}
                                        className={styles.card}
                                        onClick={() => navigate(`/project/${item.id}`)}
                                    >
                                        <div className={styles.cardImage}>
                                            <img
                                                src={getImageUrl(item) || "/default_list_element_logo.jpg"}
                                                alt={item.name ?? item.projectName}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "/default_list_element_logo.jpg";
                                                }}
                                            />
                                        </div>
                                        <div className={styles.cardBody}>
                                            <h3 className={styles.cardTitle}>{item.name ?? item.projectName}</h3>
                                            {(item.category ?? item.categoryName) && (
                                                <span className={styles.cardCategory}>
                                                    {item.category ?? item.categoryName}
                                                </span>
                                            )}
                                            {item.owner && (
                                                <span className={styles.cardOwner}>
                                                    <i className="fas fa-user"></i> {typeof item.owner === 'object' ? item.owner.username : item.owner}
                                                </span>
                                            )}
                                            {item.likes != null && (
                                                <span className={styles.cardLikes}>
                                                    <i className="fas fa-heart"></i> {item.likes}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                size={size}
                                onPreviousPage={handlePreviousPage}
                                onNextPage={handleNextPage}
                                onSizeChange={handleSizeChange}
                                onPageChange={handlePageChange}
                            />
                        </>
                    )}
                </main>
            </div>
        </>
    );
};

export default Projects;
