import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/userContext';

export default function useRequireAuth() {
    const { user } = useUser();
    const navigate = useNavigate();

    const requireLogin = (callback) => {
        if (!user) {
            navigate('/login');
            return false;
        }
        callback();
        return true;
    };

    return { requireLogin };
}
