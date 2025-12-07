import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { ref, push, set, onValue } from 'firebase/database';
import { useUser } from '../contexts/userContext';

export default function LivePage() {
    const { streamId } = useParams();
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([]);
    const [isLive, setIsLive] = useState(true);
    const { user } = useUser();

    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chat]);

    useEffect(() => {
        const chatRef = ref(db, `livechats/${streamId}`);
        const unsubscribe = onValue(chatRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const arr = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
                setChat(arr);
            } else setChat([]);
        });
        return () => unsubscribe();
    }, [streamId]);

    const handleSend = () => {
        if (!message.trim()) return;

        const chatRef = ref(db, `livechats/${streamId}`);
        const newMsg = push(chatRef);

        set(newMsg, {
            text: message,
            timestamp: Date.now(),
            userId: user?.id || user?.userId,
            name: `${user?.firstName} ${user?.lastName}`,
            avatar: user?.avatar,
        });

        setMessage('');
    };

    useEffect(() => {
        const streamRef = ref(db, `streams/${streamId}`);
        const unsubscribe = onValue(streamRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setIsLive(data.isLive);
            } else {
                setIsLive(false); // nếu stream không tồn tại → coi như kết thúc
            }
        });
        return () => unsubscribe();
    }, [streamId]);

    return (
        <div className="w-full h-screen bg-gray-100 flex gap-4 p-4">
            {/* 🎥 Video */}
            <div className="flex-1 bg-white rounded-xl shadow-md flex justify-center items-center">
                {isLive ? (
                    <iframe
                        width="95%"
                        height="95%"
                        src={`https://www.youtube.com/embed/${streamId}?autoplay=1`}
                        frameBorder="0"
                        allowFullScreen
                        className="rounded-xl"
                    ></iframe>
                ) : (
                    <p className="text-center text-gray-500 text-lg">🛑 Livestream đã kết thúc</p>
                )}
            </div>

            {/* 💬 Chat */}
            <div className="w-[350px] bg-white rounded-xl shadow-md flex flex-col">
                <h3 className="text-lg font-semibold p-3 border-b bg-gray-50">💬 Live Chat</h3>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {chat.length === 0 && (
                        <p className="text-gray-500 text-center text-sm">Chưa có tin nhắn</p>
                    )}

                    {chat.map((c, i) => {
                        const isMe = c.userId === (user?.id || user?.userId);
                        return (
                            <div
                                key={i}
                                className={`flex gap-2 p-2 rounded-lg ${
                                    isMe ? 'bg-blue-100' : 'bg-gray-100'
                                }`}
                            >
                                <img
                                    src={c.avatar}
                                    className="w-8 h-8 rounded-full object-cover"
                                    alt="avatar"
                                />
                                <div>
                                    <p className="text-sm font-semibold">
                                        {c.name}{' '}
                                        {isMe && (
                                            <span className="text-green-600 text-xs">(Bạn)</span>
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-800">{c.text}</p>
                                    <span className="text-xs text-gray-500">
                                        {new Date(c.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* 📌 điểm kết thúc để scroll tới */}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t bg-gray-50 flex gap-2">
                    <input
                        className="flex-1 p-2 rounded-lg bg-white border text-gray-700 focus:outline-blue-400"
                        placeholder="Nhập tin nhắn..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        className="bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-700"
                        onClick={handleSend}
                    >
                        Gửi
                    </button>
                </div>
            </div>
        </div>
    );
}
