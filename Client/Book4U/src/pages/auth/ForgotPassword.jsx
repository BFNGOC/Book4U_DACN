import { useState, useEffect } from 'react';

import { forgotPassword } from '../../services/api/userApi';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0); // đếm ngược thời gian

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (timer > 0) return; // chặn spam
        setLoading(true);

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
        <div>
            <h2>Quên mật khẩu</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Nhập email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button type="submit">
                    {' '}
                    {loading
                        ? 'Đang gửi...'
                        : timer > 0
                        ? `Gửi link reset sau ${timer}s`
                        : 'Gửi link reset'}
                </button>
            </form>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default ForgotPassword;
