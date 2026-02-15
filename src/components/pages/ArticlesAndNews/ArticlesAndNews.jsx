import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import styles from "./ArticlesAndNews.module.css";
import Menu from "../../menu/Menu";
import Pagination from "../../pagination/Pagination";
import config from "../../../config";
import apiClient from '../../../api/apiClient';

const ArticlesAndNews = () => {
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentTab, setCurrentTab] = useState("Новости");
    const [categories, setCategories] = useState(["Все"]);
    const [selectedCategory, setSelectedCategory] = useState("Все");
    const [appliedCategory, setAppliedCategory] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [size, setSize] = useState(4);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchCategories = async (tab) => {
        try {
            const url = `${config.MAIN_SERVICE}/${tab === "Статьи" ? "article-categories" : "news-categories"}`;
            const response = await apiClient(url);
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();
            const categoryNames = data.map(category => category.name);
            setCategories(["Все", ...categoryNames]);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            setCategories(["Все"]);
        }
    };

    const fetchItems = async (query, category, tab, pg, sz) => {
        try {
            setLoading(true);
            const path = tab === "Статьи" ? "articles" : "news";
            const params = new URLSearchParams();
            params.set("page", String(pg));
            params.set("size", String(sz));
            params.set("moderationPassed", "true");
            if (category) params.set("category", category);
            if (query) params.set("query", query);
            const url = `${config.MAIN_SERVICE}/${path}?${params.toString()}`;
            const response = await apiClient(url);
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();
            setItems(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Failed to fetch items:", error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories(currentTab);
        fetchItems("", "", currentTab, 0, size);
    }, [currentTab]);

    const handleSearch = () => {
        setPage(0);
        fetchItems(searchQuery, appliedCategory, currentTab, 0, size);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };

    const applyCategoryFilter = () => {
        setPage(0);
        setSearchQuery("");
        const categoryToApply = selectedCategory === "Все" ? "" : selectedCategory;
        setAppliedCategory(categoryToApply);
        fetchItems("", categoryToApply, currentTab, 0, size);
    };

    const resetFilters = () => {
        setSelectedCategory("Все");
        setAppliedCategory("");
        setSearchQuery("");
        setPage(0);
        fetchItems("", "", currentTab, 0, size);
    };

    const handleTabChange = (tab) => {
        setCurrentTab(tab);
        setSelectedCategory("Все");
        setAppliedCategory("");
        setSearchQuery("");
        setPage(0);
    };

    const openItem = (itemId) => {
        if (currentTab === "Статьи") {
            navigate(`/article/${itemId}`);
        } else {
            navigate(`/news/${itemId}`);
        }
    };

    const getPreviewSrc = (item) => {
        const url = item?.logoUrl ?? item?.logo_url ?? item?.previewUrl ?? item?.preview_url;
        if (!url || typeof url !== "string") return "/default_list_element_logo.jpg";
        const trimmed = url.trim();
        if (!trimmed) return "/default_list_element_logo.jpg";
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
        return `${config.FILE_SERVER || ""}${trimmed}`;
    };

    const handleNextPage = () => {
        if (page < totalPages - 1) {
            const newPage = page + 1;
            setPage(newPage);
            fetchItems(searchQuery, appliedCategory, currentTab, newPage, size);
        }
    };

    const handlePreviousPage = () => {
        if (page > 0) {
            const newPage = page - 1;
            setPage(newPage);
            fetchItems(searchQuery, appliedCategory, currentTab, newPage, size);
        }
    };

    const handleSizeChange = (event) => {
        const newSize = parseInt(event.target.value, 10);
        setSize(newSize);
        setPage(0);
        fetchItems(searchQuery, appliedCategory, currentTab, 0, newSize);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        fetchItems(searchQuery, appliedCategory, currentTab, newPage, size);
    };

    const tabIcon = currentTab === "Новости" ? "fa-newspaper" : "fa-book-open";

    return (
        <>
            <Helmet>
                <title>{currentTab} — StartHub</title>
                <body className={styles.body} />
            </Helmet>
            <Menu />
            <div className={styles.page}>
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <i className="fas fa-filter"></i>
                        <span>Категории</span>
                    </div>

                    <div className={styles.tabRow}>
                        <button
                            className={`${styles.tabBtn} ${currentTab === "Новости" ? styles.tabActive : ""}`}
                            onClick={() => handleTabChange("Новости")}
                        >
                            <i className="fas fa-newspaper"></i> Новости
                        </button>
                        <button
                            className={`${styles.tabBtn} ${currentTab === "Статьи" ? styles.tabActive : ""}`}
                            onClick={() => handleTabChange("Статьи")}
                        >
                            <i className="fas fa-book-open"></i> Статьи
                        </button>
                    </div>

                    <div className={styles.filterList}>
                        {categories.map(cat => (
                            <div
                                key={cat}
                                className={`${styles.filterItem} ${selectedCategory === cat ? styles.filterActive : ""}`}
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </div>
                        ))}
                    </div>

                    <div className={styles.sidebarActions}>
                        <button onClick={applyCategoryFilter} className={styles.applyBtn}>
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
                            <i className={`fas ${tabIcon}`}></i> {currentTab}
                        </h1>
                        <div className={styles.searchBar}>
                            <input
                                type="text"
                                placeholder={currentTab === "Статьи" ? "Поиск статей..." : "Поиск новостей..."}
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

                    {appliedCategory && (
                        <div className={styles.activeFilterBadge}>
                            <span>Категория: {appliedCategory}</span>
                            <button onClick={resetFilters} className={styles.clearFilter}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <p>Загрузка...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className={styles.emptyState}>
                            <i className={`fas ${currentTab === "Новости" ? "fa-newspaper" : "fa-book-open"}`}></i>
                            <p>{currentTab === "Новости" ? "Не найдено ни одной новости" : "Не найдено ни одной статьи"}</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.grid}>
                                {items.map(item => (
                                    <div key={item.id} className={styles.card} onClick={() => openItem(item.id)}>
                                        <div className={styles.cardImage}>
                                            <img
                                                src={getPreviewSrc(item)}
                                                alt={item.title}
                                                referrerPolicy="no-referrer"
                                                onError={(e) => { e.target.onerror = null; e.target.src = "/default_list_element_logo.jpg"; }}
                                            />
                                        </div>
                                        <div className={styles.cardBody}>
                                            <h3 className={styles.cardTitle}>{item.title}</h3>
                                            {item.category && (
                                                <span className={styles.cardCategory}>{item.category}</span>
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

export default ArticlesAndNews;
