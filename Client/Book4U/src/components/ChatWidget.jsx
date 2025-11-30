import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, MessageCircle } from 'lucide-react';
import { chatAi, getAiChatHistory } from '../services/api/aiApi';

function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // 📌 Format AI JSON (text + suggestions)
    const formatAiResponse = (res) => {
        if (!res) return { reply: '', suggestions: [] };

        // Nếu BE trả về dạng đúng
        if (res.reply || res.suggestions) return res;

        // Nếu BE trả về string
        if (typeof res === 'string') return { reply: res, suggestions: [] };

        return { reply: JSON.stringify(res), suggestions: [] };
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
            setMessages((prev) => [...prev, { sender: 'bot', text: '❌ Lỗi khi gọi AI' }]);
        }

        setLoading(false);
    };

    return (
        <>
            {/* Nút mở chat */}
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-5 right-5 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition z-50"
            >
                <MessageCircle size={24} />
            </button>

            {/* Khung chat */}
            {open && (
                <div className="fixed bottom-5 right-5 w-80 h-[420px] bg-white shadow-2xl rounded-xl flex flex-col overflow-hidden animate-fadeIn z-50">
                    {/* Header */}
                    <div className="bg-blue-500 text-white p-3 font-semibold flex justify-between">
                        <span>Chat AI hỗ trợ</span>
                        <button onClick={() => setOpen(false)} className="text-white">
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`p-2 rounded-lg max-w-[80%] whitespace-pre-line ${
                                    msg.sender === 'user'
                                        ? 'ml-auto bg-blue-500 text-white'
                                        : 'mr-auto bg-gray-200'
                                }`}
                            >
                                {/* BOT MESSAGE */}
                                {msg.sender === 'bot' ? (
                                    <>
                                        <div>{msg.content?.reply}</div>

                                        {/* Suggestion books */}
                                        {msg.content?.suggestions?.length > 0 && (
                                            <ul className="mt-2 space-y-1">
                                                {msg.content.suggestions.map((sug, idx) => (
                                                    <li key={idx}>
                                                        <Link
                                                            to={`/book/${sug.slug}`}
                                                            className="text-blue-600 underline"
                                                        >
                                                            • {sug.bookTitle}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                ) : (
                                    msg.text
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="mr-auto bg-gray-200 p-2 rounded-lg max-w-[60%]">
                                Đang trả lời...
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            className="flex-1 border rounded-lg px-3 py-2 text-sm"
                            placeholder="Nhập tin nhắn..."
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
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
