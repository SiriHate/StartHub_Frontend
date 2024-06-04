import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./ArticlesAndNews.module.css";
import NavigationBar from "../../navigation_bar/NavigationBar";
import config from "../../../config";

const categories = ["Все", "Технологии", "Спорт", "Здравоохранение", "Бизнес"];

const ArticlesAndNews = () => {
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentTab, setCurrentTab] = useState("Новости");
    const [selectedCategory, setSelectedCategory] = useState("Все");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const url = `${config.MAIN_SERVICE}/${currentTab === "Статьи" ? "article" : "news"}?page=${page}&size=1`;
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
        fetchItems();
    }, [currentTab, page]);

    const handleSearch = () => {
        const filteredItems = items.filter(item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setItems(filteredItems);
    };

    const handleCreateArticle = () => {
        navigate('/create_article');
    };

    const handleCreateNews = () => {
        navigate('/create_news');
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
                <title>{currentTab}</title>
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            <NavigationBar />
            <div className={styles.articlesAndNewsPage}>
                <div className={styles.sidebar}>
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
                        <button
                            onClick={currentTab === "Статьи" ? handleCreateArticle : handleCreateNews}
                            className={styles.createButton}
                        >
                            Создать публикацию
                        </button>
                    </div>
                    <h2 className={styles.publicationsTitle}>{currentTab}</h2>
                    <div className={styles.itemsList}>
                        {items.length === 0 ? (
                            <div className={styles.emptyItems}>{getEmptyMessage()}</div>
                        ) : (
                            items.map(item => (
                                <div key={item.id} className={styles.item} onClick={() => openItem(item.id)}>
                                    <img src={item.previewUrl} alt={item.title} className={styles.itemImage}/>
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