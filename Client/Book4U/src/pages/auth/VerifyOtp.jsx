import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestOtp, verifyOtp } from '../../services/api/userApi';

function VerifyOtp() {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);

    const navigate = useNavigate();
    const email = localStorage.getItem('registerEmail');

    // Nếu không có email, quay lại Register
    useEffect(() => {
        if (!email) {
            setError('Email không hợp lệ. Vui lòng đăng ký lại.');
            navigate('/register');
        }
    }, [email, navigate]);

    // Đếm ngược resend OTP
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Gửi lại OTP
    const handleResendOtp = async () => {
        if (timer > 0) return;
        setLoading(true);
        setError('');
        setMessage('');
        const res = await requestOtp({ email });
        if (res.error) {
            setError(res.message);
        } else {
            setMessage('OTP đã được gửi. Vui lòng kiểm tra email của bạn.');
            setTimer(60);
        }
        setLoading(false);
    };

    // Xác nhận OTP
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!otp) {
            setError('Vui lòng nhập OTP');
            return;
        }

        const res = await verifyOtp({ otp });
        if (res.error) {
            setError(res.message);
            return;
        }

        localStorage.setItem('otpVerified', 'true');
        localStorage.setItem('tempToken', res.tempToken);
        navigate('/set-password');
    };

    return (
        <div className="w-full h-full flex items-center justify-center px-4">
            <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md mt-5">
                {/* Tiêu đề */}
                <h2 className="text-2xl font-bold text-center mb-2">Xác thực OTP</h2>
                <p className="text-gray-500 text-center mb-8">
                    Chúng tôi đã gửi mã OTP tới email <span className="font-semibold">{email}</span>
                </p>

                {/* Form nhập OTP */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mã OTP
                        </label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Nhập mã OTP"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                        {message && <p className="text-green-500 text-sm mt-1">{message}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer"
                    >
                        Xác nhận
                    </button>
                </form>

                {/* Gửi lại OTP */}
                <div className="text-center mt-6">
                    <button
                        onClick={handleResendOtp}
                        disabled={loading || timer > 0}
                        className={`text-sm font-medium ${
                            loading || timer > 0
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-blue-600 hover:underline'
                        }`}
                    >
                        {loading
                            ? 'Đang gửi...'
                            : timer > 0
                            ? `Gửi lại OTP sau ${timer}s`
                            : 'Gửi lại OTP'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default VerifyOtp;
