import { useState, useEffect } from 'react';
import { useUser } from '../../contexts/userContext';
import { getUserConversations, deleteConversation } from '../../services/api/chatApi';
import { MessageCircle, Trash2, Loader } from 'lucide-react';
import Loading from '../common/Loading';

function ChatList({ onSelectConversation, selectedConversationId }) {
    const { user: currentUser } = useUser();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    console.log('ChatList: currentUser =', currentUser);
    useEffect(() => {
        if (!currentUser) {
            console.log('ChatList: currentUser không tồn tại');
            return;
        }

        console.log('ChatList: Gọi getUserConversations với userId:', currentUser._id);
        setLoading(true);
        const unsubscribe = getUserConversations(currentUser._id, (convs) => {
            console.log(
                'ChatList: Nhận callback từ getUserConversations với',
                convs.length,
                'conversations'
            );
            setConversations(convs);
            setLoading(false);
        });

        return () => {
            console.log('ChatList: Cleanup - unsubscribe listener');
            if (unsubscribe) unsubscribe();
        };
    }, [currentUser]);

    const handleDelete = async (conversationId, e) => {
        e.stopPropagation();

        if (window.confirm('Bạn chắc chắn muốn xóa cuộc trò chuyện này?')) {
            setDeleting(conversationId);
            const result = await deleteConversation(conversationId);
            if (result.success) {
                setConversations((convs) =>
                    convs.filter((c) => c.conversationId !== conversationId)
                );
            }
            setDeleting(null);
        }
    };

    const getOtherUser = (conversation) => {
        if (!conversation.participants) return null;

        const participants = Object.values(conversation.participants);
        const otherUser = participants.find((p) => p.id !== currentUser._id);
        return otherUser;
    };

    const getUnreadCount = (conversation) => {
        if (!conversation.messages) return 0;
        return Object.values(conversation.messages).filter(
            (m) => !m.read && m.senderId !== currentUser._id
        ).length;
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;

        return date.toLocaleDateString('vi-VN');
    };

    const filteredConversations = conversations.filter((conv) => {
        const otherUser = getOtherUser(conv);
        if (!otherUser) return false;
        return otherUser.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (loading) return <Loading context="Đang tải danh sách trò chuyện..." />;

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-3">
                    <MessageCircle className="w-5 h-5" />
                    Tin nhắn
                </h2>
                <input
                    type="text"
                    placeholder="Tìm kiếm cuộc trò chuyện..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Conversations List */}
            <div className="flex-grow overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400 text-center px-4">
                            {conversations.length === 0
                                ? 'Chưa có cuộc trò chuyện nào'
                                : 'Không tìm thấy cuộc trò chuyện'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredConversations.map((conversation) => {
                            const otherUser = getOtherUser(conversation);
                            const isSelected =
                                selectedConversationId === conversation.conversationId;
                            const unreadCount = getUnreadCount(conversation);

                            return (
                                <div
                                    key={conversation.conversationId}
                                    onClick={() =>
                                        onSelectConversation(conversation.conversationId, otherUser)
                                    }
                                    className={`p-3 cursor-pointer transition-colors border-l-4 ${
                                        isSelected
                                            ? 'bg-blue-50 border-l-blue-500'
                                            : 'border-l-transparent hover:bg-gray-50'
                                    } ${unreadCount > 0 ? 'bg-blue-50' : ''}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {otherUser?.name}
                                                </h3>
                                                {unreadCount > 0 && (
                                                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 truncate">
                                                {conversation.lastMessage || 'Chưa có tin nhắn'}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {conversation.lastMessageTime
                                                    ? formatTime(conversation.lastMessageTime)
                                                    : ''}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) =>
                                                handleDelete(conversation.conversationId, e)
                                            }
                                            disabled={deleting === conversation.conversationId}
                                            className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                            title="Xóa cuộc trò chuyện"
                                        >
                                            {deleting === conversation.conversationId ? (
                                                <Loader className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatList;
