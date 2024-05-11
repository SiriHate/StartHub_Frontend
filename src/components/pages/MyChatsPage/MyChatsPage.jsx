import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import NavigationBar from '../../navigation_bar/NavigationBar';
import styles from './MyChatsPage.module.css';

const MyChatsPage = () => {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);

    useEffect(() => {
        // Dummy fetch function to simulate fetching chat data
        const fetchChats = async () => {
            // Simulate an API call
            const response = await new Promise(resolve => setTimeout(() => resolve({
                data: [
                    { id: 1, name: 'Chat 1', lastMessage: 'Hello there!' },
                    { id: 2, name: 'Chat 2', lastMessage: 'How are you?' }
                ]
            }), 1000));
            setChats(response.data);
        };

        fetchChats();
    }, []);

    const selectChat = (chat) => {
        setActiveChat(chat);
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
                    {chats.map(chat => (
                        <div key={chat.id} className={styles.chatPreview} onClick={() => selectChat(chat)}>
                            <div className={styles.chatName}>{chat.name}</div>
                            <div className={styles.chatSnippet}>{chat.lastMessage}</div>
                        </div>
                    ))}
                </div>
                <div className={styles.chatWindow}>
                    {activeChat ? (
                        <div>
                            <h2 className={styles.chatTitle}>{activeChat.name}</h2>
                            {/* Placeholder for chat messages */}
                            <div className={styles.messages}>
                                <p>Chat messages for {activeChat.name} would appear here.</p>
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
