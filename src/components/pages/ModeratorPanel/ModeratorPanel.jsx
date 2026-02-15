import React, { useState, useEffect } from 'react';
import styles from './ModeratorPanel.module.css';
import Pagination from '../../pagination/Pagination';
import { useNavigate } from 'react-router-dom';
import config from '../../../config';
import apiClient, { clearAuth } from '../../../api/apiClient';

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

    useEffect(() => {
        const checkUserRole = async () => {
            try {
                const response = await apiClient(`${config.USER_SERVICE}/users/me`, {
                    headers: { 'Content-Type': 'application/json' }
                });
                if (!response.ok) { navigate('/not-found'); return; }
                const data = await response.json();
                if (data.role !== 'MODERATOR') navigate('/not-found');
            } catch (error) { navigate('/not-found'); }
        };
        checkUserRole();
    }, [navigate]);

    const fetchUsers = async (page = 0, search = '') => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ username: search, page, size: itemsPerPage });
            const response = await apiClient(`${config.USER_SERVICE}/members?${params}`, { headers: { 'Content-Type': 'application/json' } });
            if (!response.ok) throw new Error();
            const data = await response.json();
            setUsers(data.content); setTotalPages(data.totalPages);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const fetchProjects = async (page = 0) => {
        try {
            setLoading(true);
            const moderationPassed = statusFilter === 'published' ? 'true' : 'false';
            const response = await apiClient(`${config.MAIN_SERVICE}/projects?moderationPassed=${moderationPassed}&page=${page}&size=${itemsPerPage}`, { headers: { 'Content-Type': 'application/json' } });
            if (!response.ok) { const d = await response.json(); if (d.errorMessage?.includes("No unmoderated")) { setProjects([]); setTotalPages(0); return; } throw new Error(); }
            const data = await response.json(); setProjects(data.content); setTotalPages(data.totalPages);
        } catch (error) { setProjects([]); setTotalPages(0); } finally { setLoading(false); }
    };

    const fetchNews = async (page = 0) => {
        try {
            setLoading(true);
            const moderationPassed = statusFilter === 'published' ? 'true' : 'false';
            const response = await apiClient(`${config.MAIN_SERVICE}/news?moderationPassed=${moderationPassed}&page=${page}&size=${itemsPerPage}`, { headers: { 'Content-Type': 'application/json' } });
            if (!response.ok) { const d = await response.json(); if (d.errorMessage?.includes("No unmoderated")) { setNews([]); setTotalPages(0); return; } throw new Error(); }
            const data = await response.json(); setNews(data.content); setTotalPages(data.totalPages);
        } catch (error) { setNews([]); setTotalPages(0); } finally { setLoading(false); }
    };

    const fetchArticles = async (page = 0) => {
        try {
            setLoading(true);
            const moderationPassed = statusFilter === 'published' ? 'true' : 'false';
            const response = await apiClient(`${config.MAIN_SERVICE}/articles?moderationPassed=${moderationPassed}&page=${page}&size=${itemsPerPage}`, { headers: { 'Content-Type': 'application/json' } });
            if (!response.ok) { const d = await response.json(); if (d.errorMessage?.includes("No unmoderated")) { setArticles([]); setTotalPages(0); return; } throw new Error(); }
            const data = await response.json(); setArticles(data.content); setTotalPages(data.totalPages);
        } catch (error) { setArticles([]); setTotalPages(0); } finally { setLoading(false); }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, statusFilter]);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers(currentPage - 1, searchQuery);
        else if (activeTab === 'projects') fetchProjects(currentPage - 1);
        else if (activeTab === 'news') fetchNews(currentPage - 1);
        else if (activeTab === 'articles') fetchArticles(currentPage - 1);
    }, [activeTab, currentPage, searchQuery, statusFilter, itemsPerPage]);

    const getCurrentData = () => {
        switch (activeTab) {
            case 'users': return users;
            case 'projects': return projects;
            case 'news': return news;
            case 'articles': return articles;
            default: return [];
        }
    };

    const handleSearch = () => { setCurrentPage(1); if (activeTab === 'users') fetchUsers(0, searchQuery); };
    const handleLogout = () => { document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure'; document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure'; navigate('/'); };
    const handleUserClick = (username) => navigate(`/members/profile/${username}`);
    const handleProjectClick = (id) => navigate(`/project/${id}`);
    const handleNewsClick = (id) => navigate(`/news/${id}`);
    const handleArticleClick = (id) => navigate(`/article/${id}`);

    const handleBlock = async (username) => {
        try { const r = await apiClient(`${config.USER_SERVICE}/members?username=${username}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }); if (!r.ok) throw new Error(); fetchUsers(currentPage - 1, searchQuery); } catch (e) { console.error(e); }
    };
    const handleDeleteProject = async (id) => {
        try { const r = await apiClient(`${config.MAIN_SERVICE}/projects/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }); if (!r.ok) throw new Error(); fetchProjects(currentPage - 1); } catch (e) { console.error(e); }
    };
    const handleDeleteNews = async (id) => {
        try { const r = await apiClient(`${config.MAIN_SERVICE}/news/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }); if (!r.ok) throw new Error(); fetchNews(currentPage - 1); } catch (e) { console.error(e); }
    };
    const handleDeleteArticle = async (id) => {
        try { const r = await apiClient(`${config.MAIN_SERVICE}/articles/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }); if (!r.ok) throw new Error(); fetchArticles(currentPage - 1); } catch (e) { console.error(e); }
    };
    const handleApprove = async (id) => {
        try {
            let endpoint = '';
            if (activeTab === 'projects') endpoint = `${config.MAIN_SERVICE}/projects/${id}/moderation-passed`;
            else if (activeTab === 'news') endpoint = `${config.MAIN_SERVICE}/news/${id}/moderation-passed`;
            else if (activeTab === 'articles') endpoint = `${config.MAIN_SERVICE}/articles/${id}/moderation-passed`;
            const r = await apiClient(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(true) });
            if (!r.ok) throw new Error();
            if (activeTab === 'projects') fetchProjects(currentPage - 1);
            else if (activeTab === 'news') fetchNews(currentPage - 1);
            else if (activeTab === 'articles') fetchArticles(currentPage - 1);
        } catch (e) { console.error(e); }
    };

    const handlePageChange = (p) => setCurrentPage(p + 1);
    const handlePreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
    const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
    const handleSizeChange = (e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); };

    const tabs = [
        { key: 'users', label: 'Пользователи', icon: 'fa-users' },
        { key: 'projects', label: 'Проекты', icon: 'fa-rocket' },
        { key: 'news', label: 'Новости', icon: 'fa-newspaper' },
        { key: 'articles', label: 'Статьи', icon: 'fa-file-alt' },
    ];

    const getItemClick = (item) => {
        if (activeTab === 'users') return () => handleUserClick(item.username);
        if (activeTab === 'projects') return () => handleProjectClick(item.id);
        if (activeTab === 'news') return () => handleNewsClick(item.id);
        if (activeTab === 'articles') return () => handleArticleClick(item.id);
    };

    const getDeleteHandler = (item) => {
        if (activeTab === 'users') return () => handleBlock(item.username);
        if (activeTab === 'projects') return () => handleDeleteProject(item.id);
        if (activeTab === 'news') return () => handleDeleteNews(item.id);
        if (activeTab === 'articles') return () => handleDeleteArticle(item.id);
    };

    const renderItemTitle = (item) => {
        if (activeTab === 'users') return item.name || item.username;
        return item.name || item.title;
    };

    const renderItemSub = (item) => {
        if (activeTab === 'users') return item.email;
        return item.category;
    };

    const renderItemOwner = (item) => {
        if (activeTab === 'users') return item.username;
        return item.owner;
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <i className="fas fa-shield-alt"></i>
                        <h1>Панель модератора</h1>
                    </div>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i> Выйти
                    </button>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    {tabs.map(t => (
                        <button key={t.key} className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.key)}>
                            <i className={`fas ${t.icon}`}></i> {t.label}
                        </button>
                    ))}
                </div>

                {/* Toolbar: search + status filter */}
                <div className={styles.toolbar}>
                    {activeTab === 'users' && (
                        <div className={styles.searchRow}>
                            <div className={styles.searchWrap}>
                                <i className="fas fa-search"></i>
                                <input type="text" placeholder="Поиск пользователя..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                            </div>
                            <button className={styles.searchBtn} onClick={handleSearch}>Найти</button>
                        </div>
                    )}
                    {activeTab !== 'users' && (
                        <div className={styles.statusRow}>
                            <button className={`${styles.statusBtn} ${statusFilter === 'published' ? styles.statusActive : ''}`} onClick={() => setStatusFilter('published')}>
                                <i className="fas fa-check-circle"></i> Опубликованные
                            </button>
                            <button className={`${styles.statusBtn} ${statusFilter === 'pending' ? styles.statusActive : ''}`} onClick={() => setStatusFilter('pending')}>
                                <i className="fas fa-clock"></i> Ожидающие
                            </button>
                        </div>
                    )}
                </div>

                {/* List */}
                <div className={styles.list}>
                    {loading ? (
                        <div className={styles.emptyState}>
                            <i className="fas fa-spinner fa-spin"></i>
                            <span>Загрузка...</span>
                        </div>
                    ) : getCurrentData().length > 0 ? (
                        getCurrentData().map(item => (
                            <div key={item.id} className={styles.listItem} onClick={getItemClick(item)}>
                                <div className={styles.itemBody}>
                                    <div className={styles.itemMain}>
                                        <span className={styles.itemName}>{renderItemTitle(item)}</span>
                                        <span className={styles.itemOwner}>{renderItemOwner(item)}</span>
                                    </div>
                                    {renderItemSub(item) && (
                                        <span className={styles.itemSub}>{renderItemSub(item)}</span>
                                    )}
                                </div>
                                <div className={styles.itemActions}>
                                    {activeTab !== 'users' && statusFilter === 'pending' && (
                                        <button className={styles.approveBtn} onClick={(e) => { e.stopPropagation(); handleApprove(item.id); }} title="Одобрить">
                                            <i className="fas fa-check"></i>
                                        </button>
                                    )}
                                    <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); getDeleteHandler(item)(); }} title="Заблокировать">
                                        <i className="fas fa-ban"></i>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            <i className="fas fa-inbox"></i>
                            <span>Ничего не найдено</span>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {!loading && getCurrentData().length > 0 && (
                    <div className={styles.paginationWrap}>
                        <Pagination
                            page={currentPage - 1}
                            totalPages={totalPages}
                            size={itemsPerPage}
                            onPreviousPage={handlePreviousPage}
                            onNextPage={handleNextPage}
                            onPageChange={handlePageChange}
                            onSizeChange={handleSizeChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModeratorPanel;
