import React from "react";
import {Link, useLocation} from "react-router-dom";
import styles from "./Menu.module.css";

const Menu = () => {
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
                                <i className={`fas fa-newspaper ${styles.faUser}`}/> Новости и обучение
                            </Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link to="/projects" className={getActiveClass("/projects")}>
                                <i className={`fas fa-rocket ${styles.faUser}`}/> Проекты
                            </Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link to="/people" className={getActiveClass("/people")}>
                                <i className={`fas fa-users ${styles.faUser}`}/> Пользователи
                            </Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link to="/my_space" className={getActiveClass("/my_space")}>
                                <i className={`fas fa-th-large ${styles.faUser}`}/> Мое пространство
                            </Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link to="/chats" className={getActiveClass("/chats")}>
                                <i className={`fas fa-comments ${styles.faUser}`}/> Мои чаты
                            </Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link to="/members/personal-account"
                                  className={getActiveClass("/members/personal-account")}>
                                <i className={`fas fa-user ${styles.faUser}`}/> Мой профиль
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Menu;