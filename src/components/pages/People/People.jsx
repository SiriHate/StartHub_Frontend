import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import styles from "./People.module.css";
import Menu from "../../menu/Menu";
import Pagination from "../../pagination/Pagination";
import config from "../../../config";
import apiClient from '../../../api/apiClient';

const ROLE_FILTERS = [
    { key: '', label: 'Все', icon: 'fa-users' },
    { key: 'job-seeker', label: 'Соискатели', icon: 'fa-briefcase' },
    { key: 'investor', label: 'Инвесторы', icon: 'fa-chart-line' },
    { key: 'founder', label: 'Предприниматели', icon: 'fa-rocket' },
    { key: 'mentor', label: 'Менторы', icon: 'fa-graduation-cap' },
];

const People = () => {
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [specializations, setSpecializations] = useState([]);
    const [domains, setDomains] = useState([]);
    const [selectedSub, setSelectedSub] = useState("");
    const [appliedRole, setAppliedRole] = useState("");
    const [appliedSub, setAppliedSub] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [size, setSize] = useState(4);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [specRes, domainRes] = await Promise.all([
                    apiClient(`${config.USER_SERVICE}/member-specializations`),
                    apiClient(`${config.USER_SERVICE}/domains`),
                ]);
                if (specRes.ok) setSpecializations(await specRes.json());
                if (domainRes.ok) setDomains(await domainRes.json());
            } catch {}
        };
        loadFilters();
        fetchItems("", "", "", 0, size);
    }, []);

    const fetchItems = async (query, role, sub, pg, sz) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page: pg, size: sz });
            if (query) params.append("query", query);
            if (role) params.append("profileType", role);
            if (sub) {
                if (role === "job-seeker") params.append("specialization", sub);
                else params.append("domain", sub);
            }
            const url = `${config.USER_SERVICE}/members?${params.toString()}`;
            const response = await apiClient(url);
            if (!response.ok) throw new Error();
            const data = await response.json();
            setItems(data.content);
            setTotalPages(data.totalPages);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(0);
        fetchItems(searchQuery, appliedRole, appliedSub, 0, size);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleSelectRole = (key) => {
        setSelectedRole(key);
        setSelectedSub("");
    };

    const applyFilter = () => {
        setPage(0);
        setAppliedRole(selectedRole);
        setAppliedSub(selectedSub);
        fetchItems(searchQuery, selectedRole, selectedSub, 0, size);
    };

    const resetFilters = () => {
        setSelectedRole("");
        setSelectedSub("");
        setAppliedRole("");
        setAppliedSub("");
        setSearchQuery("");
        setPage(0);
        fetchItems("", "", "", 0, size);
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
            fetchItems(searchQuery, appliedRole, appliedSub, newPage, size);
        }
    };

    const handlePreviousPage = () => {
        if (page > 0) {
            const newPage = page - 1;
            setPage(newPage);
            fetchItems(searchQuery, appliedRole, appliedSub, newPage, size);
        }
    };

    const handleSizeChange = (event) => {
        const newSize = parseInt(event.target.value, 10);
        setSize(newSize);
        setPage(0);
        fetchItems(searchQuery, appliedRole, appliedSub, 0, newSize);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        fetchItems(searchQuery, appliedRole, appliedSub, newPage, size);
    };

    const subItems = selectedRole === 'job-seeker'
        ? specializations.map(s => s.name)
        : selectedRole ? domains.map(d => d.name) : [];

    const appliedLabel = ROLE_FILTERS.find(r => r.key === appliedRole)?.label;
    const hasAppliedFilter = appliedRole || appliedSub;

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
                        <span>Фильтры</span>
                    </div>

                    <div className={styles.filterSection}>
                        <div className={styles.filterSectionTitle}>Роль</div>
                        <div className={styles.filterList}>
                            {ROLE_FILTERS.map(rf => (
                                <div key={rf.key}
                                     className={`${styles.filterItem} ${selectedRole === rf.key ? styles.filterActive : ""}`}
                                     onClick={() => handleSelectRole(rf.key)}>
                                    <i className={`fas ${rf.icon}`}></i> {rf.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedRole && subItems.length > 0 && (
                        <div className={styles.filterSection}>
                            <div className={styles.filterSectionTitle}>
                                {selectedRole === 'job-seeker' ? 'Специализация' : 'Область'}
                            </div>
                            <div className={styles.filterList}>
                                <div className={`${styles.filterItem} ${selectedSub === "" ? styles.filterActive : ""}`}
                                     onClick={() => setSelectedSub("")}>
                                    Все
                                </div>
                                {subItems.map(name => (
                                    <div key={name}
                                         className={`${styles.filterItem} ${selectedSub === name ? styles.filterActive : ""}`}
                                         onClick={() => setSelectedSub(name)}>
                                        {name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
                            <input type="text" placeholder="Поиск..."
                                   value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                   onKeyDown={handleSearchKeyDown} className={styles.searchInput}/>
                            <button onClick={handleSearch} className={styles.searchBtn}>
                                <i className="fas fa-search"></i>
                            </button>
                        </div>
                    </div>

                    {hasAppliedFilter && (
                        <div className={styles.activeFilterBadges}>
                            {appliedRole && (
                                <div className={styles.activeFilterBadge}>
                                    <span>{appliedLabel}</span>
                                </div>
                            )}
                            {appliedSub && (
                                <div className={styles.activeFilterBadge}>
                                    <span>{appliedSub}</span>
                                </div>
                            )}
                            <button onClick={resetFilters} className={styles.clearFilter}>
                                <i className="fas fa-times"></i> Сбросить
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
                                    <div key={item.id ?? item.username} className={styles.card}
                                         onClick={() => navigate(`/members/profile/${item.username}`)}>
                                        <div className={styles.cardAvatar}>
                                            <img src={getAvatarUrl(item) || "/default_user_avatar.jpg"} alt={item.username}
                                                 onError={(e) => { e.target.onerror = null; e.target.src = "/default_user_avatar.jpg"; }}/>
                                        </div>
                                        <div className={styles.cardBody}>
                                            <div className={styles.cardTop}>
                                                <h3 className={styles.cardName}>{item.name || item.username}</h3>
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
                            <Pagination page={page} totalPages={totalPages} size={size}
                                        onPreviousPage={handlePreviousPage} onNextPage={handleNextPage}
                                        onSizeChange={handleSizeChange} onPageChange={handlePageChange}/>
                        </>
                    )}
                </main>
            </div>
        </>
    );
};

export default People;
