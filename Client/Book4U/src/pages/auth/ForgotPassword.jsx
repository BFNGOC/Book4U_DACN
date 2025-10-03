import { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';

import Input from '../../components/ui/Input';

import { forgotPassword } from '../../services/api/userApi';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0); // đếm ngược thời gian

    // Đếm ngược
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (timer > 0) return; // tránh spam
        setLoading(true);
        setError('');
        setMessage('');

        const res = await forgotPassword({ email });
        if (res.error) {
            setError(res.message);
        } else {
            setTimer(60);
            setMessage(res.message);
        }

        setLoading(false);
    };

    return (
        <div className="w-full h-full flex items-center justify-center px-4">
            <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md mt-5">
                {/* Tiêu đề */}
                <h2 className="text-2xl font-bold text-center mb-2">Quên mật khẩu</h2>
                <p className="text-gray-500 text-center mb-6">
                    Nhập email để nhận liên kết đặt lại mật khẩu
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        type="email"
                        name="email"
                        value={email}
                        label="Email"
                        placeholder="Nhập email"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading || timer > 0}
                        className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading
                            ? 'Đang gửi...'
                            : timer > 0
                            ? `Gửi lại sau ${timer}s`
                            : 'Gửi link reset'}
                    </button>
                </form>

                {/* Thông báo */}
                {message && <p className="text-green-600 text-sm mt-4 text-center">{message}</p>}
                {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

                <p className="text-center text-sm mt-6 text-gray-600">
                    Quay lại đăng nhập?{' '}
                    <Link to="/login" className="text-blue-600 hover:underline">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;
