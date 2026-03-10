import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AuthContext from '../security/AuthContext';
import {
    getInAppNotifications,
    markNotificationAsRead
} from '../../api/notificationClient';
import { getMutedChats, muteChatNotifications } from '../../api/chatClient';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { isValid } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [ignoredChatIds, setIgnoredChatIds] = useState([]);

    const loadNotifications = useCallback(async () => {
        if (!isValid) return;
        try {
            const response = await getInAppNotifications();
            if (!response.ok) return;
            const data = await response.json();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (_) {
        }
    }, [isValid]);

    const loadIgnoredChats = useCallback(async () => {
        if (!isValid) return;
        try {
            const response = await getMutedChats();
            if (!response.ok) return;
            const data = await response.json();
            const ids = Array.isArray(data) ? data.map(Number).filter(Number.isFinite) : [];
            setIgnoredChatIds(ids);
        } catch (_) {
        }
    }, [isValid]);

    const refreshAll = useCallback(async () => {
        await Promise.all([loadNotifications(), loadIgnoredChats()]);
    }, [loadNotifications, loadIgnoredChats]);

    const markAsRead = useCallback(async (id) => {
        if (!id) return;
        setNotifications(prev => prev.map(item => item.id === id ? { ...item, read: true } : item));
        try {
            await markNotificationAsRead(id);
        } catch (_) {
        }
    }, []);

    const ignoreChatNotifications = useCallback((chatId) => {
        if (chatId == null) return;
        const targetId = Number(chatId);
        if (!Number.isFinite(targetId)) return;

        setIgnoredChatIds(prev => prev.includes(targetId) ? prev : [...prev, targetId]);
        setNotifications(prev => prev.map(item => Number(item.chatId) === targetId ? { ...item, read: true } : item));
        muteChatNotifications(targetId).catch(() => {});
    }, []);

    const visibleNotifications = useMemo(
        () => notifications.filter(item => !ignoredChatIds.includes(Number(item.chatId))),
        [notifications, ignoredChatIds]
    );

    const visibleUnreadCount = useMemo(
        () => visibleNotifications.filter(item => !item.read).length,
        [visibleNotifications]
    );

    useEffect(() => {
        if (!isValid) {
            setNotifications([]);
            setIgnoredChatIds([]);
            return;
        }
        refreshAll();
        const timer = setInterval(() => {
            loadNotifications();
        }, 10000);
        return () => clearInterval(timer);
    }, [isValid, refreshAll, loadNotifications]);

    const value = useMemo(() => ({
        notifications: visibleNotifications,
        unreadCount: visibleUnreadCount,
        refreshAll,
        markAsRead,
        ignoreChatNotifications,
        ignoredChatIds,
    }), [visibleNotifications, visibleUnreadCount, refreshAll, markAsRead, ignoreChatNotifications, ignoredChatIds]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used inside NotificationProvider');
    }
    return context;
};
