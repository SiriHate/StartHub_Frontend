import React from "react";
import {Link, useLocation} from "react-router-dom";
import styles from "./NavigationBar.module.css";

const NavigationBar = () => {
    const location = useLocation();
    const getActiveClass = (path) => (location.pathname === path ? `${styles.navLink} ${styles.active}` : styles.navLink);

    return (
        <header className={styles.navigationHeader}>
            <div className={styles.headerContainer}>
                <div className={styles.logoContainer}>
                    <img src="/logo.png" alt="Логотип" className={styles.logo}/>
                </div>
                <nav className={styles.navContainer}>
                    <ul className={styles.navList}>
                        <li className={styles.navItem}>
                            <Link to="/articles-and-news" className={getActiveClass("/articles-and-news")}>
                                Новости и обучение
                            </Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link to="/events_calendar" className={getActiveClass("/events_calendar")}>
                                Календарь событий
                            </Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link to="/people_and_projects" className={getActiveClass("/people_and_projects")}>
                                Поиск людей и проектов
                            </Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link to="/my_projects" className={getActiveClass("/my_projects")}>
                                Мои проекты
                            </Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link to="/member/personal-account" className={getActiveClass("/member/personal-account")}>
                                <i className={`fas fa-user ${styles.faUser}`}/> Личный кабинет
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default NavigationBar;