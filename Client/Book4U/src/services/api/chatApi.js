import {
    ref,
    push,
    set,
    get,
    query,
    orderByChild,
    equalTo,
    onValue,
    off,
    update,
    remove,
} from 'firebase/database';
import { db } from '../../firebase';

// Tạo ID conversation từ 2 user IDs
export const createConversationId = (userId1, userId2) => {
    const ids = [userId1, userId2].sort();
    return `${ids[0]}_${ids[1]}`;
};

// Gửi tin nhắn
export const sendMessage = async (conversationId, senderId, message, senderInfo) => {
    try {
        const messagesRef = ref(db, `chats/${conversationId}/messages`);
        const newMessageRef = push(messagesRef);

        await set(newMessageRef, {
            id: newMessageRef.key,
            senderId,
            senderName: senderInfo.firstName + ' ' + senderInfo.lastName,
            senderAvatar: senderInfo.storeLogo || senderInfo.profilePicture || '',
            senderRole: senderInfo.role,
            text: message,
            timestamp: Date.now(),
            read: false,
        });

        // Cập nhật lastMessage của conversation
        const conversationRef = ref(db, `chats/${conversationId}`);
        await update(conversationRef, {
            lastMessage: message,
            lastMessageTime: Date.now(),
            lastMessageSenderId: senderId,
        });

        return { success: true };
    } catch (error) {
        console.error('Lỗi gửi tin nhắn:', error);
        return { success: false, error: error.message };
    }
};

// Gửi file/ảnh
export const sendFile = async (conversationId, senderId, fileData, senderInfo) => {
    try {
        const messagesRef = ref(db, `chats/${conversationId}/messages`);
        const newMessageRef = push(messagesRef);

        await set(newMessageRef, {
            id: newMessageRef.key,
            senderId,
            senderName: senderInfo.firstName + ' ' + senderInfo.lastName,
            senderAvatar: senderInfo.storeLogo || senderInfo.profilePicture || '',
            senderRole: senderInfo.role,
            fileUrl: fileData.fileUrl,
            fileType: fileData.fileType, // 'image' hoặc 'file'
            fileName: fileData.fileName,
            fileSize: fileData.fileSize,
            mimeType: fileData.mimeType,
            timestamp: Date.now(),
            read: false,
            isFile: true,
        });

        // Cập nhật lastMessage của conversation
        const conversationRef = ref(db, `chats/${conversationId}`);
        const lastMessageText =
            fileData.fileType === 'image'
                ? `[Gửi ảnh: ${fileData.fileName}]`
                : `[Gửi file: ${fileData.fileName}]`;
        await update(conversationRef, {
            lastMessage: lastMessageText,
            lastMessageTime: Date.now(),
            lastMessageSenderId: senderId,
        });

        return { success: true };
    } catch (error) {
        console.error('Lỗi gửi file:', error);
        return { success: false, error: error.message };
    }
};

