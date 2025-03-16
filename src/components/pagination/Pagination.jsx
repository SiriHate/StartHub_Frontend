import React from 'react';
import styles from './Pagination.module.css';

const Pagination = ({ page, totalPages, onPreviousPage, onNextPage }) => {
    return (
        <div className={styles.paginationControls}>
            <button 
                onClick={onPreviousPage} 
                disabled={page === 0} 
                className={styles.pageButton}
            >
                Предыдущая
            </button>
            <span className={styles.pageNumber}>Страница {page + 1}</span>
            <button 
                onClick={onNextPage} 
                disabled={page === totalPages - 1}
                className={styles.pageButton}
            >
                Следующая
            </button>
        </div>
    );
};

export default Pagination; 