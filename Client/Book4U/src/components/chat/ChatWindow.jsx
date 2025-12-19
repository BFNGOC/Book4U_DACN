import { useState, useEffect, useRef } from 'react';
import { useUser } from '../../contexts/userContext';
import { getMessages, sendMessage, markMessagesAsRead } from '../../services/api/chatApi';
import { Send, ArrowLeft, AlertCircle } from 'lucide-react';
import Loading from '../common/Loading';

function ChatWindow({ conversationId, otherUser, onBack }) {
    const { user: currentUser } = useUser();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    const inputRef = useRef(null);

    useEffect(() => {
        if (!loading) {
            inputRef.current?.focus();
        }
    }, [conversationId, loading]);

    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load messages
    useEffect(() => {
        if (!conversationId || !currentUser) return;

        setLoading(true);
        setError('');

        const unsubscribe = getMessages(conversationId, (msgs) => {
            setMessages(msgs);
            setLoading(false);
        });

        // Mark messages as read
        markMessagesAsRead(conversationId, currentUser._id);

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [conversationId, currentUser]);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        setSending(true);
        setError('');

        const result = await sendMessage(conversationId, currentUser._id, newMessage.trim(), {
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            role: currentUser.role,
            storeLogo: currentUser.storeLogo,
            profilePicture: currentUser.profilePicture,
        });

        if (result.success) {
            setNewMessage('');
            requestAnimationFrame(() => inputRef.current?.focus());
        } else {
            setError('Lỗi gửi tin nhắn: ' + result.error);
        }

        setSending(false);
    };

    if (loading) return <Loading context="Đang tải tin nhắn..." />;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="md:hidden p-2 hover:bg-blue-200 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h3 className="font-semibold text-gray-900">{otherUser?.name}</h3>
                        <p className="text-xs text-gray-500 capitalize">
                            {otherUser?.role === 'seller' ? 'Bán hàng' : 'Khách hàng'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>Bắt đầu cuộc trò chuyện</p>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => {
                            const isOwn = message.senderId === currentUser._id;
                            return (
                                <div
                                    key={message.id || index}
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                            isOwn
                                                ? 'bg-blue-500 text-white rounded-br-none'
                                                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                                        }`}
                                    >
                                        {!isOwn && (
                                            <p className="text-xs font-semibold text-gray-600 mb-1">
                                                {message.senderName}
                                            </p>
                                        )}
                                        <p className="text-sm break-words">{message.text}</p>
                                        <p
                                            className={`text-xs mt-1 ${
                                                isOwn ? 'text-blue-100' : 'text-gray-400'
                                            }`}
                                        >
                                            {new Date(message.timestamp).toLocaleTimeString(
                                                'vi-VN',
                                                {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                }
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Input */}
            <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-gray-200 bg-white flex gap-2"
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    disabled={sending}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    {sending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                    Gửi
                </button>
            </form>
        </div>
    );
}

export default ChatWindow;
