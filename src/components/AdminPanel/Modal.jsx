import React from 'react';
import './Modal.css';

const Modal = ({isOpen, onClose, onConfirm, children}) => {
    if (!isOpen) return null;

    return (
        <div className="modal">
            <div className="modal-content">
                {children}
                <button onClick={onConfirm} id="confirmDelete">Подтвердить удаление</button>
                <button onClick={onClose}>Отменить</button>
            </div>
        </div>
    );
};

export default Modal;