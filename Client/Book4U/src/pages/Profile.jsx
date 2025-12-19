import { useParams } from 'react-router-dom';
import { useUser } from '../contexts/userContext';
import UserProfile from './profile/UserProfile';
import SellerProfile from './profile/SellerProfile';

function Profile() {
    const { profileId } = useParams();
    const { user } = useUser();

    // Nếu là user hiện tại xem profile của chính mình
    if (user && profileId === user._id) {
        // Nếu là seller, hiển thị SellerProfile
        if (user.role === 'seller') {
            return <SellerProfile />;
        }
        // Nếu không, hiển thị UserProfile
        return <UserProfile />;
    }

    // Nếu là xem profile của người khác (chỉ dành cho customer)
    return <UserProfile />;
}

export default Profile;
