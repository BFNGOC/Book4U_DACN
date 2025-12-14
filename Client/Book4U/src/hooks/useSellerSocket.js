/**
 * useSellerSocket Hook
 * Tự động kết nối socket cho sellers
 */

import { useEffect } from 'react';
import { useUser } from '../contexts/userContext';
import socketService from '../services/socketService';

export const useSellerSocket = () => {
    const { user } = useUser();

    useEffect(() => {
        // Kết nối socket nếu chưa kết nối
        if (!socketService.isSocketConnected()) {
            socketService.connect();
        }

        // Nếu user là seller, join seller room (với retry logic)
        if (user && user.role === 'seller' && user._id) {
            const joinRoom = () => {
                if (socketService.isSocketConnected()) {
                    socketService.joinSellerRoom(user._id);
                    console.log('✅ Seller joined room');
                } else {
                    // Retry sau 500ms nếu socket chưa connected
                    console.log('⏳ Waiting for socket connection...');
                    setTimeout(joinRoom, 500);
                }
            };

            joinRoom();
        }

        // Cleanup
        return () => {
            // Không disconnect ngay, vì có thể người dùng vẫn muốn nhận thông báo
        };
    }, [user]);

    return {
        isConnected: socketService.isSocketConnected(),
        socketService,
    };
};

export default useSellerSocket;
