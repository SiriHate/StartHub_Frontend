import config from '../config';
import apiClient from './apiClient';

const BASE = config.CHAT_SERVICE;

export const getMyChats = (page, size) =>
    apiClient(`${BASE}/chats/me?page=${page}&size=${size}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

export const createChat = (body) =>
    apiClient(`${BASE}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

export const uploadChatImage = (chatId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient(`${BASE}/chats/${chatId}/images`, {
        method: 'POST',
        body: formData,
    });
};

export const getChatMembers = (chatId, page = 0, size = 50) =>
    apiClient(`${BASE}/chats/${chatId}/members?page=${page}&size=${size}`, {
        headers: { 'Content-Type': 'application/json' },
    });

export const addChatMember = (chatId, username, role = 'MEMBER') =>
    apiClient(`${BASE}/chats/${chatId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, role }),
    });

export const removeChatMember = (memberId) =>
    apiClient(`${BASE}/chats/members/${memberId}`, { method: 'DELETE' });

export const changeMemberRole = (memberId, role) =>
    apiClient(`${BASE}/chats/members/${memberId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
    });
