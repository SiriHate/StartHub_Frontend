import React from "react";
import styles from "./Pagination.module.css";

const Pagination = ({ page, totalPages, size, onPreviousPage, onNextPage, onSizeChange }) => {
    return (
        <div className={styles.paginationContainer}>
            <div className={styles.paginationControls}>
                <button
                    onClick={onPreviousPage}
                    disabled={page === 0}
                    className={styles.pageButton}
                >
                    Предыдущая
                </button>
                <span className={styles.pageNumber}>Страница {page + 1} из {totalPages}</span>
                <button
                    onClick={onNextPage}
                    disabled={page === totalPages - 1}
                    className={styles.pageButton}
                >
                    Следующая
                </button>
            </div>

            <div className={styles.pageSizeContainer}>
                <label className={styles.pageSizeLabel}>Элементов на странице:</label>
                <select value={size} onChange={onSizeChange} className={styles.pageSizeDropdown}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                </select>
            </div>
        </div>
    );
};

export default Pagination;