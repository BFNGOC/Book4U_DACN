import { useState, useEffect } from 'react';
import { useUser } from '../contexts/userContext';
import { useLocation } from 'react-router-dom';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';

function Chat() {
    const { user: currentUser } = useUser();
    const location = useLocation();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [selectedOtherUser, setSelectedOtherUser] = useState(null);

    // Log user khi mount
    useEffect(() => {
        console.log('Chat page: currentUser =', currentUser);
    }, [currentUser]);

    // Nếu có conversationId từ StartChat, auto select nó
    useEffect(() => {
        if (location.state?.conversationId) {
            console.log('Chat page: Auto-selecting conversation:', location.state.conversationId);
            setSelectedConversation(location.state.conversationId);
        }
    }, [location.state]);

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center">
                <p className="text-gray-600 text-center">
                    Vui lòng đăng nhập để sử dụng chức năng chat
                </p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 pb-4">
            <div className="h-[calc(100vh-theme(spacing.20))] max-w-7xl mx-auto flex bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Chat List - Sidebar */}
                <div className="w-full md:w-80 border-r border-gray-200">
                    <ChatList
                        onSelectConversation={(conversationId, otherUser) => {
                            setSelectedConversation(conversationId);
                            setSelectedOtherUser(otherUser);
                        }}
                        selectedConversationId={selectedConversation}
                    />
                </div>

                {/* Chat Window - Desktop */}
                <div className="hidden md:flex flex-1 flex-col">
                    {selectedConversation ? (
                        <ChatWindow
                            conversationId={selectedConversation}
                            otherUser={selectedOtherUser}
                            onBack={() => {
                                setSelectedConversation(null);
                                setSelectedOtherUser(null);
                            }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50 to-gray-50">
                            <div className="text-center space-y-4">
                                <div className="text-6xl">💬</div>
                                <p className="text-gray-500 text-lg">
                                    Chọn một cuộc trò chuyện để bắt đầu
                                </p>
                                <p className="text-gray-400 text-sm">
                                    Hoặc bấm "Chat với bán hàng" trên trang sản phẩm
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Window - Mobile */}
                <div className="flex md:hidden flex-1 flex-col">
                    {selectedConversation ? (
                        <ChatWindow
                            conversationId={selectedConversation}
                            otherUser={selectedOtherUser}
                            onBack={() => {
                                setSelectedConversation(null);
                                setSelectedOtherUser(null);
                            }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50 to-gray-50">
                            <div className="text-center space-y-3">
                                <div className="text-5xl">💬</div>
                                <p className="text-gray-500">Chọn một cuộc trò chuyện</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Chat;