// Upload file lên server
export const uploadChatFile = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/uploads/chat-files`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Lỗi upload file:', error);
        throw error;
    }
};

// Lấy tất cả messages của conversation
export const getMessages = (conversationId, callback) => {
    try {
        const messagesRef = ref(db, `chats/${conversationId}/messages`);
        const unsubscribe = onValue(messagesRef, (snapshot) => {
            if (snapshot.exists()) {
                const messages = [];
                snapshot.forEach((childSnapshot) => {
                    messages.push(childSnapshot.val());
                });
                // Sắp xếp theo timestamp
                messages.sort((a, b) => a.timestamp - b.timestamp);
                callback(messages);
            } else {
                callback([]);
            }
        });

        return unsubscribe;
    } catch (error) {
        console.error('Lỗi lấy messages:', error);
        return null;
    }
};

// Tạo hoặc lấy conversation
export const getOrCreateConversation = async (userId1, userId2, user1Info, user2Info) => {
    try {
        const conversationId = createConversationId(userId1, userId2);
        const conversationRef = ref(db, `chats/${conversationId}`);

        try {
            const snapshot = await get(conversationRef);

            if (!snapshot.exists()) {
                // Tạo conversation mới với cấu trúc đầy đủ
                const conversationData = {
                    id: conversationId,
                    participants: {
                        [userId1]: {
                            id: userId1,
                            name: user1Info.firstName + ' ' + user1Info.lastName,
                            role: user1Info.role,
                        },
                        [userId2]: {
                            id: userId2,
                            name: user2Info.firstName + ' ' + user2Info.lastName,
                            role: user2Info.role,
                        },
                    },
                    createdAt: Date.now(),
                    lastMessage: '',
                    lastMessageTime: 0,
                    lastMessageSenderId: '',
                    messages: {}, // Khởi tạo object rỗng
                };

                await set(conversationRef, conversationData);
            }
        } catch (getError) {
            // Nếu lỗi permission khi get, cố gắng tạo conversation
            console.log('Tạo conversation mới...');
            const conversationData = {
                id: conversationId,
                participants: {
                    [userId1]: {
                        id: userId1,
                        name: user1Info.firstName + ' ' + user1Info.lastName,
                        role: user1Info.role,
                    },
                    [userId2]: {
                        id: userId2,
                        name: user2Info.firstName + ' ' + user2Info.lastName,
                        role: user2Info.role,
                    },
                },
                createdAt: Date.now(),
                lastMessage: '',
                lastMessageTime: 0,
                lastMessageSenderId: '',
                messages: {},
            };

            await set(conversationRef, conversationData);
        }

        return { success: true, conversationId };
    } catch (error) {
        console.error('Lỗi tạo/lấy conversation:', error);
        return { success: false, error: error.message };
    }
};

// Lấy danh sách conversations của user
export const getUserConversations = (userId, callback) => {
    try {
        console.log('getUserConversations: Bắt đầu với userId:', userId);
        if (!userId) {
            console.error('getUserConversations: userId không hợp lệ:', userId);
            callback([]);
            return null;
        }

        console.log('getUserConversations: Đang lắng nghe conversations cho user:', userId);
        const chatsRef = ref(db, 'chats');

        const unsubscribe = onValue(
            chatsRef,
            (snapshot) => {
                console.log('getUserConversations: Received snapshot, exists:', snapshot.exists());

                if (snapshot.exists()) {
                    const conversations = [];
                    snapshot.forEach((childSnapshot) => {
                        const chat = childSnapshot.val();
                        const conversationId = childSnapshot.key;

                        console.log(
                            'Checking conversation:',
                            conversationId,
                            'participants:',
                            chat.participants
                        );

                        // Kiểm tra xem user có trong conversation này không
                        if (chat.participants && chat.participants[userId]) {
                            conversations.push({
                                ...chat,
                                conversationId: conversationId,
                            });
                            console.log('✓ Added conversation:', conversationId);
                        } else {
                            console.log('✗ User not in conversation:', conversationId);
                        }
                    });

                    console.log('Total conversations for user:', conversations.length);

                    // Sắp xếp theo lastMessageTime (mới nhất trước)
                    conversations.sort(
                        (a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0)
                    );
                    callback(conversations);
                } else {
                    console.log('getUserConversations: Không có dữ liệu /chats');
                    callback([]);
                }
            },
            (error) => {
                console.error('Lỗi Firebase lắng nghe conversations:', error);
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                callback([]);
            }
        );

        return unsubscribe;
    } catch (error) {
        console.error('Lỗi lấy conversations:', error);
        return null;
    }
};

// Đánh dấu messages là đã đọc
export const markMessagesAsRead = async (conversationId, userId) => {
    try {
        const messagesRef = ref(db, `chats/${conversationId}/messages`);
        const snapshot = await get(messagesRef);

        if (snapshot.exists()) {
            const updates = {};
            snapshot.forEach((childSnapshot) => {
                const message = childSnapshot.val();
                if (message.senderId !== userId && !message.read) {
                    updates[`${childSnapshot.key}/read`] = true;
                }
            });

            if (Object.keys(updates).length > 0) {
                await update(messagesRef, updates);
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Lỗi đánh dấu đã đọc:', error);
        return { success: false, error: error.message };
    }
};

// Xóa conversation
export const deleteConversation = async (conversationId) => {
    try {
        const conversationRef = ref(db, `chats/${conversationId}`);
        await remove(conversationRef);
        return { success: true };
    } catch (error) {
        console.error('Lỗi xóa conversation:', error);
        return { success: false, error: error.message };
    }
};

// Lắng nghe conversation mới từ seller
export const listenForNewConversations = (userId, callback) => {
    try {
        const chatsRef = ref(db, 'chats');
        const unsubscribe = onValue(chatsRef, (snapshot) => {
            if (snapshot.exists()) {
                const userChats = [];
                snapshot.forEach((childSnapshot) => {
                    const chat = childSnapshot.val();
                    if (chat.participants && chat.participants[userId]) {
                        userChats.push({
                            ...chat,
                            conversationId: childSnapshot.key,
                        });
                    }
                });
                callback(userChats);
            }
        });

        return unsubscribe;
    } catch (error) {
        console.error('Lỗi lắng nghe conversations:', error);
        return null;
    }
};
