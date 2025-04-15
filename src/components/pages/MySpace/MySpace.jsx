import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import styles from "./MySpace.module.css";
import Menu from "../../menu/Menu";
import Pagination from "../../pagination/Pagination";
import config from "../../../config";

const categories = ["Мои проекты", "Мои статьи", "Мои новости"];

const MySpace = () => {
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(categories[0]);
    const [appliedCategory, setAppliedCategory] = useState("");
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();

    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

    const fetchItems = async (category, query, page, size) => {
        console.log("📡 [fetchItems] called with:", { category, query, page, size });

        try {
            let url;
            switch (category) {
                case "Мои проекты":
                    url = `${config.MAIN_SERVICE}/users/my/projects/owned`;
                    break;
                case "Мои статьи":
                    url = `${config.MAIN_SERVICE}/users/my/articles`;
                    break;
                case "Мои новости":
                    url = `${config.MAIN_SERVICE}/users/my/news`;
                    break;
                default:
                    url = `${config.MAIN_SERVICE}/users/my/projects/owned`;
            }

            const queryParam = query ? `&query=${query}` : "";
            const fullUrl = `${url}?page=${page}&size=${size}${queryParam}`;
            console.log("🌐 [fetchItems] URL:", fullUrl);

            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken
                }
            });

            if (!response.ok) {
                console.error("❌ [fetchItems] Response Error:", response.statusText);
                return;
            }

            const data = await response.json();
            console.log("✅ [fetchItems] Response data:", data);

            setItems(Array.isArray(data.content) ? data.content : []);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error("🔥 [fetchItems] Exception:", error);
        }
    };

    useEffect(() => {
        fetchItems(appliedCategory, searchQuery, page, size);
    }, [appliedCategory, searchQuery, page, size]);

    const handleSearch = () => {
        console.log("🔍 [handleSearch] Search initiated:", searchQuery);
        setPage(0);
    };

    const applyCategoryFilter = () => {
        console.log("📦 [applyCategoryFilter] Applying category:", selectedCategory);
        setSearchQuery("");
        setAppliedCategory(selectedCategory);
        setPage(0);
    };

    const handleCreateItem = () => {
        if (selectedCategory === "Мои проекты") navigate('/create_project');
        if (selectedCategory === "Мои статьи") navigate('/create_article');
        if (selectedCategory === "Мои новости") navigate('/create_news');
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
        const newSize = parseInt(event.target.value, 10);
        console.log("📐 [handleSizeChange] New size selected:", newSize);
        setPage(0);
        setSize(newSize);
    };

    const handlePageChange = (newPage) => {
        console.log("📄 [handlePageChange] Page changed to:", newPage);
        setPage(newPage);
    };

    const getSearchPlaceholder = () => {
        switch (selectedCategory) {
            case "Мои проекты":
                return "Введите название проекта";
            case "Мои статьи":
                return "Введите название статьи";
            case "Мои новости":
                return "Введите название публикации";
            default:
                return "Поиск";
        }
    };

    const getCreateButtonText = () => {
        switch (selectedCategory) {
            case "Мои проекты":
                return "Создать проект";
            case "Мои статьи":
                return "Создать статью";
            case "Мои новости":
                return "Создать публикацию";
            default:
                return "Создать";
        }
    };

    return (
        <>
            <Helmet>
                <title>Мое пространство - StartHub</title>
                <body className={styles.body}/>
            </Helmet>
            <Menu/>
            <div className={styles.mySpacePage}>
                <div className={styles.sidebar}>
                    {categories.map((category) => (
                        <div
                            key={category}
                            className={`${styles.category} ${selectedCategory === category ? styles.activeCategory : ''}`}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </div>
                    ))}
                    <button className={styles.applyButton} onClick={applyCategoryFilter}>
                        Применить
                    </button>
                </div>
                <div className={styles.content}>
                    <div className={styles.controls}>
                        <div className={styles.searchBar}>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder={getSearchPlaceholder()}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button className={styles.button} onClick={handleSearch}>
                                Поиск
                            </button>
                            <button className={styles.createButton} onClick={handleCreateItem}>
                                {getCreateButtonText()}
                            </button>
                        </div>
                    </div>
                    <h1 className={styles.mySpaceTitle}>{selectedCategory}</h1>
                    <div className={styles.itemsList}>
                        {items.length === 0 ? (
                            <div className={styles.emptyItems}>
                                Не найдено ни одного {selectedCategory.toLowerCase().split(" ")[1]}
                            </div>
                        ) : (
                            items.map(item => (
                                <div key={item.id} className={styles.item} onClick={() => openItem(item.id)}>
                                    <img
                                        src={`${config.FILE_SERVER}${selectedCategory === "Мои проекты" ? item.projectLogoUrl : item.previewUrl}`}
                                        alt={item.title || item.projectName || item.eventName}
                                        className={styles.itemImage}
                                        onError={(e) => e.target.src = '/default_list_element_logo.jpg'}
                                    />
                                    <div className={styles.itemContent}>
                                        <div className={styles.itemName}>{item.title || item.projectName || item.eventName}</div>
                                        <div className={styles.itemDetail}>{item.category}</div>
                                    </div>
                                    <button
                                        className={styles.manageButton}
                                        onClick={(e) => manageItem(item.id, e)}
                                    >
                                        {selectedCategory === "Мои проекты" ? "Управление проектом" : "Управление публикацией"}
                                    </button>
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

export default MySpace;
