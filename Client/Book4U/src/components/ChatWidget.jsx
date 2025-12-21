import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, MessageCircle, X } from 'lucide-react';
import { chatAi, getAiChatHistory } from '../services/api/aiApi';
import RecommendationCard from './chat/RecommendationCard';

function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]); // messages là state danh sách tin

    // 📌 Format AI JSON - hỗ trợ cả format cũ và mới
    const formatAiResponse = (res) => {
        if (!res) return { reply: '', recommendations: [] };

        // Format mới: recommendations
        if (res.recommendations || res.reply) {
            return {
                reply: res.reply || '',
                recommendations: res.recommendations || [],
            };
        }

        // Format cũ: suggestions → convert thành recommendations
        if (res.suggestions && Array.isArray(res.suggestions)) {
            return {
                reply: res.reply || 'Dưới đây là những cuốn sách được gợi ý cho bạn:',
                recommendations: res.suggestions.map((sug) => ({
                    title: sug.bookTitle,
                    slug: sug.slug,
                    author: sug.author || 'Unknown',
                    price: sug.price || 0,
                    ratingAvg: sug.ratingAvg || 0,
                    reason: 'Sách được gợi ý',
                })),
            };
        }

        // String thường
        if (typeof res === 'string') {
            return { reply: res, recommendations: [] };
        }

        return { reply: JSON.stringify(res), recommendations: [] };
    };

    // 📌 Load lịch sử từ DB
    const loadHistory = async () => {
        try {
            const response = await getAiChatHistory();
            const history = response.data;

            if (!Array.isArray(history)) return;

            const formatted = history
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                .map((item) => [
                    { sender: 'user', text: item.userMessage },
                    {
                        sender: 'bot',
                        content: formatAiResponse(item.aiResponse),
                    },
                ])
                .flat();

            setMessages(formatted);
        } catch (err) {
            console.error('Load history error:', err);
        }
    };

    // 📌 Khi mở widget → load lịch sử
    useEffect(() => {
        if (open) loadHistory();
    }, [open]);

    // 📌 Gửi tin nhắn
    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = { sender: 'user', text: input };
        setMessages((prev) => [...prev, userMsg]);

        const rawMessage = input;
        setInput('');
        setLoading(true);

        try {
            const response = await chatAi({ message: rawMessage });
            const data = response.data;

            const botMsg = {
                sender: 'bot',
                content: formatAiResponse(data),
            };

            setMessages((prev) => [...prev, botMsg]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    content: {
                        reply: '❌ Lỗi khi gọi AI',
                        recommendations: [],
                    },
                },
            ]);
        }

        setLoading(false);
    };

    return (
        <>
            {/* Nút mở chat - hiện đại hơn */}
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-5 right-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 z-50 flex items-center justify-center"
                title="Chat AI hỗ trợ"
            >
                <MessageCircle size={24} />
            </button>

            {/* Khung chat - UI hiện đại */}
            {open && (
                <div className="fixed bottom-24 right-5 w-96 max-h-[600px] bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden z-50 animate-fadeIn border border-gray-200">
                    {/* Header - Gradient đẹp */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 font-semibold flex justify-between items-center rounded-t-2xl">
                        <div>
                            <p className="font-bold">📚 Chat AI - Book4U</p>
                            <p className="text-xs text-blue-100 mt-0.5">Gợi ý sách thông minh</p>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-white hover:bg-blue-700 p-1 rounded-lg transition"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages - Scroll chiều dọc */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                        {messages.length === 0 && !loading && (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="text-4xl mb-2">👋</div>
                                <p className="text-sm text-gray-600">
                                    Xin chào! Tôi là AI hỗ trợ gợi ý sách
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Hỏi tôi về sách, thể loại yêu thích, tác giả...
                                </p>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${
                                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                            >
                                {/* User Message */}
                                {msg.sender === 'user' ? (
                                    <div className="max-w-xs bg-blue-500 text-white rounded-2xl rounded-tr-none px-4 py-2 text-sm break-words">
                                        {msg.text}
                                    </div>
                                ) : (
                                    /* Bot Message */
                                    <div className="max-w-sm space-y-3">
                                        {/* Bot Reply */}
                                        <div className="bg-gray-200 text-gray-900 rounded-2xl rounded-tl-none px-4 py-2 text-sm">
                                            {msg.content?.reply}
                                        </div>

                                        {/* Recommendation Cards - Grid ngang */}
                                        {msg.content?.recommendations?.length > 0 && (
                                            <div className="grid grid-cols-1 gap-3">
                                                {msg.content.recommendations
                                                    .slice(0, 3)
                                                    .map((rec, idx) => (
                                                        <RecommendationCard
                                                            key={idx}
                                                            book={rec}
                                                            reason={rec.reason}
                                                        />
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        <div ref={messagesEndRef} />

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-200 text-gray-900 rounded-2xl rounded-tl-none px-4 py-2 text-sm">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                        <div
                                            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                                            style={{ animationDelay: '0.2s' }}
                                        ></div>
                                        <div
                                            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                                            style={{ animationDelay: '0.4s' }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Section - Đẹp hơn */}
                    <div className="p-3 border-t border-gray-200 bg-white rounded-b-2xl flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage()}
                            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                            placeholder="Hỏi về sách, tác giả..."
                            disabled={loading}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-full transition-all duration-200 flex items-center justify-center"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default ChatWidget;
