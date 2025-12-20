import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useUser } from '../../contexts/userContext';
import SearchBar from '../common/SearchBar';
import { CartContext } from '../../contexts/CartContext';
import NotificationBell from '../notifications/NotificationBell';
import LiveAdmin from '../../pages/LiveAdmin';
import { MessageCircle } from 'lucide-react';

const roleConfigs = {
    customer: (userId) => {
        const savedRole = localStorage.getItem(`userRoleSelected_${userId}`);
        if (savedRole === 'seller')
            return { label: 'Đăng ký bán hàng', link: '/register/seller' };
        if (savedRole === 'shipper')
            return { label: 'Đăng ký giao hàng', link: '/register/shipper' };
        return {
            label: 'Đồng hành cùng chúng tôi',
            link: '/register/role/select',
        };
    },
    seller: () => ({ label: 'Quản lý cửa hàng', link: '/dashboard/seller' }),
    shipper: () => ({
        label: 'Quản lý vận chuyển',
        link: '/dashboard/shipper',
    }),
    admin: () => ({ label: 'Quản trị hệ thống', link: '/dashboard/admin' }),
};

function Navbar() {
    const { user, logoutUser } = useUser();

    const { cartCount } = useContext(CartContext);

    const profileId = user?._id;
    const role = user?.role || 'customer';
    const { label, link } = roleConfigs[role](profileId);

    return (
        <nav className="bg-white shadow fixed top-0 left-0 w-full h-16 z-50">
            <div className="max-w-screen-xl mx-auto px-6 h-full flex items-center justify-between gap-6">
                {/* Logo */}
                <Link to="/" className="flex items-center">
                    <img
                        src="/img/Book4U-removebg.png"
                        alt="BookHub"
                        className="w-24 h-auto"
                    />
                </Link>

                {/* Search Bar (global) */}
                <SearchBar />

                <LiveAdmin />

                {/* Actions */}
                <div className="flex items-center space-x-5">
                    {/* Live Admin */}
                    <button title="Danh sách livestream">
                        <Link to="/lives">🔴</Link>
                    </button>

                    <button title="chat">
                        <Link to="/chat">
                            <MessageCircle className="w-6 h-6 text-gray-700" />
                        </Link>
                    </button>

                    {/* Notifications */}
                    {user && <NotificationBell />}

                    {/* Cart */}
                    <Link
                        to="/cart"
                        className="relative cursor-pointer"
                        title="Giỏ hàng">
                        <ShoppingCart className="w-6 h-6 text-gray-700" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {user ? (
                        <div className="relative group">
                            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
                                {user.firstName} {user.lastName}
                            </button>
                            <div
                                className="absolute right-0 top-full w-48 bg-white shadow-lg rounded-lg border py-2 
                                            opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200">
                                <Link
                                    to={`/profile/${profileId}`}
                                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                    Trang cá nhân
                                </Link>
                                <Link
                                    to="/orders"
                                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                    Đơn hàng
                                </Link>
                                {/* role-registration */}
                                <Link
                                    to={link}
                                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                                    {label}
                                </Link>
                                {/* Admin menu */}
                                {user?.role === 'admin' && (
                                    <>
                                        <div className="border-t border-gray-200 my-2"></div>
                                        <Link
                                            to="/admin/role-requests"
                                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 font-medium text-blue-600">
                                            Quản lý yêu cầu vai trò
                                        </Link>
                                    </>
                                )}
                                <button
                                    onClick={logoutUser}
                                    className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100">
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-x-1">
                            <Link
                                to="/register"
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm">
                                Đăng ký
                            </Link>
                            <Link
                                to="/login"
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm">
                                Đăng nhập
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
