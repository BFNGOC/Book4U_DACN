import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function LiveListPage() {
    const [streams, setStreams] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const streamsRef = ref(db, 'streams');

        const unsubscribe = onValue(
            streamsRef,
            (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const list = Object.values(data).filter(
                        (item) => item.isLive === true || item.isLive === 'true'
                    );
                    setStreams(list);
                } else {
                    setStreams([]);
                }
            },
            (error) => {
                console.error('Firebase read error:', error);
            }
        );

        return () => unsubscribe();
    }, []);

    return (
        <div className="p-6 min-h-screen bg-[#f9f9f9] text-[#222]">
            <h1 className="text-2xl font-bold mb-6">🔴 Livestream đang diễn ra</h1>

            {streams.length === 0 ? (
                <p className="text-gray-600">Hiện tại chưa có ai livestream</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {streams.map((s) => (
                        <div
                            key={s.streamId}
                            onClick={() => navigate(`/live/${s.streamId}`)}
                            className="bg-white rounded-xl overflow-hidden cursor-pointer 
                                       border border-gray-200 shadow-sm hover:shadow-lg 
                                       transition hover:-translate-y-1"
                        >
                            <img
                                src={s.thumb}
                                alt={`${s.title} thumbnail`}
                                className="w-full h-48 object-cover"
                            />

                            <div className="flex p-3 gap-3 items-start">
                                <img
                                    src={s.avatar}
                                    alt={`${s.streamerName} avatar`}
                                    className="w-10 h-10 rounded-full"
                                />

                                <div>
                                    <p className="font-semibold text-lg">{s.title}</p>
                                    <p className="text-sm text-gray-600">👤 {s.streamerName}</p>

                                    <span className="text-red-600 text-xs font-bold">
                                        🔴 Đang phát trực tiếp
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
