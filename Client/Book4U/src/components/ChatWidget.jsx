import { useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';

function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // 🧠 Hàm gửi tin nhắn
    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: 'user', text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');

        setLoading(true);

        // Giả lập gọi API AI
        setTimeout(() => {
            const botReply = {
                sender: 'bot',
                text: 'Mình là chatbot demo. Backend AI sẽ được thêm sau nhé!',
            };

            setMessages((prev) => [...prev, botReply]);
            setLoading(false);
        }, 800);
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

                    {/* Chat messages */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`p-2 rounded-lg max-w-[80%] ${
                                    msg.sender === 'user'
                                        ? 'ml-auto bg-blue-500 text-white'
                                        : 'mr-auto bg-gray-200'
                                }`}
                            >
                                {msg.text}
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
