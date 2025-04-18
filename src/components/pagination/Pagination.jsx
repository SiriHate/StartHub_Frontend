import React from "react";
import styles from "./Pagination.module.css";

const Pagination = ({ page, totalPages, size, onPreviousPage, onNextPage, onSizeChange, onPageChange }) => {
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 0; i < totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (page <= 2) {
                for (let i = 0; i < 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages - 1);
            } else if (page >= totalPages - 3) {
                pages.push(0);
                pages.push('...');
                for (let i = totalPages - 4; i < totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(0);
                pages.push('...');
                for (let i = page - 1; i <= page + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages - 1);
            }
        }
        return pages;
    };

    return (
        <div className={styles.paginationContainer}>
            <div className={styles.paginationControls}>
                <button
                    onClick={onPreviousPage}
                    disabled={page === 0}
                    className={styles.pageButton}
                >
                    ←
                </button>
                
                <div className={styles.pageNumbers}>
                    {getPageNumbers().map((pageNum, index) => (
                        pageNum === '...' ? (
                            <span key={`ellipsis-${index}`} className={styles.ellipsis}>...</span>
                        ) : (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`${styles.pageNumberButton} ${page === pageNum ? styles.activePage : ''}`}
                            >
                                {pageNum + 1}
                            </button>
                        )
                    ))}
                </div>

                <button
                    onClick={onNextPage}
                    disabled={page === totalPages - 1}
                    className={styles.pageButton}
                >
                    →
                </button>
            </div>
            
            <div className={styles.pageSizeContainer}>
                <span className={styles.pageSizeLabel}>Показывать по</span>
                <select value={size} onChange={onSizeChange} className={styles.pageSizeDropdown}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>
                <span className={styles.pageSizeLabel}>на странице</span>
            </div>
        </div>
    );
};

export default Pagination;