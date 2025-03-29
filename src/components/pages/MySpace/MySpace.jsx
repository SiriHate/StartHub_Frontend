import React, {useEffect, useState} from "react";
import {Helmet} from "react-helmet";
import {useNavigate} from 'react-router-dom';
import styles from "./MySpace.module.css";
import Menu from "../../menu/Menu";
import Pagination from "../../Pagination/Pagination";
import config from '../../../config';

const categories = ["Мои проекты", "Мои статьи", "Мои новости", "Мои мероприятия"];

const MySpace = () => {
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(categories[0]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();
    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

    const fetchItems = async (category, searchQuery, page) => {
        try {
            let url = `${config.MAIN_SERVICE}/users/my/projects/owned`;
            if (category === "Мои статьи") {
                url = `${config.MAIN_SERVICE}/users/my/articles`;
            } else if (category === "Мои новости") {
                url = `${config.MAIN_SERVICE}/users/my/news`;
            } else if (category === "Мои мероприятия") {
                url = `${config.MAIN_SERVICE}/users/my/events`;
            }
            const categoryParam = category ? `&category=${category}` : "";
            const queryParam = searchQuery ? `&query=${searchQuery}` : "";
            const response = await fetch(`${url}?page=${page}&size=1${categoryParam}${queryParam}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken
                }
            });

            if (response.ok) {
                const data = await response.json();
                setItems(Array.isArray(data.content) ? data.content : []);
                setTotalPages(data.totalPages || 1);
            } else {
                console.error('Failed to fetch items:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    };

    useEffect(() => {
        fetchItems(selectedCategory, searchQuery, 0);
    }, [selectedCategory, searchQuery, page]);

    const handleSearch = () => {
        setPage(0);  // Reset page to 0 when performing a new search
        fetchItems(selectedCategory, searchQuery, 0);
    };

    const handleCreateItem = () => {
        if (selectedCategory === "Мои проекты") {
            navigate('/create_project');
        } else if (selectedCategory === "Мои статьи") {
            navigate('/create_article');
        } else if (selectedCategory === "Мои новости") {
            navigate('/create_news');
        } else if (selectedCategory === "Мои мероприятия") {
            navigate('/create_event');
        }
    };

    const openItem = (itemId) => {
        if (selectedCategory === "Мои проекты") {
            navigate(`/project/${itemId}`);
        } else if (selectedCategory === "Мои статьи") {
            navigate(`/article/${itemId}`);
        } else if (selectedCategory === "Мои новости") {
            navigate(`/news/${itemId}`);
        } else if (selectedCategory === "Мои мероприятия") {
            navigate(`/event/${itemId}`);
        }
    };

    const manageItem = (itemId) => {
        if (selectedCategory === "Мои проекты") {
            navigate(`/manage_project/${itemId}`);
        } else if (selectedCategory === "Мои статьи") {
            navigate(`/manage_article/${itemId}`);
        } else if (selectedCategory === "Мои новости") {
            navigate(`/manage_news/${itemId}`);
        } else if (selectedCategory === "Мои мероприятия") {
            navigate(`/manage_event/${itemId}`);
        }
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

    const getSearchPlaceholder = () => {
        switch (selectedCategory) {
            case "Мои проекты":
                return "Введите название проекта";
            case "Мои статьи":
            case "Мои новости":
                return "Введите название публикации";
            case "Мои мероприятия":
                return "Введите название мероприятия";
            default:
                return "Поиск";
        }
    };

    const getCreateButtonText = () => {
        switch (selectedCategory) {
            case "Мои проекты":
                return "Создать проект";
            case "Мои статьи":
            case "Мои новости":
                return "Создать публикацию";
            case "Мои мероприятия":
                return "Создать мероприятие";
            default:
                return "Создать";
        }
    };

    return (
        <>
            <Helmet>
                <title>{selectedCategory}</title>
                <body className={styles.body}/>
            </Helmet>
            <Menu/>
            <div className={styles.mySpacePage}>
                <div className={styles.sidebar}>
                    <div className={styles.categories}>
                        {categories.map(category => (
                            <div
                                key={category}
                                className={`${styles.category} ${selectedCategory === category ? styles.activeCategory : ''}`}
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category}
                            </div>
                        ))}
                    </div>
                </div>
                <div className={styles.content}>
                    <div className={styles.controls}>
                        <div className={styles.searchBar}>
                            <input
                                type="text"
                                placeholder={getSearchPlaceholder()}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                            <button onClick={handleSearch} className={styles.button}>Поиск</button>
                        </div>
                        <button onClick={handleCreateItem} className={`${styles.button} ${styles.createButton}`}>
                            {getCreateButtonText()}
                        </button>
                    </div>
                    <h2 className={styles.mySpaceTitle}>{selectedCategory}</h2>
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
                                        <div
                                            className={styles.itemName}>{item.title || item.projectName || item.eventName}</div>
                                        <div className={styles.itemDetail}>{item.category}</div>
                                    </div>
                                    <button
                                        className={styles.manageButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            manageItem(item.id);
                                        }}
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
                            onPreviousPage={handlePreviousPage}
                            onNextPage={handleNextPage}
                        />
                    )}
                </div>
            </div>
        </>
    );
};

export default MySpace;
