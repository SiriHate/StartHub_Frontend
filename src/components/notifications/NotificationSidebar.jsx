import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from './NotificationContext';
import styles from './NotificationSidebar.module.css';

const NotificationSidebar = () => {
    const navigate = useNavigate();
    const { notifications, markAsRead, ignoreChatNotifications } = useNotifications();

    const unreadNotifications = notifications.filter(item => !item.read).slice(0, 4);
    if (unreadNotifications.length === 0) {
        return null;
    }

    const openChat = async (notification) => {
        await markAsRead(notification.id);
        if (notification.chatId != null) {
            navigate(`/chats?chatId=${notification.chatId}`);
            return;
        }
        navigate('/chats');
    };

    const openChatFromButton = async (event, notification) => {
        event.stopPropagation();
        await openChat(notification);
    };

    const dismiss = async (event, notificationId) => {
        event.stopPropagation();
        await markAsRead(notificationId);
    };

    const ignoreChat = (event, chatId) => {
        event.stopPropagation();
        ignoreChatNotifications(chatId);
    };

    return (
        <div className={styles.sidebar}>
            {unreadNotifications.map(notification => (
                <div
                    key={notification.id}
                    className={styles.card}
                    onClick={() => openChat(notification)}
                >
                    <div className={styles.header}>
                        <div className={styles.titleWrap}>
                            <span className={styles.icon}>
                                <i className="fas fa-comment-dots"></i>
                            </span>
                            <span className={styles.title}>{notification.title}</span>
                        </div>
                        <button type="button" className={styles.close} onClick={(event) => dismiss(event, notification.id)}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    <span className={styles.body}>{notification.body}</span>
                    <div className={styles.actions}>
                        <button type="button" className={styles.openBtn} onClick={(event) => openChatFromButton(event, notification)}>
                            В чат
                        </button>
                        {notification.chatId != null && (
                            <button
                                type="button"
                                className={styles.ignoreBtn}
                                onClick={(event) => ignoreChat(event, notification.chatId)}
                            >
                                Игнорировать чат
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotificationSidebar;
