/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
        navigate('/login');
    };

    const updateUser = (updatedUser) => {
        const { id: _ignored1, _id: _ignored2, ...sanitizedUser } = updatedUser;
        setUser(sanitizedUser);
        localStorage.setItem('user', JSON.stringify(sanitizedUser));
    };

    return (
        <UserContext.Provider value={{ user, setUser, updateUser, logoutUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
