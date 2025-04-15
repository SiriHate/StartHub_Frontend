import React, { useContext } from 'react';
import { LoadingContext } from './LoadingContext';
import './GlobalLoader.module.css';

const GlobalLoader = () => {
    const { loading } = useContext(LoadingContext);

    if (!loading) {
        return null;
    }

    return (
        <div className="loader-overlay">
            <div className="loader">Загрузка...</div>
        </div>
    );
};


export default GlobalLoader;