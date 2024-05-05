import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFoundPage.css';
import {Helmet} from "react-helmet";

const NotFoundPage = () => {
    const navigate = useNavigate();

    const goHome = () => {
        navigate('/');
    };

    return (
        <div className="not-found-container">
            <Helmet>
                <title>Страница не найдена</title>
            </Helmet>
            <div className="text">
                <div>ERROR</div>
                <h1>404</h1>
                <hr/>
                <div>Page Not Found</div>
                <button onClick={goHome} className="return-home-btn">Вернуться домой</button>
            </div>
            <div className="astronaut">
                <img
                    src="https://images.vexels.com/media/users/3/152639/isolated/preview/506b575739e90613428cdb399175e2c8-space-astronaut-cartoon-by-vexels.png"
                    alt="astronaut" className="src"/>
            </div>
        </div>
    );
};

export default NotFoundPage;
