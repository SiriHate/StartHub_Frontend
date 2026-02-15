import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import styles from "./MySpace.module.css";
import Menu from "../../menu/Menu";
import Pagination from "../../pagination/Pagination";
import config from "../../../config";
import apiClient from "../../../api/apiClient";

const sidebarCategories = [
    { key: "Мои проекты", icon: "fa-rocket", label: "Мои проекты" },
    { key: "Мои статьи", icon: "fa-book-open", label: "Мои статьи" },
    { key: "Мои новости", icon: "fa-newspaper", label: "Мои новости" },
];

const MySpace = () => {
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Мои проекты");
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(4);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchItems = async (category, query, pg, sz) => {
        try {
            setLoading(true);
            setItems([]);

            let url;
            switch (category) {
                case "Мои проекты":
                    url = `${config.MAIN_SERVICE}/me/projects`;
                    break;
                case "Мои статьи":
                    url = `${config.MAIN_SERVICE}/articles/me`;
                    break;
                case "Мои новости":
                    url = `${config.MAIN_SERVICE}/news/me`;
                    break;
                default:
                    url = `${config.MAIN_SERVICE}/me/projects`;
            }

            const params = new URLSearchParams();
            params.append("page", pg);
            params.append("size", sz);
            if (query) params.append("query", query);

            const response = await apiClient(`${url}?${params.toString()}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) return;

            const data = await response.json();
            setItems(Array.isArray(data.content) ? data.content : []);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error("Failed to fetch items:", error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems(selectedCategory, searchQuery, page, size);
    }, [selectedCategory, page, size]);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        setPage(0);
        fetchItems(selectedCategory, searchQuery, 0, size);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") handleSearch(e);
    };

    const handleCategoryChange = (cat) => {
        setSelectedCategory(cat);
        setSearchQuery("");
        setPage(0);
    };

    const handleCreateItem = () => {
        if (selectedCategory === "Мои проекты") navigate("/create_project");
        if (selectedCategory === "Мои статьи") navigate("/create_article");
        if (selectedCategory === "Мои новости") navigate("/create_news");
    };

    const openItem = (id) => {
        if (selectedCategory === "Мои проекты") navigate(`/project/${id}`);
        if (selectedCategory === "Мои статьи") navigate(`/article/${id}`);
        if (selectedCategory === "Мои новости") navigate(`/news/${id}`);
    };

    const manageItem = (id, e) => {
        e.stopPropagation();
        if (selectedCategory === "Мои проекты") navigate(`/manage_project/${id}`);
        if (selectedCategory === "Мои статьи") navigate(`/manage_article/${id}`);
        if (selectedCategory === "Мои новости") navigate(`/manage_news/${id}`);
    };

    const handleNextPage = () => {
        if (page < totalPages - 1) setPage(prev => prev + 1);
    };

    const handlePreviousPage = () => {
        if (page > 0) setPage(prev => prev - 1);
    };

    const handleSizeChange = (event) => {
        setPage(0);
        setSize(parseInt(event.target.value, 10));
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const getSearchPlaceholder = () => {
        switch (selectedCategory) {
            case "Мои проекты": return "Поиск проектов...";
            case "Мои статьи": return "Поиск статей...";
            case "Мои новости": return "Поиск новостей...";
            default: return "Поиск...";
        }
    };

    const getCreateButtonText = () => {
        switch (selectedCategory) {
            case "Мои проекты": return "Создать проект";
            case "Мои статьи": return "Создать статью";
            case "Мои новости": return "Создать новость";
            default: return "Создать";
        }
    };

    const getCreateIcon = () => {
        switch (selectedCategory) {
            case "Мои проекты": return "fa-rocket";
            case "Мои статьи": return "fa-pen";
            case "Мои новости": return "fa-bullhorn";
            default: return "fa-plus";
        }
    };

    const getCategoryIcon = () => {
        const found = sidebarCategories.find(c => c.key === selectedCategory);
        return found ? found.icon : "fa-folder";
    };

    const getPreviewSrc = (item) => {
        const url = item.logoUrl
            || (selectedCategory === "Мои проекты"
                ? (item.projectLogoUrl ? `${config.FILE_SERVER}${item.projectLogoUrl}` : "")
                : (item.previewUrl ? `${config.FILE_SERVER}${item.previewUrl}` : ""));
        if (!url || typeof url !== "string") return "";
        const trimmed = url.trim();
        if (!trimmed) return "";
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
        return `${config.FILE_SERVER || ""}${trimmed}`;
    };

    const getEmptyNoun = () => {
        switch (selectedCategory) {
            case "Мои проекты": return "проектов";
            case "Мои статьи": return "статей";
            case "Мои новости": return "новостей";
            default: return "элементов";
        }
    };

    return (
        <>
            <Helmet>
                <title>Мое пространство — StartHub</title>
                <body className={styles.body} />
            </Helmet>
            <Menu />
            <div className={styles.page}>
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <i className="fas fa-th-large"></i>
                        <span>Мое пространство</span>
                    </div>
                    <div className={styles.filterList}>
                        {sidebarCategories.map(cat => (
                            <div
                                key={cat.key}
                                className={`${styles.filterItem} ${selectedCategory === cat.key ? styles.filterActive : ""}`}
                                onClick={() => handleCategoryChange(cat.key)}
                            >
                                <i className={`fas ${cat.icon}`}></i>
                                <span>{cat.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.sidebarActions}>
                        <button onClick={handleCreateItem} className={styles.createBtn}>
                            <i className={`fas ${getCreateIcon()}`}></i> {getCreateButtonText()}
                        </button>
                    </div>
                </aside>

                <main className={styles.content}>
                    <div className={styles.topBar}>
                        <h1 className={styles.pageTitle}>
                            <i className={`fas ${getCategoryIcon()}`}></i> {selectedCategory}
                        </h1>
                        <div className={styles.searchBar}>
                            <input
                                type="text"
                                placeholder={getSearchPlaceholder()}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                className={styles.searchInput}
                            />
                            <button onClick={handleSearch} className={styles.searchBtn}>
                                <i className="fas fa-search"></i>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <p>Загрузка...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className={styles.emptyState}>
                            <i className={`fas ${getCategoryIcon()}`}></i>
                            <p>Не найдено ни одного из ваших {getEmptyNoun()}</p>
                            <button className={styles.emptyCreateBtn} onClick={handleCreateItem}>
                                <i className="fas fa-plus"></i> {getCreateButtonText()}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className={styles.grid}>
                                {items.map(item => {
                                    const itemTitle = item.name || item.title || item.projectName || item.eventName;
                                    return (
                                        <div key={item.id} className={styles.card} onClick={() => openItem(item.id)}>
                                            <div className={styles.cardImage}>
                                                <img
                                                    src={getPreviewSrc(item) || "/default_list_element_logo.jpg"}
                                                    alt={itemTitle}
                                                    onError={(e) => { e.target.onerror = null; e.target.src = "/default_list_element_logo.jpg"; }}
                                                />
                                            </div>
                                            <div className={styles.cardBody}>
                                                <h3 className={styles.cardTitle}>{itemTitle}</h3>
                                                {item.category && (
                                                    <span className={styles.cardCategory}>{item.category}</span>
                                                )}
                                                <button
                                                    className={styles.manageBtn}
                                                    onClick={(e) => manageItem(item.id, e)}
                                                >
                                                    <i className="fas fa-cog"></i> Управление
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
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

export default MySpace;
