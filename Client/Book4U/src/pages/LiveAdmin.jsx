import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { ref, set, update } from 'firebase/database';
import { useUser } from '../contexts/userContext';

export default function LiveAdmin() {
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState('');
    const [streamId, setStreamId] = useState('');

    const navigate = useNavigate();
    const { user } = useUser();

    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    const extractStreamId = (url) => {
        return (
            url.split('youtu.be/')[1]?.split('?')[0] ||
            url.split('v=')[1]?.split('&')[0] ||
            url.split('/live/')[1]?.split('?')[0]
        );
    };

    const handleStart = () => {
        const id = extractStreamId(url);
        if (!id) return alert('Link livestream không hợp lệ');

        setStreamId(id);

        // 📌 Lưu stream vào Firebase
        set(ref(db, `streams/${id}`), {
            streamId: id,
            title: `🎯 Live của ${user?.firstName || 'Streamer'}`,
            streamerName: `${user?.firstName} ${user?.lastName}`,
            streamerId: user?.id || user?.userId,
            avatar: user?.avatar,
            thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
            isLive: true,
            createdAt: Date.now(),
        });

        setIsOpen(false);
    };

    // 🚀 Khi có streamId → tự động điều hướng
    useEffect(() => {
        if (streamId) {
            navigate(`/live/${streamId}`);
        }
    }, [streamId, navigate]);

    const handleEnd = () => {
        if (!streamId) return;
        update(ref(db, `streams/${streamId}`), { isLive: false })
            .then(() => {
                setStreamId('');
                alert('Livestream đã kết thúc');
            })
            .catch(() => alert('Có lỗi khi kết thúc livestream'));
    };
    return (
        <div className="p-6">
            {!streamId && (
                <button
                    onClick={handleOpen}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition cursor-pointer"
                >
                    🔴 Bắt đầu Livestream
                </button>
            )}
            {streamId && (
                <button
                    onClick={handleEnd}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition mt-4"
                >
                    🛑 Kết thúc Livestream
                </button>
            )}

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg animate-fadeIn">
                        <h3 className="text-xl font-bold mb-4 text-center">
                            Nhập link livestream YouTube
                        </h3>

                        <input
                            type="text"
                            placeholder="https://youtube.com/live/..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="border w-full p-2 rounded mb-4 focus:outline-blue-600"
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition"
                            >
                                Hủy
                            </button>

                            <button
                                onClick={handleStart}
                                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition"
                            >
                                Bắt đầu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
