import { useEffect } from 'react';
import { useUser } from '../contexts/userContext';

/**
 * ✅ Custom Hook: useAutoRefreshUserRole
 *
 * Tự động refresh user data khi component mount
 * Dùng để lấy role mới sau khi admin duyệt role request
 *
 * Usage:
 * function MyComponent() {
 *     useAutoRefreshUserRole();
 *     // Component code...
 * }
 */
export const useAutoRefreshUserRole = () => {
    const { user, refreshUserData } = useUser();

    useEffect(() => {
        // Chỉ refresh nếu user đã đăng nhập
        if (user) {
            refreshUserData();
        }
    }, []); // Chạy một lần khi component mount
};

export default useAutoRefreshUserRole;
