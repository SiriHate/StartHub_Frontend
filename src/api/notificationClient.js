import config from '../config';
import apiClient from './apiClient';

const BASE = config.NOTIFICATION_SERVICE;

export const getInAppNotifications = () =>
    apiClient(`${BASE}/in-app`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

export const getUnreadNotificationsCount = () =>
    apiClient(`${BASE}/in-app/unread-count`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

export const markNotificationAsRead = (id) =>
    apiClient(`${BASE}/in-app/${id}/read`, {
        method: 'PATCH',
    });
