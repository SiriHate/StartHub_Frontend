import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MyChats.module.css';
import NavigationBar from '../../menu/Menu';
import { Helmet } from "react-helmet";
import config from '../../../config';
import apiClient from '../../../api/apiClient';
import {
    getMyChats as fetchChatsApi,
    createChat as createChatApi,
    uploadChatImage,
    getChatMembers,
    addChatMember,
    removeChatMember,
    changeMemberRole,
} from '../../../api/chatClient';
import chatWsClient from '../../../api/chatWsClient';

function MyChats() {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
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
    const [pendingImageKey, setPendingImageKey] = useState(null);
    const [pendingImagePreview, setPendingImagePreview] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageModalUrl, setImageModalUrl] = useState(null);
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
    const fileInputRef = useRef(null);

    const navigate = useNavigate();

    const openProfile = (username) => {
        if (username && username !== currentUsername) {
            navigate(`/members/profile/${username}`);
        }
    };

    const fetchMyChats = async (page, append = false) => {
        try {
            const response = await fetchChatsApi(page, CHAT_PAGE_SIZE);
            if (!response.ok) throw new Error('Failed to fetch chats');
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
        pendingHistoryPageRef.current = 0;

        chatWsClient.connect(chatId, {
            initialPageSize: MESSAGE_PAGE_SIZE,

            onConnectionChange: (connected) => setIsConnected(connected),

            onMessage: (msg) => {
                setMessages(prev => {
                    if (msg?.id != null && prev.some(m => m?.id === msg.id)) return prev;
                    const updated = [...prev, msg];
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                    return updated;
                });
            },

            onHistory: (list) => {
                if (pendingHistoryPageRef.current == null) return;
                const page = pendingHistoryPageRef.current;
                pendingHistoryPageRef.current = null;
                setLoadingMoreMessages(false);
                if (page === 0) {
                    setMessages(list);
                    setMessagePage(0);
                    setHasMoreMessages(list.length >= MESSAGE_PAGE_SIZE);
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                } else {
                    const el = messagesContainerRef.current;
                    if (el) {
                        scrollRestoreRef.current = { scrollHeight: el.scrollHeight, scrollTop: el.scrollTop };
                    }
                    setMessages(prev => [...list, ...prev]);
                    setMessagePage(page);
                    setHasMoreMessages(list.length >= MESSAGE_PAGE_SIZE);
                }
            },
        });
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

        connectToWebSocket(chat.id);
    };

    const handleImageSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !selectedChat) return;

        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.type)) return;

        setPendingImagePreview(URL.createObjectURL(file));
        setUploadingImage(true);

        try {
            const response = await uploadChatImage(selectedChat.id, file);
            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();
            setPendingImageKey(data.imageKey);
        } catch {
            setPendingImagePreview(null);
            setPendingImageKey(null);
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const cancelPendingImage = () => {
        setPendingImageKey(null);
        setPendingImagePreview(null);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        const hasText = newMessage.trim().length > 0;
        const hasImage = !!pendingImageKey;

        if ((!hasText && !hasImage) || !selectedChat || !chatWsClient.connected || !isConnected) {
            return;
        }

        const messageRequest = { chatId: selectedChat.id };
        if (hasText) messageRequest.content = newMessage.trim();
        if (hasImage) messageRequest.imageKey = pendingImageKey;

        chatWsClient.sendMessage(selectedChat.id, messageRequest);
        setNewMessage('');
        setPendingImageKey(null);
        setPendingImagePreview(null);
    };

    const handleCreateChat = () => {
        setShowCreateChatModal(true);
    };

    const handleCreatePrivateChat = async () => {
        if (!selectedUser) return;
        try {
            const response = await createChatApi({
                type: 'PRIVATE',
                members: [{ username: selectedUser.username, role: 'MEMBER' }],
            });
            if (!response.ok) throw new Error('Failed to create private chat');
            const newChat = await response.json();
            if (!newChat.name && newChat.type === 'PRIVATE') {
                newChat.name = selectedUser.username;
            }
            setChats(prevChats => [...prevChats, newChat]);
            setShowPrivateChatModal(false);
            setShowCreateChatModal(false);
            setSearchUsername('');
            setSelectedUser(null);
            handleChatSelect(newChat);
        } catch (error) {
            console.error('Error creating private chat:', error);
        }
    };

    const handleCreateGroupChat = async () => {
        try {
            const response = await createChatApi({
                type: 'GROUP',
                name: groupChatName,
                members: groupParticipants.map(username => ({ username, role: 'MEMBER' })),
            });
            if (!response.ok) throw new Error('Failed to create group chat');
            const newChat = await response.json();
            setChats(prevChats => [...prevChats, newChat]);
            setShowGroupChatModal(false);
            setShowCreateChatModal(false);
            setGroupChatName('');
            setGroupParticipants([]);
            handleChatSelect(newChat);
        } catch (error) {
            console.error('Error creating group chat:', error);
        }
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
        if (!dateString) return '';
        const match = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
        if (match) {
            const [, day, month, year, hour, minute] = match;
            const date = new Date(year, month - 1, day, hour, minute);
            if (!isNaN(date.getTime())) {
                return date.toLocaleString('ru-RU', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                });
            }
        }
        const fallback = new Date(dateString);
        if (!isNaN(fallback.getTime())) {
            return fallback.toLocaleString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        }
        return dateString;
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
        if (!selectedChat || !chatWsClient.connected || !isConnected || loadingMoreMessages || !hasMoreMessages) return;
        const nextPage = messagePageRef.current + 1;
        setLoadingMoreMessages(true);
        pendingHistoryPageRef.current = nextPage;
        chatWsClient.requestHistory(selectedChat.id, nextPage, MESSAGE_PAGE_SIZE);
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
            chatWsClient.disconnect();
            setIsConnected(false);
        };
    }, []);

    const fetchChatMembers = async (chatId) => {
        setLoadingMembers(true);
        try {
            const response = await getChatMembers(chatId);
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

    const isGroupChat = selectedChat?.type === 'GROUP';

    useEffect(() => {
        if (isGroupChat) {
            fetchChatMembers(selectedChat.id);
        } else {
            setCurrentUserRoleInChat(null);
            setChatMembers([]);
            setShowChatManagePanel(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChat?.id, isGroupChat]);

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
            const response = await changeMemberRole(memberId, newRole);
            if (!response.ok) throw new Error('Failed to change role');
            if (selectedChat?.type === 'GROUP') {
                await fetchChatMembers(selectedChat.id);
            }
        } catch (err) {
            console.error('Error changing member role:', err);
        }
    };

    const handleExcludeMember = async (memberId) => {
        if (selectedChat?.type !== 'GROUP') return;
        try {
            const response = await removeChatMember(memberId);
            if (!response.ok) throw new Error('Failed to exclude');
            await fetchChatMembers(selectedChat.id);
        } catch (err) {
            console.error('Error excluding member:', err);
        }
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
            const response = await addChatMember(selectedChat.id, username);
            if (!response.ok) return;
            await fetchChatMembers(selectedChat.id);
            setManagePanelSearchQuery('');
            setManagePanelSearchResults([]);
            setManagePanelShowDropdown(false);
        } catch (err) {
            console.error('Error inviting member:', err);
        }
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
                                                <span className={styles.messageTime}>{formatDate(message.sendAt)}</span>
                                            </div>
                                            {message.imageUrl && (
                                                <img
                                                    src={message.imageUrl}
                                                    alt=""
                                                    className={styles.messageImage}
                                                    onClick={() => setImageModalUrl(message.imageUrl)}
                                                />
                                            )}
                                            {message.content && (
                                                <div className={styles.messageText}>{message.content}</div>
                                            )}
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className={styles.messageForm}>
                                {pendingImagePreview && (
                                    <div className={styles.imagePreviewContainer}>
                                        <img src={pendingImagePreview} alt="" className={styles.imagePreview} />
                                        {uploadingImage && <div className={styles.imagePreviewOverlay}>Загрузка...</div>}
                                        <button type="button" className={styles.imagePreviewRemove} onClick={cancelPendingImage}>
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                )}
                                <div className={styles.messageFormRow}>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        style={{ display: 'none' }}
                                        onChange={handleImageSelect}
                                    />
                                    <button
                                        type="button"
                                        className={styles.attachButton}
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={!isConnected || uploadingImage}
                                    >
                                        <i className="fas fa-image"></i>
                                    </button>
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
                                        disabled={!isConnected || (uploadingImage && !newMessage.trim())}
                                    >
                                        <i className="fas fa-paper-plane"></i> Отправить
                                    </button>
                                </div>
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

            {imageModalUrl && (
                <div className={styles.modalOverlay} onClick={() => setImageModalUrl(null)}>
                    <div className={styles.imageModalContent} onClick={e => e.stopPropagation()}>
                        <button type="button" className={styles.modalClose} onClick={() => setImageModalUrl(null)}>
                            <i className="fas fa-times"></i>
                        </button>
                        <img src={imageModalUrl} alt="" className={styles.imageModalFull} />
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
