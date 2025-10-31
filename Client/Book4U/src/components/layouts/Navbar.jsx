import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useUser } from '../../contexts/userContext';
import SearchBar from '../common/SearchBar';

const roleConfigs = {
    customer: {
        label: 'Đồng hành cùng chúng tôi',
        link: '/register/role/select',
    },
    seller: {
        label: 'Quản lý cửa hàng',
        link: '/dashboard/seller',
    },
    shipper: {
        label: 'Quản lý vận chuyển',
        link: '/dashboard/shipper',
    },
};

function Navbar() {
    const { user, logoutUser } = useUser();

    const currentRole = user?.role || 'customer';
    const { label, link } = roleConfigs[currentRole] || {
        label: 'Vai trò không xác định',
        link: '/',
    };

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

                {/* Actions */}
                <div className="flex items-center space-x-5">
                    {/* Cart */}
                    <div className="relative cursor-pointer">
                        <ShoppingCart className="w-6 h-6 text-gray-700" />
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            0
                        </span>
                    </div>

                    {user ? (
                        <div className="relative group">
                            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
                                {user.firstName} {user.lastName}
                            </button>
                            <div
                                className="absolute right-0 top-full w-40 bg-white shadow-lg rounded-lg border py-2 
                opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200">
                                <Link
                                    to="/profile"
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
