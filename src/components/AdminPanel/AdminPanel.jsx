import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import './AdminPanel.css';

const AdminPanel = () => {
    const [moderators, setModerators] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedModerator, setSelectedModerator] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            await fetchModerators();
        };
        fetchData();
    }, []);

    const fetchModerators = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8081/api/v1/users/moderator/get');
            if (!response.ok) {
                console.error('Error fetching moderators:', response.statusText);
                setModerators([]);
                return;
            }
            const data = await response.json();
            setModerators(data);
        } catch (error) {
            console.error('Fetch error:', error);
            setModerators([]);
        }
    };

    const searchModerators = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8081/api/v1/users/moderator/search?username=${searchInput}`);
            if (!response.ok) {
                console.error('Error searching moderators:', response.statusText);
                setModerators([]);
                return;
            }
            const data = await response.json();
            setModerators(data);
        } catch (error) {
            console.error('Search error:', error);
            setModerators([]);
        }
    };

    const deleteModerator = async (id) => {
        try {
            const response = await fetch(`http://127.0.0.1:8081/api/v1/users/moderator/delete/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                console.error('Error deleting moderator:', response.statusText);
                return;
            }
            await fetchModerators();
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            closeModal();
        }
    };

    const openModal = (moderator) => {
        setSelectedModerator(moderator);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedModerator(null);
    };

    return (
        <div className="admin-panel">
            <div className="header">
                <h2>Список модераторов</h2>
                <div className="search-bar">
                    <label htmlFor="searchInput"></label>
                    <input
                        type="text"
                        id="searchInput"
                        placeholder="Введите имя пользователя"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <button onClick={searchModerators}>Найти</button>
                </div>
            </div>
            <div className="moderators-list-container">
                <div className="moderators-list">
                    {moderators.length > 0 ? (
                        moderators.map((moderator) => (
                            <div key={moderator.id} className="moderator">
                                <div>
                                    <span className="field-name">ID пользователя:</span>
                                    <span className="field-value"> {moderator.id}</span>
                                </div>
                                <div>
                                    <span className="field-name">Имя пользователя:</span>
                                    <span className="field-value"> {moderator.username}</span>
                                </div>
                                <div>
                                    <span className="field-name">Номер сотрудника:</span>
                                    <span className="field-value"> {moderator.employeeId}</span>
                                </div>
                                <span className="delete" onClick={() => openModal(moderator)}>&#10006;</span>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            Не найдено ни одного модератора
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                onConfirm={() => deleteModerator(selectedModerator.id)}
            >
                <p>Вы точно хотите удалить данного пользователя?</p>
            </Modal>
        </div>
    );
};

export default AdminPanel;
