/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosPrivate from '../utils/api/axiosPrivate';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user')) || null;
        } catch {
            return null;
        }
    });

    const navigate = useNavigate();

    const logoutUser = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        navigate('/');
    };

    const updateUser = (updatedUser) => {
        const { id: _ignored1, _id: _ignored2, ...sanitizedUser } = updatedUser;
        setUser(sanitizedUser);
        localStorage.setItem('user', JSON.stringify(sanitizedUser));
    };

    // ✅ MỚI: Refresh user data từ server (để lấy role mới sau khi admin duyệt)
    const refreshUserData = async () => {
        try {
            const response = await axiosPrivate.get('/api/auth/me');
            if (response.data?.success && response.data?.data) {
                const userData = response.data.data;
                const {
                    id: _ignored1,
                    _id: _ignored2,
                    ...sanitizedUser
                } = userData;
                setUser(sanitizedUser);
                localStorage.setItem('user', JSON.stringify(sanitizedUser));
                console.log(
                    '✅ User data refreshed, role:',
                    sanitizedUser.role
                );
                return sanitizedUser;
            }
        } catch (err) {
            console.error('❌ Lỗi refresh user data:', err);
        }
    };

    return (
        <UserContext.Provider
            value={{ user, setUser, updateUser, logoutUser, refreshUserData }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
