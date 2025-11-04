import React from 'react';
import { useNavigate } from 'react-router-dom';
const RoleSelect = () => {
    const navigate = useNavigate();
    const roles = [
        {
            id: 'seller',
            title: 'Người bán hàng',
            description: 'Mở cửa hàng và bán sản phẩm của bạn.',
            icon: '🛍️',
            color: 'from-pink-500 to-rose-500',
        },
        {
            id: 'shipper',
            title: 'Người giao hàng',
            description: 'Nhận đơn và giao hàng nhanh chóng, tiện lợi.',
            icon: '🚚',
            color: 'from-blue-500 to-cyan-500',
        },
    ];

    const handleSelect = (role) => {
        localStorage.setItem('userRoleSelected', role);
        navigate(`/register/${role}`);
    };

    return (
        <div className="max-h-screen flex flex-col items-center justify-center px-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-10 text-gray-800 text-center">
                Chọn vai trò để tiếp tục đăng ký
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                {roles.map((role) => (
                    <div
                        key={role.id}
                        onClick={() => handleSelect(role.id)}
                        className={`cursor-pointer bg-white rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 p-8 flex flex-col items-center border-t-4 border-transparent hover:border-t-8 hover:border-gradient-to-r ${role.color}`}>
                        <div
                            className={`text-6xl mb-5 bg-gradient-to-r ${role.color} text-transparent bg-clip-text`}>
                            {role.icon}
                        </div>
                        <h2 className="text-2xl font-semibold mb-3 text-gray-800 text-center">
                            {role.title}
                        </h2>
                        <p className="text-gray-600 text-center leading-relaxed">
                            {role.description}
                        </p>
                        <button
                            className={`mt-6 bg-gradient-to-r ${role.color} text-white font-medium px-6 py-2.5 rounded-xl hover:opacity-90 transition`}>
                            Đăng ký
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoleSelect;
