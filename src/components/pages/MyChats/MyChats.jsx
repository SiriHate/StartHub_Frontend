import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MyChats.module.css';
import NavigationBar from '../../menu/Menu';
import { Helmet } from "react-helmet";
import config from '../../../config';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

function MyChats() {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [stompClient, setStompClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const [currentUsername, setCurrentUsername] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateChatModal, setShowCreateChatModal] = useState(false);
    const [showPrivateChatModal, setShowPrivateChatModal] = useState(false);
    const [showGroupChatModal, setShowGroupChatModal] = useState(false);
    const [searchUsername, setSearchUsername] = useState('');
    const [groupChatName, setGroupChatName] = useState('');
    const [groupParticipants, setGroupParticipants] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const MAX_RECONNECT_ATTEMPTS = 3;
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const dropdownRef = useRef(null);

    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`${config.USER_SERVICE}/users/me`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authorizationToken
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }
                const userData = await response.json();
                setCurrentUsername(userData.username);
                return userData.username;
            } catch (error) {
                console.error('Error fetching user data:', error);
                throw error;
            }
        };

        const fetchChats = async (username) => {
            try {
                const response = await fetch(`${config.CHAT_SERVICE}/users/${username}/chats`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authorizationToken
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch chats');
                }
                const data = await response.json();
                setChats(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching chats:', error);
                setError('Ошибка при загрузке чатов');
                setLoading(false);
            }
        };

        const loadChats = async () => {
            try {
                const username = await fetchUserData();
                await fetchChats(username);
            } catch (error) {
                setError('Ошибка при загрузке данных пользователя');
                setLoading(false);
            }
        };

        loadChats();
    }, [authorizationToken]);

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
                Authorization: authorizationToken,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'heart-beat': '10000,10000',
                'simpMessageType': 'CONNECT',
                'simpDestination': '/app/chat/subscribe'
            };

            client.connect(headers, 
                (frame) => {
                    setIsConnected(true);
                    setError(null);
                    setReconnectAttempts(0);
                    
                    const subscription = client.subscribe(`/topic/chat/${chatId}`, (message) => {
                        try {
                            const newMessage = JSON.parse(message.body);
                            setMessages(prevMessages => {
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
                            const history = JSON.parse(message.body);
                            setMessages(history);
                            setTimeout(() => {
                                if (messagesEndRef.current) {
                                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                                }
                            }, 100);
                        } catch (error) {}
                    });

                    setTimeout(() => {
                        if (client.connected) {
                            client.send("/app/chat/subscribe", headers, JSON.stringify({ 
                                chatId: chatId,
                                type: 'SUBSCRIBE'
                            }));
                        }
                    }, 1000);
                },
                () => {
                    setIsConnected(false);
                    setError('Ошибка подключения к чату. Проверьте соединение с сервером.');
                    handleReconnect(chatId);
                }
            );

            client.onStompError = (frame) => {
                setIsConnected(false);
                setError('Ошибка соединения с сервером чата');
                handleReconnect(chatId);
            };

            client.onWebSocketClose = (event) => {
                setIsConnected(false);
                setError('Соединение с сервером чата потеряно');
                handleReconnect(chatId);
            };

            setStompClient(client);
        } catch (error) {
            setIsConnected(false);
            setError('Ошибка при инициализации соединения с чатом');
            handleReconnect(chatId);
        }
    };

    const handleReconnect = (chatId) => {
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            setReconnectAttempts(prev => prev + 1);
            setTimeout(() => {
                if (!isConnected) {
                    connectToWebSocket(chatId);
                }
            }, 5000);
        } else {
            setError('Не удалось установить соединение с сервером чата после нескольких попыток');
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
        setMessages(chat.messages || []);

        if (stompClient && isConnected) {
            try {
                const subscriptions = stompClient.subscriptions;
                Object.keys(subscriptions).forEach(key => {
                    subscriptions[key].unsubscribe();
                });

                const newSubscriptions = {
                    messages: stompClient.subscribe(`/topic/chat/${chat.id}`, (message) => {
                        try {
                            const newMessage = JSON.parse(message.body);
                            setMessages(prevMessages => {
                                const updatedMessages = [...prevMessages, newMessage];
                                setTimeout(() => {
                                    if (messagesEndRef.current) {
                                        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }, 100);
                                return updatedMessages;
                            });
                        } catch (error) {}
                    }),
                    history: stompClient.subscribe(`/topic/chat/${chat.id}/history`, (message) => {
                        try {
                            const history = JSON.parse(message.body);
                            setMessages(history);
                            setTimeout(() => {
                                if (messagesEndRef.current) {
                                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                                }
                            }, 100);
                        } catch (error) {}
                    })
                };

                const headers = {
                    Authorization: authorizationToken,
                    'Content-Type': 'application/json'
                };

                stompClient.send(
                    "/app/chat/subscribe",
                    headers,
                    JSON.stringify({ 
                        chatId: chat.id,
                        type: 'SUBSCRIBE'
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
        if (!newMessage.trim() || !selectedChat || !stompClient || !isConnected) {
            if (!isConnected) {
                setError('Нет соединения с сервером. Попробуйте переподключиться.');
                if (selectedChat) {
                    connectToWebSocket(selectedChat.id);
                }
            }
            return;
        }

        try {
            const messageRequest = {
                content: newMessage.trim(),
                chatId: selectedChat.id,
                timestamp: new Date().toISOString()
            };

            const headers = {
                Authorization: authorizationToken,
                'Content-Type': 'application/json'
            };

            if (!stompClient.connected) {
                setError('Соединение потеряно. Переподключение...');
                connectToWebSocket(selectedChat.id);
                return;
            }

            stompClient.send(
                `/app/chat/${selectedChat.id}/send`,
                headers,
                JSON.stringify(messageRequest)
            );
            setNewMessage('');
            setError(null);
        } catch (error) {
            setError('Ошибка при отправке сообщения. Попробуйте переподключиться.');
            if (selectedChat) {
                connectToWebSocket(selectedChat.id);
            }
        }
    };

    const handleCreateChat = () => {
        setShowCreateChatModal(true);
    };

    const handleCreatePrivateChat = async () => {
        try {
            const response = await fetch(`${config.CHAT_SERVICE}/private_chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken
                },
                body: JSON.stringify({
                    secondUsername: searchUsername
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
        } catch (error) {
            setError('Ошибка при создании личного чата');
        }
    };

    const handleCreateGroupChat = async () => {
        try {
            const response = await fetch(`${config.CHAT_SERVICE}/group_chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken
                },
                body: JSON.stringify({
                    name: groupChatName,
                    participantUsernames: groupParticipants
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
        } catch (error) {
            setError('Ошибка при создании группового чата');
        }
    };

    const searchUsers = async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        setSearchLoading(true);
        try {
            const response = await fetch(`${config.USER_SERVICE}/members?username=${query}`, {
                headers: {
                    'Authorization': authorizationToken
                }
            });

            if (response.ok) {
                const data = await response.json();
                const users = data.content || [];
                setSearchResults(users.filter(user => user.username !== currentUsername).slice(0, 5));
                setShowDropdown(true);
            }
        } catch (error) {
            setError('Ошибка при поиске пользователей');
            setSearchResults([]);
            setShowDropdown(false);
        } finally {
            setSearchLoading(false);
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

    const formatLastMessageDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (diffDays === 1) {
            return 'Вчера';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('ru-RU', { weekday: 'long' });
        } else {
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    };

    const getChatName = (chat) => {
        if (chat.user1 && chat.user2) {
            const otherUser = chat.user1.username === currentUsername ? chat.user2 : chat.user1;
            return `Личный чат с ${otherUser.username}`;
        }
        if (chat.name) {
            return `Групповой чат ${chat.name ? '«' + chat.name + '»' : ''}`.trim();
        }
        if (chat.participants && chat.participants.length > 2) {
            return 'Групповой чат';
        }
        return 'Чат';
    };

    const getLastMessageInfo = (chat) => {
        if (!chat.messages || chat.messages.length === 0) {
            return null;
        }
        
        const lastMessage = chat.messages[chat.messages.length - 1];
        return {
            text: lastMessage.content,
            author: lastMessage.sender,
            time: lastMessage.timestamp
        };
    };

    const getUnreadCount = (chat) => {
        return 0;
    };

    const filteredChats = chats.filter(chat => {
        const chatName = getChatName(chat).toLowerCase();
        const lastMessage = chat.messages?.[chat.messages.length - 1]?.content?.toLowerCase() || '';
        return chatName.includes(searchQuery.toLowerCase()) || 
               lastMessage.includes(searchQuery.toLowerCase());
    });

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        return () => {
            disconnectFromWebSocket();
        };
    }, []);

    const handleHideChat = async () => {
        if (!selectedChat) return;

        try {
            const response = await fetch(`${config.CHAT_SERVICE}/private_chats/${selectedChat.id}/toggle_visibility`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorizationToken
                }
            });

            if (!response.ok) {
                throw new Error('Failed to hide chat');
            }

            // Удаляем чат из списка
            setChats(prevChats => prevChats.filter(chat => chat.id !== selectedChat.id));
            setSelectedChat(null);
            setMessages([]);
        } catch (error) {
            setError('Ошибка при скрытии чата');
        }
    };

    if (loading) {
        return (
            <div>
                <NavigationBar />
                <div className={styles.chatsContainer}>
                    <div className={styles.loading}>Загрузка...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <NavigationBar />
            <Helmet>
                <title>Мои чаты - StartHub</title>
            </Helmet>
            <div className={styles.chatsContainer}>
                <div className={styles.chatsList}>
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
                    {error ? (
                        <div className={styles.emptyState}>Ошибка при загрузке чатов</div>
                    ) : filteredChats.length === 0 ? (
                        <div className={styles.emptyState}>
                            {searchQuery ? 'Чаты не найдены' : 'У вас пока нет чатов'}
                        </div>
                    ) : (
                        filteredChats.map(chat => {
                            const lastMessage = getLastMessageInfo(chat);
                            const unreadCount = getUnreadCount(chat);
                            
                            return (
                                <div
                                    key={chat.id}
                                    className={`${styles.chatItem} ${selectedChat?.id === chat.id ? styles.selected : ''}`}
                                    onClick={() => handleChatSelect(chat)}
                                >
                                    <div className={styles.chatName}>{getChatName(chat)}</div>
                                    {lastMessage && (
                                        <div className={styles.lastMessage}>
                                            <div className={styles.lastMessageText}>
                                                {lastMessage.text}
                                            </div>
                                            <div className={styles.lastMessageInfo}>
                                                <span className={styles.lastMessageAuthor}>
                                                    {lastMessage.author === currentUsername ? 'Вы' : lastMessage.author}
                                                </span>
                                                <span className={styles.lastMessageTime}>
                                                    {formatLastMessageDate(lastMessage.time)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {unreadCount > 0 && (
                                        <div className={styles.unreadBadge}>
                                            {unreadCount}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
                <div className={styles.chatWindow}>
                    {selectedChat ? (
                        <>
                            <div className={styles.chatHeader}>
                                <div className={styles.chatTitle}>{getChatName(selectedChat)}</div>
                                {selectedChat.user1 && selectedChat.user2 && (
                                    <button onClick={handleHideChat} className={styles.hideChatButton}>
                                        <i className="fas fa-eye-slash"></i> Скрыть чат
                                    </button>
                                )}
                            </div>
                            {error && (
                                <div className={styles.errorMessage}>
                                    {error}
                                    <button onClick={() => connectToWebSocket(selectedChat.id)} className={styles.retryButton}>
                                        Переподключиться
                                    </button>
                                </div>
                            )}
                            <div className={styles.messagesContainer}>
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
                                                <span className={styles.messageAuthor}>{message.sender}</span>
                                                <span className={styles.messageTime}>{formatDate(message.timestamp)}</span>
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

            {showCreateChatModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Создать чат</h2>
                        <div className={styles.modalButtons}>
                            <button onClick={() => {
                                setShowCreateChatModal(false);
                                setShowPrivateChatModal(true);
                            }}>
                                Личный чат
                            </button>
                            <button onClick={() => {
                                setShowCreateChatModal(false);
                                setShowGroupChatModal(true);
                            }}>
                                Групповой чат
                            </button>
                            <button onClick={() => setShowCreateChatModal(false)}>
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPrivateChatModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Создать личный чат</h2>
                        <div className={styles.searchContainer} ref={dropdownRef}>
                            <input
                                type="text"
                                placeholder="Поиск пользователя..."
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
                        <div className={styles.modalButtons}>
                            <button onClick={handleCreatePrivateChat} disabled={!selectedUser}>
                                Создать
                            </button>
                            <button onClick={() => {
                                setShowPrivateChatModal(false);
                                setSearchUsername('');
                                setSelectedUser(null);
                                setSearchResults([]);
                                setShowDropdown(false);
                            }}>
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showGroupChatModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Создать групповой чат</h2>
                        <div className={styles.groupChatForm}>
                            <input
                                type="text"
                                placeholder="Название чата"
                                value={groupChatName}
                                onChange={(e) => setGroupChatName(e.target.value)}
                            />
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
                                <div className={styles.participantsLabel}>Участники чата:</div>
                                {groupParticipants.map(username => (
                                    <div key={username} className={styles.participantTag}>
                                        {username}
                                        <button
                                            onClick={() => setGroupParticipants(
                                                groupParticipants.filter(u => u !== username)
                                            )}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={styles.modalButtons}>
                            <button
                                onClick={handleCreateGroupChat}
                                disabled={!groupChatName || groupParticipants.length === 0}
                            >
                                Создать
                            </button>
                            <button onClick={() => {
                                setShowGroupChatModal(false);
                                setGroupChatName('');
                                setGroupParticipants([]);
                                setSearchUsername('');
                                setSearchResults([]);
                                setShowDropdown(false);
                            }}>
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyChats;
