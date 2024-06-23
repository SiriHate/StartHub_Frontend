import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import styles from "./ArticlesAndNews.module.css";
import NavigationBar from "../../navigation_bar/NavigationBar";
import config from "../../../config";

const ArticlesAndNews = () => {
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentTab, setCurrentTab] = useState("Новости");
    const [categories, setCategories] = useState(["Все"]);
    const [selectedCategory, setSelectedCategory] = useState("Все");
    const [appliedCategory, setAppliedCategory] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();

    const fetchCategories = async (tab) => {
        try {
            const url = `${config.MAIN_SERVICE}/${tab === "Статьи" ? "article_categories" : "news_categories"}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            const categoryNames = data.map(category => category.name);
            setCategories(["Все", ...categoryNames]);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            setCategories(["Все"]);
        }
    };

    const fetchItems = async (searchQuery, category, currentTab, page) => {
        try {
            const categoryParam = category ? `&category=${category}` : "";
            const queryParam = searchQuery ? `&query=${searchQuery}` : "";
            const url = `${config.MAIN_SERVICE}/${currentTab === "Статьи" ? "articles/search" : "news/search"}?page=${page}&size=10${categoryParam}${queryParam}`;
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
        fetchCategories(currentTab);
        fetchItems("", "", currentTab, 0);
    }, [currentTab]);

    const handleSearch = () => {
        setPage(0);
        fetchItems(searchQuery, appliedCategory, currentTab, 0);
    };

    const applyCategoryFilter = () => {
        setPage(0);
        setSearchQuery("");
        const categoryToApply = selectedCategory === "Все" ? "" : selectedCategory;
        setAppliedCategory(categoryToApply);
        fetchItems("", categoryToApply, currentTab, 0);
    };

    const selectCategory = (category) => {
        setSelectedCategory(category);
    };

    const openArticle = (itemId) => {
        navigate(`/article/${itemId}`);
    };

    const openNews = (itemId) => {
        navigate(`/news/${itemId}`);
    };

    const openItem = (itemId) => {
        if (currentTab === "Статьи") {
            openArticle(itemId);
        } else {
            openNews(itemId);
        }
    };

    const getEmptyMessage = () => {
        return currentTab === "Новости" ? "Не найдено ни одной новости" : "Не найдено ни одной статьи";
    };

    const handleNextPage = () => {
        if (page < totalPages - 1) {
            const newPage = page + 1;
            setPage(newPage);
            fetchItems(searchQuery, appliedCategory, currentTab, newPage);
        }
    };

    const handlePreviousPage = () => {
        if (page > 0) {
            const newPage = page - 1;
            setPage(newPage);
            fetchItems(searchQuery, appliedCategory, currentTab, newPage);
        }
    };

    const handleTabChange = (tab) => {
        setCurrentTab(tab);
        setPage(0);
        fetchCategories(tab);
        fetchItems(searchQuery, appliedCategory, tab, 0);
    };

    return (
        <>
            <Helmet>
                <title>{currentTab}</title>
                <html className={styles.html} />
                <body className={styles.body} />
            </Helmet>
            <NavigationBar />
            <div className={styles.articlesAndNewsPage}>
                <div className={styles.sidebar}>
                    <div className={styles.categories}>
                        {categories.map(category => (
                            <div
                                key={category}
                                className={`${styles.category} ${selectedCategory === category ? styles.activeCategory : ''}`}
                                onClick={() => selectCategory(category)}
                            >
                                {category}
                            </div>
                        ))}
                    </div>
                    <button onClick={applyCategoryFilter} className={styles.applyButton}>Применить</button>
                </div>
                <div className={styles.content}>
                    <div className={styles.controls}>
                        <button onClick={() => handleTabChange("Новости")} className={`${styles.tabButton} ${currentTab === "Новости" ? styles.activeTab : ''}`}>
                            Новости
                        </button>
                        <button onClick={() => handleTabChange("Статьи")} className={`${styles.tabButton} ${currentTab === "Статьи" ? styles.activeTab : ''}`}>
                            Статьи
                        </button>
                        <div className={styles.searchBar}>
                            <input
                                type="text"
                                placeholder={currentTab === "Статьи" ? "Введите название статьи" : "Введите название новости"}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                            <button onClick={handleSearch} className={styles.searchButton}>Поиск</button>
                        </div>
                    </div>
                    <h2 className={styles.publicationsTitle}>{currentTab}</h2>
                    <div className={styles.itemsList}>
                        {items.length === 0 ? (
                            <div className={styles.emptyItems}>{getEmptyMessage()}</div>
                        ) : (
                            items.map(item => (
                                <div key={item.id} className={styles.item} onClick={() => openItem(item.id)}>
                                    <img
                                        src={`${config.FILE_SERVER}${item.previewUrl}`}
                                        alt={item.title}
                                        className={styles.itemImage}
                                        onError={(e) => e.target.src = '/default_list_element_logo.jpg'}
                                    />
                                    <div className={styles.itemContent}>
                                        <div className={styles.itemName}>{item.title}</div>
                                        <div className={styles.itemDetail}>{item.category}</div>
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

export default ArticlesAndNews;
