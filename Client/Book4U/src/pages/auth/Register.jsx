import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { requestOtp } from '../../services/api/userApi';

function Register() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const res = await requestOtp({ email });
        if (res.error) {
            setError(res.message);
            return;
        }

        // Lưu email tạm để verify OTP
        localStorage.setItem('registerEmail', email);
        navigate('/verify-otp');
    };

    return (
        <div className="w-full h-full flex items-center justify-center px-4">
            <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md mt-5">
                {/* Tiêu đề */}
                <h2 className="text-2xl font-bold text-center mb-2">Tạo tài khoản</h2>
                <p className="text-gray-500 text-center mb-8">Nhập email để tạo tài khoản</p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập email"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer"
                    >
                        Gửi OTP
                    </button>
                </form>

                {/* Link chuyển sang Login */}
                <p className="text-center text-sm mt-6 text-gray-600">
                    Bạn đã có tài khoản?{' '}
                    <Link to="/login" className="text-blue-600 hover:underline">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
