import React from 'react';
import {useNavigate} from 'react-router-dom';
import styles from './NotFoundPage.module.css';
import {Helmet} from 'react-helmet';
import Menu from '../../menu/Menu';

const NotFoundPage = () => {
    const navigate = useNavigate();

    const goHome = () => {
        navigate('/articles-and-news');
    };

    return (
        <>
            <Helmet>
                <title>Страница не найдена</title>
            </Helmet>
            <Menu/>
            <div className={styles.notFoundPageContainer}>
                <div className={styles.text}>
                    <div>ERROR</div>
                    <h1>404</h1>
                    <hr/>
                    <div>Page Not Found</div>
                    <button onClick={goHome} className={styles.returnHomeBtn}>Вернуться домой</button>
                </div>
                <div className={styles.astronaut}>
                    <img
                        src="https://images.vexels.com/media/users/3/152639/isolated/preview/506b575739e90613428cdb399175e2c8-space-astronaut-cartoon-by-vexels.png"
                        alt="astronaut"
                        className={styles.src}
                    />
                </div>
            </div>
        </>
    );
};

export default NotFoundPage;
