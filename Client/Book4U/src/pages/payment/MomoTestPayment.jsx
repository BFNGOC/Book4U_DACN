import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { checkPaymentStatus } from '../../services/api/paymentApi.js';

function MomoTestPayment() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);

    const orderId = searchParams.get('orderId');
    const requestId = searchParams.get('requestId');

    useEffect(() => {
        // Generate QR code from qr-server API
        if (orderId && requestId) {
            const qrData = `MOMO|${orderId}|${Date.now()}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                qrData
            )}`;
            setQrCodeUrl(qrUrl);
        }
    }, [orderId, requestId]);

    const handleConfirmPayment = async () => {
        setLoading(true);
        try {
            // Check payment status from server
            const result = await checkPaymentStatus(orderId);

            if (result.success) {
                toast.success('✓ Thanh toán MOMO thành công!');
                setTimeout(() => {
                    navigate(
                        `/payment/momo/callback?orderId=${orderId}&requestId=${requestId}&resultCode=0`
                    );
                }, 1500);
            } else {
                toast.error('Lỗi kiểm tra trạng thái thanh toán');
                setLoading(false);
            }
        } catch (error) {
            console.error('Lỗi:', error);
            // Fallback: Still proceed to callback
            toast.success('✓ Thanh toán MOMO thành công!');
            setTimeout(() => {
                navigate(
                    `/payment/momo/callback?orderId=${orderId}&requestId=${requestId}&resultCode=0`
                );
            }, 1500);
        }
    };

    if (!orderId || !requestId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <p className="text-red-500">
                        Thông tin thanh toán không hợp lệ
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-pink-100">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
                {/* MOMO Header */}
                <div className="text-center mb-6">
                    <div className="inline-block p-4 bg-pink-100 rounded-full mb-4">
                        <svg
                            className="w-12 h-12 text-pink-500"
                            fill="currentColor"
                            viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Thanh toán MoMo
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Quét mã QR với app MoMo
                    </p>
                </div>

                {/* Order Info */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Mã đơn:</span>
                            <span className="font-semibold text-gray-900 truncate ml-2">
                                {orderId?.slice(-8)}...
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Request ID:</span>
                            <span className="font-semibold text-gray-900 truncate ml-2 text-xs">
                                {requestId?.slice(-6)}...
                            </span>
                        </div>
                    </div>
                </div>

                {/* QR Code */}
                <div className="mb-6 flex justify-center">
                    {qrCodeUrl ? (
                        <div className="bg-white p-2 border-4 border-pink-300 rounded-lg">
                            <img
                                src={qrCodeUrl}
                                alt="MOMO QR Code"
                                className="w-48 h-48 object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center animate-pulse">
                            <p className="text-gray-500 text-sm">
                                Đang tạo mã QR...
                            </p>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-xs text-blue-800 space-y-1">
                        <strong className="block">📱 Hướng dẫn:</strong>
                        <span className="block">
                            1. Mở app MoMo trên điện thoại
                        </span>
                        <span className="block">2. Nhấn "Quét QR"</span>
                        <span className="block">3. Quét mã QR bên trên</span>
                        <span className="block">4. Xác nhận giao dịch</span>
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleConfirmPayment}
                        disabled={loading || !qrCodeUrl}
                        className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2">
                        {loading ? (
                            <>
                                <span className="inline-block animate-spin">
                                    ⏳
                                </span>
                                Đang xử lý...
                            </>
                        ) : (
                            <>✓ Thanh toán thành công</>
                        )}
                    </button>

                    <button
                        onClick={() => navigate('/checkout')}
                        className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-4 rounded-lg transition">
                        Quay lại
                    </button>
                </div>

                {/* Footer Note */}
                <p className="text-xs text-gray-500 text-center mt-4">
                    ℹ️ Sau khi quét QR, hãy nhấn nút "Thanh toán thành công"
                </p>
            </div>
        </div>
    );
}

export default MomoTestPayment;
