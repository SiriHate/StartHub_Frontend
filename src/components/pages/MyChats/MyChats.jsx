import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MyChats.module.css';
import NavigationBar from '../../menu/Menu';
import { Helmet } from "react-helmet";
import config from '../../../config';
import apiClient, { getCookie } from '../../../api/apiClient';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

function MyChats() {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [stompClient, setStompClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [currentUsername, setCurrentUsername] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [chatPage, setChatPage] = useState(0);
    const [totalChatPages, setTotalChatPages] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const CHAT_PAGE_SIZE = 20;
    const MESSAGE_PAGE_SIZE = 20;
    const [messagePage, setMessagePage] = useState(0);
    const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [showCreateChatModal, setShowCreateChatModal] = useState(false);
    const [showPrivateChatModal, setShowPrivateChatModal] = useState(false);
    const [showGroupChatModal, setShowGroupChatModal] = useState(false);
    const [searchUsername, setSearchUsername] = useState('');
    const [groupChatName, setGroupChatName] = useState('');
    const [groupParticipants, setGroupParticipants] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showChatManagePanel, setShowChatManagePanel] = useState(false);
    const [chatMembers, setChatMembers] = useState([]);
    const [currentUserRoleInChat, setCurrentUserRoleInChat] = useState(null);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [managePanelSearchQuery, setManagePanelSearchQuery] = useState('');
    const [managePanelSearchResults, setManagePanelSearchResults] = useState([]);
    const [managePanelShowDropdown, setManagePanelShowDropdown] = useState(false);
    const RECONNECT_INTERVAL_MS = 7000;
    const MAX_RECONNECT_ATTEMPTS = 18;
    const messagesEndRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const dropdownRef = useRef(null);
    const managePanelDropdownRef = useRef(null);
    const managePanelSearchTimeoutRef = useRef(null);
    const chatsListRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const pendingHistoryPageRef = useRef(null);
    const scrollRestoreRef = useRef(null);
    const messagePageRef = useRef(0);
    messagePageRef.current = messagePage;
    const selectedChatRef = useRef(selectedChat);
    selectedChatRef.current = selectedChat;

    const navigate = useNavigate();

    const openProfile = (username) => {
        if (username && username !== currentUsername) {
            navigate(`/members/profile/${username}`);
        }
    };

    const fetchMyChats = async (page, append = false) => {
        try {
            const response = await apiClient(
                `${config.CHAT_SERVICE}/chats/me?page=${page}&size=${CHAT_PAGE_SIZE}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            if (!response.ok) {
                throw new Error('Failed to fetch chats');
            }
            const data = await response.json();
            setTotalChatPages(data.totalPages ?? 0);
            if (append) {
                setChats(prev => [...prev, ...(data.content || [])]);
            } else {
                setChats(data.content || []);
            }
            return data;
        } catch (err) {
            console.error('Error fetching chats:', err);
            throw err;
        } finally {
            if (!append) setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await apiClient(`${config.USER_SERVICE}/users/me`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }
                const userData = await response.json();
                setCurrentUsername(userData.username);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setLoading(false);
                return;
            }
        };

        const loadInitial = async () => {
            setLoading(true);
            await fetchUserData();
            try {
                await fetchMyChats(0, false);
            } catch {
                setLoading(false);
            }
        };

        loadInitial();
    }, []);

    const connectToWebSocket = (chatId) => {
        try {
            if (stompClient && !isConnected) {
                stompClient.disconnect();
                setStompClient(null);
            }

            const wsUrl = `${config.CHAT_SERVICE_WEB_SOCKET}/ws`;

            const socket = new SockJS(wsUrl, null, {
                transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
                timeout: 10000,
                secure: true
            });

            const client = Stomp.over(socket);
            
            client.debug = () => {};
            
            const headers = {
                Authorization: `Bearer ${getCookie('accessToken')}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'heart-beat': '10000,10000',
                'simpMessageType': 'CONNECT',
                'simpDestination': '/app/chat/subscribe'
            };

            client.connect(headers, 
                (frame) => {
                    setIsConnected(true);
                    setReconnectAttempts(0);
                    
                    const subscription = client.subscribe(`/topic/chat/${chatId}`, (message) => {
                        try {
                            const newMessage = JSON.parse(message.body);
                            setMessages(prevMessages => {
                                const hasId = newMessage?.id != null;
                                const duplicate = hasId && prevMessages.some(m => m?.id === newMessage.id);
                                if (duplicate) return prevMessages;
                                const updatedMessages = [...prevMessages, newMessage];
                                setTimeout(() => {
                                    if (messagesEndRef.current) {
                                        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }, 100);
                                return updatedMessages;
                            });
                        } catch (error) {}
                    });

                    const historySubscription = client.subscribe(`/topic/chat/${chatId}/history`, (message) => {
                        try {
                            if (pendingHistoryPageRef.current == null) return;
                            const raw = JSON.parse(message.body);
                            const list = Array.isArray(raw) ? raw : (raw?.content ?? []);
                            const page = pendingHistoryPageRef.current;
                            pendingHistoryPageRef.current = null;
                            setLoadingMoreMessages(false);
                            if (page === 0) {
                                setMessages(list);
                                setMessagePage(0);
                                setHasMoreMessages(list.length >= MESSAGE_PAGE_SIZE);
                                setTimeout(() => {
                                    if (messagesEndRef.current) {
                                        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }, 100);
                            } else {
                                const el = messagesContainerRef.current;
                                if (el) {
                                    scrollRestoreRef.current = { scrollHeight: el.scrollHeight, scrollTop: el.scrollTop };
                                }
                                setMessages(prev => [...list, ...prev]);
                                setMessagePage(page);
                                setHasMoreMessages(list.length >= MESSAGE_PAGE_SIZE);
                            }
                        } catch (error) {}
                    });

                    pendingHistoryPageRef.current = 0;
                    setTimeout(() => {
                        if (client.connected) {
                            client.send("/app/chat/subscribe", headers, JSON.stringify({ 
                                chatId: chatId,
                                page: 0,
                                size: MESSAGE_PAGE_SIZE
                            }));
                        }
                    }, 1000);
                },
                () => {
                    setIsConnected(false);
                    handleReconnect(chatId);
                }
            );

            client.onStompError = () => {
                setIsConnected(false);
                handleReconnect(chatId);
            };

            client.onWebSocketClose = () => {
                setIsConnected(false);
                handleReconnect(chatId);
            };

            setStompClient(client);
        } catch (error) {
            setIsConnected(false);
            handleReconnect(chatId);
        }
    };

    const handleReconnect = (chatId) => {
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            setReconnectAttempts(prev => prev + 1);
            setTimeout(() => {
                if (selectedChatRef.current?.id === chatId) {
                    connectToWebSocket(chatId);
                }
            }, RECONNECT_INTERVAL_MS);
        }
    };

    const disconnectFromWebSocket = () => {
        if (stompClient) {
            stompClient.disconnect(() => {
                setIsConnected(false);
                setStompClient(null);
            });
        }
    };

    const handleChatSelect = async (chat) => {
        if (selectedChat?.id === chat.id) {
            return;
        }

        setSelectedChat(chat);
        setMessages([]);
        setMessagePage(0);
        setHasMoreMessages(true);
        setLoadingMoreMessages(false);
        pendingHistoryPageRef.current = null;

        if (stompClient?.connected && isConnected) {
            try {
                const subscriptions = stompClient.subscriptions;
                if (subscriptions) {
                    Object.keys(subscriptions).forEach(key => {
                        subscriptions[key].unsubscribe();
                    });
                }

                const headers = {
                    Authorization: `Bearer ${getCookie('accessToken')}`,
                    'Content-Type': 'application/json'
                };

                stompClient.subscribe(`/topic/chat/${chat.id}`, (message) => {
                    try {
                        const newMessage = JSON.parse(message.body);
                        setMessages(prevMessages => {
                            const hasId = newMessage?.id != null;
                            const duplicate = hasId && prevMessages.some(m => m?.id === newMessage.id);
                            if (duplicate) return prevMessages;
                            const updatedMessages = [...prevMessages, newMessage];
                            setTimeout(() => {
                                if (messagesEndRef.current) {
                                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                                }
                            }, 100);
                            return updatedMessages;
                        });
                    } catch (error) {}
                });

                stompClient.subscribe(`/topic/chat/${chat.id}/history`, (message) => {
                    try {
                        if (pendingHistoryPageRef.current == null) return;
                        const raw = JSON.parse(message.body);
                        const list = Array.isArray(raw) ? raw : (raw?.content ?? []);
                        const page = pendingHistoryPageRef.current;
                        pendingHistoryPageRef.current = null;
                        setLoadingMoreMessages(false);
                        if (page === 0) {
                            setMessages(list);
                            setMessagePage(0);
                            setHasMoreMessages(list.length >= MESSAGE_PAGE_SIZE);
                            setTimeout(() => {
                                if (messagesEndRef.current) {
                                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                                }
                            }, 100);
                        } else {
                            const el = messagesContainerRef.current;
                            if (el) {
                                scrollRestoreRef.current = { scrollHeight: el.scrollHeight, scrollTop: el.scrollTop };
                            }
                            setMessages(prev => [...list, ...prev]);
                            setMessagePage(page);
                            setHasMoreMessages(list.length >= MESSAGE_PAGE_SIZE);
                        }
                    } catch (error) {}
                });

                pendingHistoryPageRef.current = 0;
                stompClient.send(
                    "/app/chat/subscribe",
                    headers,
                    JSON.stringify({ 
                        chatId: chat.id,
                        page: 0,
                        size: MESSAGE_PAGE_SIZE
                    })
                );
            } catch (error) {
                console.error('Error updating subscriptions:', error);
                connectToWebSocket(chat.id);
            }
        } else {
            connectToWebSocket(chat.id);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat || !stompClient || !stompClient.connected || !isConnected) {
            if (selectedChat && (!stompClient || !stompClient.connected)) {
                handleReconnect(selectedChat.id);
            }
            return;
        }

        try {
            const messageRequest = {
                content: newMessage.trim(),
                chatId: selectedChat.id
            };

            const headers = {
                Authorization: `Bearer ${getCookie('accessToken')}`,
                'Content-Type': 'application/json'
            };

            stompClient.send(
                `/app/chat/${selectedChat.id}/send`,
                headers,
                JSON.stringify(messageRequest)
            );
            setNewMessage('');
        } catch (error) {
            if (selectedChat) {
                handleReconnect(selectedChat.id);
            }
        }
    };

    const handleCreateChat = () => {
        setShowCreateChatModal(true);
    };

    const handleCreatePrivateChat = async () => {
        if (!selectedUser) return;
        try {
            const response = await apiClient(`${config.CHAT_SERVICE}/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'PRIVATE',
                    members: [
                        { username: selectedUser.username, role: 'MEMBER' }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create private chat');
            }

            const newChat = await response.json();
            setChats(prevChats => [...prevChats, newChat]);
            setShowPrivateChatModal(false);
            setShowCreateChatModal(false);
            setSearchUsername('');
            setSelectedUser(null);
        } catch (error) {}
    };

    const handleCreateGroupChat = async () => {
        try {
            const response = await apiClient(`${config.CHAT_SERVICE}/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'GROUP',
                    name: groupChatName,
                    members: groupParticipants.map(username => ({
                        username,
                        role: 'MEMBER'
                    }))
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create group chat');
            }

            const newChat = await response.json();
            setChats(prevChats => [...prevChats, newChat]);
            setShowGroupChatModal(false);
            setShowCreateChatModal(false);
            setGroupChatName('');
            setGroupParticipants([]);
        } catch (error) {}
    };

    const searchUsers = async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        try {
            const response = await apiClient(`${config.USER_SERVICE}/members?username=${query}&page=0&size=10`);

            if (response.ok) {
                const data = await response.json();
                const users = data.content || [];
                setSearchResults(users.filter(user => user.username !== currentUsername).slice(0, 5));
                setShowDropdown(true);
            }
        } catch (error) {
            setSearchResults([]);
            setShowDropdown(false);
        }
    };

    const handleUsernameChange = (e) => {
        const value = e.target.value;
        setSearchUsername(value);
        setSelectedUser(null);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            searchUsers(value);
        }, 300);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (managePanelDropdownRef.current && !managePanelDropdownRef.current.contains(event.target)) {
                setManagePanelShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getChatName = (chat) => {
        if (chat.type === 'GROUP') {
            return `${chat.name}`;
        } else {
            return `Чат с ${chat.name}`;
        }
    };

    const hasMoreChats = totalChatPages === 0 || chatPage + 1 < totalChatPages;

    const loadMoreChats = async () => {
        if (loadingMore || !hasMoreChats) return;
        setLoadingMore(true);
        try {
            await fetchMyChats(chatPage + 1, true);
            setChatPage(p => p + 1);
        } catch {
            setLoadingMore(false);
        }
    };

    const filteredChats = chats.filter(chat =>
        getChatName(chat).toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    const loadMoreMessages = () => {
        if (!selectedChat || !stompClient || !stompClient.connected || !isConnected || loadingMoreMessages || !hasMoreMessages) return;
        const nextPage = messagePageRef.current + 1;
        setLoadingMoreMessages(true);
        pendingHistoryPageRef.current = nextPage;
        const headers = {
            Authorization: `Bearer ${getCookie('accessToken')}`,
            'Content-Type': 'application/json'
        };
        stompClient.send(
            "/app/chat/subscribe",
            headers,
            JSON.stringify({ chatId: selectedChat.id, page: nextPage, size: MESSAGE_PAGE_SIZE })
        );
    };

    useEffect(() => {
        const rest = scrollRestoreRef.current;
        if (rest && messagesContainerRef.current) {
            const el = messagesContainerRef.current;
            const newScrollHeight = el.scrollHeight;
            el.scrollTop = newScrollHeight - rest.scrollHeight + rest.scrollTop;
            scrollRestoreRef.current = null;
        } else if (messagesEndRef.current && !rest) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        if (selectedChat) {
            messagePageRef.current = messagePage;
        }
    }, [selectedChat, messagePage]);

    useEffect(() => {
        return () => {
            disconnectFromWebSocket();
        };
    }, []);

    const fetchChatMembers = async (chatId, page = 0, size = 50) => {
        setLoadingMembers(true);
        try {
            const response = await apiClient(
                `${config.CHAT_SERVICE}/chats/${chatId}/members?page=${page}&size=${size}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );
            if (!response.ok) throw new Error('Failed to fetch members');
            const data = await response.json();
            const list = data.content || [];
            setChatMembers(list);
            const me = list.find(m => (m.username || m.userUsername) === currentUsername);
            setCurrentUserRoleInChat(me?.role ?? null);
            return data;
        } catch (err) {
            setCurrentUserRoleInChat(null);
            setChatMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    };

    useEffect(() => {
        if (selectedChat?.type === 'GROUP') {
            fetchChatMembers(selectedChat.id);
        } else {
            setCurrentUserRoleInChat(null);
            setChatMembers([]);
            setShowChatManagePanel(false);
        }
    }, [selectedChat?.id, selectedChat?.type === 'GROUP']);

    const canExcludeMember = (member) => {
        if (!member || member.username === currentUsername || (member.userUsername && member.userUsername === currentUsername)) return false;
        const role = currentUserRoleInChat;
        const targetRole = member.role;
        if (role === 'OWNER') return targetRole !== 'OWNER';
        if (role === 'MODERATOR') return targetRole === 'MEMBER';
        return false;
    };

    const canChangeRole = (member) => {
        if (currentUserRoleInChat !== 'OWNER') return false;
        const name = member.username || member.userUsername;
        if (name === currentUsername) return false;
        return member.role === 'MEMBER' || member.role === 'MODERATOR';
    };

    const handleChangeMemberRole = async (memberId, newRole) => {
        try {
            const response = await apiClient(
                `${config.CHAT_SERVICE}/chats/members/${memberId}/role`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ role: newRole })
                }
            );
            if (!response.ok) throw new Error('Failed to change role');
            if (selectedChat?.type === 'GROUP') {
                await fetchChatMembers(selectedChat.id);
            }
        } catch (err) {}
    };

    const handleExcludeMember = async (memberId) => {
        if (selectedChat?.type !== 'GROUP') return;
        try {
            const response = await apiClient(
                `${config.CHAT_SERVICE}/chats/members/${memberId}`,
                { method: 'DELETE' }
            );
            if (!response.ok) throw new Error('Failed to exclude');
            await fetchChatMembers(selectedChat.id);
        } catch (err) {}
    };

    const searchUsersForManagePanel = async (query) => {
        if (query.length < 2) {
            setManagePanelSearchResults([]);
            setManagePanelShowDropdown(false);
            return;
        }
        try {
            const response = await apiClient(`${config.USER_SERVICE}/members?username=${query}&page=0&size=10`);
            if (!response.ok) return;
            const data = await response.json();
            const users = (data.content || []).filter(
                user => user.username !== currentUsername &&
                !chatMembers.some(m => (m.username || m.userUsername) === user.username)
            ).slice(0, 8);
            setManagePanelSearchResults(users);
            setManagePanelShowDropdown(true);
        } catch (err) {
            setManagePanelSearchResults([]);
            setManagePanelShowDropdown(false);
        }
    };

    const handleManagePanelSearchChange = (e) => {
        const value = e.target.value;
        setManagePanelSearchQuery(value);
        if (managePanelSearchTimeoutRef.current) clearTimeout(managePanelSearchTimeoutRef.current);
        managePanelSearchTimeoutRef.current = setTimeout(() => searchUsersForManagePanel(value), 300);
    };

    const handleInviteToChat = async (username) => {
        if (selectedChat?.type !== 'GROUP') return;
        try {
            const response = await apiClient(
                `${config.CHAT_SERVICE}/chats/${selectedChat.id}/members`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, role: 'MEMBER' })
                }
            );
            if (!response.ok) return;
            await fetchChatMembers(selectedChat.id);
            setManagePanelSearchQuery('');
            setManagePanelSearchResults([]);
            setManagePanelShowDropdown(false);
        } catch (err) {}
    };

    const getMemberDisplayName = (member) => member?.username ?? member?.userUsername ?? '—';

    return (
        <div>
            <Helmet>
                <title>Мои чаты — StartHub</title>
                <body className={styles.body} />
            </Helmet>
            <NavigationBar />
            <div className={styles.chatsContainer}>
                <div
                    ref={chatsListRef}
                    className={styles.chatsList}
                    onScroll={() => {
                        const el = chatsListRef.current;
                        if (!el || loadingMore || !hasMoreChats) return;
                        const { scrollTop, clientHeight, scrollHeight } = el;
                        if (scrollTop + clientHeight >= scrollHeight - 150) {
                            loadMoreChats();
                        }
                    }}
                >
                    <button onClick={handleCreateChat} className={styles.createChatButton}>
                        <i className="fas fa-plus"></i> Создать чат
                    </button>
                    <div className={styles.searchContainer}>
                        <input
                            type="text"
                            placeholder="Поиск чатов..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    {loading ? (
                        <div className={styles.loadingInList}>Загрузка...</div>
                    ) : filteredChats.length === 0 ? (
                        <div className={styles.emptyState}>
                            {searchQuery ? 'Чаты не найдены' : 'У вас пока нет чатов'}
                        </div>
                    ) : (
                        <>
                            {filteredChats.map(chat => (
                                <div
                                    key={chat.id}
                                    className={`${styles.chatItem} ${selectedChat?.id === chat.id ? styles.selected : ''}`}
                                    onClick={() => handleChatSelect(chat)}
                                >
                                    <div className={styles.chatName}>{getChatName(chat)}</div>
                                </div>
                            ))}
                            {hasMoreChats && (
                                <div className={styles.chatsListSentinel}>
                                    {loadingMore ? <span className={styles.loadingInList}>Загрузка...</span> : null}
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className={styles.chatWindow}>
                    {selectedChat ? (
                        <>
                            <div className={styles.chatHeader}>
                                <div className={styles.chatTitle}>{getChatName(selectedChat)}</div>
                                <div className={styles.chatHeaderActions}>
                                    {selectedChat.type === 'GROUP' && (currentUserRoleInChat === 'OWNER' || currentUserRoleInChat === 'MODERATOR') && (
                                        <button
                                            type="button"
                                            onClick={() => setShowChatManagePanel(true)}
                                            className={styles.manageChatButton}
                                        >
                                            <i className="fas fa-cog"></i> Управление чатом
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div
                                ref={messagesContainerRef}
                                className={styles.messagesContainer}
                                onScroll={() => {
                                    const el = messagesContainerRef.current;
                                    if (!el || loadingMoreMessages || !hasMoreMessages) return;
                                    if (el.scrollTop < 100) {
                                        loadMoreMessages();
                                    }
                                }}
                            >
                                {hasMoreMessages && (messages.length > 0 || loadingMoreMessages) && (
                                    <div className={styles.messagesLoadMore}>
                                        {loadingMoreMessages ? (
                                            <span className={styles.loadingInList}>Загрузка сообщений...</span>
                                        ) : (
                                            <span className={styles.messagesLoadMoreHint}>Прокрутите вверх для загрузки истории</span>
                                        )}
                                    </div>
                                )}
                                {messages.length === 0 ? (
                                    <div className={styles.emptyState}>Нет сообщений</div>
                                ) : (
                                    messages.map(message => (
                                        <div
                                            key={message.id}
                                            className={`${styles.message} ${
                                                message.sender === currentUsername ? styles.sent : styles.received
                                            }`}
                                        >
                                            <div className={styles.messageHeader}>
                                                <span
                                                    className={`${styles.messageAuthor} ${message.sender !== currentUsername ? styles.clickable : ''}`}
                                                    onClick={(e) => { e.stopPropagation(); openProfile(message.sender); }}
                                                >{message.sender}</span>
                                                <span className={styles.messageTime}>{formatDate(message.sendAt ?? message.timestamp)}</span>
                                            </div>
                                            <div className={styles.messageText}>{message.content}</div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className={styles.messageForm}>
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Введите сообщение..."
                                    className={styles.messageInput}
                                    disabled={!isConnected}
                                />
                                <button 
                                    type="submit" 
                                    className={styles.sendButton}
                                    disabled={!isConnected}
                                >
                                    <i className="fas fa-paper-plane"></i> Отправить
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className={styles.emptyState}>Выберите чат для начала общения</div>
                    )}
                </div>
            </div>

            {showChatManagePanel && selectedChat?.type === 'GROUP' && (
                <div className={styles.managePanelOverlay} onClick={() => {
                    setShowChatManagePanel(false);
                    setManagePanelSearchQuery('');
                    setManagePanelSearchResults([]);
                    setManagePanelShowDropdown(false);
                }}>
                    <div className={styles.managePanel} onClick={e => e.stopPropagation()}>
                        <div className={styles.managePanelHeader}>
                            <h3 className={styles.managePanelTitle}>Участники чата</h3>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => {
                                    setShowChatManagePanel(false);
                                    setManagePanelSearchQuery('');
                                    setManagePanelSearchResults([]);
                                    setManagePanelShowDropdown(false);
                                }}
                                aria-label="Закрыть"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className={styles.managePanelBody}>
                            <div className={styles.managePanelInvite} ref={managePanelDropdownRef}>
                                <label className={styles.modalLabel}>Пригласить в чат</label>
                                <div className={styles.searchContainer}>
                                    <input
                                        type="text"
                                        placeholder="Поиск пользователей..."
                                        value={managePanelSearchQuery}
                                        onChange={handleManagePanelSearchChange}
                                    />
                                    {managePanelShowDropdown && managePanelSearchResults.length > 0 && (
                                        <div className={styles.dropdown}>
                                            {managePanelSearchResults.map(user => (
                                                <div
                                                    key={user.username}
                                                    className={styles.dropdownItem}
                                                    onClick={() => handleInviteToChat(user.username)}
                                                >
                                                    {user.username}
                                                    <span className={styles.inviteHint}>Пригласить</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {loadingMembers ? (
                                <div className={styles.loadingInList}>Загрузка...</div>
                            ) : (
                                <ul className={styles.memberList}>
                                    {chatMembers.map(member => {
                                        const id = member.id ?? member.memberId;
                                        const name = getMemberDisplayName(member);
                                        const role = member.role || 'MEMBER';
                                        const isMe = name === currentUsername;
                                        const canExclude = canExcludeMember(member);
                                        const canSetModerator = canChangeRole(member) && role === 'MEMBER';
                                        const canRemoveModerator = canChangeRole(member) && role === 'MODERATOR';
                                        return (
                                            <li key={id} className={styles.memberItem}>
                                                <div className={styles.memberInfo}>
                                                    <span
                                                        className={`${styles.memberName} ${!isMe ? styles.clickable : ''}`}
                                                        onClick={() => openProfile(name)}
                                                    >{name}{isMe ? ' (вы)' : ''}</span>
                                                    <span className={`${styles.memberRoleBadge} ${styles[`role${role}`]}`}>
                                                        {role === 'OWNER' ? 'Владелец' : role === 'MODERATOR' ? 'Модератор' : 'Участник'}
                                                    </span>
                                                </div>
                                                {!isMe && (canExclude || canSetModerator || canRemoveModerator) && (
                                                    <div className={styles.memberActions}>
                                                        {canSetModerator && (
                                                            <button
                                                                type="button"
                                                                className={styles.memberActionBtn}
                                                                onClick={() => handleChangeMemberRole(id, 'MODERATOR')}
                                                            >
                                                                Сделать модератором
                                                            </button>
                                                        )}
                                                        {canRemoveModerator && (
                                                            <button
                                                                type="button"
                                                                className={styles.memberActionBtn}
                                                                onClick={() => handleChangeMemberRole(id, 'MEMBER')}
                                                            >
                                                                Убрать модератора
                                                            </button>
                                                        )}
                                                        {canExclude && (
                                                            <button
                                                                type="button"
                                                                className={styles.memberActionBtnDanger}
                                                                onClick={() => handleExcludeMember(id)}
                                                            >
                                                                Исключить
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showCreateChatModal && (
                <div className={styles.modalOverlay} onClick={() => setShowCreateChatModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalHeaderText}>
                                <h2 className={styles.modalTitle}>Создать чат</h2>
                                <p className={styles.modalSubtitle}>Выберите тип чата</p>
                            </div>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => setShowCreateChatModal(false)}
                                aria-label="Закрыть"
                                title="Закрыть"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className={styles.modalChoiceButtons}>
                            <button
                                type="button"
                                className={styles.modalChoiceBtn}
                                onClick={() => {
                                    setShowCreateChatModal(false);
                                    setShowPrivateChatModal(true);
                                }}
                            >
                                <i className="fas fa-user"></i>
                                <span>Личный чат</span>
                                <small>Диалог с одним пользователем</small>
                            </button>
                            <button
                                type="button"
                                className={styles.modalChoiceBtn}
                                onClick={() => {
                                    setShowCreateChatModal(false);
                                    setShowGroupChatModal(true);
                                }}
                            >
                                <i className="fas fa-users"></i>
                                <span>Групповой чат</span>
                                <small>Чат с несколькими участниками</small>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPrivateChatModal && (
                <div className={styles.modalOverlay} onClick={() => {
                    setShowPrivateChatModal(false);
                    setSearchUsername('');
                    setSelectedUser(null);
                    setSearchResults([]);
                    setShowDropdown(false);
                }}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Создать личный чат</h2>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => {
                                    setShowPrivateChatModal(false);
                                    setSearchUsername('');
                                    setSelectedUser(null);
                                    setSearchResults([]);
                                    setShowDropdown(false);
                                }}
                                aria-label="Закрыть"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <label className={styles.modalLabel}>Найдите пользователя</label>
                            <div className={styles.searchContainer} ref={dropdownRef}>
                                <input
                                    type="text"
                                    placeholder="Введите имя пользователя..."
                                    value={searchUsername}
                                    onChange={handleUsernameChange}
                                />
                                {showDropdown && searchResults.length > 0 && (
                                    <div className={styles.dropdown}>
                                        {searchResults.map(user => (
                                            <div
                                                key={user.username}
                                                className={styles.dropdownItem}
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setSearchUsername(user.username);
                                                    setShowDropdown(false);
                                                }}
                                            >
                                                {user.username}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                className={styles.modalSubmitBtn}
                                onClick={handleCreatePrivateChat}
                                disabled={!selectedUser}
                            >
                                Создать чат
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showGroupChatModal && (
                <div className={styles.modalOverlay} onClick={() => {
                    setShowGroupChatModal(false);
                    setGroupChatName('');
                    setGroupParticipants([]);
                    setSearchUsername('');
                    setSearchResults([]);
                    setShowDropdown(false);
                }}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Создать групповой чат</h2>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => {
                                    setShowGroupChatModal(false);
                                    setGroupChatName('');
                                    setGroupParticipants([]);
                                    setSearchUsername('');
                                    setSearchResults([]);
                                    setShowDropdown(false);
                                }}
                                aria-label="Закрыть"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.groupChatForm}>
                                <label className={styles.modalLabel}>Название чата</label>
                                <input
                                    type="text"
                                    placeholder="Введите название группы"
                                    value={groupChatName}
                                    onChange={(e) => setGroupChatName(e.target.value)}
                                />
                                <label className={styles.modalLabel}>Добавить участников</label>
                                <div className={styles.searchContainer} ref={dropdownRef}>
                                    <input
                                        type="text"
                                        placeholder="Поиск пользователей..."
                                        value={searchUsername}
                                        onChange={handleUsernameChange}
                                    />
                                    {showDropdown && searchResults.length > 0 && (
                                        <div className={styles.dropdown}>
                                            {searchResults.map(user => (
                                                <div
                                                    key={user.username}
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        if (!groupParticipants.includes(user.username)) {
                                                            setGroupParticipants([...groupParticipants, user.username]);
                                                        }
                                                        setSearchUsername('');
                                                        setSearchResults([]);
                                                        setShowDropdown(false);
                                                    }}
                                                >
                                                    {user.username}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.selectedParticipants}>
                                    <div className={styles.participantsLabel}>Участники ({groupParticipants.length})</div>
                                    {groupParticipants.map(username => (
                                        <div key={username} className={styles.participantTag}>
                                            {username}
                                            <button
                                                type="button"
                                                onClick={() => setGroupParticipants(
                                                    groupParticipants.filter(u => u !== username)
                                                )}
                                                aria-label={`Удалить ${username}`}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button
                                type="button"
                                className={styles.modalSubmitBtn}
                                onClick={handleCreateGroupChat}
                                disabled={!groupChatName || groupParticipants.length === 0}
                            >
                                Создать групповой чат
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyChats;
