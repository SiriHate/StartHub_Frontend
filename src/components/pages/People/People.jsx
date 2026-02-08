import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import styles from "./People.module.css";
import Menu from "../../menu/Menu";
import Pagination from "../../pagination/Pagination";
import config from "../../../config";

const People = () => {
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

    const fetchSpecializations = async () => {
        try {
            const response = await fetch(`${config.USER_SERVICE}/member-specializations`);
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();
            const specNames = data.map(s => s.name);
            setFilters(["Все", ...specNames]);
        } catch (error) {
            console.error("Failed to fetch specializations:", error);
            setFilters(["Все"]);
        }
    };

    const fetchItems = async (query, filter, pg, sz) => {
        try {
            setLoading(true);
            const filterParam = filter ? `&specialization=${filter}` : "";
            const queryParam = query ? `&username=${query}` : "";
            const url = `${config.USER_SERVICE}/members?page=${pg}&size=${sz}&profileHiddenFlag=false${filterParam}${queryParam}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();
            setItems(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Failed to fetch members:", error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSpecializations();
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

    const getAvatarUrl = (item) => {
        const url = item.avatarUrl ?? item.avatar_url ?? "";
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
                <title>Пользователи — StartHub</title>
                <body className={styles.body} />
            </Helmet>
            <Menu />
            <div className={styles.page}>
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <i className="fas fa-filter"></i>
                        <span>Специализации</span>
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
                            <i className="fas fa-users"></i> Пользователи
                        </h1>
                        <div className={styles.searchBar}>
                            <input
                                type="text"
                                placeholder="Поиск по имени пользователя..."
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
                            <span>Специализация: {appliedFilter}</span>
                            <button onClick={resetFilters} className={styles.clearFilter}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <p>Загрузка пользователей...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className={styles.emptyState}>
                            <i className="fas fa-user-slash"></i>
                            <p>Не найдено ни одного пользователя</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.list}>
                                {items.map(item => (
                                    <div
                                        key={item.id ?? item.username}
                                        className={styles.card}
                                        onClick={() => navigate(`/members/profile/${item.username}`)}
                                    >
                                        <div className={styles.cardAvatar}>
                                            <img
                                                src={getAvatarUrl(item) || "/default_user_avatar.jpg"}
                                                alt={item.username}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "/default_user_avatar.jpg";
                                                }}
                                            />
                                        </div>
                                        <div className={styles.cardBody}>
                                            <div className={styles.cardTop}>
                                                <h3 className={styles.cardName}>
                                                    {item.name || item.username}
                                                </h3>
                                                {item.name && item.username && (
                                                    <span className={styles.cardUsername}>@{item.username}</span>
                                                )}
                                            </div>
                                            {item.specialization && (
                                                <span className={styles.cardSpec}>
                                                    <i className="fas fa-briefcase"></i> {item.specialization}
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.cardArrow}>
                                            <i className="fas fa-chevron-right"></i>
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

export default People;
