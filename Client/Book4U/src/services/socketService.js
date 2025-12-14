/**
 * Socket.IO Client Service
 * Kết nối với server socket cho realtime notifications
 */

import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
    }

    /**
     * Kết nối socket
     */
    connect() {
        if (this.socket && this.isConnected) {
            console.log('Socket đã kết nối');
            return;
        }

        try {
            this.socket = io(API_URL, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
                transports: ['websocket', 'polling'],
            });

            this.socket.on('connect', () => {
                console.log('✅ Socket connected:', this.socket.id);
                this.isConnected = true;
            });

            this.socket.on('disconnect', () => {
                console.log('❌ Socket disconnected');
                this.isConnected = false;
            });

            this.socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });
        } catch (error) {
            console.error('Socket initialization error:', error);
        }
    }

    /**
     * Disconnect socket
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.isConnected = false;
            console.log('Socket disconnected');
        }
    }

    /**
     * Seller joins their notification room
     * @param {string} sellerId - ID của seller
     */
    joinSellerRoom(sellerId) {
        if (!this.socket || !this.isConnected) {
            console.warn('Socket not connected. Please connect first.');
            return;
        }

        this.socket.emit('seller:join', sellerId);
        console.log(
            `✅ Seller ${sellerId} joined notification room (socket: ${this.socket.id})`
        );
    }

    /**
     * Lắng nghe thông báo
     * @param {Function} callback - Callback khi nhận thông báo
     */
    onNotification(callback) {
        if (!this.socket) {
            console.warn('Socket not initialized');
            return;
        }

        this.socket.on('notification:received', (notification) => {
            console.log(
                '📬 Notification received on socket:',
                this.socket.id,
                notification
            );
            callback(notification);
        });
        console.log(
            '✅ Notification listener setup on socket:',
            this.socket.id
        );
    }

    /**
     * Bỏ lắng nghe thông báo
     */
    offNotification() {
        if (this.socket) {
            this.socket.off('notification:received');
        }
    }

    /**
     * Lắng nghe sự kiện tùy chỉnh
     * @param {string} event - Event name
     * @param {Function} callback - Callback
     */
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    /**
     * Phát sự kiện tùy chỉnh
     * @param {string} event - Event name
     * @param {any} data - Data
     */
    emit(event, data) {
        if (this.socket && this.isConnected) {
            this.socket.emit(event, data);
        }
    }

    /**
     * Bỏ lắng nghe sự kiện
     * @param {string} event - Event name
     */
    off(event) {
        if (this.socket) {
            this.socket.off(event);
        }
    }

    /**
     * Kiểm tra kết nối
     */
    isSocketConnected() {
        return this.isConnected && this.socket?.connected;
    }
}

// Export singleton instance
export default new SocketService();
