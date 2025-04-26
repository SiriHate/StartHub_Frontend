import React, { useState, useEffect } from 'react';
import styles from './ModeratorPanel.module.css';
import Pagination from '../../pagination/Pagination';
import { useNavigate } from 'react-router-dom';
import config from '../../../config';

const ModeratorPanel = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('published');
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [news, setNews] = useState([]);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Проверка роли пользователя
    useEffect(() => {
        const checkUserRole = async () => {
            try {
                const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
                const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

                if (!authorizationToken) {
                    navigate('/not-found');
                    return;
                }

                const response = await fetch(`${config.USER_SERVICE}/users/me`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authorizationToken
                    }
                });

                if (!response.ok) {
                    navigate('/not-found');
                    return;
                }

                const data = await response.json();
                if (data.role !== 'MODERATOR') {
                    navigate('/not-found');
                }
            } catch (error) {
                console.error('Ошибка при проверке роли пользователя:', error);
                navigate('/not-found');
            }
        };

        checkUserRole();
    }, [navigate]);

    // Загрузка пользователей
    const fetchUsers = async (page = 0, search = '') => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                username: search,
                page: page,
                size: itemsPerPage
            });
            
            const response = await fetch(`${config.USER_SERVICE}/members?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке пользователей');
            }

            const data = await response.json();
            setUsers(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Ошибка при загрузке пользователей:', error);
        } finally {
            setLoading(false);
        }
    };

    // Загрузка проектов
    const fetchProjects = async (page = 0) => {
        try {
            setLoading(true);
            const moderationPassed = statusFilter === 'published' ? 'true' : 'false';
            const response = await fetch(`${config.MAIN_SERVICE}/projects?moderationPassed=${moderationPassed}&page=${page}&size=${itemsPerPage}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.errorMessage === "No unmoderated projects found") {
                    setProjects([]);
                    setTotalPages(0);
                    return;
                }
                throw new Error('Ошибка при загрузке проектов');
            }

            const data = await response.json();
            setProjects(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Ошибка при загрузке проектов:', error);
            setProjects([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    // Загрузка новостей
    const fetchNews = async (page = 0) => {
        try {
            setLoading(true);
            const moderationPassed = statusFilter === 'published' ? 'true' : 'false';
            const response = await fetch(`${config.MAIN_SERVICE}/news?moderationPassed=${moderationPassed}&page=${page}&size=${itemsPerPage}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.errorMessage === "No unmoderated news found") {
                    setNews([]);
                    setTotalPages(0);
                    return;
                }
                throw new Error('Ошибка при загрузке новостей');
            }

            const data = await response.json();
            setNews(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Ошибка при загрузке новостей:', error);
            setNews([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    // Загрузка статей
    const fetchArticles = async (page = 0) => {
        try {
            setLoading(true);
            const moderationPassed = statusFilter === 'published' ? 'true' : 'false';
            const response = await fetch(`${config.MAIN_SERVICE}/articles?moderationPassed=${moderationPassed}&page=${page}&size=${itemsPerPage}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.errorMessage === "No unmoderated articles found") {
                    setArticles([]);
                    setTotalPages(0);
                    return;
                }
                throw new Error('Ошибка при загрузке статей');
            }

            const data = await response.json();
            setArticles(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Ошибка при загрузке статей:', error);
            setArticles([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers(currentPage - 1, searchQuery);
        } else if (activeTab === 'projects') {
            fetchProjects(currentPage - 1);
        } else if (activeTab === 'news') {
            fetchNews(currentPage - 1);
        } else if (activeTab === 'articles') {
            fetchArticles(currentPage - 1);
        }
    }, [activeTab, currentPage, searchQuery, statusFilter, itemsPerPage]);

    const getCurrentData = () => {
        switch (activeTab) {
            case 'users':
                return users;
            case 'projects':
                return projects;
            case 'news':
                return news;
            case 'articles':
                return articles;
            default:
                return [];
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        if (activeTab === 'users') {
            fetchUsers(0, searchQuery);
        }
    };

    const handleLogout = () => {
        document.cookie = 'Authorization=; Max-Age=0; path=/; SameSite=None; Secure';
        navigate('/');
    };

    const handleUserClick = (username) => {
        navigate(`/members/profile/${username}`);
    };

    const handleProjectClick = (id) => {
        navigate(`/project/${id}`);
    };

    const handleNewsClick = (id) => {
        navigate(`/news/${id}`);
    };

    const handleArticleClick = (id) => {
        navigate(`/article/${id}`);
    };

    const handleBlock = async (username) => {
        try {
            const response = await fetch(`${config.USER_SERVICE}/members/by-username/${username}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при блокировке пользователя');
            }

            // Обновляем список пользователей после блокировки
            fetchUsers(currentPage - 1, searchQuery);
        } catch (error) {
            console.error('Ошибка при блокировке пользователя:', error);
        }
    };

    const handleDeleteProject = async (id) => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/projects/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении проекта');
            }

            fetchProjects(currentPage - 1);
        } catch (error) {
            console.error('Ошибка при удалении проекта:', error);
        }
    };

    const handleDeleteNews = async (id) => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/news/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении новости');
            }

            fetchNews(currentPage - 1);
        } catch (error) {
            console.error('Ошибка при удалении новости:', error);
        }
    };

    const handleDeleteArticle = async (id) => {
        try {
            const response = await fetch(`${config.MAIN_SERVICE}/articles/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении статьи');
            }

            fetchArticles(currentPage - 1);
        } catch (error) {
            console.error('Ошибка при удалении статьи:', error);
        }
    };

    const handleApprove = async (id) => {
        try {
            let endpoint = '';
            if (activeTab === 'projects') {
                endpoint = `${config.MAIN_SERVICE}/projects/${id}/moderationPassed`;
            } else if (activeTab === 'news') {
                endpoint = `${config.MAIN_SERVICE}/news/${id}/moderationPassed`;
            } else if (activeTab === 'articles') {
                endpoint = `${config.MAIN_SERVICE}/articles/${id}/moderationPassed`;
            }

            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(true)
            });

            if (!response.ok) {
                throw new Error('Ошибка при одобрении');
            }

            // Обновляем список после успешного одобрения
            if (activeTab === 'projects') {
                fetchProjects(currentPage - 1);
            } else if (activeTab === 'news') {
                fetchNews(currentPage - 1);
            } else if (activeTab === 'articles') {
                fetchArticles(currentPage - 1);
            }
        } catch (error) {
            console.error('Ошибка при одобрении:', error);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page + 1);
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleSizeChange = (event) => {
        setItemsPerPage(parseInt(event.target.value));
        setCurrentPage(1);
    };

    return (
        <div className={styles.body}>
            <button className={styles.logoutButton} onClick={handleLogout}>
                Выйти
            </button>
            <div className={styles.moderatorPanelPage}>
                <div className={styles.moderatorPanelContainer}>
                    <h1 className={styles.panelTitle}>Панель модератора</h1>
                    
                    <div className={styles.searchContainer}>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Поиск..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                        />
                        <button
                            className={styles.searchButton}
                            onClick={handleSearch}
                        >
                            Поиск
                        </button>
                    </div>

                    <div className={styles.tabsContainer}>
                        <button
                            className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            Пользователи
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'projects' ? styles.active : ''}`}
                            onClick={() => setActiveTab('projects')}
                        >
                            Проекты
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'news' ? styles.active : ''}`}
                            onClick={() => setActiveTab('news')}
                        >
                            Новости
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'articles' ? styles.active : ''}`}
                            onClick={() => setActiveTab('articles')}
                        >
                            Статьи
                        </button>
                    </div>

                    {(activeTab !== 'users') && (
                        <div className={styles.statusFilter}>
                            <button
                                className={`${styles.statusButton} ${statusFilter === 'published' ? styles.active : ''}`}
                                onClick={() => setStatusFilter('published')}
                            >
                                Опубликованные
                            </button>
                            <button
                                className={`${styles.statusButton} ${statusFilter === 'pending' ? styles.active : ''}`}
                                onClick={() => setStatusFilter('pending')}
                            >
                                Ожидающие модерации
                            </button>
                        </div>
                    )}

                    <div className={styles.listContainer}>
                        {loading ? (
                            <div className={styles.emptyState}>Загрузка...</div>
                        ) : getCurrentData().length > 0 ? (
                            getCurrentData().map((item) => (
                                <div 
                                    key={item.id} 
                                    className={styles.listItem}
                                    onClick={() => {
                                        if (activeTab === 'users') {
                                            handleUserClick(item.username);
                                        } else if (activeTab === 'projects') {
                                            handleProjectClick(item.id);
                                        } else if (activeTab === 'news') {
                                            handleNewsClick(item.id);
                                        } else if (activeTab === 'articles') {
                                            handleArticleClick(item.id);
                                        }
                                    }}
                                    style={{ cursor: activeTab === 'users' ? 'pointer' : 'default' }}
                                >
                                    <div className={styles.itemInfo}>
                                        <div className={styles.itemTitle}>
                                            {activeTab === 'users' ? (
                                                <>
                                                    <span className={styles.name}>{item.name}</span>
                                                    <span className={styles.username}>({item.username})</span>
                                                </>
                                            ) : activeTab === 'projects' ? (
                                                <>
                                                    <span className={styles.name}>{item.projectName}</span>
                                                    <span className={styles.username}>{item.projectOwner}</span>
                                                </>
                                            ) : activeTab === 'news' ? (
                                                <>
                                                    <span className={styles.name}>{item.title}</span>
                                                    <span className={styles.username}>{item.owner}</span>
                                                </>
                                            ) : activeTab === 'articles' ? (
                                                <>
                                                    <span className={styles.name}>{item.title}</span>
                                                    <span className={styles.username}>{item.owner}</span>
                                                </>
                                            ) : null}
                                        </div>
                                        <div className={styles.itemSubtitle}>
                                            {activeTab === 'users' ? (
                                                <div>{item.email}</div>
                                            ) : activeTab === 'projects' ? (
                                                <>
                                                    <div>{item.category}</div>
                                                </>
                                            ) : activeTab === 'news' ? (
                                                <div>{item.category}</div>
                                            ) : activeTab === 'articles' ? (
                                                <div>{item.category}</div>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className={styles.actions}>
                                        {activeTab === 'users' ? (
                                            <button
                                                className={`${styles.actionButton} ${styles.blockButton}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleBlock(item.username);
                                                }}
                                            >
                                                Заблокировать
                                            </button>
                                        ) : activeTab === 'projects' ? (
                                            <>
                                                {statusFilter === 'pending' && (
                                                    <button
                                                        className={`${styles.actionButton} ${styles.approveButton}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleApprove(item.id);
                                                        }}
                                                    >
                                                        Одобрить
                                                    </button>
                                                )}
                                                <button
                                                    className={`${styles.actionButton} ${styles.blockButton}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteProject(item.id);
                                                    }}
                                                >
                                                    Заблокировать
                                                </button>
                                            </>
                                        ) : activeTab === 'news' ? (
                                            <>
                                                {statusFilter === 'pending' && (
                                                    <button
                                                        className={`${styles.actionButton} ${styles.approveButton}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleApprove(item.id);
                                                        }}
                                                    >
                                                        Одобрить
                                                    </button>
                                                )}
                                                <button
                                                    className={`${styles.actionButton} ${styles.blockButton}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteNews(item.id);
                                                    }}
                                                >
                                                    Заблокировать
                                                </button>
                                            </>
                                        ) : activeTab === 'articles' ? (
                                            <>
                                                {statusFilter === 'pending' && (
                                                    <button
                                                        className={`${styles.actionButton} ${styles.approveButton}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleApprove(item.id);
                                                        }}
                                                    >
                                                        Одобрить
                                                    </button>
                                                )}
                                                <button
                                                    className={`${styles.actionButton} ${styles.blockButton}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteArticle(item.id);
                                                    }}
                                                >
                                                    Заблокировать
                                                </button>
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                Ничего не найдено
                            </div>
                        )}
                    </div>

                    {!loading && getCurrentData().length > 0 && (
                        <Pagination
                            page={currentPage - 1}
                            totalPages={totalPages}
                            size={itemsPerPage}
                            onPreviousPage={handlePreviousPage}
                            onNextPage={handleNextPage}
                            onPageChange={handlePageChange}
                            onSizeChange={handleSizeChange}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModeratorPanel;
