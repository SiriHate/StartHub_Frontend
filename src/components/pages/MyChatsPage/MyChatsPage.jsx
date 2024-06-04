import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import NavigationBar from '../../navigation_bar/NavigationBar';
import styles from './MyChatsPage.module.css';
import axios from 'axios';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import config from '../../../config';

const MyChatsPage = () => {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [stompClient, setStompClient] = useState(null);
    const subscriptionRef = useRef(null);
    const authorizationCookie = document.cookie.split('; ').find(row => row.startsWith('Authorization='));
    const authorizationToken = authorizationCookie ? authorizationCookie.split('=')[1] : '';

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const response = await axios.get(`${config.CHAT_SERVICE}/chats/user/auth`, {
                    headers: {
                        Authorization: ` ${authorizationToken}`
                    }
                });
                setChats(response.data);
            } catch (error) {
                console.error('Error fetching chats:', error);
            }
        };

        fetchChats();
    }, [authorizationToken]);

    useEffect(() => {
        const socket = new SockJS(`${config.CHAT_SERVICE}/ws`);
        const client = Stomp.over(socket);

        client.connect({ 'Authorization': authorizationToken }, (frame) => {
            setStompClient(client);

            if (activeChat) {
                subscribeToTopic(client, activeChat.id);
            }
        }, (error) => {
            console.error('Connection error:', error);
        });

        return () => {
            if (client && client.connected) {
                client.disconnect(() => {
                    console.log('Disconnected');
                });
            }
        };
    }, [authorizationToken]);

    useEffect(() => {
        if (stompClient && stompClient.connected) {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
            if (activeChat) {
                subscribeToTopic(stompClient, activeChat.id);
            }
        }
    }, [activeChat, stompClient]);

    const subscribeToTopic = (client, chatRoomId) => {
        const topic = `/topic/chatRoom/${chatRoomId}`;
        subscriptionRef.current = client.subscribe(topic, (message) => {
            const receivedMessage = JSON.parse(message.body);
            setActiveChat((prevChat) => ({
                ...prevChat,
                messages: prevChat.messages ? [...prevChat.messages, receivedMessage] : [receivedMessage]
            }));
        });
    };

    const selectChat = async (chat) => {
        let url;
        if (chat.chatType === 'group') {
            url = `${config.CHAT_SERVICE}/chats/group/${chat.id}`;
        } else if (chat.chatType === 'personal') {
            url = `${config.CHAT_SERVICE}/chats/personal/${chat.id}`;
        }

        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: ` ${authorizationToken}`
                }
            });
            setActiveChat({
                ...response.data,
                messages: response.data.messages || []
            });
        } catch (error) {
            console.error('Error fetching chat details:', error);
        }
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
        searchUsers(event.target.value);
    };

    const searchUsers = async (query) => {
        try {
            const response = await axios.get(`${config.CHAT_SERVICE}/users/search`, {
                headers: {
                    Authorization: ` ${authorizationToken}`
                },
                params: {
                    query
                }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    const handleSendMessage = () => {
        if (message.trim() && stompClient && stompClient.connected && activeChat) {
            const chatMessage = {
                senderUsername: 'currentUser',
                messageContent: message,
                chatId: activeChat.id
            };
            stompClient.send(`/app/chat/${activeChat.id}`, {}, JSON.stringify(chatMessage));
            setMessage('');
        }
    };

    const getChatName = (chat) => {
        return chat.chatTitle;
    };

    return (
        <>
            <Helmet>
                <title>Мои чаты</title>
                <html className={styles.html}/>
                <body className={styles.body}/>
            </Helmet>
            <NavigationBar/>
            <div className={styles.chatPage}>
                <div className={styles.chatList}>
                    <input
                        type="text"
                        placeholder="Search for users"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className={styles.searchInput}
                    />
                    <div className={styles.userList}>
                        {users.map(user => (
                            <div key={user.id} className={styles.userPreview}>
                                {user.name}
                            </div>
                        ))}
                    </div>
                    {chats.map(chat => (
                        <div key={chat.id} className={styles.chatPreview} onClick={() => selectChat(chat)}>
                            <div className={styles.chatName}>{getChatName(chat)}</div>
                            <div className={styles.chatSnippet}>
                                {chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].messageContent : 'Нет сообщений'}
                            </div>
                        </div>
                    ))}
                </div>
                <div className={styles.chatWindow}>
                    {activeChat ? (
                        <div className={styles.chatContent}>
                            <h2 className={styles.chatTitle}>{getChatName(activeChat)}</h2>
                            <div className={styles.messages}>
                                {activeChat.messages && activeChat.messages.length > 0 ? (
                                    activeChat.messages.map((message, index) => (
                                        <div
                                            key={index}
                                            className={`${styles.message} ${message.senderUsername === 'currentUser' ? styles.myMessage : styles.otherMessage}`}
                                        >
                                            <div className={styles.messageSender}>{message.senderUsername}</div>
                                            <div className={styles.messageContent}>{message.messageContent}</div>
                                        </div>
                                    ))
                                ) : (
                                    <p className={styles.noMessages}>Здесь пока нет сообщений.</p>
                                )}
                            </div>
                            <div className={styles.messageInputContainer}>
                                <input
                                    type="text"
                                    placeholder="Введите сообщение..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className={styles.messageInput}
                                />
                                <button onClick={handleSendMessage} disabled={!message.trim()} className={styles.sendButton}>
                                    Отправить
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className={styles.noChatSelected}>Select a chat to view messages</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default MyChatsPage;
