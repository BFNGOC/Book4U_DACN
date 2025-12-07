import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { checkPaymentStatus } from '../../services/api/paymentApi.js';

function PaymentCallback() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('processing'); // processing, success, failed
    const [orderId, setOrderId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const processCallback = async () => {
            try {
                // Lấy tham số từ URL
                const vnpTxnRef = searchParams.get('vnp_TxnRef');
                const vnpTransactionStatus = searchParams.get(
                    'vnp_TransactionStatus'
                );
                const momoOrderId = searchParams.get('orderId');
                const momoResultCode = searchParams.get('resultCode');

                console.log('Callback params:', {
                    vnpTxnRef,
                    vnpTransactionStatus,
                    momoOrderId,
                    momoResultCode,
                });

                let extractedOrderId = null;

                // Xử lý VNPAY callback
                if (vnpTxnRef) {
                    extractedOrderId = vnpTxnRef.split('-')[0];
                    if (vnpTransactionStatus === '00') {
                        // Thanh toán thành công
                        setStatus('success');
                        setOrderId(extractedOrderId);
                        toast.success('Thanh toán thành công!');
                    } else {
                        // Thanh toán thất bại
                        setStatus('failed');
                        setOrderId(extractedOrderId);
                        toast.error('Thanh toán thất bại');
                    }
                }

                // Xử lý MOMO callback
                if (momoOrderId) {
                    extractedOrderId = momoOrderId;
                    if (momoResultCode === '0') {
                        // Thanh toán thành công
                        setStatus('success');
                        setOrderId(extractedOrderId);
                        toast.success('Thanh toán thành công!');
                    } else {
                        // Thanh toán thất bại
                        setStatus('failed');
                        setOrderId(extractedOrderId);
                        toast.error('Thanh toán thất bại');
                    }
                }

                // Nếu không có order ID, redirect về home
                if (!extractedOrderId) {
                    toast.error('Không tìm thấy thông tin đơn hàng');
                    setTimeout(() => navigate('/'), 2000);
                    return;
                }

                // Kiểm tra trạng thái thanh toán từ server
                const paymentStatus = await checkPaymentStatus(
                    extractedOrderId
                );
                console.log('Payment status:', paymentStatus);
            } catch (error) {
                console.error('Lỗi xử lý callback:', error);
                setStatus('failed');
                toast.error('Lỗi xử lý thanh toán');
            }
        };

        processCallback();
    }, [searchParams, navigate]);

    // Processing state
    if (status === 'processing') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                    <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
                        <svg
                            className="w-12 h-12 text-blue-500 animate-spin"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Đang xử lý thanh toán
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Vui lòng đợi trong giây lát...
                    </p>
                    <p className="text-sm text-gray-500">
                        Không tắt cửa sổ này trong khi đang xử lý
                    </p>
                </div>
            </div>
        );
    }

    // Success state
    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                    <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
                        <svg
                            className="w-12 h-12 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-green-600 mb-2">
                        ✓ Thanh toán thành công
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Đơn hàng của bạn đã được xác nhận. Chúng tôi sẽ sớm
                        chuẩn bị hàng.
                    </p>
                    {orderId && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <p className="text-sm text-gray-600 mb-1">
                                Mã đơn hàng
                            </p>
                            <p className="text-lg font-bold text-gray-800 break-all">
                                {orderId}
                            </p>
                        </div>
                    )}
                    <button
                        onClick={() => navigate(`/orders/${orderId}`)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition">
                        Xem chi tiết đơn hàng
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full mt-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition">
                        Quay lại trang chủ
                    </button>
                </div>
            </div>
        );
    }

    // Failed state
    if (status === 'failed') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                    <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
                        <svg
                            className="w-12 h-12 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-red-600 mb-2">
                        ✗ Thanh toán thất bại
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Không thể hoàn tất giao dịch. Vui lòng thử lại hoặc liên
                        hệ support.
                    </p>
                    {orderId && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <p className="text-sm text-gray-600 mb-1">
                                Mã đơn hàng
                            </p>
                            <p className="text-lg font-bold text-gray-800 break-all">
                                {orderId}
                            </p>
                        </div>
                    )}
                    <button
                        onClick={() => navigate(`/orders/${orderId}`)}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition">
                        Xem chi tiết đơn hàng
                    </button>
                    <button
                        onClick={() => navigate('/cart')}
                        className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition">
                        Thử thanh toán lại
                    </button>
                </div>
            </div>
        );
    }
}

export default PaymentCallback;
