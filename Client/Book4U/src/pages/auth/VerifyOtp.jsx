import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { requestOtp, verifyOtp } from '../../services/api/userApi';

function VerifyOtp() {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0); // đếm ngược thời gian

    const navigate = useNavigate();
    const email = localStorage.getItem('registerEmail');

    // Kiểm tra email hợp lệ
    useEffect(() => {
        if (!email) {
            setError('Email không hợp lệ. Vui lòng đăng ký lại.');
            navigate('/register');
        }
    }, [email, navigate]);

    // Xử lý đếm ngược
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
        if (timer > 0) return; // chặn spam
        setLoading(true);
        setError('');
        setMessage('');
        const res = await requestOtp({ email });
        if (res.error) {
            setError(res.message);
            setMessage('OTP đã được gửi. Vui lòng kiểm tra email của bạn.');
        } else {
            setTimer(60); // reset timer 60s
        }
        setLoading(false);
    };

    // Submit OTP
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!otp) {
            setError('Vui lòng nhập OTP');
            return;
        }

        const res = await verifyOtp({ otp });
        if (res.error) return setError(res.message);

        localStorage.setItem('otpVerified', 'true');
        localStorage.setItem('tempToken', res.tempToken);
        navigate('/set-password');
    };

    return (
        <div>
            <h2>Nhập OTP</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Mã OTP"
                />
                <button type="submit">Xác nhận</button>
            </form>

            <button onClick={handleResendOtp} disabled={loading || timer > 0}>
                {loading ? 'Đang gửi...' : timer > 0 ? `Gửi lại OTP sau ${timer}s` : 'Gửi lại OTP'}
            </button>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {message && <p style={{ color: 'green' }}>{message}</p>}
        </div>
    );
}

export default VerifyOtp;
