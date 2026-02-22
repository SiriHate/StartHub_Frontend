import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import styles from "./Projects.module.css";
import Menu from "../../menu/Menu";
import Pagination from "../../pagination/Pagination";
import config from "../../../config";
import apiClient from '../../../api/apiClient';

const SEEKING_ROLE_FILTERS = [
    { key: '', label: 'Не выбрано', icon: 'fa-ban' },
    { key: 'EMPLOYEE', label: 'Сотрудники', icon: 'fa-briefcase' },
    { key: 'PARTNER', label: 'Сооснователи', icon: 'fa-handshake' },
    { key: 'INVESTOR', label: 'Инвесторы', icon: 'fa-chart-line' },
    { key: 'MENTOR', label: 'Менторы', icon: 'fa-graduation-cap' },
];

const HAS_DOMAIN = new Set(['EMPLOYEE', 'PARTNER']);

const Projects = () => {
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [appliedCategory, setAppliedCategory] = useState("");
    const [selectedSeekingRole, setSelectedSeekingRole] = useState("");
    const [appliedSeekingRole, setAppliedSeekingRole] = useState("");
    const [specializations, setSpecializations] = useState([]);
    const [domains, setDomains] = useState([]);
    const [selectedDomain, setSelectedDomain] = useState("");
    const [appliedDomain, setAppliedDomain] = useState("");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [size, setSize] = useState(4);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [catRes, specRes, domainRes] = await Promise.all([
                    apiClient(`${config.MAIN_SERVICE}/project-categories`),
                    apiClient(`${config.USER_SERVICE}/member-specializations`),
                    apiClient(`${config.USER_SERVICE}/domains`),
                ]);
                if (catRes.ok) {
                    const data = await catRes.json();
                    setCategories(data.map(c => c.name));
                }
                if (specRes.ok) setSpecializations(await specRes.json());
                if (domainRes.ok) setDomains(await domainRes.json());
            } catch {}
        };
        loadFilters();
        fetchItems("", "", "", "", 0, size);
    }, []);

    const fetchItems = async (query, category, seekingRole, domain, pg, sz) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page: pg, size: sz, moderationPassed: true });
            if (query) params.append("query", query);
            if (category) params.append("category", category);
            if (seekingRole) params.append("seekingRole", seekingRole);
            if (domain) params.append("domain", domain);
            const url = `${config.MAIN_SERVICE}/projects?${params.toString()}`;
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
        fetchItems(searchQuery, appliedCategory, appliedSeekingRole, appliedDomain, 0, size);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleSelectSeekingRole = (key) => {
        setSelectedSeekingRole(key);
        setSelectedDomain("");
    };

    const applyFilter = () => {
        setPage(0);
        setAppliedCategory(selectedCategory);
        setAppliedSeekingRole(selectedSeekingRole);
        setAppliedDomain(selectedDomain);
        fetchItems(searchQuery, selectedCategory, selectedSeekingRole, selectedDomain, 0, size);
    };

    const resetFilters = () => {
        setSelectedCategory("");
        setAppliedCategory("");
        setSelectedSeekingRole("");
        setAppliedSeekingRole("");
        setSelectedDomain("");
        setAppliedDomain("");
        setSearchQuery("");
        setPage(0);
        fetchItems("", "", "", "", 0, size);
    };

    const getImageUrl = (item) => {
        const url = item.logoUrl ?? item.logo_url ?? item.projectLogoUrl ?? "";
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
            fetchItems(searchQuery, appliedCategory, appliedSeekingRole, appliedDomain, newPage, size);
        }
    };

    const handlePreviousPage = () => {
        if (page > 0) {
            const newPage = page - 1;
            setPage(newPage);
            fetchItems(searchQuery, appliedCategory, appliedSeekingRole, appliedDomain, newPage, size);
        }
    };

    const handleSizeChange = (event) => {
        const newSize = parseInt(event.target.value, 10);
        setSize(newSize);
        setPage(0);
        fetchItems(searchQuery, appliedCategory, appliedSeekingRole, appliedDomain, 0, newSize);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        fetchItems(searchQuery, appliedCategory, appliedSeekingRole, appliedDomain, newPage, size);
    };

    const domainSubItems = selectedSeekingRole === 'EMPLOYEE'
        ? specializations.map(s => s.name)
        : selectedSeekingRole === 'PARTNER'
            ? domains.map(d => d.name)
            : [];

    const appliedRoleLabel = SEEKING_ROLE_FILTERS.find(r => r.key === appliedSeekingRole)?.label;
    const hasAppliedFilter = appliedCategory || appliedSeekingRole || appliedDomain;

    return (
        <>
            <Helmet>
                <title>Проекты — StartHub</title>
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
                        <div className={styles.filterSectionTitle}>Категория</div>
                        <div className={styles.filterList}>
                            <div
                                className={`${styles.filterItem} ${selectedCategory === "" ? styles.filterActive : ""}`}
                                onClick={() => setSelectedCategory("")}
                            >
                                Все
                            </div>
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
                    </div>

                    <div className={styles.filterSection}>
                        <div className={styles.filterSectionTitle}>Проект ищет</div>
                        <div className={styles.filterList}>
                            {SEEKING_ROLE_FILTERS.map(rf => (
                                <div
                                    key={rf.key}
                                    className={`${styles.filterItem} ${selectedSeekingRole === rf.key ? styles.filterActive : ""}`}
                                    onClick={() => handleSelectSeekingRole(rf.key)}
                                >
                                    <i className={`fas ${rf.icon}`}></i> {rf.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {HAS_DOMAIN.has(selectedSeekingRole) && domainSubItems.length > 0 && (
                        <div className={styles.filterSection}>
                            <div className={styles.filterSectionTitle}>
                                {selectedSeekingRole === 'EMPLOYEE' ? 'Специализация' : 'Область'}
                            </div>
                            <div className={styles.filterList}>
                                <div
                                    className={`${styles.filterItem} ${selectedDomain === "" ? styles.filterActive : ""}`}
                                    onClick={() => setSelectedDomain("")}
                                >
                                    Все
                                </div>
                                {domainSubItems.map(name => (
                                    <div
                                        key={name}
                                        className={`${styles.filterItem} ${selectedDomain === name ? styles.filterActive : ""}`}
                                        onClick={() => setSelectedDomain(name)}
                                    >
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
                            <i className="fas fa-rocket"></i> Проекты
                        </h1>
                        <div className={styles.searchBar}>
                            <input
                                type="text"
                                placeholder="Поиск проектов..."
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

                    {hasAppliedFilter && (
                        <div className={styles.activeFilterBadges}>
                            {appliedCategory && (
                                <div className={styles.activeFilterBadge}>
                                    <span>{appliedCategory}</span>
                                </div>
                            )}
                            {appliedSeekingRole && (
                                <div className={styles.activeFilterBadge}>
                                    <span>{appliedRoleLabel}</span>
                                </div>
                            )}
                            {appliedDomain && (
                                <div className={styles.activeFilterBadge}>
                                    <span>{appliedDomain}</span>
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
                            <p>Загрузка проектов...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className={styles.emptyState}>
                            <i className="fas fa-folder-open"></i>
                            <p>Не найдено ни одного проекта</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.grid}>
                                {items.map(item => (
                                    <div
                                        key={item.id}
                                        className={styles.card}
                                        onClick={() => navigate(`/project/${item.id}`)}
                                    >
                                        <div className={styles.cardImage}>
                                            <img
                                                src={getImageUrl(item) || "/default_list_element_logo.jpg"}
                                                alt={item.name ?? item.projectName}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "/default_list_element_logo.jpg";
                                                }}
                                            />
                                        </div>
                                        <div className={styles.cardBody}>
                                            <h3 className={styles.cardTitle}>{item.name ?? item.projectName}</h3>
                                            {(item.category ?? item.categoryName) && (
                                                <span className={styles.cardCategory}>
                                                    {item.category ?? item.categoryName}
                                                </span>
                                            )}
                                            {item.owner && (
                                                <span className={styles.cardOwner}>
                                                    <i className="fas fa-user"></i> {typeof item.owner === 'object' ? item.owner.username : item.owner}
                                                </span>
                                            )}
                                            {item.likes != null && (
                                                <span className={styles.cardLikes}>
                                                    <i className="fas fa-heart"></i> {item.likes}
                                                </span>
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

export default Projects;
