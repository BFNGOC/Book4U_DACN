import { useState } from 'react';
import { useUser } from '../../contexts/userContext';
import { useNavigate } from 'react-router-dom';
import { getOrCreateConversation } from '../../services/api/chatApi';
import { MessageCircle, Loader } from 'lucide-react';

function StartChat({ sellerId, sellerInfo }) {
    const { user: currentUser } = useUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    console.log('StartChat: currentUser =', currentUser);
    console.log('StartChat: sellerId =', sellerId);
    console.log('StartChat: sellerInfo =', sellerInfo);
    const handleStartChat = async () => {
        if (!currentUser) {
            alert('Vui lòng đăng nhập để chat với bán hàng');
            navigate('/login');
            return;
        }

        if (currentUser.role === 'seller' && currentUser._id === sellerId) {
            alert('Bạn không thể chat với chính mình');
            return;
        }

        setLoading(true);
        try {
            const result = await getOrCreateConversation(
                currentUser._id,
                sellerId,
                {
                    firstName: currentUser.firstName,
                    lastName: currentUser.lastName,
                    role: currentUser.role,
                    storeLogo: currentUser.storeLogo,
                    profilePicture: currentUser.profilePicture,
                },
                {
                    firstName: sellerInfo.firstName,
                    lastName: sellerInfo.lastName,
                    role: 'seller',
                    storeLogo: sellerInfo.storeLogo,
                }
            );

            if (result.success) {
                navigate('/chat', { state: { conversationId: result.conversationId } });
            } else {
                alert('Lỗi tạo cuộc trò chuyện: ' + result.error);
            }
        } catch (error) {
            console.error('Lỗi:', error);
            alert('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleStartChat}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors"
        >
            {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
            ) : (
                <MessageCircle className="w-4 h-4" />
            )}
            {loading ? 'Đang xử lý...' : 'Chat với bán hàng'}
        </button>
    );
}

export default StartChat;
